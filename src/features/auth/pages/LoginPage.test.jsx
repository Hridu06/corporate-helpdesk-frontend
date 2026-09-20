import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeUser, renderWithProviders } from '../../../test/utils'
import * as authApi from '../authApi'
import { LoginPage } from './LoginPage'

vi.mock('../authApi')

async function submit(user, { email = 'jane@example.com', password = 'Secret!123' } = {}) {
  if (email) await user.type(screen.getByLabelText('Email'), email)
  if (password) await user.type(screen.getByLabelText('Password'), password)
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
}

describe('LoginPage', () => {
  beforeEach(() => vi.resetAllMocks())

  it('shows client-side validation errors without calling the API', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    await submit(user, { email: '', password: '' })

    expect(await screen.findByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
    expect(authApi.login).not.toHaveBeenCalled()
  })

  it('signs in, stores the token per "remember me" and updates auth state', async () => {
    const user = userEvent.setup()
    authApi.login.mockResolvedValue({ token: 'tok', user: makeUser('customer') })
    const { store } = renderWithProviders(<LoginPage />)

    await user.click(screen.getByLabelText('Remember me'))
    await submit(user)

    await waitFor(() => expect(store.getState().auth.status).toBe('authenticated'))
    expect(authApi.login).toHaveBeenCalledWith({ email: 'jane@example.com', password: 'Secret!123', remember: true })
    expect(localStorage.getItem('helpdesk_token')).toBe('tok')
  })

  it('shows the backend message for wrong credentials', async () => {
    const user = userEvent.setup()
    authApi.login.mockRejectedValue({ status: 401, code: 'invalid_credentials', message: 'The provided credentials are incorrect.', errors: {} })
    renderWithProviders(<LoginPage />)

    await submit(user)

    expect(await screen.findByRole('alert')).toHaveTextContent('The provided credentials are incorrect.')
  })

  it('offers to resend the verification email for an unverified account', async () => {
    const user = userEvent.setup()
    authApi.login.mockRejectedValue({ status: 403, code: 'email_not_verified', message: 'Please verify', errors: {} })
    authApi.resendVerification.mockResolvedValue({ message: 'sent' })
    renderWithProviders(<LoginPage />)

    await submit(user)

    expect(await screen.findByText('Verify your email to continue')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Resend verification email' }))
    await waitFor(() => expect(authApi.resendVerification).toHaveBeenCalledWith('jane@example.com'))
  })

  it('explains rate limiting', async () => {
    const user = userEvent.setup()
    authApi.login.mockRejectedValue({ status: 429, code: null, message: 'Too Many Attempts.', errors: {} })
    renderWithProviders(<LoginPage />)

    await submit(user)

    expect(await screen.findByText(/too many sign-in attempts/i)).toBeInTheDocument()
  })

  it('maps server validation errors onto the fields', async () => {
    const user = userEvent.setup()
    authApi.login.mockRejectedValue({ status: 422, code: null, message: 'Invalid', errors: { email: ['The email field is invalid.'] } })
    renderWithProviders(<LoginPage />)

    await submit(user)

    expect(await screen.findByText('The email field is invalid.')).toBeInTheDocument()
  })

  it('tells the user when their session has expired or the account was deactivated', () => {
    renderWithProviders(<LoginPage />, { sessionEndedReason: 'expired' })
    expect(screen.getByText(/your session has expired/i)).toBeInTheDocument()
  })

  it('links to registration and password reset', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByRole('link', { name: 'Register' })).toHaveAttribute('href', '/register')
    expect(screen.getByRole('link', { name: 'Forgot password?' })).toHaveAttribute('href', '/forgot-password')
  })

  it('can reveal and hide the password', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)
    const input = screen.getByLabelText('Password')

    expect(input).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(input).toHaveAttribute('type', 'text')
    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(input).toHaveAttribute('type', 'password')
  })
})
