import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getSharedGoals, getCheckInsForSharedGoal } from '../firestore-storage'
import type { Goal, CheckIn } from '../types'
import { getWeeksInYear } from '../utils'
import './SharedView.css'

interface SharedGoal extends Goal {
  ownerName: string
  shareId: string
}

export function SharedView() {
  const { currentUser } = useAuth()
  const [sharedGoals, setSharedGoals] = useState<SharedGoal[]>([])
  const [checkInsByGoal, setCheckInsByGoal] = useState<Record<string, CheckIn[]>>({})
  const [selectedGoal, setSelectedGoal] = useState<SharedGoal | null>(null)
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingCheckIns, setLoadingCheckIns] = useState(false)

  // Filters
  const [filterOwner, setFilterOwner] = useState<string>('')
  const [filterTitle, setFilterTitle] = useState('')
  const [filterYear, setFilterYear] = useState<number | ''>('')
  const [filterWeek, setFilterWeek] = useState<number | ''>('')

  useEffect(() => {
    loadSharedGoals()
  }, [currentUser])

  useEffect(() => {
    if (sharedGoals.length === 0) return
    const loadAll = async () => {
      const map: Record<string, CheckIn[]> = {}
      await Promise.all(
        sharedGoals.map(async (goal) => {
          const cis = await getCheckInsForSharedGoal(goal.id)
          map[goal.id] = cis
        })
      )
      setCheckInsByGoal(map)
    }
    loadAll()
  }, [sharedGoals])

  async function loadSharedGoals() {
    if (!currentUser) return

    try {
      setLoading(true)
      const goals = await getSharedGoals(currentUser.uid)
      setSharedGoals(goals)
    } catch (error) {
      console.error('Error loading shared goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const uniqueOwners = useMemo(
    () => [...new Set(sharedGoals.map((g) => g.ownerName))].sort(),
    [sharedGoals]
  )
  const uniqueYears = useMemo(
    () => [...new Set(sharedGoals.map((g) => g.year))].sort((a, b) => b - a),
    [sharedGoals]
  )
  const weekOptions = useMemo(() => {
    const y = typeof filterYear === 'number' ? filterYear : new Date().getFullYear()
    return Array.from({ length: getWeeksInYear(y) }, (_, i) => i + 1)
  }, [filterYear])

  const filteredGoals = useMemo(() => {
    return sharedGoals.filter((goal) => {
      if (filterOwner && goal.ownerName !== filterOwner) return false
      if (filterTitle.trim() && !goal.title.toLowerCase().includes(filterTitle.trim().toLowerCase()))
        return false
      if (filterYear !== '' && goal.year !== filterYear) return false
      if (filterWeek !== '' && filterYear !== '') {
        const goalCheckIns = checkInsByGoal[goal.id] ?? []
        const hasCheckIn = goalCheckIns.some(
          (c) => c.weekNumber === filterWeek && c.year === filterYear
        )
        if (!hasCheckIn) return false
      }
      return true
    })
  }, [sharedGoals, filterOwner, filterTitle, filterYear, filterWeek, checkInsByGoal])

  useEffect(() => {
    if (selectedGoal && !filteredGoals.some((g) => g.id === selectedGoal.id)) {
      setSelectedGoal(null)
    }
  }, [filteredGoals, selectedGoal])

  async function handleSelectGoal(goal: SharedGoal) {
    setSelectedGoal(goal)
    setLoadingCheckIns(true)

    try {
      const goalCheckIns = await getCheckInsForSharedGoal(goal.id)
      setCheckIns(goalCheckIns)
    } catch (error) {
      console.error('Error loading check-ins:', error)
    } finally {
      setLoadingCheckIns(false)
    }
  }

  if (loading) {
    return (
      <div className="shared-view">
        <div className="loading-state">Loading shared goals...</div>
      </div>
    )
  }

  if (sharedGoals.length === 0) {
    return (
      <div className="shared-view">
        <section className="shared-intro">
          <h2>Shared with Me</h2>
          <p className="muted">
            When others share their goals with you, they'll appear here.
          </p>
        </section>
        <div className="shared-empty">
          <p>No goals have been shared with you yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="shared-view">
      <section className="shared-intro">
        <h2>Shared with Me</h2>
        <p className="muted">
          Goals that others have shared with you. Click to view their progress.
        </p>
      </section>

      <div className="shared-filters">
        <div className="filter-group">
          <label htmlFor="filter-owner">Shared by</label>
          <select
            id="filter-owner"
            value={filterOwner}
            onChange={(e) => setFilterOwner(e.target.value)}
          >
            <option value="">All</option>
            {uniqueOwners.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="filter-title">Goal title</label>
          <input
            id="filter-title"
            type="text"
            value={filterTitle}
            onChange={(e) => setFilterTitle(e.target.value)}
            placeholder="Search by title..."
          />
        </div>
        <div className="filter-group">
          <label htmlFor="filter-year">Year</label>
          <select
            id="filter-year"
            value={filterYear}
            onChange={(e) => {
              const v = e.target.value
              setFilterYear(v === '' ? '' : Number(v))
              setFilterWeek('')
            }}
          >
            <option value="">All</option>
            {uniqueYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="filter-week">Week</label>
          <select
            id="filter-week"
            value={filterWeek}
            onChange={(e) => {
              const v = e.target.value
              setFilterWeek(v === '' ? '' : Number(v))
            }}
            disabled={filterYear === ''}
          >
            <option value="">All</option>
            {weekOptions.map((w) => (
              <option key={w} value={w}>Week {w}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="shared-layout">
        <aside className="shared-sidebar">
          <h3>Shared Goals {filteredGoals.length < sharedGoals.length && `(${filteredGoals.length} of ${sharedGoals.length})`}</h3>
          {filteredGoals.length === 0 ? (
            <p className="shared-filter-empty">No goals match the current filters.</p>
          ) : (
          <ul className="shared-goals-list">
            {filteredGoals.map((goal) => (
              <li key={goal.id}>
                <button
                  className={`shared-goal-btn ${selectedGoal?.id === goal.id ? 'active' : ''}`}
                  onClick={() => handleSelectGoal(goal)}
                >
                  <div className="shared-goal-title">{goal.title}</div>
                  <div className="shared-goal-owner">by {goal.ownerName}</div>
                  <div className="shared-goal-year">{goal.year}</div>
                </button>
              </li>
            ))}
          </ul>
          )}
        </aside>

        <main className="shared-content">
          {!selectedGoal ? (
            <div className="shared-placeholder">
              <p>Select a goal to view progress</p>
            </div>
          ) : (
            <div className="shared-detail">
              <header className="shared-detail-header">
                <div>
                  <h3>{selectedGoal.title}</h3>
                  <p className="shared-detail-owner">Shared by {selectedGoal.ownerName}</p>
                </div>
                <span className="shared-detail-year">{selectedGoal.year}</span>
              </header>

              {selectedGoal.description && (
                <div className="shared-detail-description">
                  <h4>Description</h4>
                  <p>{selectedGoal.description}</p>
                </div>
              )}

              <div className="shared-detail-checkins">
                <h4>Check-ins</h4>
                {loadingCheckIns ? (
                  <p className="shared-loading">Loading check-ins...</p>
                ) : checkIns.length === 0 ? (
                  <p className="shared-empty-checkins">No check-ins yet</p>
                ) : (
                  <div className="shared-checkins-list">
                    {checkIns
                      .sort((a, b) => b.weekNumber - a.weekNumber)
                      .map((checkIn) => (
                        <div key={checkIn.id} className="shared-checkin-card">
                          <div className="shared-checkin-header">
                            <span className="shared-checkin-week">
                              Week {checkIn.weekNumber} of {getWeeksInYear(checkIn.year)}
                            </span>
                            {checkIn.progressRating && (
                              <span className="shared-checkin-rating">
                                {checkIn.progressRating}/5
                              </span>
                            )}
                          </div>
                          {checkIn.reflection && (
                            <p className="shared-checkin-reflection">{checkIn.reflection}</p>
                          )}
                          <div className="shared-checkin-date">
                            {new Date(checkIn.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
