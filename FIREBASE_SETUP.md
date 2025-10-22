# Firebase Setup Guide

This guide will help you set up Firebase for the Hub Attendance Tracker application.

## Prerequisites

- A Google account
- Node.js installed on your machine
- The Hub Attendance Tracker project cloned locally

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "hub-attendance-tracker")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In the Firebase Console, click on "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Click on "Email/Password"
5. Enable "Email/Password" authentication
6. Click "Save"

## Step 3: Create Firestore Database

1. In the Firebase Console, click on "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (you can configure security rules later)
4. Select a location for your database (choose the closest to your users)
5. Click "Done"

## Step 4: Enable Firebase Storage

1. In the Firebase Console, click on "Storage" in the left sidebar
2. Click "Get started"
3. Review the security rules (start in test mode)
4. Click "Next"
5. Choose a location for your storage bucket
6. Click "Done"

## Step 5: Get Firebase Configuration

1. In the Firebase Console, click on the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click on the web icon `</>`
5. Enter an app nickname (e.g., "hub-attendance-web")
6. Check "Also set up Firebase Hosting" (optional)
7. Click "Register app"
8. Copy the Firebase configuration object

## Step 6: Configure Environment Variables

1. In your project root, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your Firebase configuration:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_api_key_here
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```

   Replace the values with those from your Firebase configuration object:
   - `apiKey` → `REACT_APP_FIREBASE_API_KEY`
   - `authDomain` → `REACT_APP_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `REACT_APP_FIREBASE_PROJECT_ID`
   - `storageBucket` → `REACT_APP_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `REACT_APP_FIREBASE_APP_ID`

## Step 7: Configure Firestore Security Rules

1. In the Firebase Console, go to "Firestore Database"
2. Click on the "Rules" tab
3. Replace the default rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Students can read/write their own student document
    match /students/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Attendance records
    match /attendance/{attendanceId} {
      // Students can create/update their own attendance records
      allow create, update: if request.auth != null && 
        request.auth.uid == resource.data.studentId;
      
      // Students can read their own attendance records
      allow read: if request.auth != null && 
        request.auth.uid == resource.data.studentId;
      
      // Admins can read all attendance records
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

4. Click "Publish"

## Step 8: Configure Storage Security Rules

1. In the Firebase Console, go to "Storage"
2. Click on the "Rules" tab
3. Replace the default rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Profile photos - users can only upload to their own folder
    match /profile-photos/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

4. Click "Publish"

## Step 9: Test the Setup

1. Start your development server:
   ```bash
   npm start
   ```

2. Open your browser to `http://localhost:3000`

3. Try creating a new account:
   - Click "Sign up here"
   - Fill in the form with a test email and password
   - Select "Student" or "Admin" role
   - Click "Create Account"

4. If successful, you should be redirected to the appropriate dashboard

## Step 10: Create Your First Admin User

Since the first user needs to be an admin to manage the system:

1. Register a new account and select "Admin" as the role
2. Or manually update a user's role in Firestore:
   - Go to Firestore Database in Firebase Console
   - Find your user document in the `users` collection
   - Edit the document and change `role` from `"student"` to `"admin"`

## Troubleshooting

### Common Issues:

1. **"Firebase configuration not found"**
   - Make sure your `.env` file is in the project root
   - Verify all environment variables are set correctly
   - Restart your development server after changing `.env`

2. **"Permission denied" errors**
   - Check that your Firestore security rules are published
   - Verify the user is authenticated
   - Ensure the user has the correct role

3. **"Storage upload failed"**
   - Check Storage security rules are published
   - Verify the user is authenticated
   - Check file size limits (5MB max in the app)

4. **Authentication not working**
   - Verify Email/Password is enabled in Firebase Auth
   - Check that your domain is authorized (localhost should work by default)

### Getting Help:

- Check the browser console for detailed error messages
- Review Firebase Console logs
- Ensure all Firebase services are enabled
- Verify your Firebase configuration matches your project

## Production Deployment

When deploying to production:

1. Update Firestore and Storage security rules for production use
2. Configure authorized domains in Firebase Auth settings
3. Set up proper environment variables in your hosting platform
4. Consider enabling Firebase App Check for additional security

## Next Steps

Once Firebase is set up:

1. Create test student and admin accounts
2. Test the check-in/check-out functionality
3. Upload profile photos
4. Review attendance data in the admin dashboard
5. Customize the application for your specific needs
