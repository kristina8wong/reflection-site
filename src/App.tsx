import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AuthView } from './views/AuthView'
import type { Goal, CheckIn } from './types'
import { GoalsView } from './views/GoalsView'
import { CheckInView } from './views/CheckInView'
import { YearView } from './views/YearView'
import { getGoalsForYear, getAllCheckInsForUser } from './firestore-storage'
import './App.css'

type Tab = 'goals' | 'checkin' | 'year'

function AppContent() {
  const { currentUser, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('checkin')
  const [goals, setGoals] = useState<Goal[]>([])
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)

  async function refresh() {
    if (!currentUser) return
    
    try {
      setLoading(true)
      const [yearGoals, allCheckIns] = await Promise.all([
        getGoalsForYear(currentUser.uid, currentYear),
        getAllCheckInsForUser(currentUser.uid)
      ])
      setGoals(yearGoals)
      setCheckIns(allCheckIns)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser) {
      refresh()
    }
  }, [currentUser, currentYear])

  if (!currentUser) {
    return <AuthView />
  }

  const thisYear = new Date().getFullYear()
  const yearOptions = [thisYear - 1, thisYear, thisYear + 1]

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Year Reflection</h1>
        <div className="header-right">
          <div className="user-info">
            <span className="user-name">{currentUser.displayName || currentUser.email}</span>
            <button className="btn-ghost btn-sm" onClick={logout}>
              Log Out
            </button>
          </div>
          <select
            className="year-select"
            value={currentYear}
            onChange={(e) => setCurrentYear(Number(e.target.value))}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <nav className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'goals' ? 'active' : ''}`}
            onClick={() => setActiveTab('goals')}
          >
            Goals
          </button>
          <button
            className={`nav-tab ${activeTab === 'checkin' ? 'active' : ''}`}
            onClick={() => setActiveTab('checkin')}
          >
            Check-in
          </button>
          <button
            className={`nav-tab ${activeTab === 'year' ? 'active' : ''}`}
            onClick={() => setActiveTab('year')}
          >
            Year View
          </button>
        </nav>
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
