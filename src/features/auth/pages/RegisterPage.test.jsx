import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../test/utils'
import * as authApi from '../authApi'
import { RegisterPage } from './RegisterPage'

vi.mock('../authApi')

async function registerCustomer() {
  const user = userEvent.setup()
  renderWithProviders(<RegisterPage />)
  await user.type(screen.getByLabelText('Full name'), 'Jane Customer')
  await user.type(screen.getByLabelText('Email'), 'jane@example.com')
  await user.type(screen.getByLabelText('Password'), 'Secret!123')
  await user.type(screen.getByLabelText('Confirm password'), 'Secret!123')
  await user.click(screen.getByRole('button', { name: 'Create account' }))
}

describe('RegisterPage', () => {
  beforeEach(() => vi.resetAllMocks())

  it('offers sign in without verification when the backend disables it', async () => {
    authApi.register.mockResolvedValue({ email_verification_required: false })

    await registerCustomer()

    expect(await screen.findByRole('heading', { name: 'Account created' })).toBeInTheDocument()
    expect(screen.getByText(/you can now sign in with/i)).toHaveTextContent('jane@example.com')
    expect(screen.getByRole('link', { name: 'Go to sign in' })).toHaveAttribute('href', '/login')
    expect(screen.queryByRole('button', { name: 'Resend verification email' })).not.toBeInTheDocument()
    expect(authApi.resendVerification).not.toHaveBeenCalled()
  })

  it.each([true, undefined])('keeps the verification flow when required is %s', async (required) => {
    authApi.register.mockResolvedValue({ email_verification_required: required })

    await registerCustomer()

    expect(await screen.findByRole('heading', { name: 'Check your email' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Resend verification email' })).toBeInTheDocument()
  })
})
