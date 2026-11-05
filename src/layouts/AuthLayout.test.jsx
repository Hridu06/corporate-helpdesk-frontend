import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import * as authApi from '../features/auth/authApi'
import { GuestRoute } from '../routes/GuestRoute'
import { ProtectedRoute } from '../routes/ProtectedRoute'
import { makeUser, renderWithProviders } from '../test/utils'
import { tokenStorage } from '../utils/tokenStorage'
import { AuthLayout, LoginLayout } from './AuthLayout'
import { Navbar } from './Navbar'

vi.mock('../features/auth/authApi')

function TestRoutes() {
  return (
    <Routes>
      <Route element={<LoginLayout />}>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<h1>Login screen</h1>} />
        </Route>
      </Route>
      <Route element={<AuthLayout />}>
        <Route path="/register" element={<Link to="/login">Back to login</Link>} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Navbar onMenuClick={() => {}} />} />
      </Route>
    </Routes>
  )
}

function expectFullWidthLogin() {
  const heading = screen.getByRole('heading', { name: 'Login screen' })
  expect(heading.closest('main')).toHaveClass('w-full', 'min-h-svh')
  expect(heading.closest('.max-w-md')).toBeNull()
}

describe('Login layout navigation', () => {
  it('uses the full-width login layout after signing out of the workspace', async () => {
    const user = userEvent.setup()
    authApi.logout.mockResolvedValue({})
    tokenStorage.set('layout-test-token', false)
    const { store } = renderWithProviders(<TestRoutes />, { route: '/dashboard', user: makeUser('customer') })

    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    await waitFor(() => expectFullWidthLogin())
    expect(store.getState().auth.status).toBe('unauthenticated')
    expect(tokenStorage.get()).toBeNull()
  })

  it('leaves the centered registration card when returning to login', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TestRoutes />, { route: '/register' })
    expect(screen.getByRole('link', { name: 'Back to login' }).closest('.max-w-md')).not.toBeNull()

    await user.click(screen.getByRole('link', { name: 'Back to login' }))

    expectFullWidthLogin()
  })
})
