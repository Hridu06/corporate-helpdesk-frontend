import { axiosClient } from '../../api/axiosClient'
import { listTickets } from '../../features/tickets/ticketsApi'

const STATUSES = ['open', 'in_progress', 'resolved', 'closed']

/** Reports cover the selected creation period. Other roles use their own API-scoped totals. */
export async function fetchDashboardSummary({ canReport, canViewTickets, days }, signal) {
  if (canReport) {
    const [breakdown, timeline] = await Promise.all([
      axiosClient.get('/reports/breakdown', { params: { days }, signal }),
      axiosClient.get('/reports/timeline', { params: { days }, signal }),
    ])
    return {
      counts: Object.fromEntries(breakdown.data.data.status.map(({ key, count }) => [key, count])),
      priority: breakdown.data.data.priority,
      departments: breakdown.data.data.departments,
      timeline: timeline.data.data,
      range: breakdown.data.range,
    }
  }

  if (!canViewTickets) return null
  const results = await Promise.all(STATUSES.map((status) => listTickets({ status, page: 1, perPage: 1 }, signal)))
  return { counts: Object.fromEntries(STATUSES.map((status, index) => [status, results[index].meta.total])) }
}

export async function fetchRecentTickets(signal) {
  const response = await listTickets({ page: 1, perPage: 5 }, signal)
  return response.data
}
