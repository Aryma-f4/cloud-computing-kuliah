// Firebase Configuration for Google Apps Script
// Replace with your actual Firebase project configuration

const FIREBASE_CONFIG = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// Firestore Collections
const COLLECTIONS = {
  TOKENS: 'tokens',
  PRESENCE: 'presence',
  TELEMETRY_ACCEL: 'telemetry_accel',
  TELEMETRY_GPS: 'telemetry_gps',
  SETTINGS: 'settings'
};

// Firebase Service Account Configuration
// Replace with your actual service account JSON
const SERVICE_ACCOUNT = {
  "type": "service_account",
  "project_id": FIREBASE_CONFIG.projectId,
  "private_key_id": "your-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n",
  "client_email": `firebase-adminsdk-${Math.random().toString(36).substring(7)}@${FIREBASE_CONFIG.projectId}.iam.gserviceaccount.com`,
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": `https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-${Math.random().toString(36).substring(7)}%40${FIREBASE_CONFIG.projectId}.iam.gserviceaccount.com`
};

// Firestore Data Models
const FirestoreModels = {
  // Token model
  Token: {
    create: (course_id, session_id, qr_token, expires_at, ts) => ({
      course_id: course_id,
      session_id: session_id,
      qr_token: qr_token,
      expires_at: expires_at,
      ts: ts,
      created_at: new Date().toISOString(),
      used: false
    }),
    
    fromDoc: (doc) => ({
      id: doc.id,
      ...doc.data(),
      expires_at: new Date(doc.data().expires_at)
    })
  },

  // Presence model
  Presence: {
    create: (presence_id, user_id, device_id, course_id, session_id, status, ts, telemetry = {}) => ({
      presence_id: presence_id,
      user_id: user_id,
      device_id: device_id,
      course_id: course_id,
      session_id: session_id,
      status: status,
      ts: ts,
      created_at: new Date().toISOString(),
      loc_lat: telemetry.loc_lat || null,
      loc_lng: telemetry.loc_lng || null,
      loc_acc: telemetry.loc_acc || null,
      accel_x: telemetry.accel_x || null,
      accel_y: telemetry.accel_y || null,
      accel_z: telemetry.accel_z || null,
      accel_m: telemetry.accel_m || null
    }),
    
    fromDoc: (doc) => ({
      id: doc.id,
      ...doc.data()
    })
  },

  // Telemetry Accelerometer model
  TelemetryAccel: {
    create: (device_id, ts, samples) => ({
      device_id: device_id,
      ts: ts,
      samples: samples,
      created_at: new Date().toISOString(),
      count: samples.length
    }),
    
    fromDoc: (doc) => ({
      id: doc.id,
      ...doc.data()
    })
  },

  // Telemetry GPS model
  TelemetryGPS: {
    create: (device_id, user_id, ts, lat, lng, accuracy_m) => ({
      device_id: device_id,
      user_id: user_id,
      ts: ts,
      lat: lat,
      lng: lng,
      accuracy_m: accuracy_m || null,
      created_at: new Date().toISOString()
    }),
    
    fromDoc: (doc) => ({
      id: doc.id,
      ...doc.data()
    })
  }
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FIREBASE_CONFIG,
    COLLECTIONS,
    SERVICE_ACCOUNT,
    FirestoreModels
  };
}