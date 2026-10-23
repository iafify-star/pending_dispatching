const SPREADSHEET_ID = "1wx8Ps4-mTL9MpdbwV3FTv8gGEqwuQL_LisSoyUBu6ZU";
const LOG_SHEET_NAME = "pallet_scan";
const DATA_SHEET_NAME = "dispatching";
const HISTORY_SHEET_NAME = "dispatching_history";
const REVIEWERS_SHEET_NAME = "reviewers";
// Columns F and G (Review time, Dispatch time) are formulas in the sheet, so the script writes only these columns.
const HISTORY_HEADERS = ["Pallet", "Tote", "Branch", "Staging location", "Pallet created"];
const HISTORY_NUMBER_FORMATS = ["@", "@", "@", "@", "yyyy-mm-dd hh:mm:ss"];
const ARCHIVE_EVERY_MINUTES = 5;
const LOG_HEADERS = [
  "Scan date", "Scan time", "Type", "Pallet", "Tote", "Branch", "Reviewer", "Shift", "Stage", "Note",
];
const LOG_NUMBER_FORMATS = ["yyyy-mm-dd", "hh:mm:ss", "@", "@", "@", "@", "@", "@", "@", "@"];
const SHIFTS = ["Night", "Morning", "Middle"];
const STAGES = ["Review", "Dispatch"];
const PALLET_ROW_COLOR = "#fff2cc";
const REPEAT_ROW_COLOR = "#f9cb9c";
const TOTE_DETAIL_COLOR = "#888888";
const TEXT_COLOR = "#000000";
const MAX_SCAN_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
const REQUEST_CACHE_SECONDS = 6 * 60 * 60;
const ADMIN_SESSION_SECONDS = 6 * 60 * 60;
const MAX_ADMIN_RANGE_DAYS = 31;
// A pause longer than this between two scans is a break, not working time.
const IDLE_GAP_MINUTES = 10;
const MAX_SESSIONS_PER_REVIEWER = 300;

function doGet(event) {
  const parameters = event && event.parameter ? event.parameter : {};
  if (parameters.action === "palletHistory") {
    return createJsonResponse(getPalletHistory(String(parameters.pallet || "").trim()));
  }
  if (parameters.action === "toteHistory") {
    return createJsonResponse(getToteHistory(String(parameters.tote || "").trim()));
  }
  if (parameters.action === "reviewers") {
    return createJsonResponse({ success: true, names: readReviewerNames(SpreadsheetApp.openById(SPREADSHEET_ID)) });
  }

  const callback = String(parameters.callback || "");
  if (!/^shippingSheetCallback_\d+_[a-zA-Z0-9_]+$/.test(callback)) {
    throw new Error("Invalid sheet data callback.");
  }

  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(DATA_SHEET_NAME);
    if (!sheet) throw new Error(`The ${DATA_SHEET_NAME} tab was not found.`);

    const csv = sheet.getDataRange().getDisplayValues()
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\r\n");
    return createJsonpResponse(callback, { success: true, csv });
  } catch (error) {
    console.error(error);
    return createJsonpResponse(callback, {
      success: false,
      message: error instanceof Error ? error.message : "Could not read the pending_dispatching sheet.",
    });
  }
}

function doPost(event) {
  const parameters = event && event.parameter ? event.parameter : {};
  // Admin calls are POSTs so the password never ends up in a URL.
  if (parameters.action === "adminLogin") return createJsonResponse(adminLogin(parameters));
  if (parameters.action === "adminLogout") return createJsonResponse(adminLogout(parameters));
  if (parameters.action === "adminStats") return createJsonResponse(adminStats(parameters));
  if (parameters.action === "addReviewer") return createJsonResponse(addReviewer(parameters));
  if (parameters.action === "branchProgress") {
    return createJsonResponse(hasAdminSession(parameters) ? getBranchProgress() : ADMIN_SESSION_ENDED);
  }

  const requestId = String(parameters.requestId || "");
  let response;
  let lock;

  try {
    if (!requestId || requestId.length > 100) {
      throw new Error("A valid request ID is required.");
    }
    const scan = validateScan(parameters);
    lock = LockService.getScriptLock();
    lock.waitLock(10000);

    // The site retries a scan when it misses the reply, so skip requests already written.
    const cache = CacheService.getScriptCache();
    if (!cache.get(requestId)) {
      const sheet = getLogSheet();
      if (scan.eventType === "pallet") {
        writePalletRow(sheet, scan);
      } else {
        writeToteRow(sheet, scan);
      }
      SpreadsheetApp.flush();
      cache.put(requestId, "1", REQUEST_CACHE_SECONDS);
    }
    response = { success: true };
  } catch (error) {
    console.error(error);
    response = {
      success: false,
      message: error instanceof Error ? error.message : "The scan could not be saved.",
    };
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }

  return createJsonResponse({ requestId, ...response });
}

function validateScan(parameters) {
  const eventType = String(parameters.eventType || "");
  const palletBarcode = String(parameters.palletBarcode || "").trim();
  const containerBarcode = String(parameters.containerBarcode || "").trim();
  const branch = String(parameters.branch || "").trim().slice(0, 200);
  const reviewer = String(parameters.reviewer || "").trim().slice(0, 100);
  // Scans queued before these fields existed have none, so an unknown value is left blank.
  const shift = SHIFTS.includes(parameters.shift) ? parameters.shift : "";
  const stage = STAGES.includes(parameters.stage) ? parameters.stage : "";

  if (eventType !== "pallet" && eventType !== "tote") {
    throw new Error("Invalid scan type.");
  }
  if (!palletBarcode || palletBarcode.length > 200) {
    throw new Error("A valid pallet barcode is required.");
  }
  if (eventType === "tote" && (!containerBarcode || containerBarcode.length > 200)) {
    throw new Error("A valid tote barcode is required.");
  }
  if (eventType === "pallet" && containerBarcode) {
    throw new Error("A pallet scan cannot include a tote barcode.");
  }

  return {
    eventType,
    palletBarcode,
    containerBarcode,
    branch,
    reviewer,
    shift,
    stage,
    scannedAt: parseScanTime(parameters.scannedAt),
  };
}

// Earlier Review scans of a pallet, so the site can warn before it is reviewed again.
// Scans with no stage were made before the stage existed and count as Review.
// getValues reads every row, whatever filter someone has on the tab.
function getPalletHistory(palletBarcode) {
  try {
    if (!palletBarcode || palletBarcode.length > 200) throw new Error("A valid pallet barcode is required.");
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(LOG_SHEET_NAME);
    const lastRow = sheet ? sheet.getLastRow() : 0;
    const rows = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, LOG_HEADERS.length).getValues() : [];
    const palletKey = palletBarcode.toUpperCase();
    const totes = new Set();
    let reviews = 0;
    let lastReview = null;

    for (const row of rows) {
      if (String(row[3]).toUpperCase() !== palletKey || row[8] === "Dispatch") continue;
      if (row[2] === "Pallet") {
        reviews += 1;
        lastReview = row;
      } else if (row[2] === "Tote") {
        totes.add(String(row[4]));
      }
    }

    return {
      success: true,
      reviews,
      totes: [...totes],
      lastReview: lastReview && {
        scannedAt: formatSheetTime(lastReview[0], sheet.getParent().getSpreadsheetTimeZone()),
        reviewer: String(lastReview[6]),
        shift: String(lastReview[7]),
      },
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: error instanceof Error ? error.message : "Could not read the scan log." };
  }
}

// Every pallet a tote was on and every scan of it, to trace a tote a branch reports missing.
// Totes are reused, so the version suffix (_v22) is ignored and older uses show up too.
function getToteHistory(toteBarcode) {
  try {
    if (!toteBarcode || toteBarcode.length > 200) throw new Error("A valid tote barcode is required.");
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const timeZone = spreadsheet.getSpreadsheetTimeZone();
    const toteKey = toteMatchKey(toteBarcode);
    const assignments = new Map();
    const addAssignment = (pallet, tote, branch, created) => {
      const palletKey = String(pallet).toUpperCase();
      if (!pallet || assignments.has(palletKey)) return;
      assignments.set(palletKey, {
        pallet: String(pallet),
        tote: String(tote),
        branch: String(branch ?? ""),
        created: created == null ? "" : formatSheetTime(created, timeZone),
      });
    };

    // Archive first, then dispatching for pallets the archive hasn't copied yet.
    const history = spreadsheet.getSheetByName(HISTORY_SHEET_NAME);
    if (history && history.getLastRow() > 1) {
      for (const row of history.getRange(2, 1, history.getLastRow() - 1, HISTORY_HEADERS.length).getValues()) {
        if (row[0] && toteMatchKey(row[1]) === toteKey) addAssignment(row[0], row[1], row[2], row[4]);
      }
    }
    const source = spreadsheet.getSheetByName(DATA_SHEET_NAME);
    if (source) {
      const rows = source.getDataRange().getValues();
      const headers = rows.shift().map(String);
      const [pallet, tote, branch, created] = ["palletBarcode", "containerBarcode", "destination_darkstore", "pallet_creation_date"]
        .map((name) => headers.indexOf(name));
      if (pallet >= 0 && tote >= 0) {
        for (const row of rows) {
          if (toteMatchKey(row[tote]) === toteKey) addAssignment(row[pallet], row[tote], row[branch], row[created]);
        }
      }
    }

    const scans = [];
    const log = spreadsheet.getSheetByName(LOG_SHEET_NAME);
    if (log && log.getLastRow() > 1) {
      for (const row of log.getRange(2, 1, log.getLastRow() - 1, LOG_HEADERS.length).getValues()) {
        if (row[2] !== "Tote" || toteMatchKey(row[4]) !== toteKey) continue;
        scans.push({
          pallet: String(row[3]),
          tote: String(row[4]),
          branch: String(row[5]),
          scannedAt: formatSheetTime(row[0], timeZone),
          reviewer: String(row[6]),
          shift: String(row[7]),
          stage: String(row[8]) || "Review",
        });
      }
    }

    return { success: true, assignments: [...assignments.values()], scans };
  } catch (error) {
    console.error(error);
    return { success: false, message: error instanceof Error ? error.message : "Could not read the sheet." };
  }
}

// The admin username and password are kept in Project Settings > Script properties
// (ADMIN_USERNAME, ADMIN_PASSWORD), never in the site's code, which anyone can read.
function adminLogin(parameters) {
  const properties = PropertiesService.getScriptProperties();
  const username = properties.getProperty("ADMIN_USERNAME");
  const password = properties.getProperty("ADMIN_PASSWORD");
  if (!username || !password) {
    return {
      success: false,
      code: "notSetUp",
      message: "Admin login isn't set up. Add ADMIN_USERNAME and ADMIN_PASSWORD to the script properties.",
    };
  }
  if (String(parameters.username || "").trim() !== username || String(parameters.password || "") !== password) {
    Utilities.sleep(1000); // slows down guessing
    return { success: false, code: "wrongLogin", message: "Wrong username or password." };
  }
  const token = Utilities.getUuid();
  CacheService.getScriptCache().put(`admin:${token}`, "1", ADMIN_SESSION_SECONDS);
  return { success: true, token };
}

function adminLogout(parameters) {
  CacheService.getScriptCache().remove(`admin:${String(parameters.token || "")}`);
  return { success: true };
}

function hasAdminSession(parameters) {
  const token = String(parameters.token || "");
  return Boolean(token && CacheService.getScriptCache().get(`admin:${token}`));
}

const ADMIN_SESSION_ENDED = { success: false, code: "expired", message: "The admin session ended. Log in again." };

// The names the site offers in its reviewer list, from the reviewers tab (column A).
function readReviewerNames(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(REVIEWERS_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const names = new Map();
  for (const [value] of sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues()) {
    const name = String(value).trim().replace(/\s+/g, " ");
    if (name && !names.has(name.toLowerCase())) names.set(name.toLowerCase(), name);
  }
  return [...names.values()].sort((a, b) => a.localeCompare(b));
}

function addReviewer(parameters) {
  if (!hasAdminSession(parameters)) return ADMIN_SESSION_ENDED;
  const name = String(parameters.name || "").trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 60) {
    return { success: false, code: "invalidName", message: "A name needs 2 to 60 characters." };
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(REVIEWERS_SHEET_NAME);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(REVIEWERS_SHEET_NAME);
      sheet.getRange(1, 1, 1, 2).setValues([["Name", "Added at"]]).setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
    if (readReviewerNames(spreadsheet).some((existing) => existing.toLowerCase() === name.toLowerCase())) {
      return { success: false, code: "duplicate", message: "That name is already in the list." };
    }
    sheet.appendRow([asPlainText(name), new Date()]);
    SpreadsheetApp.flush();
    return { success: true, name, names: readReviewerNames(spreadsheet) };
  } finally {
    lock.releaseLock();
  }
}

// For every branch with pallets in dispatching now: how many pallets and totes have been
// reviewed and what is left. A pallet counts as done when all its totes were scanned in Review
// (scans with no stage count as Review).
function getBranchProgress() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const source = spreadsheet.getSheetByName(DATA_SHEET_NAME);
    if (!source) throw new Error(`The ${DATA_SHEET_NAME} tab was not found.`);
    const rows = source.getDataRange().getValues();
    const headers = rows.shift().map(String);
    const [palletColumn, toteColumn, branchColumn, locationColumn] =
      ["palletBarcode", "containerBarcode", "destination_darkstore", "staging_location"].map((name) => headers.indexOf(name));
    if (palletColumn < 0 || toteColumn < 0) throw new Error(`The ${DATA_SHEET_NAME} tab has no pallet or tote column.`);

    const pallets = new Map();
    for (const row of rows) {
      const pallet = String(row[palletColumn]).trim();
      if (!pallet || !row[toteColumn]) continue;
      const key = pallet.toUpperCase();
      if (!pallets.has(key)) {
        pallets.set(key, {
          pallet,
          branch: branchColumn >= 0 ? String(row[branchColumn]) : "",
          location: locationColumn >= 0 ? String(row[locationColumn]) : "",
          totes: new Set(),
        });
      }
      pallets.get(key).totes.add(toteMatchKey(row[toteColumn]));
    }

    const scanned = new Map();
    const log = spreadsheet.getSheetByName(LOG_SHEET_NAME);
    if (log && log.getLastRow() > 1) {
      for (const row of log.getRange(2, 1, log.getLastRow() - 1, LOG_HEADERS.length).getValues()) {
        const key = String(row[3]).toUpperCase();
        if (row[2] !== "Tote" || row[8] === "Dispatch" || !pallets.has(key)) continue;
        if (!scanned.has(key)) scanned.set(key, new Set());
        scanned.get(key).add(toteMatchKey(row[4]));
      }
    }

    const branches = new Map();
    for (const [key, pallet] of pallets) {
      const done = [...pallet.totes].filter((tote) => scanned.get(key)?.has(tote)).length;
      const branch = branches.get(pallet.branch) || {
        branch: pallet.branch, pallets: 0, donePallets: 0, totes: 0, doneTotes: 0, remaining: [],
      };
      branch.pallets += 1;
      branch.totes += pallet.totes.size;
      branch.doneTotes += done;
      if (done >= pallet.totes.size) {
        branch.donePallets += 1;
      } else {
        branch.remaining.push({ pallet: pallet.pallet, location: pallet.location, scanned: done, expected: pallet.totes.size });
      }
      branches.set(pallet.branch, branch);
    }

    const list = [...branches.values()].sort((a, b) =>
      (b.pallets - b.donePallets) - (a.pallets - a.donePallets) || a.branch.localeCompare(b.branch));
    const total = (field) => list.reduce((sum, branch) => sum + branch[field], 0);
    return {
      success: true,
      updatedAt: formatSheetTime(new Date(), spreadsheet.getSpreadsheetTimeZone()),
      totals: {
        branches: list.length,
        pallets: total("pallets"),
        donePallets: total("donePallets"),
        totes: total("totes"),
        doneTotes: total("doneTotes"),
      },
      branches: list,
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: error instanceof Error ? error.message : "Could not read the sheet." };
  }
}

function adminStats(parameters) {
  try {
    if (!hasAdminSession(parameters)) return ADMIN_SESSION_ENDED;
    const from = String(parameters.from || "");
    const to = String(parameters.to || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) {
      throw new Error("Pick a valid date range.");
    }
    const days = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000 + 1;
    if (days > MAX_ADMIN_RANGE_DAYS) throw new Error(`Pick ${MAX_ADMIN_RANGE_DAYS} days or fewer.`);
    return { success: true, from, to, ...reviewerStats(from, to) };
  } catch (error) {
    console.error(error);
    return { success: false, message: error instanceof Error ? error.message : "Could not build the report." };
  }
}

// Per reviewer, from pallet_scan: branches, pallets, totes and working time for the dates given.
function reviewerStats(from, to) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const timeZone = spreadsheet.getSpreadsheetTimeZone();
  const log = spreadsheet.getSheetByName(LOG_SHEET_NAME);
  const rows = log && log.getLastRow() > 1 ? log.getRange(2, 1, log.getLastRow() - 1, LOG_HEADERS.length).getValues() : [];
  const expected = expectedTotesByPallet(spreadsheet);

  const reviewers = new Map();
  for (const row of rows) {
    if (!(row[0] instanceof Date) || (row[2] !== "Pallet" && row[2] !== "Tote")) continue;
    const day = Utilities.formatDate(row[0], timeZone, "yyyy-MM-dd");
    if (day < from || day > to) continue;
    // Names are typed by hand, so "AHMED RAGAB" and "ahmed ragab" are the same reviewer.
    const name = String(row[6]).trim().replace(/\s+/g, " ") || "(no name)";
    const key = name.toLowerCase();
    if (!reviewers.has(key)) reviewers.set(key, { names: new Map(), events: [] });
    const entry = reviewers.get(key);
    entry.names.set(name, (entry.names.get(name) || 0) + 1);
    entry.events.push({
      time: row[0],
      type: row[2],
      pallet: String(row[3]),
      tote: String(row[4]),
      branch: String(row[5]),
      shift: String(row[7]),
      stage: String(row[8]) || "Review",
    });
  }

  const summaries = [...reviewers.values()]
    .map((entry) => summarizeReviewer(entry, expected, timeZone))
    .sort((a, b) => b.totes - a.totes);
  const total = (field) => summaries.reduce((sum, reviewer) => sum + reviewer[field], 0);
  return {
    totals: {
      reviewers: summaries.length,
      pallets: total("pallets"),
      totes: total("totes"),
      activeMinutes: total("activeMinutes"),
      incompletePallets: total("incompletePallets"),
    },
    idleGapMinutes: IDLE_GAP_MINUTES,
    reviewers: summaries,
  };
}

// A pallet scan starts a session for that pallet; its totes count toward that session.
// Working time adds up the gaps between scans, leaving out gaps longer than IDLE_GAP_MINUTES.
function summarizeReviewer(entry, expected, timeZone) {
  const events = entry.events.sort((a, b) => a.time - b.time);
  const sessions = [];
  const openSessions = new Map();
  let activeMs = 0;

  events.forEach((event, index) => {
    if (index > 0) {
      const gap = event.time - events[index - 1].time;
      if (gap <= IDLE_GAP_MINUTES * 60000) activeMs += gap;
    }
    const palletKey = event.pallet.toUpperCase();
    let session = openSessions.get(palletKey);
    if (event.type === "Pallet" || !session) {
      session = { ...event, start: event.time, end: event.time, totes: new Set() };
      sessions.push(session);
      openSessions.set(palletKey, session);
    }
    if (event.type === "Tote") {
      session.totes.add(toteMatchKey(event.tote));
      session.end = event.time;
    }
  });

  const branches = new Map();
  const stages = {};
  let incompletePallets = 0;
  const sessionRows = sessions.map((session) => {
    const scanned = session.totes.size;
    const expectedTotes = expected.get(session.pallet.toUpperCase()) || null;
    if (expectedTotes && scanned < expectedTotes) incompletePallets += 1;
    const branch = branches.get(session.branch) || { branch: session.branch, pallets: 0, totes: 0 };
    branch.pallets += 1;
    branch.totes += scanned;
    branches.set(session.branch, branch);
    stages[session.stage] = (stages[session.stage] || 0) + 1;
    return {
      pallet: session.pallet,
      branch: session.branch,
      stage: session.stage,
      shift: session.shift,
      start: formatSheetTime(session.start, timeZone),
      minutes: Math.round((session.end - session.start) / 6000) / 10,
      scanned,
      expected: expectedTotes,
    };
  });

  const totes = sessionRows.reduce((sum, session) => sum + session.scanned, 0);
  const activeMinutes = Math.round(activeMs / 60000);
  const timedSessions = sessionRows.filter((session) => session.scanned > 0);
  return {
    name: [...entry.names].sort((a, b) => b[1] - a[1])[0][0],
    shifts: [...new Set(sessions.map((session) => session.shift).filter(Boolean))],
    stages,
    branches: [...branches.values()].sort((a, b) => b.pallets - a.pallets),
    pallets: sessions.length,
    totes,
    firstScan: formatSheetTime(events[0].time, timeZone),
    lastScan: formatSheetTime(events[events.length - 1].time, timeZone),
    activeMinutes,
    avgMinutesPerPallet: timedSessions.length
      ? Math.round(timedSessions.reduce((sum, session) => sum + session.minutes, 0) / timedSessions.length * 10) / 10
      : 0,
    totesPerHour: activeMinutes ? Math.round(totes / (activeMinutes / 60)) : 0,
    incompletePallets,
    sessions: sessionRows.slice(-MAX_SESSIONS_PER_REVIEWER),
  };
}

// How many different totes each pallet should have, from the archive and dispatching.
function expectedTotesByPallet(spreadsheet) {
  const totesByPallet = new Map();
  const add = (pallet, tote) => {
    if (!pallet || !tote) return;
    const key = String(pallet).toUpperCase();
    if (!totesByPallet.has(key)) totesByPallet.set(key, new Set());
    totesByPallet.get(key).add(toteMatchKey(tote));
  };

  const history = spreadsheet.getSheetByName(HISTORY_SHEET_NAME);
  if (history && history.getLastRow() > 1) {
    for (const [pallet, tote] of history.getRange(2, 1, history.getLastRow() - 1, 2).getValues()) add(pallet, tote);
  }
  const source = spreadsheet.getSheetByName(DATA_SHEET_NAME);
  if (source) {
    const rows = source.getDataRange().getValues();
    const headers = rows.shift().map(String);
    const pallet = headers.indexOf("palletBarcode");
    const tote = headers.indexOf("containerBarcode");
    if (pallet >= 0 && tote >= 0) rows.forEach((row) => add(row[pallet], row[tote]));
  }
  return new Map([...totesByPallet].map(([key, totes]) => [key, totes.size]));
}

function toteMatchKey(value) {
  return String(value).trim().toUpperCase().replace(/_V\d+$/, "");
}

function formatSheetTime(value, timeZone) {
  return value instanceof Date ? Utilities.formatDate(value, timeZone, "yyyy-MM-dd HH:mm") : String(value);
}

// Use the time the scan happened on the device, unless it is missing or implausible.
function parseScanTime(value) {
  const now = Date.now();
  const scannedAt = new Date(String(value || ""));
  const time = scannedAt.getTime();
  if (Number.isNaN(time) || time > now + MAX_CLOCK_SKEW_MS || now - time > MAX_SCAN_AGE_MS) {
    return new Date(now);
  }
  return scannedAt;
}

function getLogSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(LOG_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(LOG_SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, LOG_HEADERS.length)
      .setValues([LOG_HEADERS])
      .setFontWeight("bold")
      .setBackground("#d9d9d9");
    sheet.setFrozenRows(1);
  } else {
    const headers = sheet.getRange(1, 1, 1, LOG_HEADERS.length).getDisplayValues()[0];
    if (LOG_HEADERS.some((header, index) => headers[index] !== header)) {
      throw new Error(`The ${LOG_SHEET_NAME} tab has unexpected columns.`);
    }
  }
  return sheet;
}

// Earlier rows are never changed. A pallet scanned before gets a colored row with a note
// saying how many times it was scanned and who scanned it last.
function writePalletRow(sheet, scan) {
  const lastRow = sheet.getLastRow();
  const palletKey = scan.palletBarcode.toUpperCase();
  let earlierScans = 0;
  let previous = null;

  if (lastRow > 1) {
    const rows = sheet.getRange(2, 1, lastRow - 1, LOG_HEADERS.length).getValues();
    for (const row of rows) {
      if (row[2] !== "Pallet" || String(row[3]).toUpperCase() !== palletKey) continue;
      earlierScans += 1;
      previous = row;
    }
  }

  if (!previous) {
    writeScanRow(sheet, lastRow + 1, scan, "", PALLET_ROW_COLOR);
    return;
  }
  writeScanRow(sheet, lastRow + 1, scan, describePreviousScan(sheet, earlierScans + 1, previous), REPEAT_ROW_COLOR);
}

function describePreviousScan(sheet, scanNumber, previous) {
  const scannedAt = formatSheetTime(previous[0], sheet.getParent().getSpreadsheetTimeZone());
  const details = [scannedAt, previous[8], previous[7], previous[6]].filter(Boolean).join(", ");
  return `Scan ${scanNumber} of this pallet. Previous: ${details}`;
}

// Put the tote under its pallet's latest block, so each pallet's totes stay together
// even when several devices are scanning at once.
function writeToteRow(sheet, scan) {
  const lastRow = sheet.getLastRow();
  const palletKey = scan.palletBarcode.toUpperCase();
  let blockEndRow = 0;

  if (lastRow > 1) {
    const rows = sheet.getRange(2, 3, lastRow - 1, 2).getDisplayValues();
    for (let index = rows.length - 1; index >= 0; index -= 1) {
      if (rows[index][0] !== "Pallet" || rows[index][1].toUpperCase() !== palletKey) continue;

      let endIndex = index;
      while (
        endIndex + 1 < rows.length &&
        rows[endIndex + 1][0] === "Tote" &&
        rows[endIndex + 1][1].toUpperCase() === palletKey
      ) {
        endIndex += 1;
      }
      blockEndRow = endIndex + 2;
      break;
    }
  }

  if (!blockEndRow || blockEndRow === lastRow) {
    writeScanRow(sheet, lastRow + 1, scan);
    return;
  }
  sheet.insertRowAfter(blockEndRow);
  writeScanRow(sheet, blockEndRow + 1, scan);
}

function writeScanRow(sheet, row, scan, note = "", palletColor = PALLET_ROW_COLOR) {
  if (row > sheet.getMaxRows()) {
    sheet.insertRowsAfter(sheet.getMaxRows(), row - sheet.getMaxRows());
  }

  const isPallet = scan.eventType === "pallet";
  const detailColor = isPallet ? TEXT_COLOR : TOTE_DETAIL_COLOR;
  sheet.getRange(row, 1, 1, LOG_HEADERS.length)
    .setNumberFormats([LOG_NUMBER_FORMATS])
    .setValues([[
      scan.scannedAt,
      scan.scannedAt,
      isPallet ? "Pallet" : "Tote",
      asPlainText(scan.palletBarcode),
      asPlainText(scan.containerBarcode),
      asPlainText(scan.branch),
      asPlainText(scan.reviewer),
      scan.shift,
      scan.stage,
      note,
    ]])
    .setFontWeight(isPallet ? "bold" : "normal")
    .setBackground(isPallet ? palletColor : null)
    .setFontColors([[
      TEXT_COLOR, TEXT_COLOR, TEXT_COLOR, detailColor, TEXT_COLOR,
      detailColor, detailColor, detailColor, detailColor, TEXT_COLOR,
    ]]);
}

// Run once from the Apps Script editor: it archives now and then every few minutes.
function installArchiveTrigger() {
  for (const trigger of ScriptApp.getProjectTriggers()) {
    if (trigger.getHandlerFunction() === "archiveDispatching") ScriptApp.deleteTrigger(trigger);
  }
  ScriptApp.newTrigger("archiveDispatching").timeBased().everyMinutes(ARCHIVE_EVERY_MINUTES).create();
  archiveDispatching();
}

// Shipped pallets leave the dispatching tab, so new pallet and tote pairs are copied to
// dispatching_history to keep every day's pallets. Rows there are only ever added.
function archiveDispatching() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const source = spreadsheet.getSheetByName(DATA_SHEET_NAME);
    const history = spreadsheet.getSheetByName(HISTORY_SHEET_NAME) || spreadsheet.insertSheet(HISTORY_SHEET_NAME);
    if (!source) throw new Error(`The ${DATA_SHEET_NAME} tab was not found.`);

    const rows = source.getDataRange().getValues();
    const headers = rows.shift().map(String);
    const columns = ["palletBarcode", "containerBarcode", "destination_darkstore", "staging_location", "pallet_creation_date"]
      .map((name) => {
        const index = headers.indexOf(name);
        if (index < 0) throw new Error(`The ${DATA_SHEET_NAME} tab has no ${name} column.`);
        return index;
      });

    // getLastRow() would count the scan time formulas' empty rows, so find the last pallet instead.
    const palletColumn = history.getRange(1, 1, history.getMaxRows(), 1).getDisplayValues();
    let lastRow = palletColumn.length;
    while (lastRow > 0 && palletColumn[lastRow - 1][0] === "") lastRow -= 1;
    if (lastRow === 0) {
      history.getRange(1, 1, 1, HISTORY_HEADERS.length).setValues([HISTORY_HEADERS]).setFontWeight("bold");
      history.setFrozenRows(1);
      lastRow = 1;
    }
    const known = new Set(lastRow > 1
      ? history.getRange(2, 1, lastRow - 1, 2).getDisplayValues().map(([pallet, tote]) => `${pallet}|${tote}`.toUpperCase())
      : []);

    const additions = [];
    for (const row of rows) {
      const [pallet, tote, branch, location, created] = columns.map((index) => row[index]);
      const key = `${pallet}|${tote}`.toUpperCase();
      if (!pallet || !tote || known.has(key)) continue;
      known.add(key);
      additions.push([String(pallet), String(tote), branch, location, created]);
    }
    if (!additions.length) return;

    const extraRows = lastRow + additions.length - history.getMaxRows();
    if (extraRows > 0) history.insertRowsAfter(history.getMaxRows(), extraRows);
    history.getRange(lastRow + 1, 1, additions.length, HISTORY_HEADERS.length)
      .setNumberFormats(additions.map(() => HISTORY_NUMBER_FORMATS))
      .setValues(additions);
  } finally {
    lock.releaseLock();
  }
}

function asPlainText(value) {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function escapeCsvValue(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function createJsonpResponse(callback, response) {
  const serializedResponse = JSON.stringify(response).replace(/</g, "\\u003c");
  return ContentService.createTextOutput(`${callback}(${serializedResponse});`)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function createJsonResponse(response) {
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}
