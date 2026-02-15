import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getSharedGoals, getCheckInsForSharedGoal } from '../firestore-storage'
import type { Goal, CheckIn } from '../types'
import {
  getWeeksInYear,
  getWeekOfYear,
  formatWeekRange,
  formatWeekRangeShort,
  formatWeekRangeTiny,
  isFirstWeekOfMonth,
  getMonthSpans,
} from '../utils'
import './SharedView.css'
import './YearView.css'
import './CheckInView.css'

interface SharedGoal extends Goal {
  ownerName: string
  shareId: string
}

const WEEK_CELL_WIDTH = 36
const YEAR_VIEW_CELL_WIDTH = 44
const GOAL_LABEL_WIDTH = 180

function SharedUserYearTimeline({
  goals,
  checkInsByGoal,
}: {
  goals: SharedGoal[]
  checkInsByGoal: Record<string, CheckIn[]>
}) {
  const goalsByYear = useMemo(() => {
    const byYear = new Map<number, SharedGoal[]>()
    goals.forEach((g) => {
      const list = byYear.get(g.year) ?? []
      list.push(g)
      byYear.set(g.year, list)
    })
    return Array.from(byYear.entries())
      .sort(([a], [b]) => a - b)
      .map(([year, gs]) => ({ year, goals: gs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) }))
  }, [goals])

  return (
    <div className="shared-user-year-timelines">
      {goalsByYear.map(({ year, goals: yearGoals }) => {
        const totalWeeks = getWeeksInYear(year)
        const monthSpans = getMonthSpans(year, totalWeeks)
        const allCheckIns = yearGoals.flatMap((g) => checkInsByGoal[g.id] ?? [])

        function getCheckInForGoalWeek(goalId: string, week: number): CheckIn | undefined {
          return allCheckIns.find((c) => c.goalId === goalId && c.weekNumber === week && c.year === year)
        }
        function avgRatingForGoal(goalId: string): number | null {
          const goalCheckIns = allCheckIns.filter(
            (c) => c.goalId === goalId && c.year === year && c.progressRating != null
          )
          if (goalCheckIns.length === 0) return null
          const sum = goalCheckIns.reduce((a, c) => a + (c.progressRating ?? 0), 0)
          return Math.round((sum / goalCheckIns.length) * 10) / 10
        }

        return (
          <div key={year} className="shared-user-year-section">
            <h4 className="shared-user-year-title">Year overview — {year}</h4>
            <div
              className="year-timeline shared-user-year-timeline"
              style={{
                gridTemplateColumns: `${GOAL_LABEL_WIDTH}px repeat(${totalWeeks}, ${YEAR_VIEW_CELL_WIDTH}px)`,
                gap: '4px',
              }}
            >
              <div className="year-grid-spacer year-month-spacer" />
              {monthSpans.map((span) => (
                <div
                  key={span.month}
                  className="year-month-cell"
                  style={{
                    gridColumn: `${span.startCol + 1} / span ${span.weekCount}`,
                    gridRow: 1,
                  }}
                >
                  {span.label}
                </div>
              ))}
              <div className="year-grid-spacer year-date-spacer" />
              {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => (
                <div
                  key={week}
                  className={`year-date-cell ${isFirstWeekOfMonth(week, year) ? 'month-start' : ''}`}
                  style={{ gridRow: 2, gridColumn: week + 1 }}
                  title={formatWeekRange(week, year)}
                >
                  {formatWeekRangeTiny(week, year)}
                </div>
              ))}
              {yearGoals.map((goal, rowIndex) => {
                const avg = avgRatingForGoal(goal.id)
                const gridRow = 3 + rowIndex
                return (
                  <React.Fragment key={goal.id}>
                    <div
                      className="year-goal-info shared-user-goal-info"
                      style={{ gridRow, gridColumn: 1 }}
                    >
                      <h3>{goal.title}</h3>
                      {avg != null && <span className="avg-rating">Avg: {avg}/5</span>}
                    </div>
                    {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => {
                      const ci = getCheckInForGoalWeek(goal.id, week)
                      const hasReflection = ci && ci.reflection.trim().length > 0
                      const hasRating = ci && ci.progressRating != null
                      const filled = hasReflection || hasRating
                      return (
                        <div
                          key={week}
                          className={`year-bubble-cell ${isFirstWeekOfMonth(week, year) ? 'month-start' : ''}`}
                          style={{ gridRow, gridColumn: week + 1 }}
                          title={formatWeekRange(week, year)}
                        >
                          <span className={`week-dot ${filled ? 'filled' : ''}`}>
                            {filled ? (hasRating ? ci!.progressRating : '•') : null}
                          </span>
                        </div>
                      )
                    })}
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const RATING_LABELS: Record<number, string> = {
  1: 'Struggling',
  2: 'Slow progress',
  3: 'On track',
  4: 'Doing well',
  5: 'Thriving',
}

function SharedUserCheckInView({
  goals,
  checkInsByGoal,
  selectedYear,
  selectedWeek,
  onYearChange,
  onWeekChange,
  onFocusGoal,
}: {
  goals: SharedGoal[]
  checkInsByGoal: Record<string, CheckIn[]>
  selectedYear: number
  selectedWeek: number
  onYearChange: (y: number) => void
  onWeekChange: (w: number) => void
  onFocusGoal: (goal: SharedGoal) => void
}) {
  const yearGoals = goals.filter((g) => g.year === selectedYear).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const totalWeeks = getWeeksInYear(selectedYear)
  const yearsInGoals = useMemo(() => [...new Set(goals.map((g) => g.year))].sort((a, b) => a - b), [goals])

  function getCheckIn(goalId: string, week: number, year: number): CheckIn | undefined {
    return (checkInsByGoal[goalId] ?? []).find(
      (c) => c.goalId === goalId && c.weekNumber === week && c.year === year
    )
  }

  const pendingGoals = yearGoals.filter((g) => !getCheckIn(g.id, selectedWeek, selectedYear))
  const completedGoals = yearGoals.filter((g) => getCheckIn(g.id, selectedWeek, selectedYear))
  const sortedGoals = [...pendingGoals, ...completedGoals]

  if (yearGoals.length === 0) {
    return (
      <div className="shared-user-checkin-empty">
        <p className="muted">
          {yearsInGoals.length > 0
            ? 'No goals in the selected year. Use the year selector to switch.'
            : 'No goals to show check-ins for.'}
        </p>
      </div>
    )
  }

  return (
    <div className="shared-user-checkin-view">
      <div className="shared-checkin-header">
        <h4>Weekly check-ins</h4>
        {yearsInGoals.length > 1 && (
          <select
            className="shared-checkin-year-select"
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
          >
            {yearsInGoals.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        )}
        <div className="week-selector">
          <button
            className="week-nav"
            onClick={() => onWeekChange(Math.max(1, selectedWeek - 1))}
            disabled={selectedWeek <= 1}
          >
            ← Previous
          </button>
          <span className="week-label">
            Week {selectedWeek} of {totalWeeks}
          </span>
          <button
            className="week-nav"
            onClick={() => onWeekChange(Math.min(totalWeeks, selectedWeek + 1))}
            disabled={selectedWeek >= totalWeeks}
          >
            Next →
          </button>
        </div>
        <p className="week-range muted">{formatWeekRange(selectedWeek, selectedYear)}</p>
      </div>
      <ul className="goal-list shared-user-goal-list">
        {sortedGoals.map((goal) => {
          const ci = getCheckIn(goal.id, selectedWeek, selectedYear)
          const isPending = !ci
          return (
            <li
              key={goal.id}
              className={`goal-card checkin-card ${isPending ? 'checkin-card-pending' : 'checkin-card-completed'} shared-user-checkin-card`}
              onClick={() => onFocusGoal(goal)}
            >
              <div className="goal-content checkin-goal-content">
                <h3>{goal.title}</h3>
                {goal.description && <p className="goal-desc muted">{goal.description}</p>}
                {isPending ? (
                  <p className="muted">No check-in for this week</p>
                ) : (
                  <div className="checkin-summary">
                    {ci.progressRating != null && (
                      <div className="rating-display">
                        {([1, 2, 3, 4, 5] as const).map((n) => (
                          <div
                            key={n}
                            className={`rating-dot ${ci.progressRating === n ? 'filled' : ''}`}
                            title={`${n} – ${RATING_LABELS[n]}`}
                          >
                            {n}
                          </div>
                        ))}
                        <span className="rating-label-saved">{RATING_LABELS[ci.progressRating]}</span>
                      </div>
                    )}
                    {ci.reflection && (
                      <p className="reflection-preview muted">{ci.reflection}</p>
                    )}
                  </div>
                )}
              </div>
              <div className="goal-actions">
                <button className="btn-ghost btn-sm shared-checkin-view-details">View details</button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function SharedGoalYearGrid({ goal, checkIns }: { goal: SharedGoal; checkIns: CheckIn[] }) {
  const year = goal.year
  const totalWeeks = getWeeksInYear(year)
  const goalCheckIns = checkIns.filter((c) => c.goalId === goal.id && c.year === year)

  function getCheckInForWeek(week: number): CheckIn | undefined {
    return goalCheckIns.find((c) => c.weekNumber === week)
  }

  const avgRating =
    goalCheckIns.length > 0
      ? Math.round(
          (goalCheckIns.reduce((s, c) => s + (c.progressRating ?? 0), 0) / goalCheckIns.length) * 10
        ) / 10
      : null

  return (
    <div
      className="shared-year-grid"
      style={{
        gridTemplateColumns: `120px repeat(${totalWeeks}, ${WEEK_CELL_WIDTH}px)`,
      }}
    >
      <div className="shared-year-spacer" />
      {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => (
        <div
          key={`date-${week}`}
          className={`shared-year-date-cell ${isFirstWeekOfMonth(week, year) ? 'month-start' : ''}`}
          title={formatWeekRangeShort(week, year)}
        >
          {formatWeekRangeTiny(week, year)}
        </div>
      ))}
      <div className="shared-year-goal-label">
        <span className="shared-year-goal-title">{goal.title}</span>
        {avgRating != null && <span className="shared-year-avg">Avg: {avgRating}/5</span>}
      </div>
      {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => {
        const ci = getCheckInForWeek(week)
        const hasReflection = ci && ci.reflection.trim().length > 0
        const hasRating = ci && ci.progressRating != null
        const filled = hasReflection || hasRating
        return (
          <div
            key={week}
            className={`shared-year-cell ${isFirstWeekOfMonth(week, year) ? 'month-start' : ''}`}
            title={`Week ${week}: ${formatWeekRangeShort(week, year)}`}
          >
            <span className={`week-dot ${filled ? 'filled' : ''}`}>
              {filled ? (hasRating ? ci!.progressRating : '•') : null}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function SharedView() {
  const { currentUser } = useAuth()
  const [sharedGoals, setSharedGoals] = useState<SharedGoal[]>([])
  const [checkInsByGoal, setCheckInsByGoal] = useState<Record<string, CheckIn[]>>({})
  const [selectedGoal, setSelectedGoal] = useState<SharedGoal | null>(null)
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingCheckIns, setLoadingCheckIns] = useState(false)
  const [checkInsVisibleCount, setCheckInsVisibleCount] = useState(3)
  const [viewMode, setViewMode] = useState<'byUser' | 'byGoal'>('byGoal')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [sharedUserSelectedYear, setSharedUserSelectedYear] = useState<number>(() => new Date().getFullYear())
  const [sharedUserSelectedWeek, setSharedUserSelectedWeek] = useState<number>(() => getWeekOfYear(new Date()))

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
    return Array.from({ length: getWeeksInYear(y) }, (_, i) => ({
      week: i + 1,
      label: `Week ${i + 1} · ${formatWeekRangeShort(i + 1, y)}`,
    }))
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

  const filteredUsers = useMemo(() => {
    const names = [...new Set(filteredGoals.map((g) => g.ownerName))].sort()
    return names.map((name) => ({
      name,
      count: filteredGoals.filter((g) => g.ownerName === name).length,
    }))
  }, [filteredGoals])

  const goalsForSelectedUser = useMemo(() => {
    if (!selectedUser) return []
    return filteredGoals.filter((g) => g.ownerName === selectedUser)
  }, [filteredGoals, selectedUser])

  useEffect(() => {
    if (selectedGoal && !filteredGoals.some((g) => g.id === selectedGoal.id)) {
      setSelectedGoal(null)
    }
  }, [filteredGoals, selectedGoal])

  useEffect(() => {
    if (selectedUser && !filteredUsers.some((u) => u.name === selectedUser)) {
      setSelectedUser(null)
    }
  }, [filteredUsers, selectedUser])

  const goalsForSelectedUserYears = useMemo(() => {
    if (!goalsForSelectedUser.length) return []
    return [...new Set(goalsForSelectedUser.map((g) => g.year))].sort((a, b) => a - b)
  }, [goalsForSelectedUser])

  useEffect(() => {
    if (goalsForSelectedUser.length > 0 && !goalsForSelectedUserYears.includes(sharedUserSelectedYear)) {
      setSharedUserSelectedYear(goalsForSelectedUserYears[0] ?? new Date().getFullYear())
    }
  }, [goalsForSelectedUser, goalsForSelectedUserYears, sharedUserSelectedYear])

  useEffect(() => {
    const totalWeeks = getWeeksInYear(sharedUserSelectedYear)
    if (sharedUserSelectedWeek > totalWeeks) {
      setSharedUserSelectedWeek(totalWeeks)
    }
  }, [sharedUserSelectedYear, sharedUserSelectedWeek])

  async function handleSelectGoal(goal: SharedGoal) {
    setSelectedGoal(goal)
    setViewMode('byGoal')
    setCheckInsVisibleCount(3)
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

  function handleSelectUser(userName: string) {
    setSelectedUser(userName)
    setSelectedGoal(null)
  }

  function handleFocusGoal(goal: SharedGoal) {
    setViewMode('byGoal')
    setSelectedGoal(goal)
    setCheckIns(checkInsByGoal[goal.id] ?? [])
    setCheckInsVisibleCount(3)
  }

  const displayedCheckIns = useMemo(() => {
    let list = [...checkIns].sort((a, b) => b.weekNumber - a.weekNumber)
    if (filterWeek !== '' && filterYear !== '') {
      list = list.filter((c) => c.weekNumber === filterWeek && c.year === filterYear)
    }
    return list
  }, [checkIns, filterWeek, filterYear])

  const visibleCheckIns = displayedCheckIns.slice(0, checkInsVisibleCount)
  const hasMoreCheckIns = displayedCheckIns.length > checkInsVisibleCount

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

      <div className="shared-view-toggle">
        <button
          className={`toggle-btn ${viewMode === 'byUser' ? 'active' : ''}`}
          onClick={() => {
            setViewMode('byUser')
            setSelectedGoal(null)
          }}
        >
          By user
        </button>
        <button
          className={`toggle-btn ${viewMode === 'byGoal' ? 'active' : ''}`}
          onClick={() => setViewMode('byGoal')}
        >
          By goal
        </button>
      </div>

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
            {weekOptions.map(({ week, label }) => (
              <option key={week} value={week}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="shared-layout">
        <aside className="shared-sidebar">
          {viewMode === 'byUser' ? (
            <>
              <h3>Shared by {filteredGoals.length < sharedGoals.length && `(${filteredGoals.length} of ${sharedGoals.length})`}</h3>
              {filteredUsers.length === 0 ? (
                <p className="shared-filter-empty">No users match the current filters.</p>
              ) : (
                <ul className="shared-goals-list">
                  {filteredUsers.map(({ name, count }) => (
                    <li key={name}>
                      <button
                        className={`shared-goal-btn shared-user-btn ${selectedUser === name ? 'active' : ''}`}
                        onClick={() => handleSelectUser(name)}
                      >
                        <div className="shared-goal-title">{name}</div>
                        <div className="shared-goal-owner">{count} goal{count !== 1 ? 's' : ''} shared</div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
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
            </>
          )}
        </aside>

        <main className="shared-content">
          {viewMode === 'byUser' ? (
            !selectedUser ? (
              <div className="shared-placeholder">
                <p>Select a user to view their shared goals</p>
              </div>
            ) : (
              <div className="shared-user-goals">
                <header className="shared-detail-header">
                  <h3>{selectedUser}&apos;s goals</h3>
                  <span className="shared-detail-year">{goalsForSelectedUser.length} goal{goalsForSelectedUser.length !== 1 ? 's' : ''}</span>
                </header>
                <div className="shared-user-year-overview">
                  <SharedUserYearTimeline goals={goalsForSelectedUser} checkInsByGoal={checkInsByGoal} />
                </div>
                <div className="shared-user-checkin-section">
                  <SharedUserCheckInView
                    goals={goalsForSelectedUser}
                    checkInsByGoal={checkInsByGoal}
                    selectedYear={sharedUserSelectedYear}
                    selectedWeek={sharedUserSelectedWeek}
                    onYearChange={setSharedUserSelectedYear}
                    onWeekChange={setSharedUserSelectedWeek}
                    onFocusGoal={handleFocusGoal}
                  />
                </div>
              </div>
            )
          ) : !selectedGoal ? (
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

              <div className="shared-detail-year-overview">
                <h4>Year overview</h4>
                <SharedGoalYearGrid
                  goal={selectedGoal}
                  checkIns={checkIns}
                />
              </div>

              <div className="shared-detail-checkins">
                <h4>Check-ins {filterWeek !== '' && filterYear !== '' && `(Week ${filterWeek}, ${filterYear})`}</h4>
                {loadingCheckIns ? (
                  <p className="shared-loading">Loading check-ins...</p>
                ) : displayedCheckIns.length === 0 ? (
                  <p className="shared-empty-checkins">
                    {filterWeek !== '' && filterYear !== ''
                      ? `No check-ins for Week ${filterWeek}, ${filterYear}`
                      : 'No check-ins yet'}
                  </p>
                ) : (
                  <>
                  <div className="shared-checkins-list">
                    {visibleCheckIns.map((checkIn) => (
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
                  <div className="shared-checkins-actions">
                    {hasMoreCheckIns ? (
                      <button
                        className="btn-ghost shared-show-more"
                        onClick={() => setCheckInsVisibleCount((n) => n + 3)}
                      >
                        Show more ({displayedCheckIns.length - checkInsVisibleCount} more)
                      </button>
                    ) : checkInsVisibleCount > 3 ? (
                      <button
                        className="btn-ghost shared-show-more"
                        onClick={() => setCheckInsVisibleCount(3)}
                      >
                        Show less
                      </button>
                    ) : null}
                  </div>
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
