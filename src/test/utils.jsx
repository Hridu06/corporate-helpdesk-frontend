import { configureStore } from '@reduxjs/toolkit'
import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import authReducer from '../features/auth/authSlice'

// Permissions each role receives from the backend seeder (App\Support\Permissions).
// Super Admin gets every permission; the backend's /api/user returns them all.
const ALL_PERMISSIONS = [
  'user.view', 'user.create', 'user.update', 'user.delete', 'user.activate', 'user.deactivate', 'user.assign_role',
  'role.view', 'role.create', 'role.update', 'role.delete', 'permission.view', 'permission.assign',
  'department.view', 'department.create', 'department.update', 'department.delete',
  'ticket.view', 'ticket.view_all', 'ticket.create', 'ticket.update', 'ticket.assign', 'ticket.update_status',
  'ticket.update_priority', 'ticket.reply', 'ticket.internal_note', 'ticket.close',
  'report.view', 'settings.manage', 'activity.view',
]

const ROLE_PERMISSIONS = {
  'super-admin': ALL_PERMISSIONS,
  admin: [
    'user.view', 'user.create', 'user.update', 'department.view', 'department.update', 'ticket.view',
    'ticket.view_all', 'ticket.assign', 'ticket.update_priority', 'ticket.update_status', 'ticket.reply',
    'ticket.internal_note', 'report.view',
  ],
  agent: ['department.view', 'ticket.view', 'ticket.update_status', 'ticket.reply', 'ticket.internal_note'],
  customer: ['ticket.create', 'ticket.view', 'ticket.reply', 'ticket.close'],
}

export function makeUser(role, overrides = {}) {
  return {
    id: 1,
    name: `Test ${role}`,
    email: `${role}@example.com`,
    status: 'active',
    email_verified_at: '2026-01-01T00:00:00Z',
    roles: [role],
    permissions: ROLE_PERMISSIONS[role],
    ...overrides,
  }
}

/** Render inside a real Redux store (auth reducer) and a memory router. */
export function renderWithProviders(ui, { route = '/', user = null, status, sessionEndedReason = null } = {}) {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: { user, status: status ?? (user ? 'authenticated' : 'unauthenticated'), sessionEndedReason },
    },
  })

  const result = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </Provider>,
  )

  return { store, ...result }
}
