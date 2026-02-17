import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTutorial, TUTORIAL_STEPS } from '../contexts/TutorialContext'
import './TutorialWalkthrough.css'

interface TutorialWalkthroughProps {
  navOpen?: boolean
  hamburgerVisible?: boolean
  hasYearGoals?: boolean
}

export function TutorialWalkthrough({ navOpen = false, hamburgerVisible = false, hasYearGoals = true }: TutorialWalkthroughProps) {
  const { step, advance, advanceBy, complete, isActive, goalWasAdded } = useTutorial()
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  const current = TUTORIAL_STEPS[step]
  // On checkin-tab, year-tab, or shared-tab step in hamburger view: show hamburger first if menu is closed
  const checkinNeedsMenuFirst = current?.id === 'checkin-tab' && hamburgerVisible && !navOpen
  const yearTabNeedsMenuFirst = current?.id === 'year-tab' && hamburgerVisible && !navOpen
  const sharedTabNeedsMenuFirst = current?.id === 'shared-tab' && hamburgerVisible && !navOpen
  const needsMenuFirst = checkinNeedsMenuFirst || yearTabNeedsMenuFirst || sharedTabNeedsMenuFirst
  const effectiveTargetId = needsMenuFirst
    ? 'menu-btn'
    : !hasYearGoals && (current?.id === 'checkin-week-nav' || current?.id === 'checkin-added')
      ? 'checkin-empty-state'
      : !hasYearGoals && current?.id === 'year-grid'
        ? 'year-empty'
        : current?.id === 'checkin-week-nav' || current?.id === 'checkin-added'
          ? 'checkin-main-card'
          : current?.id ?? ''
  const effectiveMessage = checkinNeedsMenuFirst
    ? 'Open the menu, then click Check-in.'
    : yearTabNeedsMenuFirst
      ? 'Open the menu, then click Year View.'
      : sharedTabNeedsMenuFirst
        ? 'Open the menu, then click Shared.'
        : current?.id === 'goal-added'
          ? (goalWasAdded ?? false)
            ? "Nice! Your goal was added. Click Next to continue."
            : "You can add goals anytime. Click Next to continue."
          : !hasYearGoals && (current?.id === 'checkin-week-nav' || current?.id === 'checkin-added')
            ? "Add goals in the Goals tab first — then you can add check-ins here. Click Next to continue."
            : !hasYearGoals && current?.id === 'year-grid'
              ? "Add goals to see your progress across the year. Click Next to continue."
              : !hasYearGoals && current?.id === 'shared-view'
                ? "This is where goals shared with you appear. Add your own goals from the Goals tab to share them. Click Next to continue."
                : current?.message ?? ''
  const isLast = step === TUTORIAL_STEPS.length - 1

  // Auto-skip menu-btn step when hamburger is hidden (e.g. wide screen)
  useEffect(() => {
    if (!isActive || step !== 0) return
    const el = document.querySelector('[data-tutorial-target="menu-btn"]')
    if (el) {
      const style = window.getComputedStyle(el)
      if (style.display === 'none' || style.visibility === 'hidden') {
        advance()
      }
    }
  }, [isActive, step, advance])

  useEffect(() => {
    if (!isActive || !current) return

    const el = document.querySelector(`[data-tutorial-target="${effectiveTargetId}"]`)
    if (el) {
      const updateRect = () => {
        setTargetRect(el.getBoundingClientRect())
      }
      // Defer initial read to next frame so layout has settled (fixes misaligned highlights)
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(updateRect)
      })
      // Re-measure after a delay to catch layout changes (e.g. modals closing)
      const timeout = setTimeout(updateRect, 150)
      const ro = new ResizeObserver(updateRect)
      ro.observe(el)
      const scrollParents = document.querySelectorAll('.app-main, .shared-content, .year-timeline, .nav-tabs, .app-header, .modal-content, .goals-view, .year-empty')
      scrollParents.forEach((p) => p.addEventListener('scroll', updateRect))
      const onResize = () => updateRect()
      window.addEventListener('resize', onResize)
      const onScroll = () => updateRect()
      window.addEventListener('scroll', onScroll, true)
      return () => {
        cancelAnimationFrame(raf)
        clearTimeout(timeout)
        ro.disconnect()
        scrollParents.forEach((p) => p.removeEventListener('scroll', updateRect))
        window.removeEventListener('resize', onResize)
        window.removeEventListener('scroll', onScroll, true)
      }
    }
    setTargetRect(null)
  }, [isActive, step, current?.id, effectiveTargetId, navOpen, hamburgerVisible])

  if (!isActive || !current) return null

  // When check-in modal is open, hide tutorial overlay so user can interact with modal
  if (current.id === 'checkin-modal') return null

  const POPOVER_WIDTH = 280
  const POPOVER_HEIGHT_EST = 150
  const MARGIN = 16

  let popoverTop: number | undefined
  let popoverLeft: number | undefined
  let arrowLeft: number | undefined
  let popoverAbove = false
  let popoverLeftOfTarget = false
  let popoverRightOfTarget = false
  let arrowTop: number | undefined

  // shared-view: position on right; when target exists, place under/to the right of it
  if (current.id === 'shared-view') {
    if (targetRect) {
      const overlap = POPOVER_WIDTH * 0.5
      popoverLeft = targetRect.right - overlap
      popoverTop = targetRect.bottom - POPOVER_HEIGHT_EST + 24
      popoverLeft = Math.max(MARGIN, Math.min(popoverLeft, window.innerWidth - POPOVER_WIDTH - MARGIN))
      popoverTop = Math.max(MARGIN, Math.min(popoverTop, window.innerHeight - POPOVER_HEIGHT_EST - MARGIN))
      arrowTop = targetRect.top + targetRect.height / 2 - (popoverTop ?? 0) - 7
    } else {
      popoverLeft = window.innerWidth - POPOVER_WIDTH - MARGIN
      popoverTop = Math.max(
        MARGIN,
        Math.min(
          (window.innerHeight - POPOVER_HEIGHT_EST) / 2,
          window.innerHeight - POPOVER_HEIGHT_EST - MARGIN
        )
      )
      arrowTop = (POPOVER_HEIGHT_EST / 2) - 7
    }
    popoverRightOfTarget = true
    arrowLeft = 7
  } else if (targetRect) {
    const targetCenterX = targetRect.left + targetRect.width / 2
    const isEmptyStateTarget =
      effectiveTargetId === 'checkin-empty-state' || effectiveTargetId === 'year-empty'

    if (isEmptyStateTarget || current.id === 'checkin-week-nav' || current.id === 'checkin-added') {
      // Place popover to slightly overlap the main card (bottom-right)
      const overlap = POPOVER_WIDTH * 0.5
      popoverLeft = targetRect.right - overlap
      popoverTop = targetRect.bottom - POPOVER_HEIGHT_EST + 24
      popoverLeft = Math.max(MARGIN, Math.min(popoverLeft, window.innerWidth - POPOVER_WIDTH - MARGIN))
      popoverTop = Math.max(MARGIN, Math.min(popoverTop, window.innerHeight - POPOVER_HEIGHT_EST - MARGIN))
      popoverRightOfTarget = true
      arrowLeft = 7
      arrowTop = targetRect.top + targetRect.height / 2 - (popoverTop ?? 0) - 7
    } else if (current.id === 'year-grid') {
      // Place on right side of screen, arrow pointing left at the grid/cells
      popoverLeft = window.innerWidth - POPOVER_WIDTH - MARGIN
      popoverTop = Math.max(
        MARGIN,
        Math.min(
          targetRect.top + targetRect.height / 2 - POPOVER_HEIGHT_EST / 2,
          window.innerHeight - POPOVER_HEIGHT_EST - MARGIN
        )
      )
      popoverRightOfTarget = true
      arrowTop =
        targetRect.top + targetRect.height / 2 - (popoverTop ?? 0) - 7
      arrowLeft = 7
    } else if (current.id === 'user-menu') {
      // Place to the LEFT of the button so dropdown can open below without being covered
      const leftPosition = targetRect.left - POPOVER_WIDTH - 12
      if (leftPosition >= MARGIN) {
        popoverLeft = leftPosition
        popoverLeftOfTarget = true
        popoverTop = Math.max(
          MARGIN,
          Math.min(
            targetRect.top + targetRect.height / 2 - POPOVER_HEIGHT_EST / 2,
            window.innerHeight - POPOVER_HEIGHT_EST - MARGIN
          )
        )
        popoverAbove = false
        arrowTop =
          targetRect.top + targetRect.height / 2 - (popoverTop ?? 0) - 7
      } else {
        popoverLeft = Math.max(MARGIN, targetRect.left)
        const fitsAbove =
          targetRect.top - 12 - POPOVER_HEIGHT_EST >= MARGIN
        if (fitsAbove) {
          popoverTop = targetRect.top - 12 - POPOVER_HEIGHT_EST
          popoverAbove = true
        } else {
          popoverTop = Math.max(
            MARGIN,
            Math.min(
              targetRect.bottom + 12,
              window.innerHeight - POPOVER_HEIGHT_EST - MARGIN
            )
          )
        }
        arrowLeft = Math.max(
          12,
          Math.min(POPOVER_WIDTH - 12, targetCenterX - popoverLeft - 7)
        )
      }
    } else {
      popoverLeft = Math.max(
        MARGIN,
        Math.min(targetRect.left, window.innerWidth - POPOVER_WIDTH - MARGIN)
      )
      const fitsBelow =
        targetRect.bottom + 12 + POPOVER_HEIGHT_EST <=
        window.innerHeight - MARGIN
      const fitsAbove =
        targetRect.top - 12 - POPOVER_HEIGHT_EST >= MARGIN

      if (fitsBelow) {
        popoverTop = targetRect.bottom + 12
      } else if (fitsAbove) {
        popoverTop = targetRect.top - 12 - POPOVER_HEIGHT_EST
        popoverAbove = true
      } else {
        popoverTop = Math.max(
          MARGIN,
          Math.min(
            targetRect.bottom + 12,
            window.innerHeight - MARGIN - POPOVER_HEIGHT_EST
          )
        )
      }

      arrowLeft = Math.max(
        12,
        Math.min(POPOVER_WIDTH - 12, targetCenterX - popoverLeft - 7)
      )
    }
  }

  const overlay = (
    <div className="tutorial-overlay" aria-live="polite">
      {targetRect && (
        <div
          className="tutorial-highlight"
          style={{
            top: targetRect.top - 2,
            left: targetRect.left - 2,
            width: targetRect.width + 4,
            height: targetRect.height + 4,
          }}
        />
      )}

      <div
        className={`tutorial-popover ${popoverAbove ? 'tutorial-popover-above' : ''} ${popoverLeftOfTarget ? 'tutorial-popover-left-of-target' : ''} ${popoverRightOfTarget ? 'tutorial-popover-right-of-target' : ''}`}
        style={
          popoverTop != null && popoverLeft != null
            ? {
                top: popoverTop,
                left: popoverLeft,
                ['--arrow-left' as string]: arrowLeft != null ? `${arrowLeft}px` : '24px',
                ...(arrowTop != null && {
                  ['--arrow-top' as string]: `${Math.max(14, Math.min(POPOVER_HEIGHT_EST - 14, arrowTop))}px`,
                }),
              }
            : undefined
        }
      >
        <div className="tutorial-arrow" />
        <p className="tutorial-message">{effectiveMessage}</p>
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
                onClick={() => {
                  if (isLast) {
                    complete()
                  } else if (!hasYearGoals && (current?.id === 'checkin-week-nav' || current?.id === 'year-grid') && advanceBy) {
                    advanceBy(2)
                  } else {
                    advance()
                  }
                }}
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
