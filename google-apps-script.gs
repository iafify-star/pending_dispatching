const SPREADSHEET_ID = "1wx8Ps4-mTL9MpdbwV3FTv8gGEqwuQL_LisSoyUBu6ZU";
const LOG_SHEET_NAME = "ScanLog";
const DATA_SHEET_NAME = "Sheet1";
const LOG_HEADERS = ["scannedAt", "eventType", "palletBarcode", "containerBarcode"];

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

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(LOG_SHEET_NAME);
    if (!sheet) sheet = spreadsheet.insertSheet(LOG_SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(LOG_HEADERS);
    } else {
      const headers = sheet.getRange(1, 1, 1, LOG_HEADERS.length).getDisplayValues()[0];
      if (LOG_HEADERS.some((header, index) => headers[index] !== header)) {
        throw new Error(`The ${LOG_SHEET_NAME} tab has unexpected columns.`);
      }
    }

    sheet.appendRow([
      new Date().toISOString(),
      scan.eventType,
      asPlainText(scan.palletBarcode),
      asPlainText(scan.containerBarcode),
    ]);
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

  return createResponsePage({
    source: "shipping-scan-log",
    requestId,
    ...response,
  });
}

function validateScan(parameters) {
  const eventType = String(parameters.eventType || "");
  const palletBarcode = String(parameters.palletBarcode || "").trim();
  const containerBarcode = String(parameters.containerBarcode || "").trim();

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

  return { eventType, palletBarcode, containerBarcode };
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

function createResponsePage(response) {
  const serializedResponse = JSON.stringify(response).replace(/</g, "\\u003c");
  const html = `<!doctype html><html><body><script>
    window.parent.postMessage(${serializedResponse}, "*");
  </script></body></html>`;

  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
