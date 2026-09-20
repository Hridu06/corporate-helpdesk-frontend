import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeUser, renderWithProviders } from '../../../test/utils'
import * as api from '../departmentsApi'
import { DepartmentsPage } from './DepartmentsPage'

vi.mock('../departmentsApi')

const DEPARTMENTS = [
  { id: 1, name: 'Billing', description: 'Invoices and refunds', is_active: true, members_count: 2 },
  { id: 2, name: 'Legacy', description: null, is_active: false, members_count: 0 },
]

const STAFF = [
  { id: 10, name: 'Alex Agent', email: 'alex@example.com', roles: ['agent'] },
  { id: 11, name: 'Bea Boss', email: 'bea@example.com', roles: ['admin'] },
  { id: 12, name: 'Cy Coder', email: 'cy@example.com', roles: ['agent'] },
]

const page = (rows) => ({
  data: rows,
  meta: { current_page: 1, last_page: 1, per_page: 15, total: rows.length, from: rows.length ? 1 : 0, to: rows.length },
})

const buttonsIn = (name) =>
  within(screen.getByText(name, { selector: 'p' }).closest('tr'))
    .queryAllByRole('button')
    .map((button) => button.textContent.replace(/\s+/g, ' ').trim())

async function renderPage(viewer, rows = DEPARTMENTS) {
  api.listDepartments.mockResolvedValue(page(rows))
  renderWithProviders(<DepartmentsPage />, { user: viewer })
  if (rows.length) await screen.findByText(rows[0].name, { selector: 'p' })
}

describe('DepartmentsPage', () => {
  beforeEach(() => vi.resetAllMocks())

  it('lists departments with status and member counts', async () => {
    await renderPage(makeUser('admin'))

    expect(screen.getByText('Invoices and refunds')).toBeInTheDocument()
    const billing = within(screen.getByText('Billing', { selector: 'p' }).closest('tr'))
    expect(billing.getByText('Active')).toBeInTheDocument()
    expect(billing.getByText('2')).toBeInTheDocument()
    expect(within(screen.getByText('Legacy', { selector: 'p' }).closest('tr')).getByText('Inactive')).toBeInTheDocument()
  })

  describe('actions follow the viewer’s permissions', () => {
    it('an agent (view only) can only open details, and cannot create', async () => {
      await renderPage(makeUser('agent'))

      expect(buttonsIn('Billing')).toEqual(['Details Billing'])
      expect(screen.queryByRole('button', { name: 'New department' })).not.toBeInTheDocument()
    })

    it('a default admin (view + update) can also manage members and edit, but not delete or create', async () => {
      await renderPage(makeUser('admin'))

      expect(buttonsIn('Billing')).toEqual(['Details Billing', 'Members Billing', 'Edit Billing'])
      expect(screen.queryByRole('button', { name: 'New department' })).not.toBeInTheDocument()
    })

    it('a super admin sees everything', async () => {
      await renderPage(makeUser('super-admin'))

      expect(buttonsIn('Billing')).toEqual(['Details Billing', 'Members Billing', 'Edit Billing', 'Delete Billing'])
      expect(screen.getByRole('button', { name: 'New department' })).toBeInTheDocument()
    })
  })

  it('passes filters to the API and returns to page 1', async () => {
    const user = userEvent.setup()
    await renderPage(makeUser('admin'))

    await user.selectOptions(screen.getByLabelText('Status'), 'inactive')

    await waitFor(() =>
      expect(api.listDepartments).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'inactive', page: 1 }),
        expect.anything(),
      ),
    )
  })

  it('explains an empty list differently for managers and for members', async () => {
    api.listDepartments.mockResolvedValue(page([]))
    const { unmount } = renderWithProviders(<DepartmentsPage />, { user: makeUser('super-admin') })
    expect(await screen.findByText(/create the first department/i)).toBeInTheDocument()
    unmount()

    renderWithProviders(<DepartmentsPage />, { user: makeUser('agent') })
    expect(await screen.findByText(/not a member of any department/i)).toBeInTheDocument()
  })

  it('shows the error with a working Retry', async () => {
    const user = userEvent.setup()
    api.listDepartments.mockRejectedValueOnce({ status: 500, message: 'Server exploded', errors: {} })
    api.listDepartments.mockResolvedValue(page(DEPARTMENTS))
    renderWithProviders(<DepartmentsPage />, { user: makeUser('admin') })

    expect(await screen.findByText('Server exploded')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(await screen.findByText('Billing', { selector: 'p' })).toBeInTheDocument()
  })

  describe('create and edit', () => {
    it('validates before calling the API, then creates and refreshes the list', async () => {
      const user = userEvent.setup()
      api.createDepartment.mockResolvedValue({ message: 'Department created.' })
      await renderPage(makeUser('super-admin'))

      await user.click(screen.getByRole('button', { name: 'New department' }))
      const dialog = await screen.findByRole('dialog')
      await user.click(within(dialog).getByRole('button', { name: 'Create department' }))
      expect(await within(dialog).findByText('Name is required')).toBeInTheDocument()
      expect(api.createDepartment).not.toHaveBeenCalled()

      await user.type(within(dialog).getByLabelText('Name'), 'Sales')
      await user.click(within(dialog).getByRole('button', { name: 'Create department' }))

      await waitFor(() =>
        expect(api.createDepartment).toHaveBeenCalledWith({ name: 'Sales', description: null, is_active: true }),
      )
      await waitFor(() => expect(api.listDepartments).toHaveBeenCalledTimes(2))
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    })

    it('shows the backend error under the field for a duplicate name', async () => {
      const user = userEvent.setup()
      api.createDepartment.mockRejectedValue({ status: 422, message: 'Invalid', errors: { name: ['The name has already been taken.'] } })
      await renderPage(makeUser('super-admin'))

      await user.click(screen.getByRole('button', { name: 'New department' }))
      const dialog = await screen.findByRole('dialog')
      await user.type(within(dialog).getByLabelText('Name'), 'Billing')
      await user.click(within(dialog).getByRole('button', { name: 'Create department' }))

      expect(await within(dialog).findByText('The name has already been taken.')).toBeInTheDocument()
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('edits with the current values prefilled', async () => {
      const user = userEvent.setup()
      api.updateDepartment.mockResolvedValue({ message: 'Department updated.' })
      await renderPage(makeUser('admin'))

      await user.click(screen.getByRole('button', { name: 'Edit Billing' }))
      const dialog = await screen.findByRole('dialog')
      expect(within(dialog).getByLabelText('Name')).toHaveValue('Billing')
      expect(within(dialog).getByLabelText('Description')).toHaveValue('Invoices and refunds')
      expect(within(dialog).getByLabelText(/active/i)).toBeChecked()

      await user.click(within(dialog).getByLabelText(/active/i))
      await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))

      await waitFor(() =>
        expect(api.updateDepartment).toHaveBeenCalledWith(1, { name: 'Billing', description: 'Invoices and refunds', is_active: false }),
      )
    })

    it('sends null when the description is cleared', async () => {
      const user = userEvent.setup()
      api.updateDepartment.mockResolvedValue({ message: 'Department updated.' })
      await renderPage(makeUser('admin'))

      await user.click(screen.getByRole('button', { name: 'Edit Billing' }))
      const dialog = await screen.findByRole('dialog')
      await user.clear(within(dialog).getByLabelText('Description'))
      await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))

      await waitFor(() => expect(api.updateDepartment).toHaveBeenCalledWith(1, expect.objectContaining({ description: null })))
    })
  })

  describe('delete', () => {
    it('asks for confirmation, then deletes and refreshes', async () => {
      const user = userEvent.setup()
      api.deleteDepartment.mockResolvedValue({ message: 'Department deleted.' })
      await renderPage(makeUser('super-admin'))

      await user.click(screen.getByRole('button', { name: 'Delete Legacy' }))
      const dialog = await screen.findByRole('dialog')
      expect(api.deleteDepartment).not.toHaveBeenCalled()
      await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

      await waitFor(() => expect(api.deleteDepartment).toHaveBeenCalledWith(2))
      await waitFor(() => expect(api.listDepartments).toHaveBeenCalledTimes(2))
    })

    it('does nothing when cancelled', async () => {
      const user = userEvent.setup()
      await renderPage(makeUser('super-admin'))

      await user.click(screen.getByRole('button', { name: 'Delete Legacy' }))
      await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }))

      expect(api.deleteDepartment).not.toHaveBeenCalled()
    })

    it('closes the dialog and keeps the list when the backend refuses', async () => {
      const user = userEvent.setup()
      api.deleteDepartment.mockRejectedValue({ status: 422, code: 'department_has_members', message: 'Still has members', errors: {} })
      await renderPage(makeUser('super-admin'))

      await user.click(screen.getByRole('button', { name: 'Delete Billing' }))
      await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }))

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      expect(api.listDepartments).toHaveBeenCalledTimes(1)
      expect(screen.getByText('Billing', { selector: 'p' })).toBeInTheDocument()
    })
  })

  describe('members', () => {
    beforeEach(() => {
      api.fetchAssignableStaff.mockResolvedValue(STAFF)
    })

    it('pre-selects current members and saves the changed selection', async () => {
      const user = userEvent.setup()
      api.getDepartment.mockResolvedValue({ ...DEPARTMENTS[0], members: [{ id: 10, name: 'Alex Agent', email: 'alex@example.com', roles: ['agent'] }] })
      api.updateDepartmentMembers.mockResolvedValue({ message: 'Members updated.' })
      await renderPage(makeUser('admin'))

      await user.click(screen.getByRole('button', { name: 'Members Billing' }))
      const dialog = await screen.findByRole('dialog')
      const alex = await within(dialog).findByRole('checkbox', { name: /alex agent/i })
      expect(alex).toBeChecked()
      expect(within(dialog).getByRole('checkbox', { name: /bea boss/i })).not.toBeChecked()

      await user.click(within(dialog).getByRole('checkbox', { name: /bea boss/i }))
      await user.click(alex)
      await user.click(within(dialog).getByRole('button', { name: 'Save members' }))

      await waitFor(() => expect(api.updateDepartmentMembers).toHaveBeenCalledWith(1, [11]))
    })

    it('filters the staff list', async () => {
      const user = userEvent.setup()
      api.getDepartment.mockResolvedValue({ ...DEPARTMENTS[0], members: [] })
      await renderPage(makeUser('admin'))

      await user.click(screen.getByRole('button', { name: 'Members Billing' }))
      const dialog = await screen.findByRole('dialog')
      await within(dialog).findByRole('checkbox', { name: /alex agent/i })
      await user.type(within(dialog).getByLabelText('Filter staff'), 'cy@')

      expect(within(dialog).getAllByRole('checkbox')).toHaveLength(1)
      expect(within(dialog).getByRole('checkbox', { name: /cy coder/i })).toBeInTheDocument()
    })

    it('warns about members who are no longer eligible and drops them on save', async () => {
      const user = userEvent.setup()
      api.getDepartment.mockResolvedValue({
        ...DEPARTMENTS[0],
        members: [
          { id: 10, name: 'Alex Agent', email: 'alex@example.com', roles: ['agent'] },
          { id: 99, name: 'Gone Guy', email: 'gone@example.com', roles: ['agent'] },
        ],
      })
      api.updateDepartmentMembers.mockResolvedValue({ message: 'Members updated.' })
      await renderPage(makeUser('admin'))

      await user.click(screen.getByRole('button', { name: 'Members Billing' }))
      const dialog = await screen.findByRole('dialog')
      expect(await within(dialog).findByText(/1 current member is no longer eligible/i)).toBeInTheDocument()

      await user.click(within(dialog).getByRole('button', { name: 'Save members' }))
      await waitFor(() => expect(api.updateDepartmentMembers).toHaveBeenCalledWith(1, [10]))
    })

    it('shows the backend error when saving fails', async () => {
      const user = userEvent.setup()
      api.getDepartment.mockResolvedValue({ ...DEPARTMENTS[0], members: [] })
      api.updateDepartmentMembers.mockRejectedValue({ status: 422, message: 'Invalid', errors: { user_ids: ['Only active agents and admins can be department members.'] } })
      await renderPage(makeUser('admin'))

      await user.click(screen.getByRole('button', { name: 'Members Billing' }))
      const dialog = await screen.findByRole('dialog')
      await user.click(await within(dialog).findByRole('checkbox', { name: /alex agent/i }))
      await user.click(within(dialog).getByRole('button', { name: 'Save members' }))

      expect(await within(dialog).findByText(/only active agents and admins/i)).toBeInTheDocument()
    })
  })

  it('shows read-only details with the member list', async () => {
    const user = userEvent.setup()
    api.getDepartment.mockResolvedValue({
      ...DEPARTMENTS[0],
      members: [{ id: 10, name: 'Alex Agent', email: 'alex@example.com', roles: ['agent'] }],
    })
    await renderPage(makeUser('agent'))

    await user.click(screen.getByRole('button', { name: 'Details Billing' }))
    const dialog = await screen.findByRole('dialog')

    expect(await within(dialog).findByText('Members (1)')).toBeInTheDocument()
    expect(within(dialog).getByText('alex@example.com')).toBeInTheDocument()
    expect(api.getDepartment).toHaveBeenCalledWith(1)
  })
})
