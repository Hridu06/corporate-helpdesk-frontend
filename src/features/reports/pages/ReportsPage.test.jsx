import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeUser, renderWithProviders } from '../../../test/utils'
import * as reportsApi from '../reportsApi'
import { ReportsPage } from './ReportsPage'

vi.mock('../reportsApi')

const REPORT = {
  range: { from: '2026-08-23', to: '2026-09-21', days: 30, timezone: 'UTC', granularity: 'day' },
  overview: {
    created: 6,
    resolved: 2,
    open_now: 4,
    unassigned_now: 1,
    avg_resolution_seconds: 64800,
    avg_first_response_seconds: 10800,
    answered: 3,
    reopened: 1,
    reopen_rate: 0.5,
  },
  timeline: [
    { date: '2026-09-19', created: 1, resolved: 0 },
    { date: '2026-09-20', created: 0, resolved: 2 },
    { date: '2026-09-21', created: 3, resolved: 1 },
  ],
  breakdown: {
    status: [
      { key: 'open', count: 3 },
      { key: 'in_progress', count: 1 },
      { key: 'resolved', count: 1 },
      { key: 'closed', count: 1 },
    ],
    priority: [
      { key: 'low', count: 1 },
      { key: 'medium', count: 2 },
      { key: 'high', count: 2 },
      { key: 'urgent', count: 1 },
    ],
    departments: [
      { id: 1, name: 'Billing', created: 2, resolved: 1, open_now: 1, avg_resolution_seconds: 86400 },
      { id: 'none', name: null, created: 4, resolved: 1, open_now: 3, avg_resolution_seconds: null },
    ],
    ageing: [
      { key: 'under_1_day', count: 1 },
      { key: '1_to_3_days', count: 1 },
      { key: '3_to_7_days', count: 1 },
      { key: 'over_7_days', count: 1 },
    ],
  },
  agents: [
    { id: 10, name: 'Alex Agent', open_now: 0, resolved: 2, avg_resolution_seconds: 64800, avg_first_response_seconds: 5400 },
    { id: 11, name: 'Bea Agent', open_now: 3, resolved: 0, avg_resolution_seconds: null, avg_first_response_seconds: null },
  ],
}

const FILTERS = { days: 30, from: '', to: '', departmentId: '' }

function renderPage() {
  return renderWithProviders(<ReportsPage />, { route: '/reports', user: makeUser('admin') })
}

// Some labels ("Open now") also head table columns, so look only at the cards' <dt>.
const card = (label) => screen.getAllByText(label).find((element) => element.tagName === 'DT').closest('div')

describe('ReportsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    reportsApi.fetchReports.mockResolvedValue(REPORT)
    reportsApi.fetchReportOptions.mockResolvedValue({ departments: [{ id: 1, name: 'Billing' }, { id: 2, name: 'Support' }] })
  })

  it('loads the last 30 days by default and shows the period', async () => {
    renderPage()

    expect(screen.getByText('Loading reports')).toBeInTheDocument()
    // The dates follow the reader's locale ("Aug 23, 2026" or "23 Aug 2026"), so only the fixed parts are matched.
    expect(await screen.findByText(/30 days, UTC time/)).toBeInTheDocument()
    expect(reportsApi.fetchReports).toHaveBeenCalledWith(FILTERS, expect.any(AbortSignal))
  })

  it('shows the headline numbers in readable units', async () => {
    renderPage()
    await screen.findByText('Tickets created')

    expect(within(card('Tickets created')).getByText('6')).toBeInTheDocument()
    expect(within(card('Tickets resolved')).getByText('2')).toBeInTheDocument()
    expect(within(card('Open now')).getByText('4')).toBeInTheDocument()
    expect(within(card('Unassigned now')).getByText('1')).toBeInTheDocument()
    expect(within(card('Average resolution time')).getByText('18 h')).toBeInTheDocument() // 64800 s
    expect(within(card('Average first response')).getByText('3 h')).toBeInTheDocument()   // 10800 s
    expect(within(card('Average first response')).getByText('3 tickets answered')).toBeInTheDocument()
    expect(within(card('Reopened tickets')).getByText('1')).toBeInTheDocument()
    expect(within(card('Reopen rate')).getByText('50%')).toBeInTheDocument()
  })

  it('writes "—" rather than 0 when there is nothing to average', async () => {
    reportsApi.fetchReports.mockResolvedValue({
      ...REPORT,
      overview: { ...REPORT.overview, resolved: 0, avg_resolution_seconds: null, avg_first_response_seconds: null, answered: 0, reopen_rate: null },
    })
    renderPage()
    await screen.findByText('Tickets created')

    expect(within(card('Average resolution time')).getByText('—')).toBeInTheDocument()
    expect(within(card('Average first response')).getByText('—')).toBeInTheDocument()
    expect(within(card('Average first response')).getByText('0 tickets answered')).toBeInTheDocument()
    expect(within(card('Reopen rate')).getByText('—')).toBeInTheDocument()
  })

  it('shows the distributions with their numbers written out', async () => {
    renderPage()
    await screen.findByText('Tickets created')

    const status = screen.getByRole('region', { name: 'By status' })
    expect(within(status).getByText('In progress').nextSibling).toHaveTextContent('1')
    expect(within(status).getByText('Open').nextSibling).toHaveTextContent('3')
    const ageing = screen.getByRole('region', { name: 'Open tickets by age' })
    expect(within(ageing).getByText('Over 7 days')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'By priority' })).getByText('Urgent')).toBeInTheDocument()
  })

  it('lists departments (including tickets with none) and agents', async () => {
    renderPage()
    await screen.findByText('Tickets created')

    const departments = screen.getByRole('table', { name: 'By department' })
    const billing = within(departments).getByRole('row', { name: /Billing/ })
    expect(within(billing).getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['2', '1', '1', '1 d'])
    const none = within(departments).getByRole('row', { name: /No department/ })
    expect(within(none).getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['4', '1', '3', '—'])

    const agents = screen.getByRole('table', { name: 'By agent' })
    expect(within(within(agents).getByRole('row', { name: /Alex Agent/ })).getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['0', '2', '18 h', '1.5 h'])
    expect(within(within(agents).getByRole('row', { name: /Bea Agent/ })).getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['3', '0', '—', '—'])
  })

  it('describes the chart for screen readers and offers the same numbers as a table', async () => {
    const user = userEvent.setup()
    renderPage()

    const chart = await screen.findByRole('img', { name: /4 opened and 3 resolved in total/ })
    expect(chart).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Show as table' }))
    const table = screen.getByRole('table', { name: /4 opened and 3 resolved/ })
    const rows = within(table).getAllByRole('row').slice(1).map((row) => within(row).getAllByRole('cell').map((cell) => cell.textContent))
    expect(rows).toEqual([['1', '0'], ['0', '2'], ['3', '1']])

    await user.click(screen.getByRole('button', { name: 'Show as chart' }))
    expect(screen.getByRole('img', { name: /opened and resolved per day/ })).toBeInTheDocument()
  })

  it('calls the period "week" when the server groups by week', async () => {
    reportsApi.fetchReports.mockResolvedValue({ ...REPORT, range: { ...REPORT.range, days: 200, granularity: 'week' } })
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Opened and resolved per week' })).toBeInTheDocument()
  })

  it('explains how the numbers are counted', async () => {
    renderPage()
    await screen.findByText('Tickets created')

    expect(screen.getByText('How these numbers are counted')).toBeInTheDocument()
    expect(screen.getByText(/internal notes and the customer's own messages do not count/i)).toBeInTheDocument()
  })

  it('reloads for another preset', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Tickets created')

    await user.click(screen.getByRole('button', { name: 'Last 7 days' }))

    await waitFor(() => expect(reportsApi.fetchReports).toHaveBeenLastCalledWith({ days: 7, from: '', to: '', departmentId: '' }, expect.any(AbortSignal)))
    expect(screen.getByRole('button', { name: 'Last 7 days' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Last 30 days' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('reloads for a department, including "No department"', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Tickets created')
    await screen.findByRole('option', { name: 'Support' })

    await user.selectOptions(screen.getByLabelText('Department'), 'Support')
    await waitFor(() => expect(reportsApi.fetchReports).toHaveBeenLastCalledWith({ ...FILTERS, departmentId: '2' }, expect.any(AbortSignal)))

    await user.selectOptions(screen.getByLabelText('Department'), 'No department')
    await waitFor(() => expect(reportsApi.fetchReports).toHaveBeenLastCalledWith({ ...FILTERS, departmentId: 'none' }, expect.any(AbortSignal)))
  })

  it('applies a custom range only when both dates are filled in and in order', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Tickets created')
    await user.click(screen.getByRole('button', { name: 'Custom' }))

    const apply = screen.getByRole('button', { name: 'Apply' })
    expect(apply).toBeDisabled()

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-09-10' } })
    expect(apply).toBeDisabled() // still no end date

    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-09-01' } })
    expect(await screen.findByText('The start date must not be after the end date.')).toBeInTheDocument()
    expect(apply).toBeDisabled()

    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-09-15' } })
    await waitFor(() => expect(apply).toBeEnabled())
    await user.click(apply)

    await waitFor(() => expect(reportsApi.fetchReports).toHaveBeenLastCalledWith({ days: null, from: '2026-09-10', to: '2026-09-15', departmentId: '' }, expect.any(AbortSignal)))
  })

  it('shows an empty state when there is nothing to report', async () => {
    reportsApi.fetchReports.mockResolvedValue({
      ...REPORT,
      overview: { ...REPORT.overview, created: 0, resolved: 0, open_now: 0 },
    })
    renderPage()

    expect(await screen.findByText('No tickets to report on')).toBeInTheDocument()
    expect(screen.queryByText('Tickets created')).not.toBeInTheDocument()
  })

  it('offers a retry when loading fails', async () => {
    const user = userEvent.setup()
    reportsApi.fetchReports.mockRejectedValueOnce({ status: 500, message: 'Server error' })
    renderPage()

    expect(await screen.findByText('Server error')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(await screen.findByText('Tickets created')).toBeInTheDocument()
    expect(reportsApi.fetchReports).toHaveBeenCalledTimes(2)
  })

  it("shows the access-denied page when the server says 403 (the API is the real check)", async () => {
    reportsApi.fetchReports.mockRejectedValue({ status: 403, message: 'Forbidden' })
    renderPage()

    expect(await screen.findByText("You don't have access to this page")).toBeInTheDocument()
  })

  it('keeps the old figures on screen while newer ones load', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Tickets created')
    reportsApi.fetchReports.mockReturnValue(new Promise(() => {}))

    await user.click(screen.getByRole('button', { name: 'Last 90 days' }))

    expect(await screen.findByText('Updating…')).toBeInTheDocument()
    expect(screen.getByText('Tickets created')).toBeInTheDocument()
  })

  it('still works when the department list cannot be loaded', async () => {
    reportsApi.fetchReportOptions.mockRejectedValue({ status: 500, message: 'x' })
    renderPage()

    expect(await screen.findByText('Tickets created')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'All departments' })).toBeInTheDocument()
  })
})
