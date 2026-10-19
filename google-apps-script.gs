const SPREADSHEET_ID = "1wx8Ps4-mTL9MpdbwV3FTv8gGEqwuQL_LisSoyUBu6ZU";
const LOG_SHEET_NAME = "pallet_scan";
const DATA_SHEET_NAME = "dispatching";
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

function doGet(event) {
  const parameters = event && event.parameter ? event.parameter : {};
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
  const scannedAt = previous[0] instanceof Date
    ? Utilities.formatDate(previous[0], sheet.getParent().getSpreadsheetTimeZone(), "yyyy-MM-dd HH:mm")
    : String(previous[0]);
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
