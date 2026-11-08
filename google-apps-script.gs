// Paste this file into Extensions > Apps Script in your Google Sheet.
// Run setupCarId() once from the Apps Script editor while it is open from the
// spreadsheet. Authorize it, then copy the generated token from the execution log
// into GOOGLE_APPS_SCRIPT_TOKEN in the app's server environment.
//
// Deploy > New deployment > Web app:
//   Execute as: Me
//   Who has access: Anyone
// Copy the deployment URL into GOOGLE_APPS_SCRIPT_URL.
// The first row of the target sheet must contain the 12 column names below.

function setupCarId() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('Open Apps Script from Extensions > Apps Script in the target spreadsheet.');
  }

  const token = Utilities.getUuid() + Utilities.getUuid();
  PropertiesService.getScriptProperties().setProperties({
    CARID_SPREADSHEET_ID: spreadsheet.getId(),
    CARID_API_TOKEN: token,
  });
  console.log(`Copy this token to GOOGLE_APPS_SCRIPT_TOKEN: ${token}`);
}

const PROFILE_HEADERS = [
  'username',
  'name',
  'car_brand',
  'car_model',
  'plate',
  'avatar',
  'video',
  'instagram',
  'telegram',
  'tiktok',
  'youtube',
  'active',
];

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function textCell(value) {
  const text = String(value || '');
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function doPost(event) {
  const lock = LockService.getScriptLock();
  let lockAcquired = false;
  try {
    const properties = PropertiesService.getScriptProperties();
    const expectedToken = properties.getProperty('CARID_API_TOKEN');
    const spreadsheetId = properties.getProperty('CARID_SPREADSHEET_ID');
    const payload = JSON.parse(event.postData.contents);

    if (!expectedToken || !spreadsheetId) {
      return jsonResponse({
        ok: false,
        code: 'NOT_CONFIGURED',
        error: 'Run setupCarId() from the spreadsheet Apps Script project.',
      });
    }
    if (payload.token !== expectedToken) {
      return jsonResponse({
        ok: false,
        code: 'UNAUTHORIZED',
        error: 'The app token does not match CARID_API_TOKEN. Update GOOGLE_APPS_SCRIPT_TOKEN.',
      });
    }
    if (!payload.profile || typeof payload.profile.username !== 'string') {
      return jsonResponse({ ok: false, code: 'INVALID_PROFILE', error: 'Invalid profile data' });
    }

    lock.waitLock(10000);
    lockAcquired = true;
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName('Sheet1') || spreadsheet.getSheets()[0];
    if (!sheet) {
      return jsonResponse({ ok: false, code: 'SHEET_NOT_FOUND', error: 'Spreadsheet has no sheets.' });
    }

    const actualHeaders = sheet.getRange(1, 1, 1, PROFILE_HEADERS.length)
      .getDisplayValues()[0]
      .map((value) => value.trim().toLowerCase());
    if (PROFILE_HEADERS.some((header, index) => actualHeaders[index] !== header)) {
      return jsonResponse({
        ok: false,
        code: 'INVALID_HEADERS',
        error: `Expected first row: ${PROFILE_HEADERS.join(', ')}`,
      });
    }

    const username = payload.profile.username.trim().toLowerCase();
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const usernames = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
      if (usernames.some((row) => row[0].trim().toLowerCase() === username)) {
        return jsonResponse({ ok: false, code: 'DUPLICATE_USERNAME', error: 'Username already exists' });
      }
    }

    const profile = payload.profile;
    sheet.appendRow([
      textCell(username),
      textCell(profile.name),
      textCell(profile.car_brand),
      textCell(profile.car_model),
      textCell(profile.plate),
      textCell(profile.avatar),
      textCell(profile.video),
      textCell(profile.instagram),
      textCell(profile.telegram),
      textCell(profile.tiktok),
      textCell(profile.youtube),
      'yes',
    ]);

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error(error);
    return jsonResponse({
      ok: false,
      code: 'SHEET_WRITE_FAILED',
      error: String(error && error.message ? error.message : error),
    });
  } finally {
    if (lockAcquired) lock.releaseLock();
  }
}
