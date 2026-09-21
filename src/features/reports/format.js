/** A length of time in the most readable unit: "45 min", "2.5 h", "1.5 d". null (no data) reads "—". */
export function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return '—'
  if (seconds < 60) return `${Math.round(seconds)} s`
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`
  if (seconds < 86400) return `${trim(seconds / 3600)} h`
  return `${trim(seconds / 86400)} d`
}

function trim(value) {
  return String(Math.round(value * 10) / 10)
}

/** 0.5 -> "50%"; null (nothing to divide by) -> "—". */
export function formatPercent(ratio) {
  return ratio === null || ratio === undefined ? '—' : `${Math.round(ratio * 100)}%`
}

/** "2026-09-21" -> "21 Sep" (or "Week of 21 Sep"), parsed as a plain date so no time zone shifts it. */
export function formatBucket(date, granularity) {
  const [year, month, day] = date.split('-').map(Number)
  const label = new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' })
  return granularity === 'week' ? `Week of ${label}` : label
}

export const STATUS_LABELS = { open: 'Open', in_progress: 'In progress', resolved: 'Resolved', closed: 'Closed' }
export const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' }
export const AGEING_LABELS = {
  under_1_day: 'Under 1 day',
  '1_to_3_days': '1 to 3 days',
  '3_to_7_days': '3 to 7 days',
  over_7_days: 'Over 7 days',
}
