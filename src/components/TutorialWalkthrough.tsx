import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTutorial, TUTORIAL_STEPS } from '../contexts/TutorialContext'
import './TutorialWalkthrough.css'

export function TutorialWalkthrough() {
  const { step, advance, complete, isActive } = useTutorial()
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  const current = TUTORIAL_STEPS[step]
  const isLast = step === TUTORIAL_STEPS.length - 1

  useEffect(() => {
    if (!isActive || !current) return

    const el = document.querySelector(`[data-tutorial-target="${current.id}"]`)
    if (el) {
      const updateRect = () => {
        setTargetRect(el.getBoundingClientRect())
      }
      updateRect()
      const ro = new ResizeObserver(updateRect)
      ro.observe(el)
      const scrollParents = document.querySelectorAll('.app-main, .shared-content, .year-timeline')
      scrollParents.forEach((p) => p.addEventListener('scroll', updateRect))
      return () => {
        ro.disconnect()
        scrollParents.forEach((p) => p.removeEventListener('scroll', updateRect))
      }
    }
    setTargetRect(null)
  }, [isActive, step, current?.id])

  if (!isActive || !current) return null

  const el = document.querySelector(`[data-tutorial-target="${current.id}"]`)

  const overlay = (
    <div className="tutorial-overlay" aria-live="polite">
      {targetRect && (
        <>
          <div
            className="tutorial-highlight"
            style={{
              top: targetRect.top - 2,
              left: targetRect.left - 2,
              width: targetRect.width + 4,
              height: targetRect.height + 4,
            }}
          />
          <div
            className="tutorial-spotlight"
            style={{
              top: 0,
              left: 0,
              right: 0,
              height: targetRect.top,
            }}
          />
          <div
            className="tutorial-spotlight"
            style={{
              top: targetRect.top,
              left: 0,
              width: targetRect.left,
              height: targetRect.height,
            }}
          />
          <div
            className="tutorial-spotlight"
            style={{
              top: targetRect.top,
              left: targetRect.right,
              right: 0,
              height: targetRect.height,
            }}
          />
          <div
            className="tutorial-spotlight"
            style={{
              top: targetRect.bottom,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
        </>
      )}

      <div
        className="tutorial-popover"
        style={
          targetRect
            ? {
                top: targetRect.bottom + 12,
                left: Math.min(
                  Math.max(targetRect.left, 16),
                  window.innerWidth - 280
                ),
              }
            : undefined
        }
      >
        <div className="tutorial-arrow" />
        <p className="tutorial-message">{current.message}</p>
        <div className="tutorial-actions">
          {current.waitForClick ? (
            <button
              type="button"
              className="tutorial-skip"
              onClick={complete}
            >
              Skip
            </button>
          ) : (
            <>
              <button
                type="button"
                className="tutorial-skip"
                onClick={complete}
              >
                Skip
              </button>
              <button
                type="button"
                className="tutorial-next"
                onClick={() => (isLast ? complete() : advance())}
              >
                {isLast ? 'Get started' : 'Next'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(overlay, document.body)
}
