import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { makeUser, renderWithProviders } from '../../test/utils'
import { DashboardPage } from './DashboardPage'

const cardTitles = () =>
  screen
    .getAllByRole('heading', { level: 2 })
    .map((heading) => heading.textContent)
    .filter((title) => title !== 'Your access')

describe('DashboardPage', () => {
  it.each([
    ['super-admin', 'Admin Dashboard', ['Users', 'Roles & Permissions', 'Departments', 'Tickets', 'Reports', 'Login Activity', 'System Settings']],
    ['admin', 'Support Dashboard', ['Tickets', 'Departments', 'Users', 'Reports']],
    ['agent', 'Agent Dashboard', ['Tickets', 'Departments']],
    ['customer', 'Customer Dashboard', ['New Ticket', 'Tickets']],
  ])('shows the %s dashboard with permitted cards only', (role, title, cards) => {
    renderWithProviders(<DashboardPage />, { user: makeUser(role) })

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(title)
    expect(cardTitles()).toEqual(cards)
  })

  it('greets the user by name and links each card to its module', () => {
    renderWithProviders(<DashboardPage />, { user: makeUser('customer', { name: 'Jane Doe' }) })

    expect(screen.getByText(/welcome back, jane doe/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /new ticket/i })).toHaveAttribute('href', '/tickets/new')
  })

  it('drops a card when the backend removes the permission behind it', () => {
    const admin = makeUser('admin')
    admin.permissions = admin.permissions.filter((p) => p !== 'report.view')

    renderWithProviders(<DashboardPage />, { user: admin })

    expect(cardTitles()).not.toContain('Reports')
  })

  it('summarises the role and permission count', () => {
    renderWithProviders(<DashboardPage />, { user: makeUser('customer') })
    expect(screen.getByText(/customer · 4 permissions/i)).toBeInTheDocument()
  })

  it('falls back to a permission-driven dashboard for users without a standard role', () => {
    const custom = makeUser('customer', { roles: ['auditor'], permissions: ['report.view'] })
    renderWithProviders(<DashboardPage />, { user: custom })

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Dashboard')
    expect(cardTitles()).toEqual(['Reports'])
  })

  it('shows an empty state when the user has no accessible modules', () => {
    renderWithProviders(<DashboardPage />, { user: makeUser('customer', { roles: [], permissions: [] }) })

    expect(screen.getByText(/no modules available/i)).toBeInTheDocument()
    expect(screen.getByText(/no role assigned · 0 permissions/i)).toBeInTheDocument()
  })
})
