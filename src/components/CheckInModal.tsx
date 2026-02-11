import { useState, useEffect } from 'react'
import type { Goal, CheckIn } from '../types'
import { getCheckIn, saveOrUpdateCheckIn, deleteCheckIn } from '../storage'
import { formatWeekRange } from '../utils'
import './CheckInModal.css'

const RATING_LABELS: Record<number, string> = {
  1: 'Struggling',
  2: 'Slow progress',
  3: 'On track',
  4: 'Doing well',
  5: 'Thriving',
}

interface CheckInModalProps {
  goal: Goal
  weekNumber: number
  year: number
  onClose: () => void
  onSave: () => void
}

export function CheckInModal({
  goal,
  weekNumber,
  year,
  onClose,
  onSave,
}: CheckInModalProps) {
  const [reflection, setReflection] = useState('')
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5 | null>(null)

  useEffect(() => {
    const ci = getCheckIn(goal.id, weekNumber, year)
    setReflection(ci?.reflection ?? '')
    setRating(ci?.progressRating ?? null)
  }, [goal.id, weekNumber, year])

  function handleSave() {
    saveOrUpdateCheckIn(goal.id, weekNumber, year, reflection, rating)
    onSave()
    onClose()
  }

  function handleClear() {
    setReflection('')
    setRating(null)
    deleteCheckIn(goal.id, weekNumber, year)
    onSave()
    onClose()
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <header className="modal-header">
          <div>
            <h3>{goal.title}</h3>
            <p className="modal-week-label">
              Week {weekNumber} — {formatWeekRange(weekNumber, year)}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </header>

        <div className="modal-body">
          {goal.description && (
            <p className="modal-goal-desc">{goal.description}</p>
          )}

          <div className="modal-rating">
            <span className="rating-label">How's it going?</span>
            <div className="rating-buttons">
              {([1, 2, 3, 4, 5] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`rating-btn ${rating === n ? 'active' : ''}`}
                  onClick={() => setRating(rating === n ? null : n)}
                  title={`${n} – ${RATING_LABELS[n]}`}
                >
                  <span className="rating-num">{n}</span>
                  <span className="rating-desc">{RATING_LABELS[n]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="modal-reflection">
            <label>Reflection</label>
            <textarea
              placeholder="What happened this week? Any wins, setbacks, or insights?"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault()
                  handleSave()
                }
              }}
              className="modal-textarea"
              rows={6}
            />
          </div>
        </div>

        <footer className="modal-footer">
          <button className="btn-primary" onClick={handleSave}>
            Save
          </button>
          <button className="btn-ghost" onClick={handleClear}>
            Clear
          </button>
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </footer>
      </div>
    </div>
  )
}
