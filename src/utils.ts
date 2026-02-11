import { getWeek, getISOWeeksInYear } from 'date-fns'

export function getWeekOfYear(date: Date = new Date()): number {
  return getWeek(date, { weekStartsOn: 1 })
}

export function getWeeksInYear(year: number): number {
  // Use a date in the middle of the year to get correct ISO week count
  const midYear = new Date(year, 6, 1) // July 1
  return getISOWeeksInYear(midYear)
}

export function getWeekStartDate(weekNumber: number, year: number): Date {
  const jan1 = new Date(year, 0, 1)
  const dayOfWeek = jan1.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const firstMonday = new Date(jan1)
  firstMonday.setDate(jan1.getDate() + mondayOffset)
  const weekStart = new Date(firstMonday)
  weekStart.setDate(firstMonday.getDate() + (weekNumber - 1) * 7)
  return weekStart
}

export function formatWeekRange(weekNumber: number, year: number): string {
  const start = getWeekStartDate(weekNumber, year)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}, ${year}`
}

export function formatWeekRangeShort(weekNumber: number, year: number): string {
  const start = getWeekStartDate(weekNumber, year)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const sameMonth = start.getMonth() === end.getMonth()
  const startFmt = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const endFmt = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return sameMonth ? `${startFmt}–${end.getDate()}` : `${startFmt} – ${endFmt}`
}

/** Compact week range for small cells: "1/6-12" or "12/30-1/5" */
export function formatWeekRangeTiny(weekNumber: number, year: number): string {
  const start = getWeekStartDate(weekNumber, year)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const sm = start.getMonth() + 1
  const sd = start.getDate()
  const em = end.getMonth() + 1
  const ed = end.getDate()
  if (sm === em) {
    return `${sm}/${sd}-${ed}`
  }
  return `${sm}/${sd}-${em}/${ed}`
}

export function getMonthForWeek(weekNumber: number, year: number): number {
  return getWeekStartDate(weekNumber, year).getMonth()
}

export function isFirstWeekOfMonth(weekNumber: number, year: number): boolean {
  if (weekNumber === 1) return true
  return getMonthForWeek(weekNumber, year) !== getMonthForWeek(weekNumber - 1, year)
}

export function getMonthLabel(weekNumber: number, year: number): string {
  const date = getWeekStartDate(weekNumber, year)
  return date.toLocaleDateString('en-US', { month: 'short' })
}

export interface MonthSpan {
  month: number
  label: string
  startWeek: number
  endWeek: number
  weekCount: number
  startCol: number // 1-based grid column (after spacer)
}

export function getMonthSpans(year: number, totalWeeks: number): MonthSpan[] {
  const spans: MonthSpan[] = []
  let currentMonth = -1
  let startWeek = 1

  for (let week = 1; week <= totalWeeks; week++) {
    const month = getMonthForWeek(week, year)
    if (month !== currentMonth) {
      if (currentMonth >= 0) {
        const date = getWeekStartDate(startWeek, year)
        const weekCount = week - startWeek
        spans.push({
          month: currentMonth,
          label: date.toLocaleDateString('en-US', { month: 'short' }),
          startWeek,
          endWeek: week - 1,
          weekCount,
          startCol: spans.reduce((sum, s) => sum + s.weekCount, 0) + 1,
        })
      }
      currentMonth = month
      startWeek = week
    }
  }
  if (currentMonth >= 0) {
    const date = getWeekStartDate(startWeek, year)
    const weekCount = totalWeeks - startWeek + 1
    spans.push({
      month: currentMonth,
      label: date.toLocaleDateString('en-US', { month: 'short' }),
      startWeek,
      endWeek: totalWeeks,
      weekCount,
      startCol: spans.reduce((sum, s) => sum + s.weekCount, 0) + 1,
    })
  }
  return spans
}
