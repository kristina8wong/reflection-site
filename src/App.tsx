import { useState, useEffect } from 'react'
import { loadData } from './storage'
import type { Goal, CheckIn } from './types'
import { GoalsView } from './views/GoalsView'
import { CheckInView } from './views/CheckInView'
import { YearView } from './views/YearView'
import './App.css'

type Tab = 'goals' | 'checkin' | 'year'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('checkin')
  const [goals, setGoals] = useState<Goal[]>([])
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  function refresh() {
    const data = loadData()
    setGoals(data.goals)
    setCheckIns(data.checkIns)
    // Keep currentYear as user selected - don't reset on save/refresh
  }

  useEffect(() => refresh(), [])

  const thisYear = new Date().getFullYear()
  const yearOptions = [thisYear - 1, thisYear, thisYear + 1]

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
      </main>
    </div>
  )
}
