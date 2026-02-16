import type { Goal } from '../types'
import './CheckInModal.css'

interface GoalDescriptionModalProps {
  goal: Goal
  onClose: () => void
}

export function GoalDescriptionModal({ goal, onClose }: GoalDescriptionModalProps) {
  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content goal-description-modal">
        <header className="modal-header">
          <h3>{goal.title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
        <div className="modal-body">
          {goal.description?.trim() ? (
            <p className="modal-goal-desc">{goal.description}</p>
          ) : (
            <p className="modal-goal-desc muted">No description for this goal.</p>
          )}
        </div>
      </div>
    </div>
  )
}
