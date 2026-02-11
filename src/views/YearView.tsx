import { useState, useEffect, useRef } from 'react'
import type { Goal, CheckIn } from '../types'
import {
  getWeeksInYear,
  formatWeekRange,
  formatWeekRangeTiny,
  isFirstWeekOfMonth,
  getMonthSpans,
} from '../utils'
import { CheckInModal } from '../components/CheckInModal'
import { reorderGoals } from '../firestore-storage'
import './YearView.css'

const WEEK_CELL_WIDTH = 44
const CELL_GAP = 4
const BOX_SIZE = 24
const GOAL_LABEL_WIDTH = 180

interface YearViewProps {
  goals: Goal[]
  checkIns: CheckIn[]
  currentYear: number
  onRefresh?: () => void
}

export function YearView({
  goals,
  checkIns,
  currentYear,
  onRefresh,
}: YearViewProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const draggedIdRef = useRef<string | null>(null)
  const [, forceUpdate] = useState({})

  const yearGoals = goals
    .filter((g) => g.year === currentYear)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const totalWeeks = getWeeksInYear(currentYear)

  function handleBubbleClick(goal: Goal, week: number) {
    setSelectedGoal(goal)
    setSelectedWeek(week)
    setModalOpen(true)
  }

  function handleModalClose() {
    setModalOpen(false)
    setSelectedGoal(null)
    setSelectedWeek(null)
  }

  function handleModalSave() {
    if (onRefresh) onRefresh()
  }

  function handleDragStart(goalId: string) {
    console.log('handleDragStart:', goalId)
    draggedIdRef.current = goalId
    forceUpdate({})
  }

  async function handleDragOver(e: React.DragEvent, targetGoalId: string) {
    e.preventDefault()
    const draggedId = draggedIdRef.current
    console.log('handleDragOver - draggedId:', draggedId, 'targetGoalId:', targetGoalId)
    
    if (!draggedId || draggedId === targetGoalId) {
      console.log('Skipping - same goal or no draggedId')
      return
    }

    console.log('Setting dragOverId to:', targetGoalId)
    setDragOverId(targetGoalId)

    const draggedIndex = yearGoals.findIndex((g) => g.id === draggedId)
    const targetIndex = yearGoals.findIndex((g) => g.id === targetGoalId)
    if (draggedIndex === -1 || targetIndex === -1) return

    const reordered = [...yearGoals]
    const [removed] = reordered.splice(draggedIndex, 1)
    reordered.splice(targetIndex, 0, removed)

    await reorderGoals(reordered.map((g) => g.id))
    // Don't refresh during drag - wait until drag ends
  }

  function handleDragEnd() {
    console.log('handleDragEnd called, draggedId:', draggedIdRef.current)
    // Clear dragged state first
    draggedIdRef.current = null
    setDragOverId(null)
    forceUpdate({})
    // Then refresh to get updated order
    if (onRefresh) {
      console.log('Calling onRefresh after drag end')
      onRefresh()
    }
  }

  function getCheckInForGoalWeek(goalId: string, week: number): CheckIn | undefined {
    return checkIns.find(
      (c) => c.goalId === goalId && c.weekNumber === week && c.year === currentYear
    )
  }

  function avgRatingForGoal(goalId: string): number | null {
    const goalCheckIns = checkIns.filter(
      (c) => c.goalId === goalId && c.year === currentYear && c.progressRating != null
    )
    if (goalCheckIns.length === 0) return null
    const sum = goalCheckIns.reduce((a, c) => a + (c.progressRating ?? 0), 0)
    return Math.round((sum / goalCheckIns.length) * 10) / 10
  }

  if (yearGoals.length === 0) {
    return (
      <div className="year-empty">
        <h2>Year Overview</h2>
        <p>Add goals to see your progress across the year.</p>
      </div>
    )
  }

  const monthSpans = getMonthSpans(currentYear, totalWeeks)

  return (
    <div className="year-view">
      <header className="year-header">
        <h2>Year Overview — {currentYear}</h2>
        <p className="muted">
          Your goals and how often you&apos;ve checked in. Each dot is a week.
        </p>
      </header>

      <div
        className="year-timeline"
        style={{
          gridTemplateColumns: `${GOAL_LABEL_WIDTH}px repeat(${totalWeeks}, ${WEEK_CELL_WIDTH}px)`,
          gap: `${CELL_GAP}px`,
        }}
      >
        {/* Month row - centered above weeks of each month */}
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

        {/* Date row */}
        <div className="year-grid-spacer year-date-spacer" />
        {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => (
          <div
            key={week}
            className={`year-date-cell ${isFirstWeekOfMonth(week, currentYear) ? 'month-start' : ''}`}
            style={{ gridRow: 2, gridColumn: week + 1 }}
            title={formatWeekRange(week, currentYear)}
          >
            {formatWeekRangeTiny(week, currentYear)}
          </div>
        ))}

        {/* Goal rows - bubbles aligned */}
        {yearGoals.map((goal, rowIndex) => {
          const avg = avgRatingForGoal(goal.id)
          const gridRow = 3 + rowIndex
          const draggedId = draggedIdRef.current
          const isBeingDragged = draggedId === goal.id
          const showDropIndicator = dragOverId === goal.id && draggedId !== goal.id
          if (isBeingDragged) {
            console.log('Goal is being dragged:', goal.id, 'draggedId:', draggedId)
          }
          if (showDropIndicator) {
            console.log('Drop indicator should show for goal:', goal.id, 'at gridRow:', gridRow)
          }
          return (
            <>
              {/* Drop indicator line - appears above the target row */}
              {showDropIndicator && (
                <div
                  key={`drop-${goal.id}`}
                  className="year-drop-indicator"
                  style={{ 
                    gridRow: gridRow,
                    gridColumn: `1 / span ${totalWeeks + 1}`,
                  }}
                />
              )}
              <div
                key={`goal-${goal.id}`}
                className={`year-goal-info ${isBeingDragged ? 'dragging' : ''}`}
                style={{ gridRow, gridColumn: 1 }}
                draggable={true}
                onDragStart={() => handleDragStart(goal.id)}
                onDragOver={(e) => handleDragOver(e, goal.id)}
                onDragEnd={handleDragEnd}
              >
                <h3>{goal.title}</h3>
                {avg != null && (
                  <span className="avg-rating">Avg: {avg}/5</span>
                )}
              </div>
              {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(
                (week) => {
                  const ci = getCheckInForGoalWeek(goal.id, week)
                  const hasReflection = ci && ci.reflection.trim().length > 0
                  const hasRating = ci && ci.progressRating != null
                  const filled = hasReflection || hasRating

                  return (
                    <div
                      key={`${goal.id}-${week}`}
                      className={`year-bubble-cell ${isFirstWeekOfMonth(week, currentYear) ? 'month-start' : ''} ${isBeingDragged ? 'dragging' : ''}`}
                      style={{ gridRow: gridRow, gridColumn: week + 1 }}
                      title={formatWeekRange(week, currentYear)}
                    >
                      <button
                        className={`week-dot ${filled ? 'filled' : ''}`}
                        style={{ width: BOX_SIZE, height: BOX_SIZE, minWidth: BOX_SIZE }}
                        onClick={() => handleBubbleClick(goal, week)}
                      >
                        {filled
                          ? hasRating
                            ? ci!.progressRating
                            : '•'
                          : null}
                      </button>
                    </div>
                  )
                }
              )}
            </>
          )
        })}
      </div>

      <div className="year-legend">
        <span className="legend-item">
          <span className="week-dot filled" /> Check-in completed
        </span>
        <span className="legend-item">
          <span className="week-dot" /> Not yet
        </span>
      </div>

      {modalOpen && selectedGoal && selectedWeek && (
        <CheckInModal
          goal={selectedGoal}
          weekNumber={selectedWeek}
          year={currentYear}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </div>
  )
}
