import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import toast from 'react-hot-toast'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeUser, renderWithProviders } from '../../../test/utils'
import * as api from '../ticketsApi'
import { TicketDetailPage } from '../pages/TicketDetailPage'

vi.mock('../ticketsApi')
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))

const TICKET = {
  id: 5,
  number: 'TCK-000005',
  subject: 'Cannot log in',
  description: 'Help',
  status: 'open',
  priority: 'medium',
  department: { id: 1, name: 'Billing' },
  customer: { id: 8, name: 'Cara Customer', email: 'cara@example.com' },
  assignee: null,
  created_at: '2026-03-20T09:00:00Z',
  updated_at: '2026-03-20T09:00:00Z',
  resolved_at: null,
  closed_at: null,
}

const ability = (overrides = {}) => ({
  allowed_statuses: [],
  can_change_status: false,
  can_change_priority: false,
  can_assign: false,
  ...overrides,
})

const AGENTS = [
  { id: 9, name: 'Alex Agent', email: 'alex@example.com' },
  { id: 10, name: 'Bea Agent', email: 'bea@example.com' },
]

const payload = (ticket = TICKET, abilities = ability(), events = []) => ({ ticket, abilities, events })

function renderPage(viewer = makeUser('admin')) {
  return renderWithProviders(
    <Routes>
      <Route path="/tickets/:id" element={<TicketDetailPage />} />
    </Routes>,
    { route: '/tickets/5', user: viewer },
  )
}

const buttonNames = () =>
  within(screen.getByRole('region', { name: 'Actions' }))
    .getAllByRole('button')
    .map((button) => button.textContent)

describe('TicketActions', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    api.fetchAssignableAgents.mockResolvedValue(AGENTS)
  })

  describe('status', () => {
    it('offers exactly the moves the API allows, with clear labels', async () => {
      api.getTicket.mockResolvedValue(payload(TICKET, ability({ can_change_status: true, allowed_statuses: ['in_progress', 'resolved', 'closed'] })))
      renderPage()

      await screen.findByRole('region', { name: 'Actions' })
      expect(buttonNames()).toEqual(['Start progress', 'Mark resolved', 'Close ticket'])
    })

    it('applies a change and refreshes the ticket, the moves and the history from the response', async () => {
      const user = userEvent.setup()
      api.getTicket.mockResolvedValue(payload(TICKET, ability({ can_change_status: true, allowed_statuses: ['in_progress', 'resolved', 'closed'] })))
      api.updateTicketStatus.mockResolvedValue({
        message: 'Status updated.',
        ...payload(
          { ...TICKET, status: 'in_progress' },
          ability({ can_change_status: true, allowed_statuses: ['open', 'resolved', 'closed'] }),
          [{ id: 1, type: 'status_changed', from: 'open', to: 'in_progress', assignee_name: null, actor: { id: 2, name: 'Ada Admin' }, created_at: '2026-03-21T09:00:00Z' }],
        ),
      })
      renderPage()

      await user.click(await screen.findByRole('button', { name: 'Start progress' }))

      await waitFor(() => expect(api.updateTicketStatus).toHaveBeenCalledWith(5, 'in_progress'))
      expect(await screen.findByText('In progress')).toBeInTheDocument()
      expect(buttonNames()).toEqual(['Move back to open', 'Mark resolved', 'Close ticket'])
      expect(screen.getByText('Ada Admin changed the status from Open to In progress.')).toBeInTheDocument()
      expect(toast.success).toHaveBeenCalledWith('Status updated.')
    })

    it('asks before closing, and only then calls the API', async () => {
      const user = userEvent.setup()
      api.getTicket.mockResolvedValue(payload(TICKET, ability({ can_change_status: true, allowed_statuses: ['closed'] })))
      api.updateTicketStatus.mockResolvedValue({ message: 'Status updated.', ...payload({ ...TICKET, status: 'closed' }, ability({ can_change_status: true, allowed_statuses: ['in_progress'] })) })
      renderPage()

      await user.click(await screen.findByRole('button', { name: 'Close ticket' }))
      const dialog = await screen.findByRole('dialog')
      expect(api.updateTicketStatus).not.toHaveBeenCalled()

      await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
      expect(api.updateTicketStatus).not.toHaveBeenCalled()

      await user.click(screen.getByRole('button', { name: 'Close ticket' }))
      await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Close ticket' }))

      await waitFor(() => expect(api.updateTicketStatus).toHaveBeenCalledWith(5, 'closed'))
      expect(await screen.findByText('Closed', { selector: 'span' })).toBeInTheDocument()
    })

    it('lets a customer close or reopen a resolved ticket, and nothing else', async () => {
      api.getTicket.mockResolvedValue(payload({ ...TICKET, status: 'resolved' }, ability({ can_change_status: true, allowed_statuses: ['closed', 'open'] })))
      renderPage(makeUser('customer'))

      await screen.findByRole('region', { name: 'Actions' })
      expect(buttonNames()).toEqual(['Close ticket', 'Reopen'])
      expect(screen.queryByLabelText('Priority')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Assigned to')).not.toBeInTheDocument()
    })

    it('labels reopening a closed ticket', async () => {
      api.getTicket.mockResolvedValue(payload({ ...TICKET, status: 'closed' }, ability({ can_change_status: true, allowed_statuses: ['in_progress'] })))
      renderPage()

      await screen.findByRole('region', { name: 'Actions' })
      expect(buttonNames()).toEqual(['Reopen'])
    })

    it('reports a refused change and keeps the ticket as it was', async () => {
      const user = userEvent.setup()
      api.getTicket.mockResolvedValue(payload(TICKET, ability({ can_change_status: true, allowed_statuses: ['resolved'] })))
      api.updateTicketStatus.mockRejectedValue({ status: 422, code: 'invalid_transition', message: 'This ticket cannot be moved to that status.', errors: {} })
      renderPage()

      await user.click(await screen.findByRole('button', { name: 'Mark resolved' }))

      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('This ticket cannot be moved to that status.'))
      expect(screen.getByRole('button', { name: 'Mark resolved' })).toBeEnabled()
      expect(screen.getAllByText('Open').length).toBeGreaterThan(0)
    })
  })

  describe('priority', () => {
    it('is only offered when the API says so', async () => {
      api.getTicket.mockResolvedValue(payload(TICKET, ability({ can_change_status: true, allowed_statuses: ['closed'] })))
      renderPage()

      await screen.findByRole('region', { name: 'Actions' })
      expect(screen.queryByLabelText('Priority')).not.toBeInTheDocument()
    })

    it('changes the priority and shows the new one', async () => {
      const user = userEvent.setup()
      api.getTicket.mockResolvedValue(payload(TICKET, ability({ can_change_priority: true })))
      api.updateTicketPriority.mockResolvedValue({ message: 'Priority updated.', ...payload({ ...TICKET, priority: 'urgent' }, ability({ can_change_priority: true })) })
      renderPage()

      await user.selectOptions(await screen.findByLabelText('Priority'), 'urgent')

      await waitFor(() => expect(api.updateTicketPriority).toHaveBeenCalledWith(5, 'urgent'))
      expect(await screen.findByText('Urgent', { selector: 'span' })).toBeInTheDocument()
    })
  })

  describe('assignment', () => {
    it('lists the eligible agents, and says which pool they come from', async () => {
      api.getTicket.mockResolvedValue(payload(TICKET, ability({ can_assign: true })))
      renderPage()

      const select = await screen.findByLabelText('Assigned to')
      await screen.findByRole('option', { name: 'Alex Agent' })
      expect(within(select).getAllByRole('option').map((o) => o.textContent)).toEqual(['Unassigned', 'Alex Agent', 'Bea Agent'])
      expect(screen.getByText('Agents in Billing.')).toBeInTheDocument()
      expect(api.fetchAssignableAgents).toHaveBeenCalledWith(5)
    })

    it('assigns an agent, then unassigns', async () => {
      const user = userEvent.setup()
      api.getTicket.mockResolvedValue(payload(TICKET, ability({ can_assign: true })))
      api.updateTicketAssignee.mockResolvedValueOnce({ message: 'Ticket assigned.', ...payload({ ...TICKET, assignee: { id: 9, name: 'Alex Agent' } }, ability({ can_assign: true })) })
      api.updateTicketAssignee.mockResolvedValueOnce({ message: 'Ticket unassigned.', ...payload(TICKET, ability({ can_assign: true })) })
      renderPage()

      await screen.findByRole('option', { name: 'Alex Agent' })
      await user.selectOptions(screen.getByLabelText('Assigned to'), 'Alex Agent')
      await waitFor(() => expect(api.updateTicketAssignee).toHaveBeenLastCalledWith(5, 9))
      await waitFor(() => expect(screen.getByLabelText('Assigned to')).toHaveValue('9'))

      await user.selectOptions(screen.getByLabelText('Assigned to'), 'Unassigned')
      await waitFor(() => expect(api.updateTicketAssignee).toHaveBeenLastCalledWith(5, null))
    })

    it('keeps a current assignee selectable even if they are no longer eligible', async () => {
      api.getTicket.mockResolvedValue(payload({ ...TICKET, assignee: { id: 77, name: 'Former Member' } }, ability({ can_assign: true })))
      renderPage()

      const select = await screen.findByLabelText('Assigned to')
      await screen.findByRole('option', { name: 'Bea Agent' })
      expect(within(select).getByRole('option', { name: 'Former Member' })).toBeInTheDocument()
      expect(select).toHaveValue('77')
    })

    it('shows the backend reason when an agent is refused', async () => {
      const user = userEvent.setup()
      api.getTicket.mockResolvedValue(payload(TICKET, ability({ can_assign: true })))
      api.updateTicketAssignee.mockRejectedValue({
        status: 422,
        message: 'Invalid',
        errors: { assignee_id: ["Choose an active agent who belongs to this ticket's department."] },
      })
      renderPage()

      await screen.findByRole('option', { name: 'Alex Agent' })
      await user.selectOptions(screen.getByLabelText('Assigned to'), 'Alex Agent')

      await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Choose an active agent who belongs to this ticket's department."))
      expect(screen.getByLabelText('Assigned to')).toBeEnabled()
    })
  })

  describe('closed tickets', () => {
    it('are read-only for staff apart from reopening', async () => {
      api.getTicket.mockResolvedValue(payload({ ...TICKET, status: 'closed' }, ability({ can_change_status: true, allowed_statuses: ['in_progress'], can_change_priority: false, can_assign: false })))
      renderPage()

      await screen.findByRole('region', { name: 'Actions' })
      expect(screen.queryByLabelText('Priority')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Assigned to')).not.toBeInTheDocument()
      expect(buttonNames()).toEqual(['Reopen'])
    })
  })

  describe('history', () => {
    it('starts with when the ticket was opened and lists each change in order', async () => {
      api.getTicket.mockResolvedValue(
        payload(TICKET, ability(), [
          { id: 1, type: 'assigned', from: null, to: null, assignee_name: 'Alex Agent', actor: { id: 2, name: 'Ada Admin' }, created_at: '2026-03-20T10:00:00Z' },
          { id: 2, type: 'priority_changed', from: 'medium', to: 'urgent', assignee_name: null, actor: { id: 2, name: 'Ada Admin' }, created_at: '2026-03-20T11:00:00Z' },
          { id: 3, type: 'unassigned', from: 'Alex Agent', to: null, assignee_name: null, actor: null, created_at: '2026-03-20T12:00:00Z' },
        ]),
      )
      renderPage()

      const history = await screen.findByRole('region', { name: 'History' })
      const items = within(history).getAllByRole('listitem').map((li) => li.querySelector('p').textContent)

      expect(items).toEqual([
        'Ticket opened.',
        'Ada Admin assigned the ticket to Alex Agent.',
        'Ada Admin changed the priority from Medium to Urgent.',
        'A former team member unassigned the ticket (was Alex Agent).',
      ])
    })
  })
})
