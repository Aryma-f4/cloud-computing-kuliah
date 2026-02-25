const SPREADSHEET_ID = "11tuZPCqjDnEutWTyHqGZ1WijN7e1eX5sHAJsdICkI6A";

function doPost(e) {
  try {
    const path = e.parameter.path;
    const body = JSON.parse(e.postData.contents);

    if (path === "presence/qr/generate") {
      return generateQR(body);
    }

    if (path === "presence/checkin") {
      return checkIn(body);
    }

    return jsonResponse(false, "endpoint_not_found");

  } catch (err) {
    return jsonResponse(false, "server_error: " + err.message);
  }
}

function doGet(e) {
  try {
    const path = e.parameter.path;

    if (!path) {
      return HtmlService.createHtmlOutputFromFile("admin")
        .setTitle("Admin Presensi QR")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    if (path === "presence/status") {
      return getStatus(e.parameter);
    }

    return jsonResponse(true, null, { message: "Presensi QR Dinamis API Running" });

  } catch (err) {
    return jsonResponse(false, "server_error: " + err.message);
  }
}

function serverGenerateQR(course_id, session_id) {
  try {
    if (!course_id || !session_id) return { ok: false, error: "missing_field" };

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("tokens");
    if (!sheet) return { ok: false, error: "sheet_not_found: tokens" };

    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const qr_token   = "TKN-" + randomPart;

    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + 2);
    const expires_at = expiryDate.toISOString();

    sheet.appendRow([course_id, session_id, qr_token, expires_at, new Date().toISOString()]);

    return { ok: true, data: { qr_token: qr_token, expires_at: expires_at } };

  } catch (err) {
    return { ok: false, error: "server_error: " + err.message };
  }
}

function serverGetAllPresence(course_id, session_id) {
  try {
    if (!course_id || !session_id) return { ok: false, error: "missing_field" };

    const presenceSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("presence");
    if (!presenceSheet) return { ok: false, error: "sheet_not_found: presence" };

    const rows    = presenceSheet.getDataRange().getValues();
    const results = [];

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][3] === course_id && rows[i][4] === session_id) {
        results.push({
          presence_id: rows[i][0],
          user_id:     rows[i][1],
          device_id:   rows[i][2],
          status:      rows[i][5],
          ts:          rows[i][6]
        });
      }
    }

    return { ok: true, data: { results: results, total: results.length } };

  } catch (err) {
    return { ok: false, error: "server_error: " + err.message };
  }
}

function generateQR(body) {
  const { course_id, session_id, ts } = body;

  if (!course_id)  return jsonResponse(false, "missing_field: course_id");
  if (!session_id) return jsonResponse(false, "missing_field: session_id");
  if (!ts)         return jsonResponse(false, "missing_field: ts");

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("tokens");
  if (!sheet) return jsonResponse(false, "sheet_not_found: tokens");

  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const qr_token   = "TKN-" + randomPart;

  const expiryDate = new Date(ts);
  expiryDate.setMinutes(expiryDate.getMinutes() + 2);
  const expires_at = expiryDate.toISOString();

  sheet.appendRow([course_id, session_id, qr_token, expires_at, ts]);

  return jsonResponse(true, null, { qr_token: qr_token, expires_at: expires_at });
}

function checkIn(body) {
  const { user_id, device_id, course_id, session_id, qr_token, ts } = body;

  if (!user_id)    return jsonResponse(false, "missing_field: user_id");
  if (!device_id)  return jsonResponse(false, "missing_field: device_id");
  if (!course_id)  return jsonResponse(false, "missing_field: course_id");
  if (!session_id) return jsonResponse(false, "missing_field: session_id");
  if (!qr_token)   return jsonResponse(false, "missing_field: qr_token");
  if (!ts)         return jsonResponse(false, "missing_field: ts");

  const ss            = SpreadsheetApp.openById(SPREADSHEET_ID);
  const tokensSheet   = ss.getSheetByName("tokens");
  const presenceSheet = ss.getSheetByName("presence");

  if (!tokensSheet)   return jsonResponse(false, "sheet_not_found: tokens");
  if (!presenceSheet) return jsonResponse(false, "sheet_not_found: presence");

  const tokens = tokensSheet.getDataRange().getValues();
  let validToken = null;

  for (let i = 1; i < tokens.length; i++) {
    if (tokens[i][0] === course_id && tokens[i][1] === session_id && tokens[i][2] === qr_token) {
      validToken = tokens[i];
      break;
    }
  }

  if (!validToken)                              return jsonResponse(false, "token_invalid");
  if (new Date(ts) > new Date(validToken[3]))  return jsonResponse(false, "token_expired");

  const presences = presenceSheet.getDataRange().getValues();
  for (let i = 1; i < presences.length; i++) {
    if (presences[i][1] === user_id && presences[i][3] === course_id && presences[i][4] === session_id) {
      return jsonResponse(false, "already_checked_in");
    }
  }

  const presence_id = "PR-" + Utilities.getUuid().substring(0, 5).toUpperCase();
  presenceSheet.appendRow([presence_id, user_id, device_id, course_id, session_id, "checked_in", ts]);

  return jsonResponse(true, null, { presence_id: presence_id, status: "checked_in" });
}

function getStatus(params) {
  const { user_id, course_id, session_id } = params;

  if (!user_id)    return jsonResponse(false, "missing_field: user_id");
  if (!course_id)  return jsonResponse(false, "missing_field: course_id");
  if (!session_id) return jsonResponse(false, "missing_field: session_id");

  const presenceSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("presence");
  if (!presenceSheet) return jsonResponse(false, "sheet_not_found: presence");

  const presences = presenceSheet.getDataRange().getValues();
  for (let i = 1; i < presences.length; i++) {
    if (presences[i][1] === user_id && presences[i][3] === course_id && presences[i][4] === session_id) {
      return jsonResponse(true, null, {
        user_id: user_id, course_id: course_id, session_id: session_id,
        status: presences[i][5], last_ts: presences[i][6]
      });
    }
  }

  return jsonResponse(true, null, {
    user_id: user_id, course_id: course_id, session_id: session_id,
    status: "not_checked_in", last_ts: null
  });
}

function jsonResponse(ok, error = null, data = null) {
  const response = { ok: ok };
  if (error) response.error = error;
  if (data)  response.data  = data;
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}