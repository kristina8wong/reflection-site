# Year Reflection App

A desktop and web application for setting yearly goals, tracking weekly progress through reflections, and sharing your journey with others.

## Try It Now

- **Web version:** [year-reflection.vercel.app](https://year-reflection.vercel.app) _(live demo)_
- **Desktop app:** [Download from Releases](https://github.com/kristina8wong/reflection-site/releases) _(native app)_

## Features

- 🎯 Set goals for the year
- 📝 Weekly check-ins for each goal with 1-5 ratings and reflections
- 📊 Year overview visualization showing progress across all weeks
- 🔐 User authentication and cloud sync
- 🤝 Share goals with other users (coming soon)
- 📱 Mobile-friendly responsive design
- 🖱️ Drag-and-drop goal reordering

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Firebase account (for authentication and data storage)

## Firebase Setup

This app uses Firebase for authentication and data storage. Follow these steps to set up Firebase:

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Once created, click on your project

### 2. Enable Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** authentication
3. Click "Save"

### 3. Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Start in **production mode** (we'll set up security rules next)
4. Choose a location close to your users
5. Click "Enable"

### 4. Set Up Security Rules

In Firestore Database, go to the **Rules** tab and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users: anyone authenticated can read user profiles (for email lookup)
    // Only the user can write their own profile
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
    
    // Check-ins: users can read/write check-ins for their own goals
    // Users can read check-ins for goals shared with them
    match /checkIns/{checkInId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/goals/$(resource.data.goalId)).data.userId == request.auth.uid;
    }
    
    // Shares: document ID must be {sharedWithId}_{goalId} for goals rule to allow reads
    match /shares/{shareId} {
      allow read: if request.auth != null && 
        (resource.data.ownerId == request.auth.uid || 
         resource.data.sharedWithId == request.auth.uid);
      allow create: if request.auth != null && 
        request.resource.data.ownerId == request.auth.uid;
      allow update: if request.auth != null && 
        resource.data.ownerId == request.auth.uid;
      allow delete: if request.auth != null && 
        resource.data.ownerId == request.auth.uid;
    }
  }
}
```

### 5. Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the **Web** icon (`</>`)
4. Register your app with a nickname
5. Copy the `firebaseConfig` object

### 6. Configure Your App

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Firebase credentials in `.env`:
   ```
   VITE_FIREBASE_API_KEY=your-api-key-here
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

3. **Important**: Add `.env` to `.gitignore` (already done) - never commit your Firebase credentials!

## Install & Run

```bash
# Install dependencies (use npm ci for consistent installs)
npm ci

# Run in development mode
npm run dev

# Build for web
npm run build

# Build desktop app
npm run build:desktop
```

## If You Encounter Dependency Issues

```bash
# Clean reinstall
npm run reinstall:clean
```

## Project Structure

- `src/` - React application source code
  - `views/` - Main view components (Goals, Check-in, Year, Auth)
  - `components/` - Reusable components
  - `contexts/` - React contexts (Auth)
  - `types.ts` - TypeScript type definitions
  - `storage.ts` - Legacy localStorage (for reference)
  - `firestore-storage.ts` - Firebase Firestore operations
  - `firebase.ts` - Firebase configuration
  - `utils.ts` - Utility functions
- `electron/` - Electron main process
- `dist/` - Built web application
- `release/` - Built desktop applications

## Technologies

- React + TypeScript
- Vite
- Electron
- Firebase (Authentication + Firestore)
- date-fns

## Publishing to GitHub & Creating Releases

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

2. **Create a Release**:
   - Go to your GitHub repository
   - Click "Releases" → "Create a new release"
   - Tag version (e.g., `v1.0.0`)
   - Upload the built files from `release/` directory
   - Publish release

3. **Share**: Share the release page URL with others to download

## Deployment

### Web (Vercel)

The app is configured to deploy to Vercel:
1. Push to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard (Settings → Environment Variables):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
4. Vercel will automatically build and deploy

### Desktop

Build the desktop app and share the installers from the `release/` directory.

## Security Notes

- Never commit your `.env` file or Firebase credentials to Git
- Use Firebase Security Rules to protect user data
- Keep your Firebase API keys secure (they're safe to use in client-side code with proper security rules)

## Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"
- Make sure you've created a `.env` file with your Firebase credentials
- Restart the development server after adding environment variables

### "Missing or insufficient permissions"
- Check that your Firestore security rules are properly configured
- Make sure you're logged in

### Data not syncing
- Check your internet connection
- Open browser console to see any Firebase errors
- Verify your Firebase project is active and not over quota
