export interface Goal {
  id: string
  title: string
  description: string
  createdAt: string
  year: number
  order: number
}

export interface CheckIn {
  id: string
  goalId: string
  weekNumber: number
  year: number
  reflection: string
  progressRating: 1 | 2 | 3 | 4 | 5 | null
  createdAt: string
}

export interface AppData {
  goals: Goal[]
  checkIns: CheckIn[]
  currentYear: number
}
