const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1wx8Ps4-mTL9MpdbwV3FTv8gGEqwuQL_LisSoyUBu6ZU/export?format=csv";
const REFRESH_INTERVAL_MS = 60_000;
const translations = {
  ar: {
    pageTitle: "مراجعة شحن البالتات",
    homeLabel: "الصفحة الرئيسية",
    lastUpdatedInitial: "لم يتم تحديث البيانات بعد",
    designerCredit: "تصميم إبراهيم عفيفي",
    brand: "مراجعة الشحن",
    stepOne: "١",
    stepTwo: "٢",
    progressTextLabel: "تقدم المسح",
    introEyebrow: "تأكيد البالتات والتوت",
    introTitle: "كل حاجة جاهزة للشحن؟",
    introCopy: "امسح البالتة، وبعدها امسح كل توت عليها للتأكد إنه تابع لها.",
    palletHeading: "امسح باركود البالتة",
    palletDescription: "هنعرض لك التوت المسجل على البالتة دي.",
    palletLabel: "باركود البالتة",
    palletPlaceholder: "مثال: FPIA1B1HNLSFJ",
    palletSubmit: "تأكيد البالتة",
    scanHint: "استخدم جهاز الاسكانر أو اكتب الكود واضغط Enter.",
    currentPallet: "البالتة الحالية",
    changePallet: "تغيير البالتة",
    progressLabel: "تقدم مسح التوت",
    containerHeading: "امسح باركود التوت",
    containerDescription: "التوت الصح هيتعلم بالأخضر، وأي كود مش تابع للبالتة هيظهر كخطأ. لاحقة النسخة زي _v22 مش مطلوبة في الاسكان.",
    containerLabel: "باركود التوت",
    containerPlaceholder: "امسح باركود التوت",
    containerSubmit: "فحص التوت",
    containerListHeading: "التوت المطلوب",
    refresh: "تحديث البيانات",
    openSheet: "فتح الشيت",
    switchLanguage: "English",
    switchLanguageLabel: "Switch to English",
    themeDark: "التغيير إلى الوضع الليلي",
    themeLight: "التغيير إلى الوضع النهاري",
    loadingInitial: "جاري تحميل بيانات الشيت...",
    loading: "جاري تحديث بيانات الشيت...",
    connected: "الشيت متصل",
    connectionError: "مشكلة في الاتصال بالشيت",
    latestUpdate: "آخر تحديث {time} · {count} بالتة",
    palletCount: "{count} توت",
    scanned: "تم التأكيد",
    pending: "في انتظار المسح",
    sheetColumns: "الشيت لازم يحتوي على عمودي palletBarcode و containerBarcode.",
    similarContainers: "في أكواد توت متشابهة بعد حذف لاحقة النسخة على البالتة {pallet}.",
    noValidRows: "الشيت مفيهوش بالتات وكونتينرات صالحة للمسح.",
    httpError: "تعذر تحميل الشيت (HTTP {status}).",
    unknownError: "حدث خطأ غير معروف أثناء تحميل الشيت.",
    missingPallet: "البالتة الحالية لم تعد موجودة في الشيت بعد التحديث. امسح بالتة موجودة للمتابعة.",
    sheetPermission: "تأكد أن الشيت متاح للعرض لأي شخص لديه الرابط، ثم حاول التحديث.",
    freshRequiredPallet: "بيانات الشيت مش محدثة حاليًا، مش ممكن تأكيد البالتة. اضغط تحديث البيانات وحاول تاني.",
    freshRequiredContainer: "بيانات الشيت مش محدثة، تم إيقاف التحقق. حدّث البيانات قبل متابعة المسح.",
    palletNotFound: "كود البالتة مش موجود في بيانات الشيت. راجع الكود أو حدّث البيانات.",
    sheetNotLoaded: "بيانات الشيت لسه محملتش. حدّث الصفحة أو اضغط تحديث البيانات قبل المسح.",
    unavailablePallet: "البالتة غير متاحة في بيانات الشيت. امسح البالتة مرة أخرى.",
    wrongContainer: "خطأ: التوت {container} مش تابع للبالتة {pallet}.",
    wrongTotePallet: "التوت {container} مش تابع للبالتة الحالية {currentPallet}؛ هو مسجل على البالتة أو البالتات دي:",
    unknownTote: "التوت {container} مش موجود في بيانات الشيت على أي بالتة.",
    assignmentPallet: "البالتة {pallet} · الفرع: {branch}",
    toteDetails: "تفاصيل التوت في الشيت",
    toteBarcode: "باركود التوت المسجل",
    stagingLocation: "موقع التجهيز",
    orderNumber: "رقم الطلب",
    sourceWarehouse: "مخزن المصدر",
    destination: "الفرع",
    destinationCode: "كود الفرع",
    targetShippedAt: "موعد الشحن المستهدف",
    requestCreationDate: "تاريخ إنشاء الطلب",
    palletCreationDate: "تاريخ إنشاء البالتة",
    shippingCutoff: "آخر موعد للشحن",
    ageingHours: "ساعات الانتظار",
    numberOfItems: "عدد الأصناف",
    markContainerLost: "إعداد تحديد التوت كمفقود",
    duplicateContainer: "تنبيه: التوت {container} اتعمله مسح قبل كده.",
    allScanned: "تمام! كل التوت الـ {count} على البالتة {pallet} اتأكد.",
    containerAccepted: "تمام، التوت {container} تابع للبالتة. باقي {count} توت.",
    palletDetailsFallback: "بيانات البالتة من الشيت",
    sheetLoadFailure: "{message} تأكد أن الشيت متاح للعرض لأي شخص لديه الرابط، ثم حاول التحديث.",
  },
  en: {
    pageTitle: "Pallet Shipping Check",
    homeLabel: "Home",
    lastUpdatedInitial: "Data has not been refreshed yet",
    designerCredit: "Designed by Ibrahim Afify",
    brand: "Shipping Check",
    stepOne: "1",
    stepTwo: "2",
    progressTextLabel: "Scan progress",
    introEyebrow: "Pallet and tote verification",
    introTitle: "Ready to ship?",
    introCopy: "Scan a pallet, then scan each tote on it to confirm it belongs.",
    palletHeading: "Scan the pallet barcode",
    palletDescription: "We’ll show the totes listed for this pallet.",
    palletLabel: "Pallet barcode",
    palletPlaceholder: "Example: FPIA1B1HNLSFJ",
    palletSubmit: "Confirm pallet",
    scanHint: "Use a barcode scanner, or type the code and press Enter.",
    currentPallet: "Current pallet",
    changePallet: "Change pallet",
    progressLabel: "Tote scan progress",
    containerHeading: "Scan the tote barcode",
    containerDescription: "A matching tote turns green. A code that doesn’t belong to this pallet will show an error. Version suffixes such as _v22 are not required.",
    containerLabel: "Tote barcode",
    containerPlaceholder: "Scan a tote barcode",
    containerSubmit: "Check tote",
    containerListHeading: "Expected totes",
    refresh: "Refresh data",
    openSheet: "Open spreadsheet",
    switchLanguage: "العربية",
    switchLanguageLabel: "التغيير إلى العربية",
    themeDark: "Switch to dark mode",
    themeLight: "Switch to light mode",
    loadingInitial: "Loading spreadsheet data...",
    loading: "Refreshing spreadsheet data...",
    connected: "Spreadsheet connected",
    connectionError: "Spreadsheet connection problem",
    latestUpdate: "Last updated {time} · {count} pallets",
    palletCount: "{count} totes",
    scanned: "Confirmed",
    pending: "Waiting to scan",
    sheetColumns: "The spreadsheet must include palletBarcode and containerBarcode columns.",
    similarContainers: "Tote barcodes become ambiguous after removing the version suffix on pallet {pallet}.",
    noValidRows: "The spreadsheet contains no valid pallet and container rows.",
    httpError: "Could not load the spreadsheet (HTTP {status}).",
    unknownError: "An unknown error occurred while loading the spreadsheet.",
    missingPallet: "The current pallet is no longer in the spreadsheet. Scan an available pallet to continue.",
    sheetPermission: "Make sure the spreadsheet is shared with anyone who has the link as a viewer, then try again.",
    freshRequiredPallet: "Spreadsheet data is not up to date, so the pallet cannot be confirmed. Refresh the data and try again.",
    freshRequiredContainer: "Spreadsheet data is not up to date. Verification is paused; refresh before continuing.",
    palletNotFound: "Pallet barcode not found in the spreadsheet. Check the code or refresh the data.",
    sheetNotLoaded: "Spreadsheet data has not loaded yet. Refresh the page or click Refresh data before scanning.",
    unavailablePallet: "This pallet is not available in the spreadsheet. Scan the pallet again.",
    wrongContainer: "Error: tote {container} does not belong to pallet {pallet}.",
    wrongTotePallet: "Tote {container} does not belong to the current pallet {currentPallet}. It is listed under:",
    unknownTote: "Tote {container} is not listed in the spreadsheet under any pallet.",
    assignmentPallet: "Pallet {pallet} · Branch: {branch}",
    toteDetails: "Tote details from spreadsheet",
    toteBarcode: "Registered tote barcode",
    stagingLocation: "Staging location",
    orderNumber: "Order number",
    sourceWarehouse: "Source warehouse",
    destination: "Branch",
    destinationCode: "Branch code",
    targetShippedAt: "Target ship time",
    requestCreationDate: "Request creation date",
    palletCreationDate: "Pallet creation date",
    shippingCutoff: "Shipping cutoff",
    ageingHours: "Ageing hours",
    numberOfItems: "Number of items",
    markContainerLost: "Mark tote lost setting",
    duplicateContainer: "Notice: tote {container} has already been scanned.",
    allScanned: "Done! All {count} totes on pallet {pallet} are confirmed.",
    containerAccepted: "Good, tote {container} belongs to this pallet. {count} remaining.",
    palletDetailsFallback: "Pallet details from spreadsheet",
    sheetLoadFailure: "{message} Make sure the spreadsheet is shared with anyone who has the link as a viewer, then try again.",
  },
};

const elements = {
  languageButton: document.querySelector("#languageButton"),
  themeButton: document.querySelector("#themeButton"),
  syncIndicator: document.querySelector("#syncIndicator"),
  syncText: document.querySelector("#syncText"),
  notice: document.querySelector("#notice"),
  palletScanCard: document.querySelector("#palletScanCard"),
  palletForm: document.querySelector("#palletForm"),
  palletInput: document.querySelector("#palletInput"),
  palletResult: document.querySelector("#palletResult"),
  selectedPallet: document.querySelector("#selectedPallet"),
  palletDetails: document.querySelector("#palletDetails"),
  changePalletButton: document.querySelector("#changePalletButton"),
  containerForm: document.querySelector("#containerForm"),
  containerInput: document.querySelector("#containerInput"),
  scanFeedback: document.querySelector("#scanFeedback"),
  containerList: document.querySelector("#containerList"),
  containerCount: document.querySelector("#containerCount"),
  progressText: document.querySelector("#progressText"),
  progressBar: document.querySelector("#progressBar"),
  progressFill: document.querySelector("#progressFill"),
  lastUpdated: document.querySelector("#lastUpdated"),
  refreshButton: document.querySelector("#refreshButton"),
};

let pallets = new Map();
let toteAssignments = new Map();
let currentPalletBarcode = "";
let scannedContainers = new Set();
let isRefreshing = false;
let hasFreshSheet = false;
let currentLanguage = localStorage.getItem("shipping-check-language") === "en" ? "en" : "ar";
let currentTheme = localStorage.getItem("shipping-check-theme") === "dark" ? "dark" : "light";

function t(key, values = {}) {
  return translations[currentLanguage][key].replace(/\{(\w+)\}/g, (_, name) => String(values[name]));
}

function applyLanguage() {
  document.documentElement.lang = currentLanguage;
  document.documentElement.dir = currentLanguage === "ar" ? "rtl" : "ltr";
  document.title = t("pageTitle");
  for (const element of document.querySelectorAll("[data-i18n]")) {
    element.textContent = t(element.dataset.i18n);
  }
  for (const element of document.querySelectorAll("[data-i18n-placeholder]")) {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  }
  for (const element of document.querySelectorAll("[data-i18n-aria]")) {
    element.setAttribute("aria-label", t(element.dataset.i18nAria));
  }
  elements.languageButton.textContent = t("switchLanguage");
  elements.languageButton.setAttribute("aria-label", t("switchLanguageLabel"));
  elements.themeButton.textContent = currentTheme === "dark" ? "☀️" : "🌙";
  elements.themeButton.setAttribute("aria-label", t(currentTheme === "dark" ? "themeLight" : "themeDark"));
  elements.syncText.textContent = t(elements.syncIndicator.dataset.messageKey || "loadingInitial");
  if (elements.lastUpdated.dataset.updateTime) {
    elements.lastUpdated.textContent = t("latestUpdate", {
      time: formatTime(new Date(elements.lastUpdated.dataset.updateTime)),
      count: elements.lastUpdated.dataset.palletCount,
    });
  }
  if (!elements.palletResult.hidden && currentPalletBarcode) {
    const pallet = pallets.get(normalizeBarcode(currentPalletBarcode));
    if (pallet) renderPallet(pallet);
  }
  if (elements.notice.dataset.messageKey) {
    elements.notice.textContent = t(elements.notice.dataset.messageKey, JSON.parse(elements.notice.dataset.messageValues || "{}"));
  }
  if (elements.scanFeedback.dataset.messageKey) renderScanFeedback();
  document.querySelector('meta[name="theme-color"]').content = currentTheme === "dark" ? "#111a17" : "#102a27";
}

function applyTheme() {
  document.documentElement.dataset.theme = currentTheme;
  applyLanguage();
}

function normalizeBarcode(value) {
  return value.trim().toLocaleUpperCase();
}

function containerMatchKey(value) {
  return normalizeBarcode(value).replace(/_V\d+$/, "");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (insideQuotes) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        insideQuotes = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      insideQuotes = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function buildPalletIndex(csv) {
  const rows = parseCsv(csv.replace(/^\uFEFF/, ""));
  const headers = rows.shift()?.map((header) => header.trim()) ?? [];
  const palletIndex = headers.indexOf("palletBarcode");
  const containerIndex = headers.indexOf("containerBarcode");
  const locationIndex = headers.indexOf("staging_location");
  const destinationIndex = headers.indexOf("destination_darkstore");

  if (palletIndex < 0 || containerIndex < 0) {
    throw new Error(t("sheetColumns"));
  }

  const index = new Map();
  const assignments = new Map();
  const detailColumns = [
    ["stagingLocation", "staging_location"],
    ["orderNumber", "order_nr"],
    ["sourceWarehouse", "source_warehouse_code"],
    ["destination", "destination_darkstore"],
    ["destinationCode", "destination_ds_code"],
    ["targetShippedAt", "target_shipped_at"],
    ["requestCreationDate", "request_creation_date"],
    ["palletCreationDate", "pallet_creation_date"],
    ["shippingCutoff", "shipping_cutoff"],
    ["ageingHours", "ageing_hours"],
    ["numberOfItems", "number_of_items"],
    ["markContainerLost", "enable_mark_container_lost"],
  ].map(([key, header]) => [key, headers.indexOf(header)]);

  for (const row of rows) {
    const palletBarcode = row[palletIndex]?.trim();
    const containerBarcode = row[containerIndex]?.trim();
    if (!palletBarcode || !containerBarcode) continue;

    let pallet = index.get(normalizeBarcode(palletBarcode));
    if (!pallet) {
      pallet = {
        barcode: palletBarcode,
        location: row[locationIndex]?.trim() ?? "",
        destination: row[destinationIndex]?.trim() ?? "",
        containers: new Map(),
      };
      index.set(normalizeBarcode(palletBarcode), pallet);
    }

    const containerKey = containerMatchKey(containerBarcode);
    const existingContainer = pallet.containers.get(containerKey);
    if (existingContainer && normalizeBarcode(existingContainer) !== normalizeBarcode(containerBarcode)) {
      throw new Error(t("similarContainers", { pallet: palletBarcode }));
    }
    if (!existingContainer) {
      pallet.containers.set(containerKey, containerBarcode);
    }

    let palletAssignments = assignments.get(containerKey);
    if (!palletAssignments) {
      palletAssignments = new Map();
      assignments.set(containerKey, palletAssignments);
    }

    let assignment = palletAssignments.get(normalizeBarcode(palletBarcode));
    if (!assignment) {
      assignment = {
        palletBarcode,
        containerBarcodes: new Set(),
        fields: new Map(),
      };
      palletAssignments.set(normalizeBarcode(palletBarcode), assignment);
    }
    assignment.containerBarcodes.add(containerBarcode);

    for (const [key, columnIndex] of detailColumns) {
      const value = columnIndex < 0 ? "" : row[columnIndex]?.trim() ?? "";
      if (!value) continue;
      let values = assignment.fields.get(key);
      if (!values) {
        values = new Set();
        assignment.fields.set(key, values);
      }
      values.add(value);
    }
  }

  if (index.size === 0) {
    throw new Error(t("noValidRows"));
  }

  const toteIndex = new Map();
  for (const [containerKey, palletAssignments] of assignments) {
    const details = [];
    for (const assignment of palletAssignments.values()) {
      const fields = Object.fromEntries(
        [...assignment.fields].map(([key, values]) => [key, [...values]]),
      );
      details.push({
        palletBarcode: assignment.palletBarcode,
        containerBarcodes: [...assignment.containerBarcodes],
        fields,
      });
    }
    toteIndex.set(containerKey, details);
  }

  return { pallets: index, toteAssignments: toteIndex };
}

function setSyncState(state, messageKey) {
  elements.syncIndicator.dataset.state = state;
  elements.syncIndicator.dataset.messageKey = messageKey;
  elements.syncText.textContent = t(messageKey);
}

function showNotice(messageKey, values = {}, state = "error") {
  elements.notice.dataset.messageKey = messageKey;
  elements.notice.dataset.messageValues = JSON.stringify(values);
  elements.notice.textContent = t(messageKey, values);
  elements.notice.dataset.state = state;
  elements.notice.hidden = false;
}

function clearNotice() {
  elements.notice.hidden = true;
  elements.notice.textContent = "";
  delete elements.notice.dataset.messageKey;
  delete elements.notice.dataset.messageValues;
}

function formatTime(date) {
  return new Intl.DateTimeFormat(currentLanguage === "ar" ? "ar-EG" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

async function refreshSheet() {
  if (isRefreshing) return;

  isRefreshing = true;
  elements.refreshButton.disabled = true;
  setSyncState("loading", "loading");
  try {
    const separator = SHEET_CSV_URL.includes("?") ? "&" : "?";
    const response = await fetch(`${SHEET_CSV_URL}${separator}_=${Date.now()}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(t("httpError", { status: response.status }));
    }

    const sheetData = buildPalletIndex(await response.text());
    pallets = sheetData.pallets;
    toteAssignments = sheetData.toteAssignments;
    hasFreshSheet = true;
    elements.lastUpdated.dataset.updateTime = new Date().toISOString();
    elements.lastUpdated.dataset.palletCount = String(pallets.size);
    elements.lastUpdated.textContent = t("latestUpdate", {
      time: formatTime(new Date(elements.lastUpdated.dataset.updateTime)),
      count: pallets.size,
    });
    setSyncState("ok", "connected");
    clearNotice();

    if (currentPalletBarcode) {
      const pallet = pallets.get(normalizeBarcode(currentPalletBarcode));
      if (!pallet) {
        currentPalletBarcode = "";
        scannedContainers.clear();
        elements.palletScanCard.hidden = false;
        elements.palletResult.hidden = true;
        elements.palletInput.focus();
        showNotice("missingPallet");
      } else {
        const validScans = new Set(pallet.containers.keys());
        scannedContainers = new Set([...scannedContainers].filter((code) => validScans.has(code)));
        renderPallet(pallet);
      }
    }
  } catch (error) {
    hasFreshSheet = false;
    const message = error instanceof Error ? error.message : t("unknownError");
    setSyncState("error", "connectionError");
    showNotice("sheetLoadFailure", { message });
  } finally {
    isRefreshing = false;
    elements.refreshButton.disabled = false;
  }
}

function renderPallet(pallet) {
  elements.palletResult.hidden = false;
  elements.selectedPallet.textContent = pallet.barcode;
  const details = [pallet.location, pallet.destination].filter(Boolean);
  elements.palletDetails.textContent = details.length ? details.join(" · ") : t("palletDetailsFallback");
  elements.containerCount.textContent = t("palletCount", { count: pallet.containers.size });

  const list = document.createDocumentFragment();
  for (const [normalizedCode, barcode] of pallet.containers) {
    const item = document.createElement("li");
    item.className = "container-row";
    item.dataset.state = scannedContainers.has(normalizedCode) ? "scanned" : "pending";

    const code = document.createElement("span");
    code.className = "container-code";
    code.textContent = barcode;

    const state = document.createElement("span");
    state.className = "container-state";
    state.textContent = scannedContainers.has(normalizedCode) ? t("scanned") : t("pending");

    item.append(code, state);
    list.append(item);
  }
  elements.containerList.replaceChildren(list);

  const total = pallet.containers.size;
  const scanned = scannedContainers.size;
  const progress = total ? Math.round((scanned / total) * 100) : 0;
  elements.progressText.textContent = `${scanned} / ${total}`;
  elements.progressFill.style.width = `${progress}%`;
  elements.progressBar.setAttribute("aria-valuemax", String(total));
  elements.progressBar.setAttribute("aria-valuenow", String(scanned));
}

function showScanFeedback(messageKey, values = {}, state = "success") {
  elements.scanFeedback.dataset.messageKey = messageKey;
  elements.scanFeedback.dataset.messageValues = JSON.stringify(values);
  elements.scanFeedback.dataset.state = state;
  elements.scanFeedback.hidden = false;
  renderScanFeedback();
}

function renderScanFeedback() {
  const messageKey = elements.scanFeedback.dataset.messageKey;
  const values = JSON.parse(elements.scanFeedback.dataset.messageValues || "{}");
  const message = document.createElement("div");
  message.className = "feedback-message";
  message.textContent = t(messageKey, values);
  elements.scanFeedback.replaceChildren(message);

  if (messageKey !== "wrongTotePallet") return;

  const assignmentList = document.createElement("ul");
  assignmentList.className = "assignment-list";
  for (const assignment of values.assignments) {
    const item = document.createElement("li");
    const branch = assignment.fields.destination?.join(", ") || t("palletDetailsFallback");
    const heading = document.createElement("h3");
    heading.textContent = t("assignmentPallet", {
      pallet: assignment.palletBarcode,
      branch,
    });
    item.append(heading);

    const details = document.createElement("dl");
    details.className = "assignment-details";
    const fields = {
      toteBarcode: assignment.containerBarcodes,
      ...assignment.fields,
    };
    for (const [key, fieldValues] of Object.entries(fields)) {
      if (!fieldValues?.length) continue;
      const group = document.createElement("div");
      const term = document.createElement("dt");
      term.textContent = t(key);
      const value = document.createElement("dd");
      value.textContent = fieldValues.join(", ");
      group.append(term, value);
      details.append(group);
    }
    item.append(details);
    assignmentList.append(item);
  }
  elements.scanFeedback.append(assignmentList);
}

elements.palletForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!hasFreshSheet) {
    showNotice("freshRequiredPallet");
    return;
  }

  const barcode = elements.palletInput.value.trim();
  const pallet = pallets.get(normalizeBarcode(barcode));

  if (!pallet) {
    showNotice(
      pallets.size
        ? "palletNotFound"
        : "sheetNotLoaded",
    );
    elements.palletInput.select();
    return;
  }

  clearNotice();
  currentPalletBarcode = pallet.barcode;
  scannedContainers.clear();
  elements.palletInput.value = "";
  elements.palletScanCard.hidden = true;
  elements.scanFeedback.hidden = true;
  renderPallet(pallet);
  elements.containerInput.focus();
});

elements.containerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const scannedBarcode = elements.containerInput.value.trim();
  elements.containerInput.value = "";
  if (!scannedBarcode) return;

  if (!hasFreshSheet) {
    showScanFeedback("freshRequiredContainer", {}, "error");
    return;
  }

  const pallet = pallets.get(normalizeBarcode(currentPalletBarcode));
  if (!pallet) {
    showScanFeedback("unavailablePallet", {}, "error");
    return;
  }

  const normalizedCode = containerMatchKey(scannedBarcode);
  if (!pallet.containers.has(normalizedCode)) {
    const assignments = toteAssignments.get(normalizedCode) ?? [];
    if (assignments.length) {
      showScanFeedback(
        "wrongTotePallet",
        { container: scannedBarcode, currentPallet: pallet.barcode, assignments },
        "error",
      );
    } else {
      showScanFeedback("unknownTote", { container: scannedBarcode }, "error");
    }
    return;
  }

  if (scannedContainers.has(normalizedCode)) {
    showScanFeedback("duplicateContainer", { container: scannedBarcode }, "warning");
    return;
  }

  scannedContainers.add(normalizedCode);
  renderPallet(pallet);
  const remaining = pallet.containers.size - scannedContainers.size;
  showScanFeedback(
    remaining === 0
      ? "allScanned"
      : "containerAccepted",
    remaining === 0
      ? { count: pallet.containers.size, pallet: pallet.barcode }
      : { container: scannedBarcode, count: remaining },
  );
  elements.containerInput.focus();
});

elements.changePalletButton.addEventListener("click", () => {
  currentPalletBarcode = "";
  scannedContainers.clear();
  elements.palletResult.hidden = true;
  elements.palletScanCard.hidden = false;
  elements.scanFeedback.hidden = true;
  elements.palletInput.focus();
});

elements.refreshButton.addEventListener("click", refreshSheet);

elements.languageButton.addEventListener("click", () => {
  currentLanguage = currentLanguage === "ar" ? "en" : "ar";
  localStorage.setItem("shipping-check-language", currentLanguage);
  applyLanguage();
});

elements.themeButton.addEventListener("click", () => {
  currentTheme = currentTheme === "light" ? "dark" : "light";
  localStorage.setItem("shipping-check-theme", currentTheme);
  applyTheme();
});

applyTheme();
refreshSheet();
window.setInterval(refreshSheet, REFRESH_INTERVAL_MS);
