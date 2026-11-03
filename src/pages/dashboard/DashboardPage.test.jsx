import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeUser, renderWithProviders } from '../../test/utils'
import * as api from './dashboardApi'
import { DashboardPage } from './DashboardPage'

vi.mock('./dashboardApi')
const SUMMARY = {
  counts: { open: 8, in_progress: 4, resolved: 6, closed: 2 },
  timeline: [{ date: '2026-11-01', created: 3, resolved: 2 }, { date: '2026-11-02', created: 5, resolved: 3 }],
  priority: [{ key: 'medium', count: 12 }, { key: 'high', count: 8 }],
  departments: [{ id: 1, name: 'IT Support', created: 20 }],
  range: { timezone: 'UTC' },
}
const TICKET = { id: 12, number: 'TCK-000012', subject: 'Email is not working', status: 'open', priority: 'medium', customer: { name: 'Raiyan' }, updated_at: '2026-11-02T12:00:00Z' }

const shortcuts = () => within(screen.getByRole('region', { name: 'Quick access' })).getAllByRole('link').map((link) => link.textContent)

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    api.fetchDashboardSummary.mockResolvedValue(SUMMARY)
    api.fetchRecentTickets.mockResolvedValue([TICKET])
  })

  it.each([
    ['super-admin', ['Users', 'Roles & Permissions', 'Departments', 'Tickets', 'Reports', 'Login Activity', 'System Settings']],
    ['admin', ['Tickets', 'Departments', 'Users', 'Reports']],
    ['agent', ['Tickets', 'Departments']],
    ['customer', ['New Ticket', 'Tickets']],
  ])('keeps shortcuts scoped to the %s permissions', async (role, expected) => {
    renderWithProviders(<DashboardPage />, { user: makeUser(role) })
    expect(shortcuts()).toEqual(expected)
    await screen.findByText(TICKET.subject)
  })

  it('greets the user and shows real ticket counts and charts', async () => {
    renderWithProviders(<DashboardPage />, { user: makeUser('super-admin', { name: 'Hridoy' }) })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/good (morning|afternoon|evening), Hridoy/i)
    await screen.findByText(TICKET.subject)
    const stats = screen.getByLabelText('Ticket overview')
    expect(within(stats).getByText('20')).toBeInTheDocument()
    expect(within(stats).getByText('8')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Tickets over time' })).toBeInTheDocument()
    expect(screen.getByText('IT Support')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: TICKET.number })).toHaveAttribute('href', '/tickets/12')
  })

  it('reloads the charts when the selected period changes', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DashboardPage />, { user: makeUser('admin') })
    await screen.findByText(TICKET.subject)
    await user.selectOptions(screen.getByRole('combobox', { name: 'Dashboard period' }), '7')
    await waitFor(() => expect(api.fetchDashboardSummary).toHaveBeenLastCalledWith(expect.objectContaining({ days: 7, canReport: true }), expect.any(AbortSignal)))
  })

  it('uses scoped totals and hides report charts for a customer', async () => {
    renderWithProviders(<DashboardPage />, { user: makeUser('customer') })
    await screen.findByText(TICKET.subject)
    expect(api.fetchDashboardSummary).toHaveBeenCalledWith(expect.objectContaining({ canReport: false, canViewTickets: true }), expect.any(AbortSignal))
    expect(screen.queryByRole('region', { name: 'Tickets over time' })).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Dashboard period' })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Requester' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /create a ticket/i })).toHaveAttribute('href', '/tickets/new')
  })

  it('handles accounts without any accessible modules', async () => {
    renderWithProviders(<DashboardPage />, { user: makeUser('customer', { roles: [], permissions: [] }) })
    expect(screen.getByText('No modules available')).toBeInTheDocument()
    expect(screen.getByText(/no role assigned · 0 permissions/i)).toBeInTheDocument()
    await waitFor(() => expect(api.fetchDashboardSummary).toHaveBeenCalled())
    expect(api.fetchRecentTickets).not.toHaveBeenCalled()
  })

  it('keeps available tickets visible when summary loading fails and offers retry', async () => {
    const user = userEvent.setup()
    api.fetchDashboardSummary.mockRejectedValue(new Error('Unavailable'))
    renderWithProviders(<DashboardPage />, { user: makeUser('admin') })
    expect(await screen.findByRole('alert')).toHaveTextContent('Some dashboard information could not be loaded.')
    expect(screen.getByText(TICKET.subject)).toBeInTheDocument()
    api.fetchDashboardSummary.mockResolvedValue(SUMMARY)
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })

  it('shows zero counts and helpful empty states without fabricated tickets', async () => {
    api.fetchDashboardSummary.mockResolvedValue({ ...SUMMARY, counts: { open: 0, in_progress: 0, resolved: 0, closed: 0 }, priority: [], timeline: [], departments: [] })
    api.fetchRecentTickets.mockResolvedValue([])
    renderWithProviders(<DashboardPage />, { user: makeUser('super-admin') })
    expect(await screen.findByText('Your next ticket starts the story')).toBeInTheDocument()
    expect(screen.getByText('A fresh start for better support')).toBeInTheDocument()
    expect(screen.queryByText(TICKET.subject)).not.toBeInTheDocument()
  })
})
