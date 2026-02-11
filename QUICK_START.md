# Quick Start Guide

## What's New

Your Year Reflection app now has:

✅ **User Accounts** - Sign up and log in with email/password
✅ **Cloud Sync** - Your data syncs across all devices
✅ **Sharing** - Share goals with friends and view their progress
✅ **New "Shared" Tab** - See goals others have shared with you

## Get Started in 3 Steps

### 1. Set Up Firebase (5 minutes)

Follow the detailed guide in `FIREBASE_SETUP_GUIDE.md`, or quick version:

1. Create Firebase project at https://console.firebase.google.com/
2. Enable Email/Password authentication
3. Create Firestore database
4. Copy security rules from README
5. Get your config and add to `.env` file

### 2. Run the App

```bash
# Make sure Firebase is installed
npm ci

# Start the app
npm run dev
```

### 3. Test It Out

**Create an account:**
1. App will show login screen
2. Click "Sign Up"
3. Enter your name, email, and password
4. You're in!

**Add some goals:**
1. Go to "Goals" tab
2. Add a goal for the current year
3. Add a few check-ins in the "Check-in" tab

**Test sharing:**
1. Create a second account (use a different email)
2. In the first account, click "Share" on a goal
3. Enter the second account's email
4. Log in to the second account
5. Go to "Shared" tab - you should see the shared goal!

## Troubleshooting

**App won't start:**
- Make sure you created the `.env` file with your Firebase config
- Restart the dev server after creating `.env`

**Can't sign up:**
- Check that Email/Password auth is enabled in Firebase Console
- Check browser console for error messages

**Sharing doesn't work:**
- Make sure the person you're sharing with has created an account
- Check that you're using their exact email address
- Check Firestore security rules are published

**Data not syncing:**
- Check your internet connection
- Open browser console to see Firebase errors
- Verify Firebase project is active

## What Changed

### New Files:
- `src/firebase.ts` - Firebase configuration
- `src/firestore-storage.ts` - Cloud database operations
- `src/contexts/AuthContext.tsx` - Authentication state
- `src/views/AuthView.tsx` - Login/signup screens
- `src/views/SharedView.tsx` - View shared goals
- `src/components/ShareModal.tsx` - Share management UI
- `.env.example` - Environment variables template

### Modified Files:
- `src/App.tsx` - Added auth provider and Shared tab
- `src/views/GoalsView.tsx` - Added Share button, uses Firestore
- `src/views/CheckInView.tsx` - Uses Firestore
- `src/views/YearView.tsx` - Uses Firestore
- `src/components/CheckInModal.tsx` - Uses Firestore
- `package.json` - Added Firebase dependency

### Old Files (Keep for Reference):
- `src/storage.ts` - Original localStorage implementation (still there but not used)

## Next Steps

1. **Set up Firebase** - Follow FIREBASE_SETUP_GUIDE.md
2. **Test locally** - Create accounts and test sharing
3. **Deploy to Vercel** - Add Firebase env vars to Vercel
4. **Share with friends** - Send them the link!

## Need Help?

- Check `FIREBASE_SETUP_GUIDE.md` for detailed Firebase setup
- Check `SHARING_FEATURE.md` for sharing feature details
- Check `README.md` for general app documentation
- Open browser console to see error messages
