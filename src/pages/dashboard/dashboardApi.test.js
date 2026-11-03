import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axiosClient } from '../../api/axiosClient'
import { listTickets } from '../../features/tickets/ticketsApi'
import { fetchDashboardSummary } from './dashboardApi'

vi.mock('../../api/axiosClient', () => ({ axiosClient: { get: vi.fn() } }))
vi.mock('../../features/tickets/ticketsApi', () => ({ listTickets: vi.fn() }))

describe('dashboard data scope', () => {
  beforeEach(() => vi.resetAllMocks())

  it('uses only scoped ticket endpoints for a user without reports', async () => {
    listTickets.mockImplementation(({ status }) => Promise.resolve({ meta: { total: status === 'open' ? 3 : 0 } }))
    const result = await fetchDashboardSummary({ canReport: false, canViewTickets: true, days: 30 })
    expect(axiosClient.get).not.toHaveBeenCalled()
    expect(result.counts).toEqual({ open: 3, in_progress: 0, resolved: 0, closed: 0 })
  })

  it('does not request ticket data when the user has no access', async () => {
    expect(await fetchDashboardSummary({ canReport: false, canViewTickets: false, days: 30 })).toBeNull()
    expect(axiosClient.get).not.toHaveBeenCalled()
    expect(listTickets).not.toHaveBeenCalled()
  })

  it('passes the selected period and cancellation signal to report endpoints', async () => {
    axiosClient.get.mockImplementation((path) => Promise.resolve(path.endsWith('breakdown')
      ? { data: { data: { status: [{ key: 'open', count: 5 }], priority: [], departments: [] }, range: { days: 7 } } }
      : { data: { data: [{ date: '2026-11-02', created: 5, resolved: 0 }] } }))
    const controller = new AbortController()
    const result = await fetchDashboardSummary({ canReport: true, canViewTickets: true, days: 7 }, controller.signal)
    expect(result.counts.open).toBe(5)
    expect(axiosClient.get).toHaveBeenCalledWith('/reports/breakdown', { params: { days: 7 }, signal: controller.signal })
    expect(axiosClient.get).toHaveBeenCalledWith('/reports/timeline', { params: { days: 7 }, signal: controller.signal })
    expect(listTickets).not.toHaveBeenCalled()
  })
})
