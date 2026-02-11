import type { Goal, CheckIn, AppData } from './types'

const STORAGE_KEY = 'year-reflection-data'

const defaultData: AppData = {
  goals: [],
  checkIns: [],
  currentYear: new Date().getFullYear(),
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultData }
    const data = JSON.parse(raw) as AppData
    
    // Migration: add order field to goals that don't have it
    const goals = (data.goals ?? []).map((g, index) => ({
      ...g,
      order: g.order ?? index,
    }))
    
    return {
      goals,
      checkIns: data.checkIns ?? [],
      currentYear: data.currentYear ?? new Date().getFullYear(),
    }
  } catch {
    return { ...defaultData }
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function addGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'order'>): Goal {
  const data = loadData()
  const maxOrder = data.goals.reduce((max, g) => Math.max(max, g.order ?? 0), 0)
  const newGoal: Goal = {
    ...goal,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    order: maxOrder + 1,
  }
  data.goals.push(newGoal)
  saveData(data)
  return newGoal
}

export function updateGoal(id: string, updates: Partial<Pick<Goal, 'title' | 'description'>>): void {
  const data = loadData()
  const idx = data.goals.findIndex((g) => g.id === id)
  if (idx >= 0) {
    data.goals[idx] = { ...data.goals[idx], ...updates }
    saveData(data)
  }
}

export function deleteGoal(id: string): void {
  const data = loadData()
  data.goals = data.goals.filter((g) => g.id !== id)
  data.checkIns = data.checkIns.filter((c) => c.goalId !== id)
  saveData(data)
}

export function saveOrUpdateCheckIn(
  goalId: string,
  weekNumber: number,
  year: number,
  reflection: string,
  progressRating: 1 | 2 | 3 | 4 | 5 | null
): CheckIn {
  const data = loadData()
  const existing = data.checkIns.find(
    (c) => c.goalId === goalId && c.weekNumber === weekNumber && c.year === year
  )
  const now = new Date().toISOString()

  if (existing) {
    existing.reflection = reflection
    existing.progressRating = progressRating
    existing.createdAt = now
    saveData(data)
    return existing
  }

  const newCheckIn: CheckIn = {
    id: crypto.randomUUID(),
    goalId,
    weekNumber,
    year,
    reflection,
    progressRating,
    createdAt: now,
  }
  data.checkIns.push(newCheckIn)
  saveData(data)
  return newCheckIn
}

export function getCheckIn(goalId: string, weekNumber: number, year: number): CheckIn | undefined {
  const data = loadData()
  return data.checkIns.find(
    (c) => c.goalId === goalId && c.weekNumber === weekNumber && c.year === year
  )
}

export function deleteCheckIn(goalId: string, weekNumber: number, year: number): void {
  const data = loadData()
  data.checkIns = data.checkIns.filter(
    (c) => !(c.goalId === goalId && c.weekNumber === weekNumber && c.year === year)
  )
  saveData(data)
}

export function getGoalsForYear(year: number): Goal[] {
  return loadData().goals.filter((g) => g.year === year)
}

export function getCheckInsForWeek(weekNumber: number, year: number): CheckIn[] {
  return loadData().checkIns.filter((c) => c.weekNumber === weekNumber && c.year === year)
}

export function reorderGoals(goalIds: string[]): void {
  const data = loadData()
  goalIds.forEach((id, index) => {
    const goal = data.goals.find((g) => g.id === id)
    if (goal) {
      goal.order = index
    }
  })
  saveData(data)
}
