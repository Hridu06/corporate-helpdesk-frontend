import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeUser, renderWithProviders } from '../../../test/utils'
import * as usersApi from '../usersApi'
import { UsersPage } from './UsersPage'

vi.mock('../usersApi')

const row = (overrides) => ({
  status: 'active',
  roles: ['customer'],
  email_verified_at: '2026-01-01T00:00:00Z',
  last_login_at: null,
  created_at: '2026-01-01T00:00:00Z',
  ...overrides,
})

const ME = row({ id: 1, name: 'Me Myself', email: 'me@example.com', roles: ['admin'] })
const CUSTOMER = row({ id: 2, name: 'Cara Customer', email: 'cara@example.com' })
const SUPER = row({ id: 3, name: 'Sue Super', email: 'sue@example.com', roles: ['super-admin'] })
const INACTIVE = row({ id: 4, name: 'Ivan Inactive', email: 'ivan@example.com', status: 'inactive' })

const page = (users) => ({
  data: users,
  meta: { current_page: 1, last_page: 1, per_page: 15, total: users.length, from: users.length ? 1 : 0, to: users.length },
})

const buttonsIn = (email) =>
  within(screen.getByText(email).closest('tr'))
    .queryAllByRole('button')
    .map((button) => button.textContent.replace(/\s+/g, ' ').trim())

async function renderPage(viewer, users = [ME, CUSTOMER, SUPER, INACTIVE]) {
  usersApi.listUsers.mockResolvedValue(page(users))
  usersApi.fetchAssignableRoles.mockResolvedValue(['agent', 'customer'])
  const result = renderWithProviders(<UsersPage />, { user: viewer })
  await screen.findByText(users[0]?.email ?? 'nobody', {}, { timeout: 3000 }).catch(() => {})
  return result
}

describe('UsersPage', () => {
  beforeEach(() => vi.resetAllMocks())

  describe('as a default Admin (view / create / update only)', () => {
    const admin = () => makeUser('admin', { id: 1 })

    it('can only edit other users: no role change, activation or deactivation', async () => {
      await renderPage(admin())

      expect(buttonsIn('cara@example.com')).toEqual(['Edit Cara Customer'])
      expect(buttonsIn('ivan@example.com')).toEqual(['Edit Ivan Inactive'])
    })

    it('gets no actions at all on a Super Admin', async () => {
      await renderPage(admin())
      expect(buttonsIn('sue@example.com')).toEqual([])
    })

    it('marks the current user and offers only Edit on their own row', async () => {
      await renderPage(admin())
      expect(screen.getByText('(you)')).toBeInTheDocument()
      expect(buttonsIn('me@example.com')).toEqual(['Edit Me Myself'])
    })

    it('shows the Add user button', async () => {
      await renderPage(admin())
      expect(screen.getByRole('button', { name: 'Add user' })).toBeInTheDocument()
    })
  })

  describe('as a Super Admin', () => {
    const superAdmin = () => makeUser('super-admin', { id: 1 })

    it('sees the full set of actions on other users', async () => {
      await renderPage(superAdmin())

      expect(buttonsIn('cara@example.com')).toEqual(['Edit Cara Customer', 'Change role Cara Customer', 'Deactivate Cara Customer'])
      expect(buttonsIn('ivan@example.com')).toEqual(['Edit Ivan Inactive', 'Change role Ivan Inactive', 'Activate Ivan Inactive'])
    })

    it('may act on another Super Admin but never on their own row (beyond Edit)', async () => {
      await renderPage(superAdmin())

      expect(buttonsIn('sue@example.com')).toContain('Deactivate Sue Super')
      expect(buttonsIn('me@example.com')).toEqual(['Edit Me Myself'])
    })

    it('asks for confirmation, then deactivates and refreshes the list', async () => {
      const user = userEvent.setup()
      usersApi.deactivateUser.mockResolvedValue({ message: 'User deactivated.' })
      await renderPage(superAdmin())

      await user.click(screen.getByRole('button', { name: 'Deactivate Cara Customer' }))
      const dialog = await screen.findByRole('dialog')
      expect(within(dialog).getByText(/signed out everywhere immediately/i)).toBeInTheDocument()
      expect(usersApi.deactivateUser).not.toHaveBeenCalled()

      await user.click(within(dialog).getByRole('button', { name: 'Deactivate' }))

      await waitFor(() => expect(usersApi.deactivateUser).toHaveBeenCalledWith(2))
      await waitFor(() => expect(usersApi.listUsers).toHaveBeenCalledTimes(2))
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    })

    it('does nothing when the confirmation is cancelled', async () => {
      const user = userEvent.setup()
      await renderPage(superAdmin())

      await user.click(screen.getByRole('button', { name: 'Deactivate Cara Customer' }))
      await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }))

      expect(usersApi.deactivateUser).not.toHaveBeenCalled()
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    })

    it('activates an inactive user immediately', async () => {
      const user = userEvent.setup()
      usersApi.activateUser.mockResolvedValue({ message: 'User activated.' })
      await renderPage(superAdmin())

      await user.click(screen.getByRole('button', { name: 'Activate Ivan Inactive' }))

      await waitFor(() => expect(usersApi.activateUser).toHaveBeenCalledWith(4))
    })
  })

  it('hides Add user and every action from a viewer who can only view users', async () => {
    const viewOnly = makeUser('customer', { id: 1, permissions: ['user.view'] })
    await renderPage(viewOnly)

    expect(screen.queryByRole('button', { name: 'Add user' })).not.toBeInTheDocument()
    expect(buttonsIn('cara@example.com')).toEqual([])
  })

  it('passes the filters to the API and returns to page 1', async () => {
    const user = userEvent.setup()
    await renderPage(makeUser('admin', { id: 1 }))

    await user.selectOptions(screen.getByLabelText('Status'), 'inactive')

    await waitFor(() =>
      expect(usersApi.listUsers).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'inactive', page: 1 }),
        expect.anything(),
      ),
    )
  })

  it('shows an empty state, distinguishing "no users" from "no matches"', async () => {
    const user = userEvent.setup()
    await renderPage(makeUser('admin', { id: 1 }), [])
    expect(await screen.findByText('No users yet')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Role'), 'agent')
    expect(await screen.findByText('No users match your filters')).toBeInTheDocument()
  })

  it('shows the error with a working Retry', async () => {
    const user = userEvent.setup()
    usersApi.fetchAssignableRoles.mockResolvedValue([])
    usersApi.listUsers.mockRejectedValueOnce({ status: 500, message: 'Server exploded', errors: {} })
    usersApi.listUsers.mockResolvedValue(page([CUSTOMER]))
    renderWithProviders(<UsersPage />, { user: makeUser('admin', { id: 1 }) })

    expect(await screen.findByText('Server exploded')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(await screen.findByText('cara@example.com')).toBeInTheDocument()
    expect(screen.queryByText('Server exploded')).not.toBeInTheDocument()
  })

  it('offers only the roles the backend says the viewer may assign, when creating a user', async () => {
    const user = userEvent.setup()
    await renderPage(makeUser('admin', { id: 1 }))

    await user.click(screen.getByRole('button', { name: 'Add user' }))
    const dialog = await screen.findByRole('dialog')
    const options = within(dialog).getAllByRole('option').map((option) => option.textContent)

    expect(options).toEqual(['Select a role…', 'Agent', 'Customer'])
  })

  it('creates a user and refreshes the list', async () => {
    const user = userEvent.setup()
    usersApi.createUser.mockResolvedValue({ message: 'User created.' })
    await renderPage(makeUser('admin', { id: 1 }))

    await user.click(screen.getByRole('button', { name: 'Add user' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText('Full name'), 'New Person')
    await user.type(within(dialog).getByLabelText('Email'), 'new@example.com')
    await user.selectOptions(within(dialog).getByLabelText('Role'), 'agent')
    await user.click(within(dialog).getByRole('button', { name: 'Create user' }))

    await waitFor(() =>
      expect(usersApi.createUser).toHaveBeenCalledWith({ name: 'New Person', email: 'new@example.com', role: 'agent' }),
    )
    await waitFor(() => expect(usersApi.listUsers).toHaveBeenCalledTimes(2))
  })

  it('shows the backend error under the field when creating a duplicate email', async () => {
    const user = userEvent.setup()
    usersApi.createUser.mockRejectedValue({ status: 422, message: 'Invalid', errors: { email: ['The email has already been taken.'] } })
    await renderPage(makeUser('admin', { id: 1 }))

    await user.click(screen.getByRole('button', { name: 'Add user' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText('Full name'), 'Dup')
    await user.type(within(dialog).getByLabelText('Email'), 'cara@example.com')
    await user.selectOptions(within(dialog).getByLabelText('Role'), 'customer')
    await user.click(within(dialog).getByRole('button', { name: 'Create user' }))

    expect(await within(dialog).findByText('The email has already been taken.')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
