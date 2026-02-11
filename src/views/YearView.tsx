import type { Goal, CheckIn } from '../types'
import {
  getWeeksInYear,
  formatWeekRange,
  formatWeekRangeTiny,
  isFirstWeekOfMonth,
  getMonthSpans,
} from '../utils'
import './YearView.css'

const WEEK_CELL_WIDTH = 44
const CELL_GAP = 4
const BOX_SIZE = 24
const GOAL_LABEL_WIDTH = 180

interface YearViewProps {
  goals: Goal[]
  checkIns: CheckIn[]
  currentYear: number
}

export function YearView({
  goals,
  checkIns,
  currentYear,
}: YearViewProps) {
  const yearGoals = goals.filter((g) => g.year === currentYear)
  const totalWeeks = getWeeksInYear(currentYear)

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
          return (
            <div key={goal.id} className="year-goal-row">
              <div
                className="year-goal-info"
                style={{ gridRow, gridColumn: 1 }}
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
                      key={week}
                      className={`year-bubble-cell ${isFirstWeekOfMonth(week, currentYear) ? 'month-start' : ''}`}
                      style={{ gridRow: gridRow, gridColumn: week + 1 }}
                      title={formatWeekRange(week, currentYear)}
                    >
                      <div
                        className={`week-dot ${filled ? 'filled' : ''}`}
                        style={{ width: BOX_SIZE, height: BOX_SIZE, minWidth: BOX_SIZE }}
                      >
                        {filled
                          ? hasRating
                            ? ci!.progressRating
                            : '•'
                          : null}
                      </div>
                    </div>
                  )
                }
              )}
            </div>
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
    </div>
  )
}
