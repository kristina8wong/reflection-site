import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode
} from 'react'

export type Tab = 'goals' | 'checkin' | 'year' | 'shared'

export const TUTORIAL_STEPS = [
  { id: 'menu-btn', message: 'Open the menu (☰) to see the tabs.', waitForClick: true, tab: null },
  { id: 'goals-tab', message: 'Click Goals to add your first goal.', waitForClick: true, tab: 'goals' as Tab },
  { id: 'goal-form', message: 'Enter a goal title and click Add. Or click Next to continue.', waitForClick: false, tab: null },
  { id: 'checkin-tab', message: 'Click Check-in to log your weekly progress.', waitForClick: true, tab: 'checkin' as Tab },
  { id: 'checkin-area', message: 'Select a week and add a reflection or rating for each goal.', waitForClick: false, tab: null },
  { id: 'year-tab', message: 'Click Year View to see your progress at a glance.', waitForClick: true, tab: 'year' as Tab },
  { id: 'year-grid', message: 'Each dot is a week. Click dots to add or edit check-ins.', waitForClick: false, tab: null },
  { id: 'shared-tab', message: 'Click Shared to share goals with others.', waitForClick: true, tab: 'shared' as Tab },
  { id: 'user-menu', message: "You're all set! Click your name for Settings, Feedback, and more.", waitForClick: false, tab: null },
]

interface TutorialContextType {
  step: number
  advance: () => void
  onTargetClick: (targetId: string) => void
  onTabSelect: (tab: Tab) => boolean
  onMenuClick: () => boolean
  complete: () => void
  isActive: boolean
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
}

export function TutorialProvider({
  children,
  active,
  onComplete,
}: TutorialProviderProps) {
  const [step, setStep] = useState(0)

  const advance = useCallback(() => {
    setStep((s) => {
      if (s >= TUTORIAL_STEPS.length - 1) {
        onComplete()
        return 0
      }
      return s + 1
    })
  }, [onComplete])

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
    onComplete()
  }, [onComplete])

  return (
    <TutorialContext.Provider
      value={{
        step,
        advance,
        onTargetClick,
        onTabSelect,
        onMenuClick,
        complete,
        isActive: active,
      }}
    >
      {children}
    </TutorialContext.Provider>
  )
}
