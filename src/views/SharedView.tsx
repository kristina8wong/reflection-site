import { useState, useEffect } from 'react'
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
  const [selectedGoal, setSelectedGoal] = useState<SharedGoal | null>(null)
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingCheckIns, setLoadingCheckIns] = useState(false)

  useEffect(() => {
    loadSharedGoals()
  }, [currentUser])

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

      <div className="shared-layout">
        <aside className="shared-sidebar">
          <h3>Shared Goals</h3>
          <ul className="shared-goals-list">
            {sharedGoals.map((goal) => (
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
