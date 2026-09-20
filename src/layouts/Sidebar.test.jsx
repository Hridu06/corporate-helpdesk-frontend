import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { makeUser, renderWithProviders } from '../test/utils'
import { Sidebar } from './Sidebar'

// The sidebar renders twice (desktop column + mobile drawer); check the desktop one.
const linkLabels = () => {
  const [desktopNav] = screen.getAllByRole('navigation', { name: 'Main', hidden: true })
  return within(desktopNav)
    .getAllByRole('link', { hidden: true })
    .map((link) => link.textContent)
}

describe('Sidebar', () => {
  it.each([
    ['super-admin', ['Dashboard', 'Tickets', 'New Ticket', 'Users', 'Roles & Permissions', 'Departments', 'Reports', 'Login Activity', 'System Settings']],
    ['admin', ['Dashboard', 'Tickets', 'Users', 'Departments', 'Reports']],
    ['agent', ['Dashboard', 'Tickets', 'Departments']],
    ['customer', ['Dashboard', 'Tickets', 'New Ticket']],
  ])('lists only the modules a %s may access', (role, expected) => {
    renderWithProviders(<Sidebar open={false} onClose={() => {}} />, { user: makeUser(role) })
    expect(linkLabels()).toEqual(expected)
  })

  it('reflects permission changes made on the backend', () => {
    const adminWithoutReports = makeUser('admin')
    adminWithoutReports.permissions = adminWithoutReports.permissions.filter((p) => p !== 'report.view')

    renderWithProviders(<Sidebar open={false} onClose={() => {}} />, { user: adminWithoutReports })

    expect(linkLabels()).not.toContain('Reports')
  })

  it('shows only the dashboard link for a user with no permissions', () => {
    renderWithProviders(<Sidebar open={false} onClose={() => {}} />, {
      user: makeUser('customer', { roles: [], permissions: [] }),
    })
    expect(linkLabels()).toEqual(['Dashboard'])
  })
})
