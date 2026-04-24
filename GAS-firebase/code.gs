/**
 * Main GAS backend for E-Absen Firebase version
 * This replaces the spreadsheet backend with Firebase Firestore
 */

// Include Firebase modules
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Load Firebase modules
const firebaseConfig = include('firebase-config');
const firebaseCrud = include('firebase-crud');
const firebaseModels = include('firebase-models');

eval(firebaseConfig);
eval(firebaseCrud);
eval(firebaseModels);

/**
 * Main doPost handler
 */
function doPost(e) {
  try {
    const path = e.parameter.path;
    const body = JSON.parse(e.postData.contents);

    if (path === "presence/qr/generate") {
      return generateQR(body);
    }

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

/**
 * Main doGet handler
 */
function doGet(e) {
  try {
    const path = e.parameter.path;

    if (!path) {
      return HtmlService.createHtmlOutputFromFile("admin")
        .setTitle("Admin Presensi QR - Firebase")
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

    return jsonResponse(true, null, { message: "E-Absen Firebase API Running" });

  } catch (err) {
    return jsonResponse(false, "server_error: " + err.message);
  }
}

/**
 * Generate QR token (standard format)
 */
function generateQR(body) {
  const { course_id, session_id, ts } = body;

  if (!course_id)  return jsonResponse(false, "missing_field: course_id");
  if (!session_id) return jsonResponse(false, "missing_field: session_id");
  if (!ts)         return jsonResponse(false, "missing_field: ts");

  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const qr_token   = "TKN-" + randomPart;
  const expiryDate = new Date(ts);
  expiryDate.setMinutes(expiryDate.getMinutes() + 2);
  const expires_at = expiryDate.toISOString();

  // Save to Firebase
  const saved = saveToken(course_id, session_id, qr_token, expires_at, ts);
  
  if (!saved) {
    return jsonResponse(false, "failed_to_save_token");
  }

  return jsonResponse(true, null, { qr_token: qr_token, expires_at: expires_at });
}

/**
 * Generate autoscan QR token
 */
function generateAutoscanQR(body) {
  const { course_id, session_id, ts } = body;

  if (!course_id)  return jsonResponse(false, "missing_field: course_id");
  if (!session_id) return jsonResponse(false, "missing_field: session_id");
  if (!ts)         return jsonResponse(false, "missing_field: ts");

  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const raw_token  = "TKN-" + randomPart;
  const expiryDate = new Date(ts);
  expiryDate.setMinutes(expiryDate.getMinutes() + 2);
  const expires_at = expiryDate.toISOString();

  // Save raw token to Firebase
  const saved = saveToken(course_id, session_id, raw_token, expires_at, ts);
  
  if (!saved) {
    return jsonResponse(false, "failed_to_save_token");
  }

  // Format autoscan for QR code
  const autoscan_qr = "AUTOSCAN|" + raw_token + "|" + course_id + "|" + session_id;

  return jsonResponse(true, null, {
    qr_token:    autoscan_qr,
    raw_token:   raw_token,
    expires_at:  expires_at
  });
}

/**
 * Check-in presence
 */
function checkIn(body) {
  const user_id    = String(body.user_id || "").trim();
  const device_id  = String(body.device_id || "").trim();
  const course_id  = String(body.course_id || "").trim();
  const session_id = String(body.session_id || "").trim();
  const qr_token   = String(body.qr_token || "").trim();
  const ts         = String(body.ts || "").trim();
  
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

  // Validate token
  const token = getToken(qr_token);
  if (!token) return jsonResponse(false, "token_invalid");
  
  if (new Date(ts) > new Date(token.expires_at)) {
    return jsonResponse(false, "token_expired");
  }

  // Check if already checked in
  const existingPresence = getPresence(user_id, course_id, session_id);
  if (existingPresence) {
    return jsonResponse(false, "already_checked_in");
  }

  // Create presence record
  const presence_id = "PR-" + Utilities.getUuid().substring(0, 5).toUpperCase();
  const telemetry = {
    loc_lat, loc_lng, loc_acc,
    accel_x, accel_y, accel_z, accel_m
  };
  
  const saved = savePresence(presence_id, user_id, device_id, course_id, session_id, "checked_in", ts, telemetry);
  
  if (!saved) {
    return jsonResponse(false, "failed_to_save_presence");
  }

  // Mark token as used
  markTokenAsUsed(qr_token);

  return jsonResponse(true, null, { presence_id: presence_id, status: "checked_in" });
}

/**
 * Get presence status
 */
function getStatus(params) {
  const user_id    = String(params.user_id || "").toLowerCase().trim();
  const course_id  = String(params.course_id || "").toLowerCase().trim();
  const session_id = String(params.session_id || "").toLowerCase().trim();

  if (!user_id)    return jsonResponse(false, "missing_field: user_id");
  if (!course_id)  return jsonResponse(false, "missing_field: course_id");
  if (!session_id) return jsonResponse(false, "missing_field: session_id");

  // Get presence for this user/course/session
  const presence = getPresence(user_id, course_id, session_id);
  
  // Get stats for this user/course
  const stats = getPresenceStats(user_id, course_id);
  
  return jsonResponse(true, null, {
    user_id: user_id,
    course_id: course_id,
    session_id: session_id,
    presence_id: presence ? presence.presence_id : null,
    status: presence ? presence.status : "not_checked_in",
    last_ts: presence ? presence.ts : null,
    stats: stats
  });
}

/**
 * Get presence history
 */
function getPresenceHistory(params) {
  const user_id    = String(params.user_id || "").toLowerCase().trim();
  const course_id  = params.course_id ? String(params.course_id).toLowerCase().trim() : null;
  const session_id = params.session_id ? String(params.session_id).toLowerCase().trim() : null;
  var limit = Number(params.limit);

  if (!user_id) return jsonResponse(false, "missing_field: user_id");
  if (isNaN(limit) || limit <= 0) limit = 100;

  const records = getPresenceHistory(user_id, course_id, session_id, limit);
  
  return jsonResponse(true, null, {
    user_id: user_id,
    total: records.length,
    limit: limit,
    records: records
  });
}

/**
 * Accelerometer telemetry POST
 */
function telemetryAccelPost(body) {
  try {
    const device_id = (body.device_id || "").trim();
    const user_id = (body.user_id || "").trim();
    const ts = (body.ts || "").trim();
    const samples = body.samples || [];
    
    if (!device_id) return jsonResponse(false, "missing_field: device_id");
    if (!user_id) return jsonResponse(false, "missing_field: user_id");
    if (!ts) return jsonResponse(false, "missing_field: ts");
    if (!Array.isArray(samples) || samples.length === 0) {
      return jsonResponse(false, "missing_field: samples");
    }

    const accepted = saveAccelSamples(device_id, user_id, samples, ts);
    
    return jsonResponse(true, null, { accepted: accepted });
  } catch (err) {
    return jsonResponse(false, "server_error: " + err.message);
  }
}

/**
 * Accelerometer telemetry latest GET
 */
function telemetryAccelLatest(params) {
  try {
    const device_id = (params.device_id || "").trim();
    const user_id = (params.user_id || "").trim();
    
    if (!device_id) return jsonResponse(false, "missing_field: device_id");
    if (!user_id) return jsonResponse(false, "missing_field: user_id");

    const latest = getLatestAccel(device_id, user_id);
    
    return jsonResponse(true, null, latest);
  } catch (err) {
    return jsonResponse(false, "server_error: " + err.message);
  }
}

/**
 * GPS telemetry POST
 */
function telemetryGpsPost(body) {
  try {
    const device_id = (body.device_id || "").trim();
    const user_id = (body.user_id || "").trim();
    const ts = (body.ts || "").trim();
    var lat = Number(body.lat);
    var lng = Number(body.lng);
    var acc = Number(body.accuracy_m);
    
    if (!device_id) return jsonResponse(false, "missing_field: device_id");
    if (!user_id) return jsonResponse(false, "missing_field: user_id");
    if (!ts) return jsonResponse(false, "missing_field: ts");
    if (isNaN(lat) || isNaN(lng)) {
      return jsonResponse(false, "missing_field: lat_lng");
    }
    if (isNaN(acc)) acc = null;

    const saved = saveGpsPoint(device_id, user_id, ts, lat, lng, acc);
    
    if (!saved) {
      return jsonResponse(false, "failed_to_save_gps");
    }
    
    return jsonResponse(true, null, { accepted: true });
  } catch (err) {
    return jsonResponse(false, "server_error: " + err.message);
  }
}

/**
 * GPS telemetry latest GET
 */
function telemetryGpsLatest(params) {
  try {
    const device_id = (params.device_id || "").trim();
    const user_id = (params.user_id || "").trim();
    
    if (!device_id) return jsonResponse(false, "missing_field: device_id");
    if (!user_id) return jsonResponse(false, "missing_field: user_id");

    const latest = getLatestGps(device_id, user_id);
    
    return jsonResponse(true, null, latest);
  } catch (err) {
    return jsonResponse(false, "server_error: " + err.message);
  }
}

/**
 * GPS telemetry history GET
 */
function telemetryGpsHistory(params) {
  try {
    const device_id = (params.device_id || "").trim();
    const user_id = (params.user_id || "").trim();
    var limit = Number(params.limit);

    if (!device_id) return jsonResponse(false, "missing_field: device_id");
    if (!user_id) return jsonResponse(false, "missing_field: user_id");
    if (isNaN(limit) || limit <= 0) limit = 100;

    const items = getGpsHistory(device_id, user_id, limit);
    
    return jsonResponse(true, null, {
      device_id: device_id,
      user_id: user_id,
      items: items
    });
  } catch (err) {
    return jsonResponse(false, "server_error: " + err.message);
  }
}

/**
 * JSON response helper
 */
function jsonResponse(ok, error = null, data = null) {
  const response = { ok: ok };
  if (error) response.error = error;
  if (data)  response.data  = data;
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}