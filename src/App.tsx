import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AuthView } from './views/AuthView'
import type { Goal, CheckIn } from './types'
import { GoalsView } from './views/GoalsView'
import { CheckInView } from './views/CheckInView'
import { YearView } from './views/YearView'
import { SharedView } from './views/SharedView'
import { SettingsModal } from './components/SettingsModal'
import { AddToHomeScreenModal } from './components/AddToHomeScreenModal'
import { TutorialWalkthrough } from './components/TutorialWalkthrough'
import { TutorialProvider, useTutorial } from './contexts/TutorialContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { getGoalsForYear, getAllCheckInsForUser, ensureUserProfileSearchable } from './firestore-storage'
import './App.css'

type Tab = 'goals' | 'checkin' | 'year' | 'shared'

const TABS: { id: Tab; label: string }[] = [
  { id: 'goals', label: 'Goals' },
  { id: 'checkin', label: 'Check-in' },
  { id: 'year', label: 'Year View' },
  { id: 'shared', label: 'Shared' },
]

function AppContent() {
  const { currentUser, logout } = useAuth()
  const tutorial = useTutorial()
  const [activeTab, setActiveTab] = useState<Tab>('checkin')
  const [navOpen, setNavOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [addToHomeScreenOpen, setAddToHomeScreenOpen] = useState(false)
  const [showTutorial, setShowTutorial] = useState<boolean | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)

  async function refresh(showLoading = true) {
    if (!currentUser) return
    
    try {
      if (showLoading) setLoading(true)
      const [yearGoals, allCheckIns] = await Promise.all([
        getGoalsForYear(currentUser.uid, currentYear),
        getAllCheckInsForUser(currentUser.uid)
      ])
      setGoals(yearGoals)
      setCheckIns(allCheckIns)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser) {
      refresh()
      // Migrate: ensure user profile has displayNameLower for search
      if (currentUser.displayName) {
        ensureUserProfileSearchable(currentUser.uid, currentUser.displayName).catch(() => {
          // Ignore - profile may not exist or update may fail
        })
      }
    } else {
      setShowTutorial(null)
    }
  }, [currentUser, currentYear])

  // Show tutorial after data loads: new users (no goals/check-ins) or never seen
  useEffect(() => {
    if (!currentUser || loading) return

    try {
      const key = `year-reflection-tutorial-${currentUser.uid}`
      const seen = localStorage.getItem(key)
      const hasNoData = goals.length === 0 && checkIns.length === 0
      const shouldShow = seen !== '1' || hasNoData
      setShowTutorial(shouldShow)
    } catch {
      setShowTutorial(false)
    }
  }, [currentUser, loading, goals, checkIns])

  useEffect(() => {
    if (!navOpen && !userMenuOpen) return
    function handleClickOutside() {
      setNavOpen(false)
      setUserMenuOpen(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [navOpen, userMenuOpen])

  function handleLogoutClick() {
    if (confirm('Are you sure you want to log out?')) {
      setUserMenuOpen(false)
      logout()
    }
  }

  if (!currentUser) {
    return <AuthView />
  }

  const thisYear = new Date().getFullYear()
  const yearOptions = [thisYear - 1, thisYear, thisYear + 1]

  function handleTabSelect(tab: Tab) {
    tutorial?.onTabSelect?.(tab)
    setActiveTab(tab)
    setNavOpen(false)
  }

  function handleTutorialComplete() {
    setShowTutorial(false)
    if (currentUser) {
      try {
        localStorage.setItem(`year-reflection-tutorial-${currentUser.uid}`, '1')
      } catch {
        // ignore
      }
    }
  }

  return (
    <TutorialProvider
      active={showTutorial === true}
      onComplete={handleTutorialComplete}
    >
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Year Reflection</h1>
        <div className="header-right">
          <select
            className="year-select"
            value={currentYear}
            onChange={(e) => setCurrentYear(Number(e.target.value))}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            className="nav-hamburger"
            data-tutorial-target="menu-btn"
            onClick={(e) => {
              e.stopPropagation()
              tutorial?.onMenuClick?.()
              setNavOpen((o) => !o)
            }}
            aria-label={navOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={navOpen}
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
          <nav className={`nav-tabs ${navOpen ? 'nav-open' : ''}`} onClick={(e) => e.stopPropagation()}>
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                className={`nav-tab ${activeTab === id ? 'active' : ''}`}
                data-tutorial-target={`${id}-tab`}
                onClick={() => handleTabSelect(id)}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="user-menu-wrapper" onClick={(e) => e.stopPropagation()}>
            <button
              className={`user-menu-trigger ${userMenuOpen ? 'open' : ''}`}
              data-tutorial-target="user-menu"
              onClick={(e) => {
                e.stopPropagation()
                setUserMenuOpen((o) => !o)
              }}
              aria-label="Account menu"
              aria-expanded={userMenuOpen}
            >
              <span className="user-name">{currentUser.displayName || currentUser.email}</span>
              <span className="user-menu-chevron">▼</span>
            </button>
            {userMenuOpen && (
              <div className="user-menu-dropdown">
                <div className="user-menu-email">{currentUser.email}</div>
                <button
                  className="user-menu-item"
                  onClick={() => {
                    setUserMenuOpen(false)
                    setSettingsOpen(true)
                  }}
                >
                  Settings
                </button>
                <a
                  className="user-menu-item"
                  href="mailto:kristina8wong@gmail.com?subject=Year%20Reflection%20App%20-%20Feedback"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setUserMenuOpen(false)}
                >
                  Feedback
                </a>
                <button
                  className="user-menu-item"
                  onClick={() => {
                    setUserMenuOpen(false)
                    setAddToHomeScreenOpen(true)
                  }}
                >
                  Add to Home Screen
                </button>
                <button className="user-menu-item" onClick={handleLogoutClick}>
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        {loading ? (
          <div className="loading-state">Loading your data...</div>
        ) : (
          <>
            {activeTab === 'goals' && (
              <GoalsView
                goals={goals}
                currentYear={currentYear}
                onRefresh={refresh}
              />
            )}
            {activeTab === 'checkin' && (
              <CheckInView
                goals={goals}
                checkIns={checkIns}
                currentYear={currentYear}
                onRefresh={refresh}
              />
            )}
            {activeTab === 'year' && (
              <YearView
                goals={goals}
                checkIns={checkIns}
                currentYear={currentYear}
                onRefresh={refresh}
              />
            )}
            {activeTab === 'shared' && <SharedView />}
          </>
        )}
      </main>

      {settingsOpen && (
        <SettingsModal onClose={() => setSettingsOpen(false)} />
      )}

      {addToHomeScreenOpen && (
        <AddToHomeScreenModal onClose={() => setAddToHomeScreenOpen(false)} />
      )}

      {showTutorial === true && !loading && (
        <TutorialWalkthrough />
      )}
    </div>
    </TutorialProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProviderWrapper />
    </AuthProvider>
  )
}

function ThemeProviderWrapper() {
  const { currentUser } = useAuth()
  return (
    <ThemeProvider userId={currentUser?.uid ?? undefined}>
      <AppContent />
    </ThemeProvider>
  )
}
