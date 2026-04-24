# Firebase Setup Guide for E-Kuliah

This guide will help you set up Firebase Firestore as the backend for E-Kuliah application.

## Prerequisites

- Firebase account (Google account required)
- Firebase project created
- Service account with Firestore access

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select existing project
3. Follow the setup wizard
4. Enable Firestore Database in "Build" section

## Step 2: Set Up Firestore Database

1. Go to "Firestore Database" in Firebase Console
2. Click "Create database"
3. Choose production mode (recommended)
4. Select your region
5. Click "Enable"

## Step 3: Create Service Account

1. Go to Project Settings (gear icon)
2. Navigate to "Service accounts" tab
3. Click "Generate new private key"
4. Save the JSON file securely
5. **Important**: Never commit this file to version control

## Step 4: Configure Collections

Create the following collections in Firestore:

### 1. tokens Collection
```javascript
// Collection: tokens
// Document structure:
{
  course_id: "cloud-101",
  session_id: "sesi-01", 
  qr_token: "TKN-H2KU13",
  expires_at: "2024-01-01T12:00:00.000Z",
  ts: "2024-01-01T10:00:00.000Z",
  created_at: "2024-01-01T10:00:00.000Z",
  used: false
}
```

### 2. presence Collection
```javascript
// Collection: presence
// Document structure:
{
  presence_id: "PRES-123456",
  user_id: "434231077",
  device_id: "device-fingerprint-123",
  course_id: "cloud-101",
  session_id: "sesi-01",
  status: "checked_in",
  ts: "2024-01-01T10:30:00.000Z",
  created_at: "2024-01-01T10:30:00.000Z",
  loc_lat: -6.200000,
  loc_lng: 106.816666,
  loc_acc: 10.5,
  accel_x: 0.1,
  accel_y: 0.2,
  accel_z: 9.8,
  accel_m: 9.81
}
```

### 3. telemetry_accel Collection
```javascript
// Collection: telemetry_accel
// Document structure:
{
  device_id: "device-fingerprint-123",
  ts: "2024-01-01T10:30:00.000Z",
  samples: [
    { x: 0.1, y: 0.2, z: 9.8, t: "2024-01-01T10:30:00.000Z" },
    { x: 0.2, y: 0.3, z: 9.7, t: "2024-01-01T10:30:01.000Z" }
  ],
  created_at: "2024-01-01T10:30:00.000Z",
  count: 2
}
```

### 4. telemetry_gps Collection
```javascript
// Collection: telemetry_gps
// Document structure:
{
  device_id: "device-fingerprint-123",
  user_id: "434231077",
  ts: "2024-01-01T10:30:00.000Z",
  lat: -6.200000,
  lng: 106.816666,
  accuracy_m: 10.5,
  created_at: "2024-01-01T10:30:00.000Z"
}
```

## Step 5: Configure Environment Variables

1. Copy `.env.firebase.example` to `.env.firebase`:
```bash
cp .env.firebase.example .env.firebase
```

2. Fill in your Firebase configuration:
```env
# Firebase Project ID
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-actual-firebase-project-id

# Firebase Service Account JSON (for GAS backend)
FIREBASE_SERVICE_ACCOUNT_JSON={
  "type": "service_account",
  "project_id": "your-actual-firebase-project-id",
  "private_key_id": "your-actual-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYour actual private key here\n-----END PRIVATE KEY-----\n",
  "client_email": "your-actual-service-account@your-actual-firebase-project-id.iam.gserviceaccount.com",
  "client_id": "your-actual-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/your-actual-service-account%40your-actual-firebase-project-id.iam.gserviceaccount.com"
}

# GAS Backend URL for Firebase mode
NEXT_PUBLIC_FIREBASE_GAS_URL=https://script.google.com/macros/s/YOUR_FIREBASE_GAS_DEPLOYMENT_ID/exec

# Mode selection: 'spreadsheet' or 'firebase'
NEXT_PUBLIC_BACKEND_MODE=firebase
```

## Step 6: Deploy Firebase GAS Backend

1. Open Google Apps Script: [https://script.google.com](https://script.google.com)
2. Create new project
3. Copy all files from `/GAS-firebase/` folder:
   - `code.gs`
   - `firebase-config.js`
   - `firebase-helper.js`
   - `admin.html`
4. Replace configuration values with your actual Firebase credentials
5. Deploy as web app
6. Copy deployment URL to `NEXT_PUBLIC_FIREBASE_GAS_URL`

## Step 7: Test Firebase Connection

Use the admin panel to test Firebase connection:

1. Navigate to your GAS deployment URL
2. Add `/admin` to the URL
3. Use the Firebase settings tab to test connection
4. Generate test QR codes
5. Monitor telemetry data

## Security Rules

Set up Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Or allow read/write for specific collections
    match /tokens/{token} {
      allow read, write: if true; // Public access for token validation
    }
    
    match /presence/{presence} {
      allow read, write: if true; // Public access for presence tracking
    }
    
    match /telemetry_accel/{accel} {
      allow read, write: if true; // Public access for telemetry
    }
    
    match /telemetry_gps/{gps} {
      allow read, write: if true; // Public access for GPS data
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Permission Denied**: Check service account permissions
2. **Invalid Credentials**: Verify service account JSON format
3. **Connection Failed**: Check network connectivity and Firebase project settings
4. **Data Not Saving**: Verify Firestore security rules

### Debug Steps

1. Check browser console for errors
2. Verify GAS deployment URL is accessible
3. Test Firebase connection in admin panel
4. Check service account has proper roles:
   - Firebase Admin SDK Administrator Service Agent
   - Cloud Firestore Service Agent

## Migration from Spreadsheet

To migrate existing data from spreadsheet to Firebase:

1. Export data from Google Sheets
2. Use Firebase Admin SDK to import data
3. Update existing records with proper timestamps
4. Verify data integrity after migration

## Support

For issues related to Firebase setup:
- Check Firebase documentation: https://firebase.google.com/docs
- Review Google Apps Script documentation: https://developers.google.com/apps-script
- Check application logs in GAS editor
- Monitor Firestore usage in Firebase Console