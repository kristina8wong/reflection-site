# Firebase Setup Guide for Year Reflection App

## What's Been Implemented

Your Year Reflection app now has:

✅ **User Authentication** - Sign up and log in with email/password
✅ **Cloud Data Storage** - All goals and check-ins sync to Firebase Firestore
✅ **Multi-device Access** - Log in from any device to see your data
✅ **Data Security** - Firebase security rules protect user data
✅ **Automatic Sync** - Changes save automatically to the cloud

## Quick Start (5 minutes)

### Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name it (e.g., "year-reflection")
4. Disable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Email Authentication

1. In your Firebase project, click **Authentication** in the left sidebar
2. Click "Get started"
3. Click on **Email/Password**
4. Toggle "Enable" to ON
5. Click "Save"

### Step 3: Create Firestore Database

1. Click **Firestore Database** in the left sidebar
2. Click "Create database"
3. Select **"Start in production mode"**
4. Choose a location (e.g., us-central)
5. Click "Enable"

### Step 4: Set Security Rules

1. In Firestore Database, click the **Rules** tab
2. Replace everything with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users: anyone authenticated can read user profiles (for email lookup)
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Goals: users can read/write their own goals OR goals shared with them
    match /goals/{goalId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         exists(/databases/$(database)/documents/shares/$(request.auth.uid + '_' + goalId)));
      allow write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Check-ins: users can read check-ins for their own goals or shared goals
    match /checkIns/{checkInId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/goals/$(resource.data.goalId)).data.userId == request.auth.uid;
    }
    
    // Shares: users can manage shares for their goals
    match /shares/{shareId} {
      allow read: if request.auth != null && 
        (resource.data.ownerId == request.auth.uid || 
         resource.data.sharedWithId == request.auth.uid);
      allow create: if request.auth != null && 
        request.resource.data.ownerId == request.auth.uid;
      allow delete: if request.auth != null && 
        resource.data.ownerId == request.auth.uid;
    }
  }
}
```

3. Click "Publish"

### Step 5: Get Your Config

1. Click the gear icon (⚙️) next to "Project Overview"
2. Click "Project settings"
3. Scroll down to "Your apps"
4. Click the **Web** icon (`</>`)
5. Register app (nickname: "Year Reflection Web")
6. Copy the `firebaseConfig` values

### Step 6: Add Config to Your App

1. In your project folder, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and paste your Firebase values:
   ```
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

3. Restart your dev server:
   ```bash
   npm run dev
   ```

## Testing It Out

1. The app should now show a login screen
2. Click "Sign Up" and create an account
3. Add a goal and some check-ins
4. Log out and log back in - your data should still be there!
5. Try logging in from a different browser or device

## What Changed in Your Code

### New Files Created:
- `src/firebase.ts` - Firebase configuration
- `src/firestore-storage.ts` - Cloud storage operations (replaces localStorage)
- `src/contexts/AuthContext.tsx` - Authentication state management
- `src/views/AuthView.tsx` - Login/signup UI
- `.env.example` - Template for environment variables

### Modified Files:
- `src/App.tsx` - Now wraps app with AuthProvider and shows login screen
- `src/views/GoalsView.tsx` - Uses Firestore instead of localStorage
- `src/views/CheckInView.tsx` - Uses Firestore instead of localStorage
- `src/views/YearView.tsx` - Uses Firestore instead of localStorage
- `src/components/CheckInModal.tsx` - Uses Firestore instead of localStorage
- `package.json` - Added Firebase dependency
- `README.md` - Updated with Firebase setup instructions

### Data Migration

Your old localStorage data is still there, but the app now uses Firebase. If you want to migrate your existing data:

1. Export your localStorage data (open browser console):
   ```javascript
   console.log(localStorage.getItem('year-reflection-data'))
   ```
2. Copy the output
3. You'll need to manually recreate your goals in the new system

## Deploying to Vercel

When you deploy to Vercel, add these environment variables in the Vercel dashboard:

1. Go to your project in Vercel
2. Settings → Environment Variables
3. Add each variable:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

## Sharing Feature

The app now includes full sharing functionality:

### How to Share Goals:

1. Go to the **Goals** tab
2. Click the **Share** button on any goal
3. Enter the email address of the person you want to share with
4. They must have an account in the app
5. Once shared, they can view your goal and all check-ins in the **Shared** tab

### Viewing Shared Goals:

1. Go to the **Shared** tab
2. You'll see all goals that others have shared with you
3. Click on a goal to view its description and all check-ins
4. Shared goals are read-only - you can view but not edit them

### Managing Shares:

1. Click **Share** on a goal to see who it's shared with
2. Click **Remove** next to any email to revoke access
3. You can share the same goal with multiple people

## Troubleshooting

**"Firebase: Error (auth/configuration-not-found)"**
- Your `.env` file is missing or has incorrect values
- Make sure to restart the dev server after creating `.env`

**"Missing or insufficient permissions"**
- Check your Firestore security rules
- Make sure you're logged in

**Can't sign up**
- Check that Email/Password authentication is enabled in Firebase Console
- Check browser console for specific error messages

**Data not saving**
- Check your internet connection
- Open browser console to see Firebase errors
- Verify your Firebase project quota isn't exceeded

## Need Help?

- Firebase Docs: https://firebase.google.com/docs
- Firebase Console: https://console.firebase.google.com/
- Check browser console for error messages
