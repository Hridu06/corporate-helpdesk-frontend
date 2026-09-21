import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeUser, renderWithProviders } from '../../../test/utils'
import * as api from '../ticketsApi'
import { TicketDetailPage } from './TicketDetailPage'

vi.mock('../ticketsApi')

export const TICKET = {
  id: 5,
  number: 'TCK-000005',
  subject: 'Cannot log in',
  description: 'Line one\nLine two',
  status: 'in_progress',
  priority: 'high',
  department: { id: 1, name: 'Billing' },
  customer: { id: 8, name: 'Cara Customer', email: 'cara@example.com' },
  assignee: { id: 9, name: 'Alex Agent' },
  created_at: '2026-03-20T09:00:00Z',
  updated_at: '2026-03-21T09:00:00Z',
  resolved_at: null,
  closed_at: null,
}

const NO_ABILITIES = { allowed_statuses: [], can_change_status: false, can_change_priority: false, can_assign: false }

/** What GET /tickets/:id returns. */
export const payload = (ticket = TICKET, abilities = NO_ABILITIES, events = []) => ({ ticket, abilities, events })

function renderPage(viewer = makeUser('admin'), id = 5) {
  return renderWithProviders(
    <Routes>
      <Route path="/tickets/:id" element={<TicketDetailPage />} />
      <Route path="/tickets" element={<p>tickets list</p>} />
    </Routes>,
    { route: `/tickets/${id}`, user: viewer },
  )
}

describe('TicketDetailPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    api.listMessages.mockResolvedValue({ data: [], has_more: false })
  })

  it('shows the ticket with its badges and people', async () => {
    api.getTicket.mockResolvedValue(payload())
    renderPage()

    expect(await screen.findByRole('heading', { level: 1, name: 'Cannot log in' })).toBeInTheDocument()
    expect(screen.getByText('TCK-000005')).toBeInTheDocument()
    expect(screen.getByText('In progress')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
    expect(screen.getByText('Cara Customer')).toBeInTheDocument()
    expect(screen.getByText('cara@example.com')).toBeInTheDocument()
    expect(screen.getByText('Billing')).toBeInTheDocument()
    expect(screen.getByText('Alex Agent')).toBeInTheDocument()
    expect(api.getTicket).toHaveBeenCalledWith('5')
  })

  it('says so when a ticket has no department or assignee', async () => {
    api.getTicket.mockResolvedValue(payload({ ...TICKET, department: null, assignee: null }))
    renderPage()

    expect(await screen.findByText('Not assigned to a department')).toBeInTheDocument()
    expect(screen.getByText('Unassigned')).toBeInTheDocument()
  })

  it('shows resolved and closed dates when they exist', async () => {
    api.getTicket.mockResolvedValue(payload({ ...TICKET, status: 'closed', resolved_at: '2026-03-22T09:00:00Z', closed_at: '2026-03-23T09:00:00Z' }))
    renderPage()

    expect(await screen.findByText('Resolved')).toBeInTheDocument()
    expect(screen.getByText('Closed', { selector: 'dt' })).toBeInTheDocument()
  })

  it('renders the description as plain text, never as HTML', async () => {
    api.getTicket.mockResolvedValue(payload({ ...TICKET, description: '<img src=x onerror=alert(1)> <script>alert(2)</script>' }))
    const { container } = renderPage()

    expect(await screen.findByText(/<script>alert\(2\)<\/script>/)).toBeInTheDocument()
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('img')).toBeNull()
  })

  it('preserves line breaks in the description', async () => {
    api.getTicket.mockResolvedValue(payload())
    renderPage()

    const description = await screen.findByText(/Line one/)
    expect(description).toHaveClass('whitespace-pre-wrap')
    expect(description.textContent).toBe('Line one\nLine two')
  })

  it('shows no action panel when the viewer has no abilities', async () => {
    api.getTicket.mockResolvedValue(payload())
    renderPage(makeUser('customer'))

    await screen.findByRole('heading', { level: 1, name: 'Cannot log in' })
    expect(screen.queryByRole('heading', { name: 'Actions' })).not.toBeInTheDocument()
  })

  it('shows the Unauthorized page when the API refuses access', async () => {
    api.getTicket.mockRejectedValue({ status: 403, message: 'This action is unauthorized.', errors: {} })
    renderPage(makeUser('customer'))

    expect(await screen.findByText(/you don't have access to this page/i)).toBeInTheDocument()
  })

  it('shows a not-found state for a missing ticket', async () => {
    api.getTicket.mockRejectedValue({ status: 404, message: 'Not found', errors: {} })
    renderPage(makeUser('admin'), 999)

    expect(await screen.findByText('Ticket not found')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to tickets/i })).toHaveAttribute('href', '/tickets')
  })

  it('shows other errors with a working Retry', async () => {
    const user = userEvent.setup()
    api.getTicket.mockRejectedValueOnce({ status: 500, message: 'Server exploded', errors: {} })
    api.getTicket.mockResolvedValue(payload())
    renderPage()

    expect(await screen.findByText('Server exploded')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Cannot log in' })).toBeInTheDocument()
  })

  it('offers a way back to the list', async () => {
    api.getTicket.mockResolvedValue(payload())
    renderPage()

    expect(await screen.findByRole('link', { name: /back to tickets/i })).toHaveAttribute('href', '/tickets')
  })
})
