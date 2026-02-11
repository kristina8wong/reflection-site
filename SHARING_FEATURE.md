# Sharing Feature Documentation

## Overview

The Year Reflection app now includes a complete sharing system that allows users to share their goals and progress with others.

## How It Works

### For Goal Owners (Sharing Your Goals)

1. **Share a Goal**:
   - Go to the **Goals** tab
   - Click the **Share** button on any goal
   - Enter the email address of the person you want to share with
   - Click **Share**

2. **Manage Shares**:
   - Click **Share** on a goal to see who has access
   - View a list of all people you've shared with
   - Click **Remove** to revoke someone's access

3. **What Gets Shared**:
   - Goal title and description
   - All check-ins (weekly reflections and ratings)
   - Real-time updates - when you add new check-ins, they'll see them automatically

### For Recipients (Viewing Shared Goals)

1. **Access Shared Goals**:
   - Go to the **Shared** tab in the navigation
   - You'll see a list of all goals shared with you

2. **View Progress**:
   - Click on any shared goal to view details
   - See the goal description
   - View all check-ins sorted by week (most recent first)
   - Each check-in shows:
     - Week number
     - Rating (1-5)
     - Reflection text
     - Date of check-in

3. **Read-Only Access**:
   - You can view shared goals but cannot edit them
   - Only the goal owner can add/edit check-ins

## Technical Implementation

### Database Schema

**Users Collection** (`users`):
```typescript
{
  uid: string
  email: string
  displayName: string
  createdAt: Timestamp
}
```

**Goals Collection** (`goals`):
```typescript
{
  id: string
  userId: string  // Owner's user ID
  title: string
  description: string
  year: number
  order: number
  createdAt: Timestamp
}
```

**Check-ins Collection** (`checkIns`):
```typescript
{
  id: string
  goalId: string
  weekNumber: number
  year: number
  reflection: string
  progressRating: 1 | 2 | 3 | 4 | 5 | null
  createdAt: Timestamp
}
```

**Shares Collection** (`shares`):
```typescript
{
  id: string
  ownerId: string
  ownerName: string
  sharedWithId: string
  sharedWithEmail: string
  goalId: string
  goalTitle: string
  createdAt: Timestamp
}
```

### Security Rules

The Firestore security rules ensure:
- Users can only edit their own goals and check-ins
- Users can read goals that are shared with them
- Users can read check-ins for goals they own or that are shared with them
- Only goal owners can create/delete shares
- User profiles are readable by all authenticated users (for email lookup)

### Key Functions

**In `firestore-storage.ts`**:

- `createUserProfile()` - Creates user profile on signup for email lookup
- `getUserByEmail()` - Looks up user by email address
- `shareGoal()` - Creates a share record
- `unshareGoal()` - Removes a share record
- `getSharesForGoal()` - Gets all shares for a specific goal
- `getSharedGoals()` - Gets all goals shared with current user
- `getCheckInsForSharedGoal()` - Gets check-ins for a shared goal

## User Flow Examples

### Example 1: Sharing a Goal

1. Alice creates a goal: "Run a marathon"
2. Alice adds weekly check-ins with her training progress
3. Alice clicks "Share" and enters Bob's email: bob@example.com
4. Bob logs into his account
5. Bob goes to the "Shared" tab and sees Alice's goal
6. Bob clicks on the goal and reads all of Alice's check-ins

### Example 2: Managing Multiple Shares

1. Alice shares "Run a marathon" with Bob and Carol
2. Alice clicks "Share" on the goal
3. Alice sees both Bob and Carol in the shared list
4. Alice decides to remove Carol's access
5. Alice clicks "Remove" next to Carol's email
6. Carol can no longer see the goal in her "Shared" tab

## Privacy & Security

- **Email-based sharing**: You must know someone's email to share with them
- **Explicit sharing**: Goals are private by default - only shared when you explicitly share them
- **Owner control**: Only the goal owner can share/unshare
- **Revocable access**: You can remove access at any time
- **Read-only for recipients**: People you share with can only view, not edit

## Future Enhancements

Potential features to add:
- Share entire years (all goals for a year) at once
- Share notifications (email when someone shares with you)
- Comments on shared goals
- Share permissions (view-only vs. can-comment)
- Share links (share with anyone via URL, not just registered users)
- Group sharing (share with multiple people at once)
