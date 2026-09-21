import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeUser, renderWithProviders } from '../../../test/utils'
import * as api from '../ticketsApi'
import { NewTicketPage } from './NewTicketPage'

vi.mock('../ticketsApi')

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/tickets/new" element={<NewTicketPage />} />
      <Route path="/tickets/:id" element={<p>ticket detail page</p>} />
    </Routes>,
    { route: '/tickets/new', user: makeUser('customer') },
  )
}

describe('NewTicketPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    api.fetchTicketOptions.mockResolvedValue({ departments: [{ id: 3, name: 'Billing' }, { id: 4, name: 'Technical' }] })
  })

  it('validates before calling the API', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Submit ticket' }))

    expect(await screen.findByText('Subject is required')).toBeInTheDocument()
    expect(screen.getByText('Please describe the problem')).toBeInTheDocument()
    expect(api.createTicket).not.toHaveBeenCalled()
  })

  it('enforces the length limits', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByLabelText(/subject/i))
    await user.paste('a'.repeat(151))
    await user.click(screen.getByRole('button', { name: 'Submit ticket' }))

    expect(await screen.findByText(/subject must be 150 characters or fewer/i)).toBeInTheDocument()
  })

  it('loads the active departments into the select', async () => {
    renderPage()

    expect(await screen.findByRole('option', { name: 'Billing' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'No department' })).toBeInTheDocument()
  })

  it('creates the ticket without a department and opens it', async () => {
    const user = userEvent.setup()
    api.createTicket.mockResolvedValue({ message: 'Ticket created.', ticket: { id: 42 } })
    renderPage()

    await user.type(screen.getByLabelText(/subject/i), '  Cannot log in ')
    await user.type(screen.getByLabelText(/description/i), 'It says my password is wrong.')
    await user.click(screen.getByRole('button', { name: 'Submit ticket' }))

    await waitFor(() =>
      expect(api.createTicket).toHaveBeenCalledWith(
        {
          subject: 'Cannot log in',
          description: 'It says my password is wrong.',
          department_id: null,
        },
        [],
        expect.anything(),
      ),
    )
    expect(await screen.findByText('ticket detail page')).toBeInTheDocument()
  })

  it('sends the chosen department as a number', async () => {
    const user = userEvent.setup()
    api.createTicket.mockResolvedValue({ message: 'Ticket created.', ticket: { id: 42 } })
    renderPage()

    await screen.findByRole('option', { name: 'Technical' })
    await user.type(screen.getByLabelText(/subject/i), 'S')
    await user.type(screen.getByLabelText(/description/i), 'D')
    await user.selectOptions(screen.getByLabelText('Department'), 'Technical')
    await user.click(screen.getByRole('button', { name: 'Submit ticket' }))

    await waitFor(() => expect(api.createTicket).toHaveBeenCalledWith(expect.objectContaining({ department_id: 4 }), [], expect.anything()))
  })

  it('shows backend validation errors on the fields and stays on the form', async () => {
    const user = userEvent.setup()
    api.createTicket.mockRejectedValue({ status: 422, message: 'Invalid', errors: { department_id: ['The selected department is invalid.'] } })
    renderPage()

    await user.type(screen.getByLabelText(/subject/i), 'S')
    await user.type(screen.getByLabelText(/description/i), 'D')
    await user.click(screen.getByRole('button', { name: 'Submit ticket' }))

    expect(await screen.findByText('The selected department is invalid.')).toBeInTheDocument()
    expect(screen.queryByText('ticket detail page')).not.toBeInTheDocument()
  })

  it('explains the rate limit', async () => {
    const user = userEvent.setup()
    api.createTicket.mockRejectedValue({ status: 429, message: 'Too Many Attempts.', errors: {} })
    renderPage()

    await user.type(screen.getByLabelText(/subject/i), 'S')
    await user.type(screen.getByLabelText(/description/i), 'D')
    await user.click(screen.getByRole('button', { name: 'Submit ticket' }))

    expect(await screen.findByText(/too many tickets recently/i)).toBeInTheDocument()
  })

  it('still works when the departments cannot be loaded', async () => {
    const user = userEvent.setup()
    api.fetchTicketOptions.mockRejectedValue({ status: 500, message: 'boom', errors: {} })
    api.createTicket.mockResolvedValue({ message: 'Ticket created.', ticket: { id: 7 } })
    renderPage()

    expect(await screen.findByText(/departments could not be loaded/i)).toBeInTheDocument()
    await user.type(screen.getByLabelText(/subject/i), 'S')
    await user.type(screen.getByLabelText(/description/i), 'D')
    await user.click(screen.getByRole('button', { name: 'Submit ticket' }))

    expect(await screen.findByText('ticket detail page')).toBeInTheDocument()
  })
})

describe('NewTicketPage attachments', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    api.fetchTicketOptions.mockResolvedValue({ departments: [] })
  })

  const fill = async (user) => {
    await user.type(screen.getByLabelText(/subject/i), 'Broken')
    await user.type(screen.getByLabelText(/description/i), 'See picture')
  }

  it('sends the chosen files with the new ticket', async () => {
    const user = userEvent.setup()
    api.createTicket.mockResolvedValue({ message: 'Ticket created.', ticket: { id: 42 } })
    renderPage()

    await fill(user)
    await user.upload(screen.getByLabelText('Attach files'), new File(['x'], 'shot.png', { type: 'image/png' }))
    await user.click(screen.getByRole('button', { name: 'Submit ticket' }))

    await waitFor(() =>
      expect(api.createTicket).toHaveBeenCalledWith(expect.objectContaining({ subject: 'Broken' }), [expect.objectContaining({ name: 'shot.png' })], expect.anything()),
    )
    expect(await screen.findByText('ticket detail page')).toBeInTheDocument()
  })

  it('shows the server message about a rejected file and stays on the form', async () => {
    const user = userEvent.setup()
    api.createTicket.mockRejectedValue({ status: 422, message: 'x', errors: { 'attachments.0': ['shell.png: The file content does not match its ".png" extension.'] } })
    renderPage()

    await fill(user)
    await user.upload(screen.getByLabelText('Attach files'), new File(['x'], 'shell.png', { type: 'image/png' }))
    await user.click(screen.getByRole('button', { name: 'Submit ticket' }))

    expect(await screen.findByText(/does not match its "\.png" extension/)).toBeInTheDocument()
    expect(screen.queryByText('ticket detail page')).not.toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Selected files' })).toBeInTheDocument()
  })

  it('explains an over-large upload', async () => {
    const user = userEvent.setup()
    api.createTicket.mockRejectedValue({ status: 413, code: 'payload_too_large', message: 'The upload is too large.', errors: {} })
    renderPage()

    await fill(user)
    await user.upload(screen.getByLabelText('Attach files'), new File(['x'], 'a.txt', { type: 'text/plain' }))
    await user.click(screen.getByRole('button', { name: 'Submit ticket' }))

    expect(await screen.findByText(/Attach fewer or smaller files/)).toBeInTheDocument()
  })
})
