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

    if (path === "telemetry/accel") {
      return telemetryAccelPost(body);
    }

    if (path === "telemetry/gps") {
      return telemetryGpsPost(body);
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

    if (path === "presence/history") {
      return getPresenceHistory(e.parameter);
    }

    if (path === "telemetry/accel/latest") {
      return telemetryAccelLatest(e.parameter);
    }

    if (path === "telemetry/gps/latest") {
      return telemetryGpsLatest(e.parameter);
    }

    if (path === "telemetry/gps/history") {
      return telemetryGpsHistory(e.parameter);
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
  const loc_lat  = body.loc_lat || null;
  const loc_lng  = body.loc_lng || null;
  const loc_acc  = body.loc_acc || null;
  const accel_x  = body.accel_x || null;
  const accel_y  = body.accel_y || null;
  const accel_z  = body.accel_z || null;
  const accel_m  = body.accel_m || null;

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
  presenceSheet.appendRow([
    presence_id,
    user_id,
    device_id,
    course_id,
    session_id,
    "checked_in",
    ts,
    loc_lat,
    loc_lng,
    loc_acc,
    accel_x,
    accel_y,
    accel_z,
    accel_m
  ]);

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

function getPresenceHistory(params) {
  const { user_id } = params;
  const course_id   = params.course_id  || null;
  const session_id  = params.session_id || null;
  var   limit       = Number(params.limit);

  if (!user_id) return jsonResponse(false, "missing_field: user_id");
  if (isNaN(limit) || limit <= 0) limit = 50;

  const presenceSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("presence");
  if (!presenceSheet) return jsonResponse(false, "sheet_not_found: presence");

  const rows    = presenceSheet.getDataRange().getValues();
  const results = [];

  // headers: presence_id[0], user_id[1], device_id[2], course_id[3],
  //          session_id[4], status[5], ts[6]
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[1]).trim() !== String(user_id).trim()) continue;
    if (course_id  && String(row[3]).trim() !== String(course_id).trim())  continue;
    if (session_id && String(row[4]).trim() !== String(session_id).trim()) continue;

    results.push({
      presence_id: row[0],
      course_id:   row[3],
      session_id:  row[4],
      status:      row[5],
      ts:          row[6]
    });
  }

  // Ambil N record terbaru
  const paginated = results.slice(-limit).reverse();

  return jsonResponse(true, null, {
    user_id: user_id,
    total:   results.length,
    limit:   limit,
    records: paginated
  });
}


function getOrCreateSheet_(name, headers) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
  } else if (sh.getLastRow() === 0) {
    sh.appendRow(headers);
  }
  return sh;
}

function telemetryAccelPost(body) {
  try {
    const device_id = (body.device_id || "").trim();
    const ts = (body.ts || "").trim();
    const samples = body.samples || [];
    if (!device_id) return jsonResponse(false, "missing_field: device_id");
    if (!ts) return jsonResponse(false, "missing_field: ts");
    if (!Array.isArray(samples) || samples.length === 0) return jsonResponse(false, "missing_field: samples");
    const sh = getOrCreateSheet_("telemetry_accel", ["device_id", "t", "x", "y", "z", "ts"]);
    let accepted = 0;
    for (var i = 0; i < samples.length; i++) {
      var s = samples[i] || {};
      var t = (s.t || "").trim();
      var x = Number(s.x);
      var y = Number(s.y);
      var z = Number(s.z);
      if (!t || isNaN(x) || isNaN(y) || isNaN(z)) continue;
      sh.appendRow([device_id, t, x, y, z, ts]);
      accepted++;
    }
    return jsonResponse(true, null, { accepted: accepted });
  } catch (err) {
    return jsonResponse(false, "server_error: " + err.message);
  }
}

function telemetryAccelLatest(params) {
  try {
    const device_id = (params.device_id || "").trim();
    if (!device_id) return jsonResponse(false, "missing_field: device_id");
    const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("telemetry_accel");
    if (!sh) return jsonResponse(false, "sheet_not_found: telemetry_accel");
    const rows = sh.getDataRange().getValues();
    // headers: device_id, t, x, y, z, ts
    for (var i = rows.length - 1; i >= 1; i--) {
      if (String(rows[i][0]).trim() === device_id) {
        return jsonResponse(true, null, {
          t: rows[i][1],
          x: rows[i][2],
          y: rows[i][3],
          z: rows[i][4]
        });
      }
    }
    return jsonResponse(true, null, null);
  } catch (err) {
    return jsonResponse(false, "server_error: " + err.message);
  }
}

function telemetryGpsPost(body) {
  try {
    const device_id = (body.device_id || "").trim();
    const ts = (body.ts || "").trim();
    var lat = Number(body.lat);
    var lng = Number(body.lng);
    var acc = Number(body.accuracy_m);
    if (!device_id) return jsonResponse(false, "missing_field: device_id");
    if (!ts) return jsonResponse(false, "missing_field: ts");
    if (isNaN(lat) || isNaN(lng)) return jsonResponse(false, "missing_field: lat_lng");
    if (isNaN(acc)) acc = null;
    const sh = getOrCreateSheet_("telemetry_gps", ["device_id", "ts", "lat", "lng", "accuracy_m"]);
    sh.appendRow([device_id, ts, lat, lng, acc]);
    return jsonResponse(true, null, { accepted: true });
  } catch (err) {
    return jsonResponse(false, "server_error: " + err.message);
  }
}

function telemetryGpsLatest(params) {
  try {
    const device_id = (params.device_id || "").trim();
    if (!device_id) return jsonResponse(false, "missing_field: device_id");
    const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("telemetry_gps");
    if (!sh) return jsonResponse(false, "sheet_not_found: telemetry_gps");
    const rows = sh.getDataRange().getValues();
    // headers: device_id, ts, lat, lng, accuracy_m
    for (var i = rows.length - 1; i >= 1; i--) {
      if (String(rows[i][0]).trim() === device_id) {
        return jsonResponse(true, null, {
          ts: rows[i][1],
          lat: rows[i][2],
          lng: rows[i][3],
          accuracy_m: rows[i][4]
        });
      }
    }
    return jsonResponse(true, null, null);
  } catch (err) {
    return jsonResponse(false, "server_error: " + err.message);
  }
}

function telemetryGpsHistory(params) {
  try {
    const device_id = (params.device_id || "").trim();
    var limit = Number(params.limit);
    if (!device_id) return jsonResponse(false, "missing_field: device_id");
    if (isNaN(limit) || limit <= 0) limit = 100;
    const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("telemetry_gps");
    if (!sh) return jsonResponse(false, "sheet_not_found: telemetry_gps");
    const rows = sh.getDataRange().getValues();
    var items = [];
    // headers: device_id, ts, lat, lng, accuracy_m
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === device_id) {
        items.push({ ts: rows[i][1], lat: rows[i][2], lng: rows[i][3] });
      }
    }
    if (items.length > limit) {
      items = items.slice(items.length - limit);
    }
    return jsonResponse(true, null, { device_id: device_id, items: items });
  } catch (err) {
    return jsonResponse(false, "server_error: " + err.message);
  }
}

function jsonResponse(ok, error = null, data = null) {
  const response = { ok: ok };
  if (error) response.error = error;
  if (data)  response.data  = data;
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}