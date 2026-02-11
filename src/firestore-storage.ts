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
  // Get max order for user's goals
  const goalsRef = collection(db, GOALS_COLLECTION)
  const q = query(goalsRef, where('userId', '==', userId), where('year', '==', goal.year))
  const snapshot = await getDocs(q)
  const maxOrder = snapshot.docs.reduce((max, doc) => {
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
    createdAt: Timestamp.now()
  })
}

export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  const usersRef = collection(db, USERS_COLLECTION)
  const q = query(usersRef, where('email', '==', email.toLowerCase()))
  const snapshot = await getDocs(q)
  
  if (snapshot.empty) return null
  
  const doc = snapshot.docs[0]
  const data = doc.data()
  return {
    uid: data.uid,
    email: data.email,
    displayName: data.displayName,
    createdAt: timestampToISO(data.createdAt)
  }
}

// ===== SHARING OPERATIONS =====

export interface Share {
  id: string
  ownerId: string
  ownerName: string
  sharedWithId: string
  sharedWithEmail: string
  goalId: string
  goalTitle: string
  createdAt: string
}

export async function shareGoal(
  ownerId: string,
  ownerName: string,
  sharedWithEmail: string,
  goalId: string,
  goalTitle: string
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
    
    // Check if already shared
    const sharesRef = collection(db, SHARES_COLLECTION)
    const existingQuery = query(
      sharesRef,
      where('ownerId', '==', ownerId),
      where('sharedWithId', '==', user.uid),
      where('goalId', '==', goalId)
    )
    const existingSnapshot = await getDocs(existingQuery)
    
    if (!existingSnapshot.empty) {
      return { success: false, error: 'Goal already shared with this user' }
    }
    
    // Create share
    const shareRef = doc(collection(db, SHARES_COLLECTION))
    await setDoc(shareRef, {
      id: shareRef.id,
      ownerId,
      ownerName,
      sharedWithId: user.uid,
      sharedWithEmail: user.email,
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

export async function getSharesForGoal(goalId: string): Promise<Share[]> {
  const sharesRef = collection(db, SHARES_COLLECTION)
  const q = query(sharesRef, where('goalId', '==', goalId))
  const snapshot = await getDocs(q)
  
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      ownerId: data.ownerId,
      ownerName: data.ownerName,
      sharedWithId: data.sharedWithId,
      sharedWithEmail: data.sharedWithEmail,
      goalId: data.goalId,
      goalTitle: data.goalTitle,
      createdAt: timestampToISO(data.createdAt)
    }
  })
}

export async function getSharedGoals(userId: string): Promise<Array<Goal & { ownerName: string; shareId: string }>> {
  const sharesRef = collection(db, SHARES_COLLECTION)
  const q = query(sharesRef, where('sharedWithId', '==', userId))
  const snapshot = await getDocs(q)
  
  const goalIds = snapshot.docs.map(doc => doc.data().goalId)
  if (goalIds.length === 0) return []
  
  // Create a map of goalId to share info
  const shareMap = new Map<string, { ownerName: string; shareId: string }>()
  snapshot.docs.forEach(doc => {
    const data = doc.data()
    shareMap.set(data.goalId, {
      ownerName: data.ownerName,
      shareId: doc.id
    })
  })
  
  // Get the actual goals (in batches of 10)
  const allGoals: Array<Goal & { ownerName: string; shareId: string }> = []
  for (let i = 0; i < goalIds.length; i += 10) {
    const batch = goalIds.slice(i, i + 10)
    const goalsRef = collection(db, GOALS_COLLECTION)
    const goalsQuery = query(goalsRef, where('__name__', 'in', batch))
    const goalsSnapshot = await getDocs(goalsQuery)
    
    const goals = goalsSnapshot.docs.map((doc) => {
      const data = doc.data()
      const shareInfo = shareMap.get(doc.id)!
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        year: data.year,
        order: data.order ?? 0,
        createdAt: timestampToISO(data.createdAt),
        ownerName: shareInfo.ownerName,
        shareId: shareInfo.shareId
      }
    })
    
    allGoals.push(...goals)
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
