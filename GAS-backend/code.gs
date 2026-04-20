const SPREADSHEET_ID = "11tuZPCqjDnEutWTyHqGZ1WijN7e1eX5sHAJsdICkI6A";

function doPost(e) {
  try {
    const path = e.parameter.path;
    const body = JSON.parse(e.postData.contents);

    if (path === "presence/qr/generate") {
      return generateQR(body);
    }

    // Endpoint baru untuk swap test — menghasilkan QR dengan embedded course+session
    if (path === "presence/qr/autoscan") {
      return generateAutoscanQR(body);
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

/**
 * Dipanggil dari admin.html via google.script.run.serverGenerateAutoscanQR(c, s)
 * Menghasilkan QR berformat: AUTOSCAN|TKN-xxx|course_id|session_id
 */
function serverGenerateAutoscanQR(course_id, session_id) {
  try {
    if (!course_id || !session_id) return { ok: false, error: "missing_field" };

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("tokens");
    if (!sheet) return { ok: false, error: "sheet_not_found: tokens" };

    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const raw_token  = "TKN-" + randomPart;

    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + 2);
    const expires_at = expiryDate.toISOString();

    // Simpan raw token ke sheet (kompatibel dengan checkIn)
    sheet.appendRow([course_id, session_id, raw_token, expires_at, new Date().toISOString()]);

    // Format autoscan untuk QR code
    const autoscan_qr = "AUTOSCAN|" + raw_token + "|" + course_id + "|" + session_id;

    return { ok: true, data: { qr_token: autoscan_qr, expires_at: expires_at } };

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

/**
 * Endpoint: POST presence/qr/autoscan
 * Menghasilkan QR token berformat: AUTOSCAN|TKN-xxx|course_id|session_id
 * untuk digunakan saat swap test antar kelompok.
 * Token TKN- tetap disimpan di sheet tokens agar kompatibel dengan endpoint checkIn.
 */
function generateAutoscanQR(body) {
  const { course_id, session_id, ts } = body;

  if (!course_id)  return jsonResponse(false, "missing_field: course_id");
  if (!session_id) return jsonResponse(false, "missing_field: session_id");
  if (!ts)         return jsonResponse(false, "missing_field: ts");

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("tokens");
  if (!sheet) return jsonResponse(false, "sheet_not_found: tokens");

  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const raw_token  = "TKN-" + randomPart;

  const expiryDate = new Date(ts);
  expiryDate.setMinutes(expiryDate.getMinutes() + 2);
  const expires_at = expiryDate.toISOString();

  // Simpan raw token ke sheet (kompatibel dengan checkIn)
  sheet.appendRow([course_id, session_id, raw_token, expires_at, ts]);

  // String yang di-embed ke QR code — membawa course+session agar bisa autoscan
  const autoscan_qr = "AUTOSCAN|" + raw_token + "|" + course_id + "|" + session_id;

  return jsonResponse(true, null, {
    qr_token:    autoscan_qr,   // ← nilai ini yang dibuat jadi QR code di admin panel
    raw_token:   raw_token,      // ← token mentah (untuk debug)
    expires_at:  expires_at,
  });
}

function checkIn(body) {
  const user_id   = String(body.user_id   || "").trim();
  const device_id = String(body.device_id || "").trim();
  const qr_token  = String(body.qr_token  || "").trim();
  const ts        = String(body.ts        || "").trim();
  // course_id & session_id dari client TIDAK dipakai untuk lookup —
  // akan diambil langsung dari record token di server (authoritative).
  // Ini memungkinkan kelompok lain (swap test) scan QR ini tanpa
  // perlu tahu course_id / session_id kelompok yang punya QR.

  const loc_lat = body.loc_lat || null;
  const loc_lng = body.loc_lng || null;
  const loc_acc = body.loc_acc || null;
  const accel_x = body.accel_x || null;
  const accel_y = body.accel_y || null;
  const accel_z = body.accel_z || null;
  const accel_m = body.accel_m || null;

  if (!user_id)   return jsonResponse(false, "missing_field: user_id");
  if (!device_id) return jsonResponse(false, "missing_field: device_id");
  if (!qr_token)  return jsonResponse(false, "missing_field: qr_token");
  if (!ts)        return jsonResponse(false, "missing_field: ts");

  const ss            = SpreadsheetApp.openById(SPREADSHEET_ID);
  const tokensSheet   = ss.getSheetByName("tokens");
  const presenceSheet = ss.getSheetByName("presence");

  if (!tokensSheet)   return jsonResponse(false, "sheet_not_found: tokens");
  if (!presenceSheet) return jsonResponse(false, "sheet_not_found: presence");

  const tokens = tokensSheet.getDataRange().getValues();
  let validToken = null;

  // Cari token HANYA berdasarkan qr_token (kolom index 2).
  // Tidak mensyaratkan course_id / session_id dari client —
  // sehingga siapapun yang memegang token ini bisa check-in.
  for (let i = 1; i < tokens.length; i++) {
    if (String(tokens[i][2]).trim() === qr_token) {
      validToken = tokens[i];
      break;
    }
  }

  if (!validToken)                            return jsonResponse(false, "token_invalid");
  if (new Date(ts) > new Date(validToken[3])) return jsonResponse(false, "token_expired");

  // Ambil course_id & session_id dari TOKEN RECORD (server) — bukan dari client.
  // toLowerCase agar konsisten dengan getStatus() dan menghindari mismatch case.
  const actual_course_id  = String(validToken[0]).toLowerCase().trim();
  const actual_session_id = String(validToken[1]).toLowerCase().trim();
  const actual_user_id    = user_id.toLowerCase().trim();

  // Cek apakah user sudah check-in di sesi ini (pakai actual course+session dari server)
  const presences = presenceSheet.getDataRange().getValues();
  for (let i = 1; i < presences.length; i++) {
    // headers: presence_id[0], user_id[1], device_id[2], course_id[3], session_id[4]
    if (String(presences[i][1]).toLowerCase().trim() === actual_user_id &&
        String(presences[i][3]).toLowerCase().trim() === actual_course_id &&
        String(presences[i][4]).toLowerCase().trim() === actual_session_id) {
      return jsonResponse(false, "already_checked_in");
    }
  }

  // Simpan presence dengan course+session DARI SERVER (bukan dari client)
  const presence_id = "PR-" + Utilities.getUuid().substring(0, 5).toUpperCase();
  presenceSheet.appendRow([
    presence_id,
    actual_user_id,
    device_id,
    actual_course_id,   // ← dari server
    actual_session_id,  // ← dari server
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

  // Kembalikan actual course+session ke client agar bisa update localStorage
  return jsonResponse(true, null, {
    presence_id:  presence_id,
    status:       "checked_in",
    course_id:    actual_course_id,
    session_id:   actual_session_id,
  });
}

function getStatus(params) {
  // Normalisasi input (trim & lowercase)
  const user_id    = String(params.user_id || "").toLowerCase().trim();
  const course_id  = String(params.course_id || "").toLowerCase().trim();
  const session_id = String(params.session_id || "").toLowerCase().trim();

  if (!user_id)    return jsonResponse(false, "missing_field: user_id");
  if (!course_id)  return jsonResponse(false, "missing_field: course_id");
  if (!session_id) return jsonResponse(false, "missing_field: session_id");

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const presenceSheet = ss.getSheetByName("presence");
  if (!presenceSheet) return jsonResponse(false, "sheet_not_found: presence");

  // Gunakan getDisplayValues() agar sinkron dengan apa yang terlihat di sheet (termasuk format angka/teks)
  const presences = presenceSheet.getDataRange().getDisplayValues();
  
  let current_status = "not_checked_in";
  let presence_id = null;
  let last_ts = null;
  let total_attendance_in_course = 0;

  for (let i = 1; i < presences.length; i++) {
    const row = presences[i];
    // headers: presence_id[0], user_id[1], device_id[2], course_id[3], session_id[4], status[5], ts[6]
    
    // Normalisasi data dari sheet (trim & lowercase)
    const rowUser    = String(row[1]).toLowerCase().trim();
    const rowCourse  = String(row[3]).toLowerCase().trim();
    const rowSession = String(row[4]).toLowerCase().trim();
    const rowStatus  = String(row[5] || "").toLowerCase().trim().replace(/\s+/g, "_"); // "checked in" -> "checked_in"

    if (rowUser === user_id && rowCourse === course_id) {
      total_attendance_in_course++;
      
      if (rowSession === session_id) {
        current_status = rowStatus;
        presence_id = row[0];
        last_ts = row[6];
      }
    }
  }

  const MAX_SESSIONS = 14; 
  const percentage = Math.min(100, Math.round((total_attendance_in_course / MAX_SESSIONS) * 100));

  return jsonResponse(true, null, {
    user_id, course_id, session_id,
    presence_id,
    status: current_status,
    last_ts,
    stats: {
      total_presence: total_attendance_in_course,
      percentage: percentage,
      max_sessions: MAX_SESSIONS
    }
  });
}

function getPresenceHistory(params) {
  const user_id    = String(params.user_id || "").toLowerCase().trim();
  const course_id   = params.course_id ? String(params.course_id).toLowerCase().trim() : null;
  const session_id  = params.session_id ? String(params.session_id).toLowerCase().trim() : null;
  var   limit       = Number(params.limit);

  if (!user_id) return jsonResponse(false, "missing_field: user_id");
  if (isNaN(limit) || limit <= 0) limit = 100;

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const presenceSheet = ss.getSheetByName("presence");
  if (!presenceSheet) return jsonResponse(false, "sheet_not_found: presence");

  // Gunakan getDisplayValues() untuk konsistensi tampilan
  const rows = presenceSheet.getDataRange().getDisplayValues();
  const results = [];

  // headers: presence_id[0], user_id[1], device_id[2], course_id[3],
  //          session_id[4], status[5], ts[6]
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowUser    = String(row[1]).toLowerCase().trim();
    const rowCourse  = String(row[3]).toLowerCase().trim();
    const rowSession = String(row[4]).toLowerCase().trim();
    const rowStatus  = String(row[5] || "").toLowerCase().trim().replace(/\s+/g, "_");

    if (rowUser !== user_id) continue;
    if (course_id  && rowCourse !== course_id)  continue;
    if (session_id && rowSession !== session_id) continue;

    results.push({
      presence_id: row[0],
      course_id:   row[3],
      session_id:  row[4],
      status:      rowStatus,
      ts:          row[6]
    });
  }

  // Ambil N record terbaru (slice dari belakang, lalu balik urutannya)
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
    const user_id   = (body.user_id || "").trim();
    const ts = (body.ts || "").trim();
    var lat = Number(body.lat);
    var lng = Number(body.lng);
    var acc = Number(body.accuracy_m);
    
    if (!device_id) return jsonResponse(false, "missing_field: device_id");
    if (!user_id)   return jsonResponse(false, "missing_field: user_id");
    if (!ts)        return jsonResponse(false, "missing_field: ts");
    if (isNaN(lat) || isNaN(lng)) return jsonResponse(false, "missing_field: lat_lng");
    if (isNaN(acc)) acc = null;

    const sh = getOrCreateSheet_("telemetry_gps", ["device_id", "user_id", "ts", "lat", "lng", "accuracy_m"]);
    sh.appendRow([device_id, user_id, ts, lat, lng, acc]);
    
    return jsonResponse(true, null, { accepted: true });
  } catch (err) {
    return jsonResponse(false, "server_error: " + err.message);
  }
}

function telemetryGpsLatest(params) {
  try {
    const device_id = (params.device_id || "").trim();
    const user_id   = (params.user_id || "").trim();
    
    if (!device_id) return jsonResponse(false, "missing_field: device_id");
    if (!user_id)   return jsonResponse(false, "missing_field: user_id");
    
    const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("telemetry_gps");
    if (!sh) return jsonResponse(false, "sheet_not_found: telemetry_gps");
    
    const rows = sh.getDataRange().getValues();
    // headers: device_id[0], user_id[1], ts[2], lat[3], lng[4], accuracy_m[5]
    for (var i = rows.length - 1; i >= 1; i--) {
      const row = rows[i];
      if (String(row[0]).trim() === device_id && String(row[1]).trim() === user_id) {
        return jsonResponse(true, null, {
          ts: row[2],
          lat: Number(row[3]),
          lng: Number(row[4]),
          accuracy_m: Number(row[5])
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
    const user_id   = (params.user_id || "").trim();
    var limit = Number(params.limit);

    if (!device_id) return jsonResponse(false, "missing_field: device_id");
    if (!user_id)   return jsonResponse(false, "missing_field: user_id");
    if (isNaN(limit) || limit <= 0) limit = 100;

    const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("telemetry_gps");
    if (!sh) return jsonResponse(false, "sheet_not_found: telemetry_gps");
    
    const rows = sh.getDataRange().getValues();
    var items = [];
    // headers: device_id[0], user_id[1], ts[2], lat[3], lng[4], accuracy_m[5]
    for (var i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (String(row[0]).trim() === device_id && String(row[1]).trim() === user_id) {
        items.push({ 
          ts: row[2], 
          lat: Number(row[3]), 
          lng: Number(row[4]),
          accuracy_m: Number(row[5])
        });
      }
    }
    if (items.length > limit) {
      items = items.slice(items.length - limit);
    }
    return jsonResponse(true, null, { device_id: device_id, user_id: user_id, items: items });
  } catch (err) {
    return jsonResponse(false, "server_error: " + err.message);
  }
}

function serverGetAccelData(device_id, limit) {
  try {
    if (!limit || isNaN(Number(limit)) || Number(limit) <= 0) limit = 60;
    else limit = Number(limit);

    var sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("telemetry_accel");
    if (!sh || sh.getLastRow() <= 1) return { ok: true, data: { items: [], devices: [] } };

    var rows = sh.getDataRange().getValues();
    // headers: device_id[0], t[1], x[2], y[3], z[4], ts[5]

    // Collect unique devices
    var devSet = {};
    for (var i = 1; i < rows.length; i++) {
      devSet[String(rows[i][0]).trim()] = true;
    }
    var devices = Object.keys(devSet);

    // Filter by device_id if provided
    var did = (device_id || "").trim();
    if (!did && devices.length > 0) did = devices[0]; // default first device

    var items = [];
    for (var j = 1; j < rows.length; j++) {
      if (String(rows[j][0]).trim() === did) {
        items.push({
          t: rows[j][1],
          x: Number(rows[j][2]),
          y: Number(rows[j][3]),
          z: Number(rows[j][4]),
          ts: rows[j][5]
        });
      }
    }

    // Take last N
    if (items.length > limit) {
      items = items.slice(items.length - limit);
    }

    return { ok: true, data: { device_id: did, items: items, devices: devices } };
  } catch (err) {
    return { ok: false, error: "server_error: " + err.message };
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