/**
 * Spreadsheet, validation and response helpers shared by every handler.
 */

function getSheet_(tabName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tabName);
  if (!sheet) fail_('SERVER', 'Missing "' + tabName + '" tab. Run setupSheet() first.');
  return sheet;
}

/** Every value comes back as a string so the frontend types stay honest. */
function sheetToObjects_(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1)
    .filter(row => row.some(cell => cell !== ''))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        const cell = row[i];
        obj[h] = cell instanceof Date ? cell.toISOString() : String(cell == null ? '' : cell);
      });
      return obj;
    });
}

function findRowByKey_(sheet, keyColName, keyValue) {
  const target = String(keyValue).toLowerCase();
  return sheetToObjects_(sheet).find(r => String(r[keyColName]).toLowerCase() === target) || null;
}

function appendObject_(sheet, headers, obj) {
  sheet.appendRow(headers.map(col => sanitizeCell_(obj[col])));
}

/** Writes only the changed cells of one row and returns the merged record. */
function updateRowByKey_(sheet, keyColName, keyValue, changes) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const keyIndex = headers.indexOf(keyColName);
  if (keyIndex === -1) fail_('SERVER', 'Column ' + keyColName + ' not found.');

  const target = String(keyValue).toLowerCase();
  const rowIndex = data.findIndex((row, i) => i > 0 && String(row[keyIndex]).toLowerCase() === target);
  if (rowIndex === -1) fail_('NOT_FOUND', 'Record ' + keyColName + '="' + keyValue + '" not found.');

  const record = {};
  headers.forEach((col, i) => {
    const cell = data[rowIndex][i];
    record[col] = cell instanceof Date ? cell.toISOString() : String(cell == null ? '' : cell);
  });

  Object.keys(changes).forEach(field => {
    const colIndex = headers.indexOf(field);
    if (colIndex === -1 || field === keyColName) return;
    sheet.getRange(rowIndex + 1, colIndex + 1).setValue(sanitizeCell_(changes[field]));
    record[field] = changes[field];
  });
  return record;
}

function deleteRowByKey_(sheet, keyColName, keyValue) {
  const data = sheet.getDataRange().getValues();
  const keyIndex = data[0].indexOf(keyColName);
  const rowIndex = data.findIndex((row, i) => i > 0 && String(row[keyIndex]) === String(keyValue));
  if (rowIndex !== -1) sheet.deleteRow(rowIndex + 1);
}

/** Stops user text like "=IMPORTXML(...)" from being evaluated as a formula. */
function sanitizeCell_(value) {
  const str = String(value == null ? '' : value);
  return /^[=+\-@]/.test(str) ? "'" + str : str;
}

function cleanText_(value) {
  return String(value == null ? '' : value).trim().slice(0, CONFIG.MAX_TEXT_LENGTH);
}

function assertId_(id) {
  const str = String(id || '');
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(str)) fail_('BAD_REQUEST', 'Invalid id: ' + str.slice(0, 64));
  return str;
}

function withWriteLock_(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(CONFIG.LOCK_WAIT_MS)) {
    fail_('BUSY', 'Server busy with other edits. Retrying shortly.');
  }
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function sha256Hex_(text) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8)
    .map(b => ('0' + (b & 0xff).toString(16)).slice(-2))
    .join('');
}

/** Throws an error carrying a machine-readable code for the frontend sync engine. */
function fail_(code, message) {
  const err = new Error(message);
  err.code = code;
  throw err;
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
