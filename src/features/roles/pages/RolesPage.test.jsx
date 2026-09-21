import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import toast from 'react-hot-toast'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeUser, renderWithProviders } from '../../../test/utils'
import * as api from '../rolesApi'
import { RolesPage } from './RolesPage'

vi.mock('../rolesApi')
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))

const perm = (name, label, extra = {}) => ({
  name,
  label,
  description: `${label} description.`,
  sensitive: false,
  reserved: false,
  allowed_for: ['admin', 'agent', 'customer'],
  required_for: [],
  can_grant: true,
  ...extra,
})

const GROUPS = [
  {
    key: 'tickets',
    label: 'Tickets',
    permissions: [
      perm('ticket.create', 'Open tickets', { required_for: ['customer'] }),
      perm('ticket.view', 'View tickets', { required_for: ['customer', 'agent', 'admin'] }),
      perm('ticket.view_all', 'View every ticket', { sensitive: true, allowed_for: ['admin', 'agent'] }),
      perm('ticket.internal_note', 'Write and read internal notes', { sensitive: true, allowed_for: ['admin', 'agent'] }),
      perm('ticket.update', 'Edit ticket details', { reserved: true, allowed_for: [] }),
    ],
  },
  {
    key: 'reports',
    label: 'Reports and activity',
    permissions: [perm('report.view', 'View reports', { sensitive: true, allowed_for: ['admin', 'agent'], can_grant: false })],
  },
]

const ALL = ['report.view', 'ticket.create', 'ticket.internal_note', 'ticket.update', 'ticket.view', 'ticket.view_all']

const role = (name, label, extra) => ({
  name,
  label,
  description: `${label} description.`,
  rank: 1,
  user_count: 2,
  permissions: [],
  version: `v-${name}`,
  default_permissions: [],
  is_default: true,
  editable: true,
  locked_reason: null,
  ...extra,
})

const ROLES = [
  role('super-admin', 'Super Admin', { user_count: 1, permissions: ALL, editable: false, locked_reason: 'Super Admin always has every permission and cannot be changed.' }),
  role('admin', 'Admin', { user_count: 1, permissions: ['ticket.view', 'ticket.view_all'], editable: false, locked_reason: 'You cannot change your own role or a higher one.' }),
  role('agent', 'Agent', { permissions: ['ticket.internal_note', 'ticket.view'], is_default: false }),
  role('customer', 'Customer', { user_count: 3, permissions: ['ticket.create', 'ticket.view'] }),
]

function renderPage() {
  return renderWithProviders(<RolesPage />, { route: '/roles', user: makeUser('super-admin') })
}

const checkbox = (label) => screen.getByRole('checkbox', { name: new RegExp(`^${label}`) })

async function open() {
  renderPage()
  await screen.findByRole('heading', { level: 2, name: 'Agent' })
}

describe('RolesPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    api.fetchRolesAndCatalog.mockResolvedValue({ roles: ROLES, groups: GROUPS })
    api.fetchRoleHistory.mockResolvedValue([])
  })

  it('lists the roles with their people, and marks the ones you cannot change', async () => {
    await open()
    const nav = screen.getByRole('navigation', { name: 'Roles' })

    expect(within(nav).getByRole('button', { name: /^Super Admin/ })).toHaveTextContent('Read only')
    expect(within(nav).getByRole('button', { name: /^Admin\b/ })).toHaveTextContent('Read only')
    expect(within(nav).getByRole('button', { name: /^Agent/ })).toHaveTextContent('2 people · customised')
    expect(within(nav).getByRole('button', { name: /^Customer/ })).toHaveTextContent('3 people')
    expect(within(nav).getByRole('button', { name: /^Super Admin/ })).toHaveTextContent('1 person')
    // The first role you may change is selected.
    expect(within(nav).getByRole('button', { name: /^Agent/ })).toHaveAttribute('aria-current', 'true')
  })

  it("shows the selected role's permissions grouped, with what each one means", async () => {
    await open()

    expect(screen.getByRole('heading', { name: 'Tickets' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Reports and activity' })).toBeInTheDocument()
    expect(checkbox('View tickets')).toBeChecked()
    expect(checkbox('Write and read internal notes')).toBeChecked()
    expect(checkbox('View every ticket')).not.toBeChecked()
    expect(screen.getByText('View every ticket description.')).toBeInTheDocument()
    expect(screen.getAllByText('Sensitive').length).toBeGreaterThan(0)
  })

  it('explains why a permission cannot be switched', async () => {
    await open()

    // Not used by any feature yet
    expect(checkbox('Edit ticket details')).toBeDisabled()
    expect(screen.getByText('Not used by any feature yet')).toBeInTheDocument()
    // Required for the role
    expect(checkbox('View tickets')).toBeDisabled()
    expect(screen.getAllByText('Required: this role cannot work without it').length).toBeGreaterThan(0)
    // The editor does not hold it themselves
    expect(checkbox('View reports')).toBeDisabled()
    expect(screen.getByText("You don't hold this permission, so you can't grant it")).toBeInTheDocument()
    // Ordinary ones are free to toggle
    expect(checkbox('View every ticket')).toBeEnabled()
  })

  it('never lets staff permissions be switched on for the Customer role', async () => {
    const user = userEvent.setup()
    await open()

    await user.click(within(screen.getByRole('navigation', { name: 'Roles' })).getByRole('button', { name: /^Customer/ }))

    expect(await screen.findByRole('heading', { level: 2, name: 'Customer' })).toBeInTheDocument()
    expect(checkbox('View every ticket')).toBeDisabled()
    expect(checkbox('Write and read internal notes')).toBeDisabled()
    expect(screen.getAllByText('Can never be given to the Customer role').length).toBeGreaterThan(0)
    expect(checkbox('Open tickets')).toBeDisabled() // required
  })

  it('shows what is changed and lets you discard it', async () => {
    const user = userEvent.setup()
    await open()
    const save = screen.getByRole('button', { name: 'Save changes' })
    expect(save).toBeDisabled()
    expect(screen.getByText('No unsaved changes')).toBeInTheDocument()

    await user.click(checkbox('View every ticket'))
    await user.click(checkbox('Write and read internal notes'))

    expect(screen.getByText('1 to add, 1 to remove')).toBeInTheDocument()
    expect(save).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Discard changes' }))
    expect(screen.getByText('No unsaved changes')).toBeInTheDocument()
    expect(checkbox('View every ticket')).not.toBeChecked()
    expect(checkbox('Write and read internal notes')).toBeChecked()
  })

  it('asks for confirmation listing exactly what changes, then saves the whole set with the version', async () => {
    const user = userEvent.setup()
    await open()
    api.updateRolePermissions.mockResolvedValue({
      message: 'Permissions updated.',
      added: ['ticket.view_all'],
      removed: ['ticket.internal_note'],
      role: { ...ROLES[2], permissions: ['ticket.view', 'ticket.view_all'], version: 'v-agent-2' },
    })

    await user.click(checkbox('View every ticket'))
    await user.click(checkbox('Write and read internal notes'))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Change the Agent role?')).toBeInTheDocument()
    expect(within(dialog).getByText(/immediately for the 2 people with this role/)).toBeInTheDocument()
    expect(within(within(dialog).getByText('Will be added').parentElement).getByText('View every ticket')).toBeInTheDocument()
    expect(within(within(dialog).getByText('Will be removed').parentElement).getByText('Write and read internal notes')).toBeInTheDocument()
    expect(within(dialog).getByText('Sensitive access')).toBeInTheDocument() // view_all is sensitive
    expect(api.updateRolePermissions).not.toHaveBeenCalled() // nothing is sent before confirming

    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(api.updateRolePermissions).toHaveBeenCalledWith('agent', expect.arrayContaining(['ticket.view', 'ticket.view_all']), 'v-agent'))
    expect(api.updateRolePermissions.mock.calls[0][1]).toHaveLength(2)
    expect(toast.success).toHaveBeenCalledWith('Permissions updated.')
    expect(api.fetchRolesAndCatalog).toHaveBeenCalledTimes(2) // reloaded to pick up the new version
    await waitFor(() => expect(api.fetchRoleHistory).toHaveBeenCalledTimes(2))
  })

  it('does not warn about sensitive access when only ordinary permissions are added', async () => {
    const user = userEvent.setup()
    api.fetchRolesAndCatalog.mockResolvedValue({
      roles: ROLES,
      groups: [{ key: 'x', label: 'Extras', permissions: [perm('ticket.reply', 'Reply to tickets', { allowed_for: ['agent'] })] }],
    })
    await open()

    await user.click(checkbox('Reply to tickets'))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(screen.queryByText('Sensitive access')).not.toBeInTheDocument()
  })

  it('shows the server\'s reasons and keeps the draft when a change is refused (422)', async () => {
    const user = userEvent.setup()
    await open()
    api.updateRolePermissions.mockRejectedValue({ status: 422, message: 'Invalid', errors: { permissions: ['"View every ticket" (ticket.view_all) can never be given to the Agent role.'] } })

    await user.click(checkbox('View every ticket'))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('This change was not saved')).toBeInTheDocument()
    expect(screen.getByText(/can never be given to the Agent role/)).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(checkbox('View every ticket')).toBeChecked() // the draft is still there
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('tells you when someone else changed the role, and reloads on request (409)', async () => {
    const user = userEvent.setup()
    await open()
    api.updateRolePermissions.mockRejectedValue({ status: 409, code: 'stale_version', message: 'This role was changed by someone else. Reload to see the current permissions, then try again.' })

    await user.click(checkbox('View every ticket'))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Someone else changed this role')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Load the current permissions' }))

    await waitFor(() => expect(api.fetchRolesAndCatalog).toHaveBeenCalledTimes(2))
  })

  it('is read-only for a role you may not change, and says why', async () => {
    const user = userEvent.setup()
    await open()

    await user.click(within(screen.getByRole('navigation', { name: 'Roles' })).getByRole('button', { name: /^Admin\b/ }))

    expect(await screen.findByRole('heading', { level: 2, name: 'Admin' })).toBeInTheDocument()
    expect(screen.getByText('You cannot change your own role or a higher one.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reset to defaults' })).not.toBeInTheDocument()
    expect(checkbox('View every ticket')).toBeChecked()
    screen.getAllByRole('checkbox').forEach((box) => expect(box).toBeDisabled())
  })

  it('shows the Super Admin with everything on and nothing switchable', async () => {
    const user = userEvent.setup()
    await open()

    await user.click(within(screen.getByRole('navigation', { name: 'Roles' })).getByRole('button', { name: /^Super Admin/ }))

    expect(await screen.findByText(/always has every permission and cannot be changed/)).toBeInTheDocument()
    screen.getAllByRole('checkbox').forEach((box) => {
      expect(box).toBeChecked()
      expect(box).toBeDisabled()
    })
  })

  it('says so when nothing at all can be changed', async () => {
    api.fetchRolesAndCatalog.mockResolvedValue({ roles: ROLES.map((r) => ({ ...r, editable: false, locked_reason: 'You do not have permission to change roles.' })), groups: GROUPS })
    renderPage()

    expect(await screen.findByText('You can look at the roles but not change them.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument()
  })

  it('resets a customised role to its defaults after confirmation', async () => {
    const user = userEvent.setup()
    await open()
    api.resetRole.mockResolvedValue({ message: 'Permissions reset to the defaults.', added: [], removed: [], role: { ...ROLES[2], is_default: true, version: 'v-agent-3' } })

    await user.click(screen.getByRole('button', { name: 'Reset to defaults' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Reset the Agent role to its defaults?')).toBeInTheDocument()
    expect(api.resetRole).not.toHaveBeenCalled()

    await user.click(within(dialog).getByRole('button', { name: 'Reset to defaults' }))

    await waitFor(() => expect(api.resetRole).toHaveBeenCalledWith('agent', 'v-agent'))
    expect(toast.success).toHaveBeenCalledWith('Permissions reset to the defaults.')
  })

  it('offers no reset for a role that is already at its defaults', async () => {
    const user = userEvent.setup()
    await open()

    await user.click(within(screen.getByRole('navigation', { name: 'Roles' })).getByRole('button', { name: /^Customer/ }))

    await screen.findByRole('heading', { level: 2, name: 'Customer' })
    expect(screen.queryByRole('button', { name: 'Reset to defaults' })).not.toBeInTheDocument()
  })

  it('lists recent changes with readable names', async () => {
    api.fetchRoleHistory.mockResolvedValue([
      { id: 2, action: 'reset', actor: { id: 1, name: 'Ada Super' }, added: ['ticket.internal_note'], removed: [], created_at: '2026-09-21T10:00:00Z' },
      { id: 1, action: 'updated', actor: null, added: ['ticket.view_all'], removed: ['report.view'], created_at: '2026-09-20T10:00:00Z' },
    ])
    await open()

    const history = await screen.findByRole('region', { name: 'Recent changes' })
    expect(within(history).getByText('Ada Super')).toBeInTheDocument()
    expect(within(history).getByText(/reset the role to its defaults/)).toBeInTheDocument()
    expect(within(history).getByText('Added: Write and read internal notes')).toBeInTheDocument()
    expect(within(history).getByText('A former team member')).toBeInTheDocument()
    expect(within(history).getByText('Added: View every ticket')).toBeInTheDocument()
    expect(within(history).getByText('Removed: View reports')).toBeInTheDocument()
    expect(api.fetchRoleHistory).toHaveBeenCalledWith('agent')
  })

  it('says so when a role has never been changed', async () => {
    await open()

    expect(await screen.findByText(/No changes yet/)).toBeInTheDocument()
  })

  it('offers a retry when loading fails', async () => {
    const user = userEvent.setup()
    api.fetchRolesAndCatalog.mockRejectedValueOnce({ status: 500, message: 'Server error' })
    renderPage()

    expect(await screen.findByText('Server error')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(await screen.findByRole('heading', { level: 2, name: 'Agent' })).toBeInTheDocument()
  })

  it('shows the access-denied page on a 403 (the API is the real check)', async () => {
    api.fetchRolesAndCatalog.mockRejectedValue({ status: 403, message: 'Forbidden' })
    renderPage()

    expect(await screen.findByText("You don't have access to this page")).toBeInTheDocument()
  })
})
