import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeUser, renderWithProviders } from '../../../test/utils'
import * as api from '../ticketsApi'
import { TicketsPage } from './TicketsPage'

vi.mock('../ticketsApi')

const TICKETS = [
  {
    id: 12,
    number: 'TCK-000012',
    subject: 'Cannot log in',
    status: 'in_progress',
    priority: 'urgent',
    department: { id: 1, name: 'Billing' },
    customer: { id: 5, name: 'Cara Customer', email: 'cara@example.com' },
    assignee: { id: 9, name: 'Alex Agent' },
    created_at: '2026-03-20T09:00:00Z',
  },
  {
    id: 11,
    number: 'TCK-000011',
    subject: 'Invoice is wrong',
    status: 'open',
    priority: 'low',
    department: null,
    customer: { id: 5, name: 'Cara Customer', email: 'cara@example.com' },
    assignee: null,
    created_at: '2026-03-19T09:00:00Z',
  },
]

const page = (rows) => ({
  data: rows,
  meta: { current_page: 1, last_page: 1, per_page: 15, total: rows.length, from: rows.length ? 1 : 0, to: rows.length },
})

async function renderPage(viewer, rows = TICKETS) {
  api.listTickets.mockResolvedValue(page(rows))
  const result = renderWithProviders(<TicketsPage />, { user: viewer })
  if (rows.length) await screen.findByText(rows[0].subject)
  return result
}

const table = () => within(screen.getByRole('table'))

describe('TicketsPage', () => {
  beforeEach(() => vi.resetAllMocks())

  it('lists tickets with number, status, priority, department and assignee', async () => {
    await renderPage(makeUser('admin'))

    const first = within(screen.getByText('Cannot log in').closest('tr'))
    expect(first.getByText('TCK-000012')).toBeInTheDocument()
    expect(first.getByText('In progress')).toBeInTheDocument()
    expect(first.getByText('Urgent')).toBeInTheDocument()
    expect(first.getByText('Billing')).toBeInTheDocument()
    expect(first.getByText('Alex Agent')).toBeInTheDocument()

    const second = within(screen.getByText('Invoice is wrong').closest('tr'))
    expect(second.getByText('Unassigned')).toBeInTheDocument()
    expect(second.getByText('—', { selector: 'td' })).toBeInTheDocument() // no department
  })

  it('links each ticket to its detail page', async () => {
    await renderPage(makeUser('admin'))

    expect(screen.getByRole('link', { name: 'Cannot log in' })).toHaveAttribute('href', '/tickets/12')
  })

  it('shows the customer column and assignment filter to staff', async () => {
    await renderPage(makeUser('admin'))

    expect(table().getByRole('columnheader', { name: 'Customer' })).toBeInTheDocument()
    expect(screen.getByLabelText('Assignment')).toBeInTheDocument()
  })

  it('hides both from customers, who only ever see their own tickets', async () => {
    await renderPage(makeUser('customer'))

    expect(table().queryByRole('columnheader', { name: 'Customer' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Assignment')).not.toBeInTheDocument()
  })

  it('offers "New ticket" only to users who can open tickets', async () => {
    const { unmount } = await renderPage(makeUser('customer'))
    expect(screen.getByRole('link', { name: 'New ticket' })).toHaveAttribute('href', '/tickets/new')
    unmount()

    await renderPage(makeUser('agent'))
    expect(screen.queryByRole('link', { name: 'New ticket' })).not.toBeInTheDocument()
  })

  it('passes filters to the API and returns to page 1', async () => {
    const user = userEvent.setup()
    await renderPage(makeUser('admin'))

    await user.selectOptions(screen.getByLabelText('Status'), 'resolved')
    await user.selectOptions(screen.getByLabelText('Priority'), 'high')
    await user.selectOptions(screen.getByLabelText('Assignment'), 'unassigned')

    await waitFor(() =>
      expect(api.listTickets).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'resolved', priority: 'high', assigned: 'unassigned', page: 1 }),
        expect.anything(),
      ),
    )
  })

  it('searches (debounced)', async () => {
    const user = userEvent.setup()
    await renderPage(makeUser('admin'))

    await user.type(screen.getByLabelText('Search'), 'TCK-12')

    await waitFor(() =>
      expect(api.listTickets).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'TCK-12' }), expect.anything()),
    )
  })

  it('explains an empty list differently for customers, staff and filtered views', async () => {
    const user = userEvent.setup()
    api.listTickets.mockResolvedValue(page([]))

    const customer = renderWithProviders(<TicketsPage />, { user: makeUser('customer') })
    expect(await screen.findByText(/open a ticket when you need help/i)).toBeInTheDocument()
    customer.unmount()

    renderWithProviders(<TicketsPage />, { user: makeUser('agent') })
    expect(await screen.findByText(/tickets assigned to you will appear here/i)).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Priority'), 'low')
    expect(await screen.findByText('No tickets match your filters')).toBeInTheDocument()
  })

  it('shows the error with a working Retry', async () => {
    const user = userEvent.setup()
    api.listTickets.mockRejectedValueOnce({ status: 500, message: 'Server exploded', errors: {} })
    api.listTickets.mockResolvedValue(page(TICKETS))
    renderWithProviders(<TicketsPage />, { user: makeUser('admin') })

    expect(await screen.findByText('Server exploded')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(await screen.findByText('Cannot log in')).toBeInTheDocument()
  })
})
