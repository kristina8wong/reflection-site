import { useState } from 'react'
import './CheckInModal.css'
import './WelcomeTutorial.css'

const STEPS = [
  {
    title: 'Welcome to Year Reflection',
    body: 'Track your yearly goals and weekly check-ins in one place. This quick tour will show you around.',
  },
  {
    title: 'Goals',
    body: 'Create goals for the year in the Goals tab. Add a title and optional description, then organize them by dragging to reorder.',
  },
  {
    title: 'Check-in',
    body: 'Each week, record how you\'re doing with a 1–5 rating and a short reflection. Use the Check-in tab to pick a week and update your progress.',
  },
  {
    title: 'Year View',
    body: 'See your progress at a glance. Each dot is a week—filled dots show check-ins. Click a dot to add or edit, or click a goal title to read its description.',
  },
  {
    title: 'Shared',
    body: 'Share goals with others so they can see your progress or help you stay accountable. Switch between viewing by user or by goal, and invite people via email.',
  },
  {
    title: 'You\'re all set',
    body: 'Use the menu (☰) to switch tabs. Click your name for Settings, Feedback, and more. Happy reflecting!',
  },
]

interface WelcomeTutorialProps {
  onComplete: () => void
}

export function WelcomeTutorial({ onComplete }: WelcomeTutorialProps) {
  const [step, setStep] = useState(0)
  const isFirst = step === 0
  const isLast = step === STEPS.length - 1
  const content = STEPS[step]

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onComplete()
    }
  }

  return (
    <div className="modal-backdrop tutorial-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content welcome-tutorial" onClick={(e) => e.stopPropagation()}>
        <div className="tutorial-progress">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`tutorial-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
              aria-hidden
            />
          ))}
        </div>
        <header className="modal-header tutorial-header">
          <h3>{content.title}</h3>
        </header>
        <div className="modal-body">
          <p className="tutorial-body">{content.body}</p>
        </div>
        <footer className="modal-footer tutorial-footer">
          <div className="tutorial-actions">
            {!isFirst ? (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </button>
            ) : (
              <span />
            )}
            {isLast ? (
              <button
                type="button"
                className="btn-primary"
                onClick={onComplete}
              >
                Get started
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary"
                onClick={() => setStep((s) => s + 1)}
              >
                Next
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}
