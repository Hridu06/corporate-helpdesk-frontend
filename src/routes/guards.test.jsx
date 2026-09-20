import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { makeUser, renderWithProviders } from '../test/utils'
import { GuestRoute } from './GuestRoute'
import { PermissionRoute } from './PermissionRoute'
import { ProtectedRoute } from './ProtectedRoute'

function TestRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<p>login page</p>} />
      <Route element={<GuestRoute />}>
        <Route path="/register" element={<p>register page</p>} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<p>dashboard page</p>} />
        <Route element={<PermissionRoute permission="user.view" />}>
          <Route path="/users" element={<p>users page</p>} />
        </Route>
        <Route element={<PermissionRoute permission={['report.view', 'department.view']} />}>
          <Route path="/either" element={<p>either page</p>} />
        </Route>
      </Route>
    </Routes>
  )
}

describe('ProtectedRoute', () => {
  it('redirects signed-out visitors to /login', () => {
    renderWithProviders(<TestRoutes />, { route: '/dashboard' })
    expect(screen.getByText('login page')).toBeInTheDocument()
  })

  it('shows a loading state while the session is being restored (no flash of the login page)', () => {
    renderWithProviders(<TestRoutes />, { route: '/dashboard', status: 'loading' })
    expect(screen.getByRole('status')).toHaveTextContent(/checking your session/i)
    expect(screen.queryByText('login page')).not.toBeInTheDocument()
  })

  it('renders the page for signed-in users', () => {
    renderWithProviders(<TestRoutes />, { route: '/dashboard', user: makeUser('customer') })
    expect(screen.getByText('dashboard page')).toBeInTheDocument()
  })
})

describe('GuestRoute', () => {
  it('lets signed-out visitors see the page', () => {
    renderWithProviders(<TestRoutes />, { route: '/register' })
    expect(screen.getByText('register page')).toBeInTheDocument()
  })

  it('sends signed-in users to the dashboard', () => {
    renderWithProviders(<TestRoutes />, { route: '/register', user: makeUser('customer') })
    expect(screen.getByText('dashboard page')).toBeInTheDocument()
  })
})

describe('PermissionRoute', () => {
  it('renders the page when the permission is held', () => {
    renderWithProviders(<TestRoutes />, { route: '/users', user: makeUser('admin') })
    expect(screen.getByText('users page')).toBeInTheDocument()
  })

  it('shows the Unauthorized page (URL unchanged) when the permission is missing', () => {
    renderWithProviders(<TestRoutes />, { route: '/users', user: makeUser('customer') })
    expect(screen.getByText(/you don't have access to this page/i)).toBeInTheDocument()
    expect(screen.queryByText('users page')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to dashboard/i })).toHaveAttribute('href', '/dashboard')
  })

  it('accepts any one of several permissions', () => {
    renderWithProviders(<TestRoutes />, { route: '/either', user: makeUser('agent') }) // has department.view only
    expect(screen.getByText('either page')).toBeInTheDocument()
  })

  it('denies when none of the listed permissions is held', () => {
    renderWithProviders(<TestRoutes />, { route: '/either', user: makeUser('customer') })
    expect(screen.getByText(/you don't have access/i)).toBeInTheDocument()
  })

  it('follows the backend-provided permission list, not the role name', () => {
    const customerWithUserView = makeUser('customer', { permissions: ['user.view'] })
    renderWithProviders(<TestRoutes />, { route: '/users', user: customerWithUserView })
    expect(screen.getByText('users page')).toBeInTheDocument()
  })
})
