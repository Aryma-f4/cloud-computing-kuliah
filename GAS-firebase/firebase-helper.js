// Firebase Configuration Helper for GAS
// This file handles Firebase authentication and Firestore operations

const FIREBASE_PROJECT_ID = 'your-firebase-project-id'; // Replace with your actual project ID
const FIREBASE_SERVICE_ACCOUNT = {
  "type": "service_account",
  "project_id": FIREBASE_PROJECT_ID,
  "private_key_id": "your-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n",
  "client_email": `firebase-adminsdk-${Math.random().toString(36).substring(7)}@${FIREBASE_PROJECT_ID}.iam.gserviceaccount.com`,
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": `https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-${Math.random().toString(36).substring(7)}%40${FIREBASE_PROJECT_ID}.iam.gserviceaccount.com`
};

// Firestore Collections
const COLLECTIONS = {
  TOKENS: 'tokens',
  PRESENCE: 'presence',
  TELEMETRY_ACCEL: 'telemetry_accel',
  TELEMETRY_GPS: 'telemetry_gps',
  SETTINGS: 'settings'
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

// Firestore CRUD Operations
const FirestoreCRUD = {
  // Create document
  create: function(collection, data, customId = null) {
    try {
      const db = getFirestore();
      const docRef = customId ? db.collection(collection).doc(customId) : db.collection(collection).doc();
      docRef.set(data);
      return {
        id: docRef.id,
        success: true,
        error: null
      };
    } catch (error) {
      return {
        id: null,
        success: false,
        error: error.message
      };
    }
  },

  // Get document by ID
  get: function(collection, docId) {
    try {
      const db = getFirestore();
      const doc = db.collection(collection).doc(docId).get();
      if (doc.exists) {
        return {
          data: doc.data(),
          exists: true,
          error: null
        };
      } else {
        return {
          data: null,
          exists: false,
          error: null
        };
      }
    } catch (error) {
      return {
        data: null,
        exists: false,
        error: error.message
      };
    }
  },

  // Get documents by query
  getByQuery: function(collection, field, operator, value, limit = null) {
    try {
      const db = getFirestore();
      let query = db.collection(collection).where(field, operator, value);
      if (limit) {
        query = query.limit(limit);
      }
      const snapshot = query.get();
      const results = [];
      snapshot.forEach(doc => {
        results.push({
          id: doc.id,
          ...doc.data()
        });
      });
      return {
        data: results,
        count: results.length,
        error: null
      };
    } catch (error) {
      return {
        data: [],
        count: 0,
        error: error.message
      };
    }
  },

  // Update document
  update: function(collection, docId, data) {
    try {
      const db = getFirestore();
      db.collection(collection).doc(docId).update(data);
      return {
        success: true,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Delete document
  delete: function(collection, docId) {
    try {
      const db = getFirestore();
      db.collection(collection).doc(docId).delete();
      return {
        success: true,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get all documents (with optional limit)
  getAll: function(collection, limit = null) {
    try {
      const db = getFirestore();
      let query = db.collection(collection);
      if (limit) {
        query = query.limit(limit);
      }
      const snapshot = query.get();
      const results = [];
      snapshot.forEach(doc => {
        results.push({
          id: doc.id,
          ...doc.data()
        });
      });
      return {
        data: results,
        count: results.length,
        error: null
      };
    } catch (error) {
      return {
        data: [],
        count: 0,
        error: error.message
      };
    }
  }
};

// Firebase Authentication Helper
const FirebaseAuth = {
  // Get access token for service account
  getAccessToken: function() {
    try {
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        iss: FIREBASE_SERVICE_ACCOUNT.client_email,
        sub: FIREBASE_SERVICE_ACCOUNT.client_email,
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
        scope: 'https://www.googleapis.com/auth/datastore'
      };

      const header = {
        alg: 'RS256',
        typ: 'JWT'
      };

      const jwt = Utilities.computeRsaSha256Signature(
        JSON.stringify(header) + '.' + JSON.stringify(payload),
        FIREBASE_SERVICE_ACCOUNT.private_key
      );

      const tokenResponse = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
        method: 'post',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        payload: {
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: Utilities.base64EncodeWebSafe(header) + '.' + Utilities.base64EncodeWebSafe(payload) + '.' + Utilities.base64EncodeWebSafe(jwt)
        }
      });

      const tokenData = JSON.parse(tokenResponse.getContentText());
      return tokenData.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  },

  // Test Firebase connection
  testConnection: function() {
    try {
      const token = this.getAccessToken();
      if (!token) {
        return { success: false, error: 'Failed to get access token' };
      }

      const response = UrlFetchApp.fetch(`https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return {
        success: true,
        status: response.getResponseCode(),
        error: null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    COLLECTIONS,
    FirestoreModels,
    FirestoreCRUD,
    FirebaseAuth
  };
}