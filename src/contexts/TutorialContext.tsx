import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode
} from 'react'

export type Tab = 'goals' | 'checkin' | 'year' | 'shared'

export const TUTORIAL_STEPS = [
  { id: 'menu-btn', message: 'Open the menu (☰) to see the tabs.', waitForClick: true, tab: null },
  { id: 'goals-tab', message: 'Click Goals to add your first goal.', waitForClick: true, tab: 'goals' as Tab },
  { id: 'goal-form', message: 'Enter a goal title and click Add. Or click Next to continue.', waitForClick: false, tab: null },
  { id: 'goal-added', message: "Nice! Your goal was added. Click Next to continue.", waitForClick: false, tab: null },
  { id: 'checkin-tab', message: 'Click Check-in to log your weekly progress.', waitForClick: true, tab: 'checkin' as Tab },
  { id: 'checkin-week-nav', message: 'Select a week and add a reflection or rating for each goal.', waitForClick: false, tab: null },
  { id: 'checkin-added', message: "Nice! Your check-in was added. Add more check-ins if you'd like, or click Next to continue.", waitForClick: false, tab: null },
  { id: 'year-tab', message: 'Click Year View to see your progress at a glance.', waitForClick: true, tab: 'year' as Tab },
  { id: 'year-grid', message: 'Each cell is a week. Click a cell to add or edit a check-in, or click Next to continue.', waitForClick: false, tab: null },
  { id: 'checkin-modal', message: 'Add a reflection or rating, then save. Or click Next to continue the tour.', waitForClick: false, tab: null },
  { id: 'shared-tab', message: 'Click Shared to see goals others have shared with you.', waitForClick: true, tab: 'shared' as Tab },
  { id: 'shared-view', message: "This is where goals shared with you appear. Share your own goals from the Goals tab.", waitForClick: false, tab: null },
  { id: 'user-menu', message: "You're all set! Click your name for settings, feedback, and more.", waitForClick: false, tab: null },
]

interface TutorialContextType {
  step: number
  advance: () => void
  /** Advance by n steps (skips intermediate steps when no goals) */
  advanceBy: (n: number) => void
  onTargetClick: (targetId: string) => void
  onTabSelect: (tab: Tab) => boolean
  onMenuClick: () => void
  onGoalAdded: () => void
  onCheckInAdded: () => void
  complete: () => void
  isActive: boolean
  /** True when advancing to goal-added because user actually added a goal (vs clicking Next) */
  goalWasAdded: boolean
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined)

export function useTutorial() {
  const ctx = useContext(TutorialContext)
  return ctx
}

interface TutorialProviderProps {
  children: ReactNode
  active: boolean
  onComplete: () => void
  /** When true, skip the menu-btn step (e.g. on desktop where hamburger is hidden) */
  skipMenuStep?: boolean
}

export function TutorialProvider({
  children,
  active,
  onComplete,
  skipMenuStep = false,
}: TutorialProviderProps) {
  const [step, setStep] = useState(skipMenuStep ? 1 : 0)
  const [goalWasAdded, setGoalWasAdded] = useState(false)

  // When tutorial becomes active, ensure we start at the right step (skip menu on desktop)
  useEffect(() => {
    if (active) {
      setStep(skipMenuStep ? 1 : 0)
    }
  }, [active, skipMenuStep])

  const advance = useCallback(() => {
    // Notify views to close modals so they don't overlay the next step
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tutorial-advanced'))
    }
    setGoalWasAdded(false) // User clicked Next, so goal wasn't added via Add button
    setStep((s) => {
      if (s >= TUTORIAL_STEPS.length - 1) {
        onComplete()
        return 0
      }
      return s + 1
    })
  }, [onComplete])

  const advanceBy = useCallback(
    (n: number) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tutorial-advanced'))
      }
      setGoalWasAdded(false)
      setStep((s) => {
        const next = s + n
        if (next >= TUTORIAL_STEPS.length) {
          onComplete()
          return 0
        }
        return Math.min(next, TUTORIAL_STEPS.length - 1)
      })
    },
    [onComplete]
  )

  const onTargetClick = useCallback(
    (targetId: string) => {
      if (!active || step >= TUTORIAL_STEPS.length) return
      const current = TUTORIAL_STEPS[step]
      if (current.waitForClick && current.id === targetId) {
        advance()
      }
    },
    [active, step, advance]
  )

  const onTabSelect = useCallback(
    (tab: Tab): boolean => {
      if (!active || step >= TUTORIAL_STEPS.length) return false
      const current = TUTORIAL_STEPS[step]
      if (current.waitForClick && current.tab === tab) {
        advance()
        return true
      }
      return false
    },
    [active, step, advance]
  )

  const onGoalAdded = useCallback(() => {
    if (!active || step >= TUTORIAL_STEPS.length) return
    const current = TUTORIAL_STEPS[step]
    if (current.id === 'goal-form') {
      setGoalWasAdded(true)
      setStep((s) => {
        if (s >= TUTORIAL_STEPS.length - 1) {
          onComplete()
          return 0
        }
        return s + 1
      })
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tutorial-advanced'))
      }
    }
  }, [active, step, onComplete])

  const onCheckInAdded = useCallback(() => {
    if (!active || step >= TUTORIAL_STEPS.length) return
    const current = TUTORIAL_STEPS[step]
    if (current.id === 'checkin-week-nav') {
      advance()
    }
  }, [active, step, advance])

  const onMenuClick = useCallback(
    (): boolean => {
      if (!active || step >= TUTORIAL_STEPS.length) return false
      const current = TUTORIAL_STEPS[step]
      if (current.waitForClick && current.id === 'menu-btn') {
        advance()
        return true
      }
      return false
    },
    [active, step, advance]
  )


  const complete = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tutorial-advanced'))
    }
    onComplete()
  }, [onComplete])

  return (
    <TutorialContext.Provider
      value={{
        step,
        advance,
        advanceBy,
        onTargetClick,
        onTabSelect,
        onMenuClick,
        onGoalAdded,
        onCheckInAdded,
        complete,
        isActive: active,
        goalWasAdded,
      }}
    >
      {children}
    </TutorialContext.Provider>
  )
}
