import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AuthView } from './views/AuthView'
import type { Goal, CheckIn } from './types'
import { GoalsView } from './views/GoalsView'
import { CheckInView } from './views/CheckInView'
import { YearView } from './views/YearView'
import { SharedView } from './views/SharedView'
import { getGoalsForYear, getAllCheckInsForUser } from './firestore-storage'
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
  const [activeTab, setActiveTab] = useState<Tab>('checkin')
  const [navOpen, setNavOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
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
    }
  }, [currentUser, currentYear])

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
    setActiveTab(tab)
    setNavOpen(false)
  }

  return (
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
            onClick={(e) => {
              e.stopPropagation()
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
                onClick={() => handleTabSelect(id)}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="user-menu-wrapper" onClick={(e) => e.stopPropagation()}>
            <button
              className={`user-menu-trigger ${userMenuOpen ? 'open' : ''}`}
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
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
