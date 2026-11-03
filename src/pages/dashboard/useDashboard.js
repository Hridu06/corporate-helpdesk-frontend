import { useEffect, useState } from 'react'
import { fetchDashboardSummary, fetchRecentTickets } from './dashboardApi'

export function useDashboard({ userId, canReport, canViewTickets, days }) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState(null)
  const key = JSON.stringify({ userId, canReport, canViewTickets, days, attempt })

  useEffect(() => {
    const controller = new AbortController()
    const params = JSON.parse(key)
    Promise.allSettled([
      fetchDashboardSummary(params, controller.signal),
      params.canViewTickets ? fetchRecentTickets(controller.signal) : Promise.resolve([]),
    ]).then(([summary, tickets]) => {
      if (controller.signal.aborted) return
      setResult({
        key,
        summary: summary.status === 'fulfilled' ? summary.value : null,
        tickets: tickets.status === 'fulfilled' ? tickets.value : [],
        summaryError: summary.status === 'rejected',
        ticketsError: tickets.status === 'rejected',
      })
    })
    return () => controller.abort()
  }, [key])

  return {
    data: result?.key === key ? result : null,
    loading: result?.key !== key,
    reload: () => setAttempt((current) => current + 1),
  }
}
