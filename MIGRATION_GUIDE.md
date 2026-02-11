# Migration Guide: localStorage to Firebase

## Overview

The Year Reflection app has been upgraded from localStorage (local-only storage) to Firebase (cloud storage with authentication). This guide helps you migrate your existing data.

## What This Means

**Before (localStorage):**
- Data stored only on your computer
- No login required
- Data doesn't sync across devices
- No sharing features

**After (Firebase):**
- Data stored in the cloud
- Login required (email/password)
- Data syncs across all your devices
- Can share goals with others

## Your Existing Data

Your old goals and check-ins are still in your browser's localStorage. They won't be automatically migrated to Firebase - you'll need to manually recreate them or use the migration script below.

## Option 1: Manual Migration (Recommended for Few Goals)

If you only have a few goals, the easiest way is to manually recreate them:

1. **Export your old data** (open browser console with F12):
   ```javascript
   console.log(JSON.stringify(JSON.parse(localStorage.getItem('year-reflection-data')), null, 2))
   ```

2. **Copy the output** and save it to a text file for reference

3. **Sign up** for a new account in the app

4. **Recreate your goals** in the Goals tab

5. **Add your check-ins** in the Check-in tab (you can reference your exported data)

## Option 2: Automatic Migration Script

If you have many goals, you can use this migration script:

### Step 1: Export Your Data

Open browser console (F12) and run:

```javascript
// Export to JSON file
const data = localStorage.getItem('year-reflection-data')
const blob = new Blob([data], { type: 'application/json' })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = 'year-reflection-backup.json'
a.click()
```

This downloads your data as a JSON file.

### Step 2: Run Migration Script

1. Sign up for a new account in the app
2. Open browser console (F12)
3. Paste this script (replace `YOUR_BACKUP_DATA` with your exported data):

```javascript
// Migration script - paste your backup data here
const backupData = YOUR_BACKUP_DATA // paste the JSON object here

async function migrateData() {
  console.log('Starting migration...')
  
  // Import Firebase functions
  const { addGoal, saveOrUpdateCheckIn } = await import('./src/firestore-storage.ts')
  const { auth } = await import('./src/firebase.ts')
  
  const userId = auth.currentUser.uid
  if (!userId) {
    console.error('Not logged in!')
    return
  }
  
  console.log('Migrating', backupData.goals.length, 'goals...')
  
  // Migrate goals
  const goalIdMap = new Map() // old ID -> new ID
  for (const oldGoal of backupData.goals) {
    const newGoal = await addGoal(userId, {
      title: oldGoal.title,
      description: oldGoal.description,
      year: oldGoal.year
    })
    goalIdMap.set(oldGoal.id, newGoal.id)
    console.log('Migrated goal:', oldGoal.title)
  }
  
  console.log('Migrating', backupData.checkIns.length, 'check-ins...')
  
  // Migrate check-ins
  for (const oldCheckIn of backupData.checkIns) {
    const newGoalId = goalIdMap.get(oldCheckIn.goalId)
    if (newGoalId) {
      await saveOrUpdateCheckIn(
        newGoalId,
        oldCheckIn.weekNumber,
        oldCheckIn.year,
        oldCheckIn.reflection,
        oldCheckIn.progressRating
      )
      console.log('Migrated check-in for week', oldCheckIn.weekNumber)
    }
  }
  
  console.log('Migration complete! Refresh the page.')
}

migrateData()
```

4. Wait for migration to complete
5. Refresh the page

## Keeping Both Versions

If you want to keep using the old localStorage version alongside the new Firebase version:

1. The old code is still in `src/storage.ts`
2. You could create a branch with the old version
3. Or maintain two separate deployments

## Backup Your Data

**Before migrating**, always backup your data:

```javascript
// In browser console
const data = localStorage.getItem('year-reflection-data')
console.log(data)
// Copy and save this somewhere safe
```

## Questions?

- Check `FIREBASE_SETUP_GUIDE.md` for Firebase setup help
- Check `SHARING_FEATURE.md` for sharing feature details
- Open browser console to see error messages
