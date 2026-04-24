/**
 * Firestore models for E-Absen Firebase version
 * Collection structures and helper functions
 */

/**
 * Collection names
 */
const COLLECTIONS = {
  TOKENS: 'tokens',
  PRESENCE: 'presence',
  TELEMETRY_ACCEL: 'telemetry_accel',
  TELEMETRY_GPS: 'telemetry_gps'
};

/**
 * Token document structure
 */
function createTokenDocument(course_id, session_id, qr_token, expires_at, created_at) {
  return {
    course_id: course_id,
    session_id: session_id,
    qr_token: qr_token,
    expires_at: expires_at,
    created_at: created_at,
    is_used: false
  };
}

/**
 * Presence document structure
 */
function createPresenceDocument(presence_id, user_id, device_id, course_id, session_id, status, ts, telemetry = {}) {
  return {
    presence_id: presence_id,
    user_id: user_id,
    device_id: device_id,
    course_id: course_id,
    session_id: session_id,
    status: status,
    ts: ts,
    loc_lat: telemetry.loc_lat || null,
    loc_lng: telemetry.loc_lng || null,
    loc_acc: telemetry.loc_acc || null,
    accel_x: telemetry.accel_x || null,
    accel_y: telemetry.accel_y || null,
    accel_z: telemetry.accel_z || null,
    accel_m: telemetry.accel_m || null,
    created_at: new Date().toISOString()
  };
}

/**
 * Accelerometer telemetry document structure
 */
function createAccelDocument(device_id, user_id, t, x, y, z, ts) {
  return {
    device_id: device_id,
    user_id: user_id,
    t: t,
    x: x,
    y: y,
    z: z,
    ts: ts,
    created_at: new Date().toISOString()
  };
}

/**
 * GPS telemetry document structure
 */
function createGpsDocument(device_id, user_id, ts, lat, lng, accuracy_m) {
  return {
    device_id: device_id,
    user_id: user_id,
    ts: ts,
    lat: lat,
    lng: lng,
    accuracy_m: accuracy_m || null,
    created_at: new Date().toISOString()
  };
}

/**
 * Token CRUD operations
 */
function saveToken(course_id, session_id, qr_token, expires_at, created_at) {
  const tokenData = createTokenDocument(course_id, session_id, qr_token, expires_at, created_at);
  const tokenId = qr_token; // Use token as ID for easy lookup
  
  return setFirestoreDocument(COLLECTIONS.TOKENS, tokenId, tokenData);
}

function getToken(qr_token) {
  return getFirestoreDocument(COLLECTIONS.TOKENS, qr_token);
}

function markTokenAsUsed(qr_token) {
  const token = getToken(qr_token);
  if (token) {
    token.is_used = true;
    return setFirestoreDocument(COLLECTIONS.TOKENS, qr_token, token);
  }
  return false;
}

/**
 * Presence CRUD operations
 */
function savePresence(presence_id, user_id, device_id, course_id, session_id, status, ts, telemetry = {}) {
  const presenceData = createPresenceDocument(presence_id, user_id, device_id, course_id, session_id, status, ts, telemetry);
  
  return setFirestoreDocument(COLLECTIONS.PRESENCE, presenceId, presenceData);
}

function getPresence(user_id, course_id, session_id) {
  const results = queryFirestoreDocuments(COLLECTIONS.PRESENCE, 'user_id', '==', user_id);
  
  for (const presence of results) {
    if (presence.course_id === course_id && presence.session_id === session_id) {
      return presence;
    }
  }
  
  return null;
}

function getAllPresence(course_id, session_id) {
  const results = queryFirestoreDocuments(COLLECTIONS.PRESENCE, 'course_id', '==', course_id);
  
  return results.filter(presence => presence.session_id === session_id);
}

function getPresenceHistory(user_id, course_id = null, session_id = null, limit = 100) {
  let results = queryFirestoreDocuments(COLLECTIONS.PRESENCE, 'user_id', '==', user_id, limit);
  
  if (course_id) {
    results = results.filter(presence => presence.course_id === course_id);
  }
  
  if (session_id) {
    results = results.filter(presence => presence.session_id === session_id);
  }
  
  return results.sort((a, b) => new Date(b.ts) - new Date(a.ts));
}

/**
 * Accelerometer telemetry operations
 */
function saveAccelSamples(device_id, user_id, samples, batch_ts) {
  let accepted = 0;
  
  for (const sample of samples) {
    if (sample.t && typeof sample.x === 'number' && typeof sample.y === 'number' && typeof sample.z === 'number') {
      const accelData = createAccelDocument(device_id, user_id, sample.t, sample.x, sample.y, sample.z, batch_ts);
      const docId = `${device_id}_${sample.t}`;
      
      if (addFirestoreDocument(COLLECTIONS.TELEMETRY_ACCEL, accelData)) {
        accepted++;
      }
    }
  }
  
  return accepted;
}

function getLatestAccel(device_id, user_id) {
  const results = queryFirestoreDocuments(COLLECTIONS.TELEMETRY_ACCEL, 'device_id', '==', device_id, 1);
  
  for (const accel of results) {
    if (accel.user_id === user_id) {
      return {
        t: accel.t,
        x: accel.x,
        y: accel.y,
        z: accel.z
      };
    }
  }
  
  return null;
}

/**
 * GPS telemetry operations
 */
function saveGpsPoint(device_id, user_id, ts, lat, lng, accuracy_m) {
  const gpsData = createGpsDocument(device_id, user_id, ts, lat, lng, accuracy_m);
  const docId = `${device_id}_${ts}`;
  
  return setFirestoreDocument(COLLECTIONS.TELEMETRY_GPS, docId, gpsData);
}

function getLatestGps(device_id, user_id) {
  const results = queryFirestoreDocuments(COLLECTIONS.TELEMETRY_GPS, 'device_id', '==', device_id, 1);
  
  for (const gps of results) {
    if (gps.user_id === user_id) {
      return {
        ts: gps.ts,
        lat: gps.lat,
        lng: gps.lng,
        accuracy_m: gps.accuracy_m
      };
    }
  }
  
  return null;
}

function getGpsHistory(device_id, user_id, limit = 100) {
  const results = queryFirestoreDocuments(COLLECTIONS.TELEMETRY_GPS, 'device_id', '==', device_id, limit);
  
  const filtered = results.filter(gps => gps.user_id === user_id);
  
  return filtered.map(gps => ({
    ts: gps.ts,
    lat: gps.lat,
    lng: gps.lng
  })).sort((a, b) => new Date(a.ts) - new Date(b.ts));
}

/**
 * Statistics helper
 */
function getPresenceStats(user_id, course_id) {
  const results = queryFirestoreDocuments(COLLECTIONS.PRESENCE, 'user_id', '==', user_id);
  const courseResults = results.filter(presence => presence.course_id === course_id);
  
  const total_presence = courseResults.length;
  const max_sessions = 14; // Default max sessions per course
  const percentage = Math.min(100, Math.round((total_presence / max_sessions) * 100));
  
  return {
    total_presence,
    percentage,
    max_sessions
  };
}