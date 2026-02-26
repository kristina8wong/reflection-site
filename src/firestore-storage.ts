import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch
} from 'firebase/firestore'
import { db } from './firebase'
import type { Goal, CheckIn } from './types'

// Firestore collections
const GOALS_COLLECTION = 'goals'
const CHECKINS_COLLECTION = 'checkIns'
const SHARES_COLLECTION = 'shares'
const USERS_COLLECTION = 'users'

// Helper to convert Firestore timestamp to ISO string
function timestampToISO(timestamp: any): string {
  if (timestamp?.toDate) {
    return timestamp.toDate().toISOString()
  }
  return timestamp || new Date().toISOString()
}

// ===== GOAL OPERATIONS =====

export async function addGoal(
  userId: string,
  goal: Omit<Goal, 'id' | 'createdAt' | 'order'>
): Promise<Goal> {
  // Get max order for user's goals (simplified query to avoid index requirement)
  const goalsRef = collection(db, GOALS_COLLECTION)
  const q = query(goalsRef, where('userId', '==', userId))
  const snapshot = await getDocs(q)
  
  // Filter by year in memory and get max order
  const yearGoals = snapshot.docs.filter(doc => doc.data().year === goal.year)
  const maxOrder = yearGoals.reduce((max, doc) => {
    const data = doc.data()
    return Math.max(max, data.order ?? 0)
  }, 0)

  const goalRef = doc(collection(db, GOALS_COLLECTION))
  const newGoal: Goal & { userId: string } = {
    ...goal,
    id: goalRef.id,
    createdAt: new Date().toISOString(),
    order: maxOrder + 1,
    userId
  }

  await setDoc(goalRef, {
    ...newGoal,
    createdAt: Timestamp.now()
  })

  return newGoal
}

export async function updateGoal(
  goalId: string,
  updates: Partial<Pick<Goal, 'title' | 'description'>>
): Promise<void> {
  const goalRef = doc(db, GOALS_COLLECTION, goalId)
  await updateDoc(goalRef, updates)
}

export async function deleteGoal(goalId: string): Promise<void> {
  const batch = writeBatch(db)
  
  // Delete goal
  const goalRef = doc(db, GOALS_COLLECTION, goalId)
  batch.delete(goalRef)
  
  // Delete associated check-ins
  const checkInsRef = collection(db, CHECKINS_COLLECTION)
  const q = query(checkInsRef, where('goalId', '==', goalId))
  const snapshot = await getDocs(q)
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref)
  })
  
  await batch.commit()
}

export async function getGoalsForYear(userId: string, year: number): Promise<Goal[]> {
  const goalsRef = collection(db, GOALS_COLLECTION)
  const q = query(
    goalsRef,
    where('userId', '==', userId),
    where('year', '==', year),
    orderBy('order', 'asc')
  )
  const snapshot = await getDocs(q)
  
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      title: data.title,
      description: data.description,
      year: data.year,
      order: data.order ?? 0,
      createdAt: timestampToISO(data.createdAt)
    }
  })
}

export async function getAllGoalsForUser(userId: string): Promise<Goal[]> {
  const goalsRef = collection(db, GOALS_COLLECTION)
  const q = query(
    goalsRef,
    where('userId', '==', userId),
    orderBy('year', 'desc'),
    orderBy('order', 'asc')
  )
  const snapshot = await getDocs(q)
  
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      title: data.title,
      description: data.description,
      year: data.year,
      order: data.order ?? 0,
      createdAt: timestampToISO(data.createdAt)
    }
  })
}

export async function reorderGoals(goalIds: string[]): Promise<void> {
  const batch = writeBatch(db)
  
  goalIds.forEach((id, index) => {
    const goalRef = doc(db, GOALS_COLLECTION, id)
    batch.update(goalRef, { order: index })
  })
  
  await batch.commit()
}

// ===== CHECK-IN OPERATIONS =====

export async function saveOrUpdateCheckIn(
  goalId: string,
  weekNumber: number,
  year: number,
  reflection: string,
  progressRating: 1 | 2 | 3 | 4 | 5 | null
): Promise<CheckIn> {
  // Check if check-in already exists
  const checkInsRef = collection(db, CHECKINS_COLLECTION)
  const q = query(
    checkInsRef,
    where('goalId', '==', goalId),
    where('weekNumber', '==', weekNumber),
    where('year', '==', year)
  )
  const snapshot = await getDocs(q)
  
  const now = Timestamp.now()
  
  if (!snapshot.empty) {
    // Update existing
    const existingDoc = snapshot.docs[0]
    await updateDoc(existingDoc.ref, {
      reflection,
      progressRating,
      createdAt: now
    })
    
    return {
      id: existingDoc.id,
      goalId,
      weekNumber,
      year,
      reflection,
      progressRating,
      createdAt: now.toDate().toISOString()
    }
  }
  
  // Create new
  const checkInRef = doc(collection(db, CHECKINS_COLLECTION))
  const newCheckIn: CheckIn = {
    id: checkInRef.id,
    goalId,
    weekNumber,
    year,
    reflection,
    progressRating,
    createdAt: now.toDate().toISOString()
  }
  
  await setDoc(checkInRef, {
    ...newCheckIn,
    createdAt: now
  })
  
  return newCheckIn
}

export async function getCheckIn(
  goalId: string,
  weekNumber: number,
  year: number
): Promise<CheckIn | undefined> {
  const checkInsRef = collection(db, CHECKINS_COLLECTION)
  const q = query(
    checkInsRef,
    where('goalId', '==', goalId),
    where('weekNumber', '==', weekNumber),
    where('year', '==', year)
  )
  const snapshot = await getDocs(q)
  
  if (snapshot.empty) return undefined
  
  const doc = snapshot.docs[0]
  const data = doc.data()
  
  return {
    id: doc.id,
    goalId: data.goalId,
    weekNumber: data.weekNumber,
    year: data.year,
    reflection: data.reflection,
    progressRating: data.progressRating,
    createdAt: timestampToISO(data.createdAt)
  }
}

export async function deleteCheckIn(
  goalId: string,
  weekNumber: number,
  year: number
): Promise<void> {
  const checkInsRef = collection(db, CHECKINS_COLLECTION)
  const q = query(
    checkInsRef,
    where('goalId', '==', goalId),
    where('weekNumber', '==', weekNumber),
    where('year', '==', year)
  )
  const snapshot = await getDocs(q)
  
  const batch = writeBatch(db)
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref)
  })
  await batch.commit()
}

export async function getCheckInsForWeek(
  userId: string,
  weekNumber: number,
  year: number
): Promise<CheckIn[]> {
  // First get user's goals for that year
  const goals = await getGoalsForYear(userId, year)
  const goalIds = goals.map(g => g.id)
  
  if (goalIds.length === 0) return []
  
  // Then get check-ins for those goals
  const checkInsRef = collection(db, CHECKINS_COLLECTION)
  const q = query(
    checkInsRef,
    where('goalId', 'in', goalIds),
    where('weekNumber', '==', weekNumber),
    where('year', '==', year)
  )
  const snapshot = await getDocs(q)
  
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      goalId: data.goalId,
      weekNumber: data.weekNumber,
      year: data.year,
      reflection: data.reflection,
      progressRating: data.progressRating,
      createdAt: timestampToISO(data.createdAt)
    }
  })
}

export async function getAllCheckInsForUser(userId: string): Promise<CheckIn[]> {
  // Get all user's goals
  const goalsRef = collection(db, GOALS_COLLECTION)
  const goalsQuery = query(goalsRef, where('userId', '==', userId))
  const goalsSnapshot = await getDocs(goalsQuery)
  const goalIds = goalsSnapshot.docs.map(doc => doc.id)
  
  if (goalIds.length === 0) return []
  
  // Get all check-ins for those goals (Firestore 'in' queries limited to 10 items)
  const allCheckIns: CheckIn[] = []
  for (let i = 0; i < goalIds.length; i += 10) {
    const batch = goalIds.slice(i, i + 10)
    const checkInsRef = collection(db, CHECKINS_COLLECTION)
    const q = query(checkInsRef, where('goalId', 'in', batch))
    const snapshot = await getDocs(q)
    
    const checkIns = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        goalId: data.goalId,
        weekNumber: data.weekNumber,
        year: data.year,
        reflection: data.reflection,
        progressRating: data.progressRating,
        createdAt: timestampToISO(data.createdAt)
      }
    })
    
    allCheckIns.push(...checkIns)
  }
  
  return allCheckIns
}

// ===== USER OPERATIONS =====

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  createdAt: string
}

export async function createUserProfile(
  uid: string,
  email: string,
  displayName: string
): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid)
  await setDoc(userRef, {
    uid,
    email: email.toLowerCase(),
    displayName,
    displayNameLower: displayName.toLowerCase(),
    createdAt: Timestamp.now()
  })
}

/** Ensure existing user has displayNameLower for search (migration) */
export async function ensureUserProfileSearchable(
  uid: string,
  displayName: string
): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid)
  await updateDoc(userRef, {
    displayNameLower: displayName.toLowerCase()
  })
}

/**
 * Mark a user profile as deleted so they no longer appear in user search (e.g. goal sharing).
 * Call this when a user deletes their account so the sharing list stays up to date.
 * If users are deleted from Firebase Auth (e.g. Console) without going through the app,
 * use a Cloud Function triggered on user delete to call this (or delete the document).
 */
export async function deleteUserProfile(uid: string): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid)
  await updateDoc(userRef, { deletedAt: Timestamp.now() })
}

const VALID_COLOR_SCHEMES = ['gold', 'red-green', 'teal', 'blue', 'purple', 'rose', 'coral'] as const

export async function getUserColorScheme(userId: string): Promise<string | null> {
  const userRef = doc(db, USERS_COLLECTION, userId)
  const snap = await getDoc(userRef)
  const scheme = snap.data()?.colorScheme
  return typeof scheme === 'string' && VALID_COLOR_SCHEMES.includes(scheme as any) ? scheme : null
}

export async function saveUserColorScheme(userId: string, colorScheme: string): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, userId)
  await setDoc(userRef, { colorScheme }, { merge: true })
}

export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  const usersRef = collection(db, USERS_COLLECTION)
  const q = query(usersRef, where('email', '==', email.toLowerCase()))
  const snapshot = await getDocs(q)
  
  if (snapshot.empty) return null
  
  const docSnap = snapshot.docs[0]
  const data = docSnap.data()
  if (data.deletedAt) return null
  return {
    uid: data.uid,
    email: data.email,
    displayName: data.displayName,
    createdAt: timestampToISO(data.createdAt)
  }
}

function docToUserProfile(data: Record<string, unknown>): UserProfile | null {
  if (!data.uid) return null
  return {
    uid: data.uid as string,
    email: data.email as string,
    displayName: data.displayName as string,
    createdAt: timestampToISO(data.createdAt)
  }
}

/** Search users by name or email (partial match). Returns users whose displayName or email matches the query. */
export async function searchUsers(queryText: string): Promise<UserProfile[]> {
  const q = queryText.trim().toLowerCase()
  if (q.length < 1) return []

  const usersRef = collection(db, USERS_COLLECTION)
  const seen = new Set<string>()
  const results: UserProfile[] = []

  // 1. Try index-based prefix queries (efficient, works for users with displayNameLower)
  const nameQuery = query(
    usersRef,
    where('displayNameLower', '>=', q),
    where('displayNameLower', '<=', q + '\uf8ff'),
    limit(20)
  )
  const emailQuery = query(
    usersRef,
    where('email', '>=', q),
    where('email', '<=', q + '\uf8ff'),
    limit(20)
  )

  try {
    const [nameSnap, emailSnap] = await Promise.all([getDocs(nameQuery), getDocs(emailQuery)])
    for (const docSnap of [...nameSnap.docs, ...emailSnap.docs]) {
      const data = docSnap.data()
      if (data.deletedAt) continue
      if (data.uid && !seen.has(data.uid)) {
        seen.add(data.uid)
        const user = docToUserProfile(data)
        if (user) results.push(user)
      }
    }
  } catch {
    // Index may not exist; fall through to fetch-and-filter
  }

  // 2. If no results (e.g. users without displayNameLower, or substring/match needs),
  //    fetch users and filter in memory. Supports "Test User" → finds "Test User"
  if (results.length === 0) {
    const queryWords = q.split(/\s+/).filter(Boolean)
    const usersQuery = query(usersRef, orderBy('email'), limit(500))
    const snapshot = await getDocs(usersQuery)

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data()
      if (data.deletedAt) continue
      const displayNameLower = (data.displayName || data.displayNameLower || '').toLowerCase()
      const emailLower = (data.email || '').toLowerCase()

      const matches =
        displayNameLower.includes(q) ||
        emailLower.includes(q) ||
        queryWords.every((w) => displayNameLower.includes(w) || emailLower.includes(w))

      if (matches && data.uid) {
        const user = docToUserProfile(data)
        if (user) results.push(user)
      }
    }
  }

  results.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''))
  return results
}

// ===== SHARING OPERATIONS =====

export type ShareAccessLevel = 'view' | 'edit'

export interface Share {
  id: string
  ownerId: string
  ownerName: string
  sharedWithId: string
  sharedWithEmail: string
  sharedWithName?: string
  accessLevel: ShareAccessLevel
  goalId: string
  goalTitle: string
  createdAt: string
}

export async function shareGoal(
  ownerId: string,
  ownerName: string,
  sharedWithEmail: string,
  goalId: string,
  goalTitle: string,
  accessLevel: ShareAccessLevel = 'view'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Look up user by email
    const user = await getUserByEmail(sharedWithEmail)
    
    if (!user) {
      return { success: false, error: 'User not found with that email address' }
    }
    
    if (user.uid === ownerId) {
      return { success: false, error: 'You cannot share a goal with yourself' }
    }
    
    // Use sharedWithId_goalId as doc ID so Firestore rules can check exists(shares/{auth.uid}_{goalId})
    const shareId = `${user.uid}_${goalId}`
    const shareRef = doc(db, SHARES_COLLECTION, shareId)
    
    // Query for existing share (don't use getDoc - it fails on non-existent docs due to rules)
    const existingQuery = query(
      collection(db, SHARES_COLLECTION),
      where('ownerId', '==', ownerId),
      where('sharedWithId', '==', user.uid),
      where('goalId', '==', goalId)
    )
    const existingSnapshot = await getDocs(existingQuery)
    if (!existingSnapshot.empty) {
      const existingDoc = existingSnapshot.docs[0]
      // Migrate legacy (random ID) to new format so goals rule works
      if (existingDoc.id !== shareId) {
        await setDoc(shareRef, { ...existingDoc.data(), id: shareId })
        await deleteDoc(existingDoc.ref)
        return { success: true }
      }
      return { success: false, error: 'Goal already shared with this user' }
    }
    
    // Create share
    await setDoc(shareRef, {
      id: shareId,
      ownerId,
      ownerName,
      sharedWithId: user.uid,
      sharedWithEmail: user.email,
      sharedWithName: user.displayName || null,
      accessLevel,
      goalId,
      goalTitle,
      createdAt: Timestamp.now()
    })
    
    return { success: true }
  } catch (error) {
    console.error('Error sharing goal:', error)
    return { success: false, error: 'Failed to share goal' }
  }
}

export async function unshareGoal(shareId: string): Promise<void> {
  const shareRef = doc(db, SHARES_COLLECTION, shareId)
  await deleteDoc(shareRef)
}

export async function updateShareAccessLevel(
  shareId: string,
  accessLevel: ShareAccessLevel
): Promise<void> {
  const shareRef = doc(db, SHARES_COLLECTION, shareId)
  await updateDoc(shareRef, { accessLevel })
}

export async function getSharesForGoal(goalId: string, ownerId: string): Promise<Share[]> {
  const sharesRef = collection(db, SHARES_COLLECTION)
  const q = query(
    sharesRef,
    where('goalId', '==', goalId),
    where('ownerId', '==', ownerId)
  )
  const snapshot = await getDocs(q)
  
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      ownerId: data.ownerId,
      ownerName: data.ownerName,
      sharedWithId: data.sharedWithId,
      sharedWithEmail: data.sharedWithEmail,
      sharedWithName: data.sharedWithName ?? null,
      accessLevel: (data.accessLevel as ShareAccessLevel) ?? 'view',
      goalId: data.goalId,
      goalTitle: data.goalTitle,
      createdAt: timestampToISO(data.createdAt)
    }
  })
}

export async function getSharedGoals(
  userId: string
): Promise<Array<Goal & { ownerName: string; shareId: string; accessLevel: ShareAccessLevel }>> {
  const sharesRef = collection(db, SHARES_COLLECTION)
  const q = query(sharesRef, where('sharedWithId', '==', userId))
  const snapshot = await getDocs(q)

  const goalIds = snapshot.docs.map((doc) => doc.data().goalId)
  if (goalIds.length === 0) return []

  const shareMap = new Map<
    string,
    { ownerName: string; shareId: string; accessLevel: ShareAccessLevel }
  >()
  snapshot.docs.forEach((doc) => {
    const data = doc.data()
    shareMap.set(data.goalId, {
      ownerName: data.ownerName,
      shareId: doc.id,
      accessLevel: (data.accessLevel as ShareAccessLevel) ?? 'view'
    })
  })

  const allGoals: Array<
    Goal & { ownerName: string; shareId: string; accessLevel: ShareAccessLevel }
  > = []
  for (let i = 0; i < goalIds.length; i += 10) {
    const batch = goalIds.slice(i, i + 10)
    const goalsRef = collection(db, GOALS_COLLECTION)
    const goalsQuery = query(goalsRef, where('__name__', 'in', batch))
    const goalsSnapshot = await getDocs(goalsQuery)

    goalsSnapshot.docs.forEach((doc) => {
      const data = doc.data()
      const shareInfo = shareMap.get(doc.id)!
      allGoals.push({
        id: doc.id,
        title: data.title,
        description: data.description,
        year: data.year,
        order: data.order ?? 0,
        createdAt: timestampToISO(data.createdAt),
        ownerName: shareInfo.ownerName,
        shareId: shareInfo.shareId,
        accessLevel: shareInfo.accessLevel
      })
    })
  }

  return allGoals
}

export async function getCheckInsForSharedGoal(goalId: string): Promise<CheckIn[]> {
  const checkInsRef = collection(db, CHECKINS_COLLECTION)
  const q = query(checkInsRef, where('goalId', '==', goalId))
  const snapshot = await getDocs(q)
  
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      goalId: data.goalId,
      weekNumber: data.weekNumber,
      year: data.year,
      reflection: data.reflection,
      progressRating: data.progressRating,
      createdAt: timestampToISO(data.createdAt)
    }
  })
}
