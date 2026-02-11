import { useState, useEffect } from 'react'
import type { Goal } from '../types'
import { getCheckIn, saveOrUpdateCheckIn, deleteCheckIn, reorderGoals } from '../storage'
import { getWeekOfYear, getWeeksInYear, formatWeekRange } from '../utils'
import './GoalsView.css'
import './CheckInView.css'

const RATING_LABELS: Record<number, string> = {
  1: 'Struggling',
  2: 'Slow progress',
  3: 'On track',
  4: 'Doing well',
  5: 'Thriving',
}

const REFLECTION_PROMPT = 'What happened this week? Any wins, setbacks, or insights?'

interface CheckInViewProps {
  goals: Goal[]
  currentYear: number
  onRefresh: () => void
}

export function CheckInView({
  goals,
  currentYear,
  onRefresh,
}: CheckInViewProps) {
  const year = currentYear
  const totalWeeks = getWeeksInYear(year)
  const currentWeek = getWeekOfYear(new Date())

  const [selectedWeek, setSelectedWeek] = useState(currentWeek)
  const [reflections, setReflections] = useState<Record<string, string>>({})
  const [ratings, setRatings] = useState<Record<string, 1 | 2 | 3 | 4 | 5 | null>>({})
  const [editingCheckInId, setEditingCheckInId] = useState<string | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const yearGoals = goals
    .filter((g) => g.year === year)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  useEffect(() => {
    setSelectedWeek((w) => Math.min(w, totalWeeks))
  }, [year, totalWeeks])

  const goalIds = yearGoals.map((g) => g.id).sort().join(',')
  useEffect(() => {
    const init: Record<string, string> = {}
    const initRatings: Record<string, 1 | 2 | 3 | 4 | 5 | null> = {}
    yearGoals.forEach((g) => {
      const ci = getCheckIn(g.id, selectedWeek, year)
      init[g.id] = ci?.reflection ?? ''
      initRatings[g.id] = ci?.progressRating ?? null
    })
    setReflections(init)
    setRatings(initRatings)
  }, [selectedWeek, year, goalIds])

  const pendingGoals = yearGoals.filter((g) => !getCheckIn(g.id, selectedWeek, year))
  const completedGoals = yearGoals.filter((g) => getCheckIn(g.id, selectedWeek, year))
  const sortedGoals = [...pendingGoals, ...completedGoals]

  // Progress: rating = 20%, reflection = 80% per goal. Updates when saved.
  const progressPercent = (() => {
    if (yearGoals.length === 0) return 0
    let total = 0
    yearGoals.forEach((g) => {
      const ci = getCheckIn(g.id, selectedWeek, year)
      let goalProgress = 0
      if (ci) {
        if (ci.progressRating != null) goalProgress += 20
        if (ci.reflection?.trim()) goalProgress += 80
      }
      total += goalProgress
    })
    return Math.round(total / yearGoals.length)
  })()

  function handleReflectionChange(goalId: string, value: string) {
    setReflections((r) => ({ ...r, [goalId]: value }))
  }

  function handleRatingChange(goalId: string, value: 1 | 2 | 3 | 4 | 5 | null) {
    setRatings((r) => ({ ...r, [goalId]: value }))
  }

  function handleSaveGoal(goalId: string) {
    saveOrUpdateCheckIn(
      goalId,
      selectedWeek,
      year,
      reflections[goalId] ?? '',
      ratings[goalId] ?? null
    )
    setEditingCheckInId(null)
    onRefresh()
  }

  function handleEditCheckIn(goalId: string) {
    setEditingCheckInId(goalId)
  }

  function handleClearCheckIn(goalId: string) {
    setReflections((r) => ({ ...r, [goalId]: '' }))
    setRatings((r) => ({ ...r, [goalId]: null }))
    deleteCheckIn(goalId, selectedWeek, year)
    setEditingCheckInId(null)
    onRefresh()
  }

  function handleDragStart(goalId: string) {
    setDraggedId(goalId)
  }

  function handleDragOver(e: React.DragEvent, targetGoalId: string) {
    e.preventDefault()
    if (!draggedId || draggedId === targetGoalId) return

    const draggedIndex = sortedGoals.findIndex((g) => g.id === draggedId)
    const targetIndex = sortedGoals.findIndex((g) => g.id === targetGoalId)
    if (draggedIndex === -1 || targetIndex === -1) return

    const reordered = [...sortedGoals]
    const [removed] = reordered.splice(draggedIndex, 1)
    reordered.splice(targetIndex, 0, removed)

    reorderGoals(reordered.map((g) => g.id))
    onRefresh()
  }

  function handleDragEnd() {
    setDraggedId(null)
  }

  if (yearGoals.length === 0) {
    return (
      <div className="goals-view checkin-empty-state">
        <h2>Weekly Check-in</h2>
        <p className="muted">Add goals first in the Goals tab, then come back here for weekly reflections.</p>
      </div>
    )
  }

  return (
    <div className="goals-view checkin-view">
      <section className="goals-intro">
        <div className="checkin-progress-bar">
          <div
            className="checkin-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="checkin-progress-label">{progressPercent}% complete</span>
        <h2>Weekly Check-in — {year}</h2>
        <div className="week-selector">
          <button
            className="week-nav"
            onClick={() => setSelectedWeek((w) => Math.max(1, w - 1))}
            disabled={selectedWeek <= 1}
            title="Previous week"
          >
            ← Previous
          </button>
          <span className="week-label">
            Week {selectedWeek} of {totalWeeks}
          </span>
          <button
            className="week-nav"
            onClick={() => setSelectedWeek((w) => Math.min(totalWeeks, w + 1))}
            disabled={selectedWeek >= totalWeeks}
            title="Next week"
          >
            Next →
          </button>
        </div>
        <p className="week-range muted">{formatWeekRange(selectedWeek, year)}</p>
      </section>

      <ul className="goal-list">
        {sortedGoals.map((goal) => {
          const isEditingCheckIn = editingCheckInId === goal.id
          const isPending = !getCheckIn(goal.id, selectedWeek, year)
          const showCheckInForm = isPending || isEditingCheckIn

          return (
            <li
              key={goal.id}
              className={`goal-card checkin-card ${isPending ? 'checkin-card-pending' : 'checkin-card-completed'} ${draggedId === goal.id ? 'dragging' : ''}`}
              draggable={true}
              onDragStart={() => handleDragStart(goal.id)}
              onDragOver={(e) => handleDragOver(e, goal.id)}
              onDragEnd={handleDragEnd}
            >
              <div className="goal-content checkin-goal-content">
                <h3>{goal.title}</h3>
                {goal.description && (
                  <p className="goal-desc">{goal.description}</p>
                )}

                {showCheckInForm ? (
                  <div className="checkin-form">
                    <div className="progress-rating">
                      <span className="rating-label">How's it going?</span>
                      <div className="rating-buttons">
                        {([1, 2, 3, 4, 5] as const).map((n) => (
                          <button
                            key={n}
                            type="button"
                            className={`rating-btn ${ratings[goal.id] === n ? 'active' : ''}`}
                            onClick={() =>
                              handleRatingChange(
                                goal.id,
                                ratings[goal.id] === n ? null : n
                              )
                            }
                            title={`${n} – ${RATING_LABELS[n]}`}
                          >
                            <span className="rating-num">{n}</span>
                            <span className="rating-desc">{RATING_LABELS[n]}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="reflection-field">
                      <label>Reflection</label>
                      <textarea
                        placeholder={REFLECTION_PROMPT}
                        value={reflections[goal.id] ?? ''}
                        onChange={(e) =>
                          handleReflectionChange(goal.id, e.target.value)
                        }
                        onKeyDown={(e) => {
                          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                            e.preventDefault()
                            handleSaveGoal(goal.id)
                          }
                        }}
                        className="goal-textarea reflection-textarea"
                        rows={4}
                      />
                    </div>

                    <div className="checkin-form-actions">
                      <button
                        className="btn-primary btn-save-goal"
                        onClick={() => handleSaveGoal(goal.id)}
                      >
                        Save
                      </button>
                      {isEditingCheckIn && (
                        <button
                          className="btn-ghost"
                          onClick={() => setEditingCheckInId(null)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="checkin-summary">
                    {(() => {
                      const ci = getCheckIn(goal.id, selectedWeek, year)!
                      return (
                        <>
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
                              <span className="rating-label-saved">
                                {RATING_LABELS[ci.progressRating]}
                              </span>
                            </div>
                          )}
                          {ci.reflection && (
                            <p className="reflection-preview muted">{ci.reflection}</p>
                          )}
                        </>
                      )
                    })()}
                  </div>
                )}
              </div>
              <div className="goal-actions">
                {!showCheckInForm && (
                  <button
                    className="btn-ghost btn-sm"
                    onClick={() => handleEditCheckIn(goal.id)}
                  >
                    Edit
                  </button>
                )}
                <button
                  className="btn-ghost btn-sm btn-danger"
                  onClick={() => handleClearCheckIn(goal.id)}
                >
                  Clear
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
