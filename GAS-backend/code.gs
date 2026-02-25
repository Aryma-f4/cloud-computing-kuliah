const SPREADSHEET_ID = "11tuZPCqjDnEutWTyHqGZ1WijN7e1eX5sHAJsdICkI6A";

function doPost(e) {
  try {
    const path = e.pathInfo || e.parameter.path;
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
    const path = e.pathInfo;

    if (path === "presence/status") {
      return getStatus(e.parameter);
    }

    return jsonResponse(true, null, { message: "Presensi QR Dinamis API Running" });

  } catch (err) {
    return jsonResponse(false, "server_error: " + err.message);
  }
}

// POST /presence/qr/generate
function generateQR(body) {
  const { course_id, session_id, ts } = body;

  if (!course_id) return jsonResponse(false, "missing_field: course_id");
  if (!session_id) return jsonResponse(false, "missing_field: session_id");
  if (!ts)         return jsonResponse(false, "missing_field: ts");

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID)
    .getSheetByName("tokens");

  if (!sheet) return jsonResponse(false, "sheet_not_found: tokens");

  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const qr_token = "TKN-" + randomPart;

  const expiryDate = new Date(ts);
  expiryDate.setMinutes(expiryDate.getMinutes() + 2);
  const expires_at = expiryDate.toISOString();

  sheet.appendRow([course_id, session_id, qr_token, expires_at, ts]);

  return jsonResponse(true, null, {
    qr_token: qr_token,
    expires_at: expires_at
  });
}

// POST /presence/checkin
function checkIn(body) {
  const { user_id, device_id, course_id, session_id, qr_token, ts } = body;

  if (!user_id)    return jsonResponse(false, "missing_field: user_id");
  if (!device_id)  return jsonResponse(false, "missing_field: device_id");
  if (!course_id)  return jsonResponse(false, "missing_field: course_id");
  if (!session_id) return jsonResponse(false, "missing_field: session_id");
  if (!qr_token)   return jsonResponse(false, "missing_field: qr_token");
  if (!ts)         return jsonResponse(false, "missing_field: ts");

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const tokensSheet   = ss.getSheetByName("tokens");
  const presenceSheet = ss.getSheetByName("presence");

  if (!tokensSheet)   return jsonResponse(false, "sheet_not_found: tokens");
  if (!presenceSheet) return jsonResponse(false, "sheet_not_found: presence");

  const tokens = tokensSheet.getDataRange().getValues();
  let validToken = null;

  for (let i = 1; i < tokens.length; i++) {
    if (
      tokens[i][0] === course_id &&
      tokens[i][1] === session_id &&
      tokens[i][2] === qr_token
    ) {
      validToken = tokens[i];
      break;
    }
  }

  if (!validToken) {
    return jsonResponse(false, "token_invalid");
  }

  const expiry = new Date(validToken[3]);
  const now    = new Date(ts);

  if (now > expiry) {
    return jsonResponse(false, "token_expired");
  }

  const presences = presenceSheet.getDataRange().getValues();

  for (let i = 1; i < presences.length; i++) {
    if (
      presences[i][1] === user_id &&
      presences[i][3] === course_id &&
      presences[i][4] === session_id
    ) {
      return jsonResponse(false, "already_checked_in");
    }
  }

  const presence_id = "PR-" + Utilities.getUuid().substring(0, 5).toUpperCase();
  const status      = "checked_in";

  presenceSheet.appendRow([presence_id, user_id, device_id, course_id, session_id, status, ts]);

  return jsonResponse(true, null, {
    presence_id: presence_id,
    status: status
  });
}

// GET /presence/status?user_id=...&course_id=...&session_id=...
function getStatus(params) {
  const { user_id, course_id, session_id } = params;

  if (!user_id)    return jsonResponse(false, "missing_field: user_id");
  if (!course_id)  return jsonResponse(false, "missing_field: course_id");
  if (!session_id) return jsonResponse(false, "missing_field: session_id");

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const presenceSheet = ss.getSheetByName("presence");

  if (!presenceSheet) return jsonResponse(false, "sheet_not_found: presence");

  const presences = presenceSheet.getDataRange().getValues();

  for (let i = 1; i < presences.length; i++) {
    if (
      presences[i][1] === user_id &&
      presences[i][3] === course_id &&
      presences[i][4] === session_id
    ) {
      return jsonResponse(true, null, {
        user_id:    user_id,
        course_id:  course_id,
        session_id: session_id,
        status:     presences[i][5],
        last_ts:    presences[i][6]
      });
    }
  }

  return jsonResponse(true, null, {
    user_id:    user_id,
    course_id:  course_id,
    session_id: session_id,
    status:     "not_checked_in",
    last_ts:    null
  });
}

// HELPER
function jsonResponse(ok, error = null, data = null) {
  const response = { ok: ok };
  if (error) response.error = error;
  if (data)  response.data  = data;

  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}