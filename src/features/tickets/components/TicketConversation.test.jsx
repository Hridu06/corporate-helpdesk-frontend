import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import toast from 'react-hot-toast'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeUser, renderWithProviders } from '../../../test/utils'
import { TicketDetailPage } from '../pages/TicketDetailPage'
import * as api from '../ticketsApi'

vi.mock('../ticketsApi')
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))

const TICKET = {
  id: 5,
  number: 'TCK-000005',
  subject: 'Cannot log in',
  description: 'Help',
  status: 'open',
  priority: 'medium',
  department: null,
  customer: { id: 8, name: 'Cara Customer', email: 'cara@example.com' },
  assignee: null,
  created_at: '2026-03-20T09:00:00Z',
  updated_at: '2026-03-20T09:00:00Z',
  resolved_at: null,
  closed_at: null,
}

const abilities = (overrides = {}) => ({
  allowed_statuses: [],
  can_change_status: false,
  can_change_priority: false,
  can_assign: false,
  can_reply: false,
  can_add_note: false,
  can_view_notes: false,
  ...overrides,
})

const message = (id, overrides = {}) => ({
  id,
  type: 'public_reply',
  body: `body ${id}`,
  author: { id: 8, name: 'Cara Customer', role: 'customer' },
  created_at: '2026-03-21T09:00:00Z',
  ...overrides,
})

function renderPage(viewer, ticket = TICKET, ability = abilities(), messages = [], hasMore = false) {
  api.getTicket.mockResolvedValue({ ticket, abilities: ability, events: [] })
  api.listMessages.mockResolvedValue({ data: messages, has_more: hasMore })

  return renderWithProviders(
    <Routes>
      <Route path="/tickets/:id" element={<TicketDetailPage />} />
    </Routes>,
    { route: '/tickets/5', user: viewer },
  )
}

describe('ticket conversation', () => {
  beforeEach(() => vi.resetAllMocks())

  it('shows an empty state and no composer without the abilities', async () => {
    renderPage(makeUser('customer'))

    expect(await screen.findByText('No replies yet.')).toBeInTheDocument()
    expect(screen.queryByRole('form', { name: /add to the conversation/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('renders public replies and internal notes distinctly, as plain text', async () => {
    renderPage(makeUser('agent'), TICKET, abilities({ can_view_notes: true }), [
      message(1, { body: '<b>hi</b>\nsecond line' }),
      message(2, { type: 'internal_note', body: 'Check the logs', author: { id: 9, name: 'Alex Agent', role: 'agent' } }),
    ])

    const list = await screen.findByRole('list', { name: 'Messages' })
    const [reply, note] = within(list).getAllByRole('listitem')

    expect(within(reply).getByText('Public reply')).toBeInTheDocument()
    expect(within(reply).getByText('Customer')).toBeInTheDocument()
    expect(within(reply).getByText(/<b>hi<\/b>/)).toBeInTheDocument() // escaped, not rendered as HTML
    expect(within(reply).queryByRole('strong')).not.toBeInTheDocument()
    expect(within(note).getByText('Internal note · Staff only')).toBeInTheDocument()
    expect(within(note).getByText('Check the logs')).toBeInTheDocument()
    expect(within(note).getByText('Agent')).toBeInTheDocument()
  })

  it('offers only a reply composer to a customer', async () => {
    renderPage(makeUser('customer'), TICKET, abilities({ can_reply: true }))

    expect(await screen.findByRole('textbox', { name: 'Reply' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send reply' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Internal note' })).not.toBeInTheDocument()
    expect(screen.queryByText(/staff only/i)).not.toBeInTheDocument()
  })

  it('lets staff switch between a reply and an internal note', async () => {
    const user = userEvent.setup()
    renderPage(makeUser('agent'), TICKET, abilities({ can_reply: true, can_add_note: true, can_view_notes: true }))

    await screen.findByRole('textbox', { name: 'Reply' })
    await user.click(screen.getByRole('button', { name: 'Internal note' }))

    expect(screen.getByRole('textbox', { name: 'Internal note' })).toBeInTheDocument()
    expect(screen.getByText(/visible to staff only/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add note' })).toBeInTheDocument()
  })

  it('shows only the note composer to someone who can add notes but not reply', async () => {
    renderPage(makeUser('agent'), TICKET, abilities({ can_add_note: true, can_view_notes: true }))

    expect(await screen.findByRole('textbox', { name: 'Internal note' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reply' })).not.toBeInTheDocument()
  })

  it('rejects an empty or whitespace-only message without calling the API', async () => {
    const user = userEvent.setup()
    renderPage(makeUser('customer'), TICKET, abilities({ can_reply: true }))

    await user.type(await screen.findByRole('textbox', { name: 'Reply' }), '   ')
    await user.click(screen.getByRole('button', { name: 'Send reply' }))

    expect(await screen.findByText('Write a message first.')).toBeInTheDocument()
    expect(api.postReply).not.toHaveBeenCalled()
  })

  it('sends a trimmed reply, appends it and clears the box', async () => {
    const user = userEvent.setup()
    renderPage(makeUser('customer'), TICKET, abilities({ can_reply: true }))
    api.postReply.mockResolvedValue({
      message: 'Reply sent.',
      entry: message(7, { body: 'Thanks a lot' }),
      ticket: TICKET,
      abilities: abilities({ can_reply: true }),
      events: [],
    })

    const box = await screen.findByRole('textbox', { name: 'Reply' })
    await user.type(box, '  Thanks a lot ')
    await user.click(screen.getByRole('button', { name: 'Send reply' }))

    await waitFor(() => expect(api.postReply).toHaveBeenCalledWith(5, 'Thanks a lot', [], expect.anything()))
    expect(await screen.findByText('Thanks a lot')).toBeInTheDocument()
    expect(box).toHaveValue('')
    expect(toast.success).toHaveBeenCalledWith('Reply sent.')
  })

  it('sends internal notes through the notes endpoint only', async () => {
    const user = userEvent.setup()
    renderPage(makeUser('agent'), TICKET, abilities({ can_reply: true, can_add_note: true, can_view_notes: true }))
    api.postInternalNote.mockResolvedValue({
      message: 'Note added.',
      entry: message(8, { type: 'internal_note', body: 'private' }),
      ticket: TICKET,
      abilities: abilities({ can_reply: true, can_add_note: true, can_view_notes: true }),
      events: [],
    })

    await user.click(await screen.findByRole('button', { name: 'Internal note' }))
    await user.type(screen.getByRole('textbox', { name: 'Internal note' }), 'private')
    await user.click(screen.getByRole('button', { name: 'Add note' }))

    await waitFor(() => expect(api.postInternalNote).toHaveBeenCalledWith(5, 'private', [], expect.anything()))
    expect(api.postReply).not.toHaveBeenCalled()
    expect(await screen.findByText('Internal note · Staff only')).toBeInTheDocument()
  })

  it('shows the server validation message and keeps the text', async () => {
    const user = userEvent.setup()
    renderPage(makeUser('customer'), TICKET, abilities({ can_reply: true }))
    api.postReply.mockRejectedValue({ status: 422, message: 'Invalid', errors: { body: ['The body field is required.'] } })

    const box = await screen.findByRole('textbox', { name: 'Reply' })
    await user.type(box, 'hello')
    await user.click(screen.getByRole('button', { name: 'Send reply' }))

    expect(await screen.findByText('The body field is required.')).toBeInTheDocument()
    expect(box).toHaveValue('hello')
  })

  it('shows an API error for a closed ticket and keeps the text', async () => {
    const user = userEvent.setup()
    renderPage(makeUser('customer'), TICKET, abilities({ can_reply: true }))
    api.postReply.mockRejectedValue({ status: 422, code: 'ticket_closed', message: 'This ticket is closed. Reopen it to add messages.' })

    await user.type(await screen.findByRole('textbox', { name: 'Reply' }), 'late')
    await user.click(screen.getByRole('button', { name: 'Send reply' }))

    expect(await screen.findByText('This ticket is closed. Reopen it to add messages.')).toBeInTheDocument()
  })

  it('disables the form while sending', async () => {
    const user = userEvent.setup()
    renderPage(makeUser('customer'), TICKET, abilities({ can_reply: true }))
    api.postReply.mockReturnValue(new Promise(() => {}))

    await user.type(await screen.findByRole('textbox', { name: 'Reply' }), 'hello')
    await user.click(screen.getByRole('button', { name: 'Send reply' }))

    expect(screen.getByRole('button', { name: /send reply/i })).toBeDisabled()
    expect(screen.getByRole('textbox', { name: 'Reply' })).toBeDisabled()
  })

  it('updates the ticket status when a customer reply reopens a resolved ticket', async () => {
    const user = userEvent.setup()
    const resolved = { ...TICKET, status: 'resolved', resolved_at: '2026-03-21T09:00:00Z' }
    renderPage(makeUser('customer'), resolved, abilities({ can_reply: true, can_change_status: true, allowed_statuses: ['closed', 'open'] }))
    api.postReply.mockResolvedValue({
      message: 'Reply sent.',
      entry: message(9, { body: 'Still broken' }),
      ticket: { ...TICKET, status: 'open' },
      abilities: abilities({ can_reply: true }),
      events: [{ id: 1, type: 'status_changed', from: 'resolved', to: 'open', reason: 'customer_reply', actor: { id: 8, name: 'Cara Customer' }, created_at: '2026-03-22T09:00:00Z' }],
    })

    expect(await screen.findByText('Resolved', { selector: 'span' })).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: 'Reply' }), 'Still broken')
    await user.click(screen.getByRole('button', { name: 'Send reply' }))

    expect(await screen.findByText('Cara Customer replied to the ticket. Status changed from Resolved to Open.')).toBeInTheDocument()
    expect(screen.getAllByText('Open').length).toBeGreaterThan(0)
    expect(screen.queryByText('Resolved', { selector: 'span' })).not.toBeInTheDocument()
  })

  it('explains a closed ticket instead of showing a composer', async () => {
    renderPage(makeUser('customer'), { ...TICKET, status: 'closed' }, abilities())

    expect(await screen.findByText(/this ticket is closed, so no new messages/i)).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('loads earlier messages on request', async () => {
    const user = userEvent.setup()
    renderPage(makeUser('customer'), TICKET, abilities(), [message(5), message(6)], true)
    api.listMessages.mockResolvedValueOnce({ data: [message(5), message(6)], has_more: true })

    await screen.findByText('body 6')
    api.listMessages.mockResolvedValueOnce({ data: [message(3), message(4)], has_more: false })
    await user.click(screen.getByRole('button', { name: 'Load earlier messages' }))

    expect(await screen.findByText('body 3')).toBeInTheDocument()
    expect(api.listMessages).toHaveBeenLastCalledWith(5, { before: 5 })
    expect(screen.queryByRole('button', { name: 'Load earlier messages' })).not.toBeInTheDocument()
  })

  it('offers a retry when the conversation cannot be loaded', async () => {
    api.getTicket.mockResolvedValue({ ticket: TICKET, abilities: abilities(), events: [] })
    api.listMessages.mockRejectedValueOnce({ status: 500, message: 'Server error' }).mockResolvedValue({ data: [message(1)], has_more: false })
    const user = userEvent.setup()
    renderWithProviders(
      <Routes>
        <Route path="/tickets/:id" element={<TicketDetailPage />} />
      </Routes>,
      { route: '/tickets/5', user: makeUser('customer') },
    )

    expect(await screen.findByText('Server error')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('body 1')).toBeInTheDocument()
  })
})
