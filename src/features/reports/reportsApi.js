import { axiosClient } from '../../api/axiosClient'

// Every figure is computed by the backend, which also enforces `report.view`; the UI only draws them.

const SECTIONS = ['overview', 'timeline', 'breakdown', 'agents']

/**
 * Loads the four report sections for one period. `days` (a preset such as 30) or an explicit
 * `from`/`to` (YYYY-MM-DD) picks the period; `departmentId` is '' (all), 'none' or an id.
 * Resolves to { range, overview, timeline, breakdown, agents }.
 */
export async function fetchReports({ days, from, to, departmentId }, signal) {
  const params = {
    days: days || undefined,
    from: from || undefined,
    to: to || undefined,
    department_id: departmentId || undefined,
  }

  const [overview, timeline, breakdown, agents] = await Promise.all(
    SECTIONS.map((section) => axiosClient.get(`/reports/${section}`, { params, signal }).then((response) => response.data)),
  )

  return {
    range: overview.range,
    overview: overview.data,
    timeline: timeline.data,
    breakdown: breakdown.data,
    agents: agents.data,
  }
}

/**
 * Departments for the filter: { departments: [{ id, name }] }. It has its own endpoint because
 * the "new ticket" list needs a permission that people who read reports may not have.
 */
export async function fetchReportOptions() {
  const { data } = await axiosClient.get('/reports/options')
  return data
}
