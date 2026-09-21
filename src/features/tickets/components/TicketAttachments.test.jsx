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
  attachments: [],
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
  can_reply: true,
  can_add_note: false,
  can_view_notes: false,
  ...overrides,
})

const attachment = (id, name, size = 2048) => ({ id, name, size, mime_type: 'text/plain', extension: 'txt', is_image: false })

const file = (name, content = 'data', type = 'text/plain') => new File([content], name, { type })

function renderPage({ ticket = TICKET, ability = abilities(), messages = [], viewer = makeUser('customer') } = {}) {
  api.getTicket.mockResolvedValue({ ticket, abilities: ability, events: [] })
  api.listMessages.mockResolvedValue({ data: messages, has_more: false })
  return renderWithProviders(
    <Routes>
      <Route path="/tickets/:id" element={<TicketDetailPage />} />
    </Routes>,
    { route: '/tickets/5', user: viewer },
  )
}

const sentResponse = (overrides = {}) => ({
  message: 'Reply sent.',
  entry: { id: 30, type: 'public_reply', body: 'See file', author: { id: 8, name: 'Cara Customer', role: 'customer' }, attachments: [attachment(70, 'log.txt')], created_at: '2026-03-22T09:00:00Z' },
  ticket: TICKET,
  abilities: abilities(),
  events: [],
  ...overrides,
})

describe('ticket attachments', () => {
  beforeEach(() => vi.resetAllMocks())

  it('lists the files on the ticket and on messages with a download button each', async () => {
    renderPage({
      ticket: { ...TICKET, attachments: [attachment(1, 'opening.png', 3 * 1024 * 1024)] },
      messages: [{ id: 3, type: 'public_reply', body: 'here', author: { id: 8, name: 'Cara Customer', role: 'customer' }, attachments: [attachment(2, 'reply.txt')], created_at: '2026-03-21T09:00:00Z' }],
    })

    expect(await screen.findByRole('button', { name: 'Download opening.png' })).toBeInTheDocument()
    expect(screen.getByText('(3.0 MB)')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Download reply.txt' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Download/ })).toHaveLength(2)
  })

  it('shows file names as plain text', async () => {
    renderPage({ messages: [{ id: 3, type: 'public_reply', body: 'x', author: null, attachments: [attachment(2, '<img src=x onerror=alert(1)>.txt')], created_at: '2026-03-21T09:00:00Z' }] })

    expect((await screen.findAllByText((content) => content.includes('<img src=x onerror=alert(1)>.txt'))).length).toBeGreaterThan(0)
    expect(document.querySelector('img')).toBeNull()
  })

  it('downloads through the API and reports a missing file', async () => {
    const user = userEvent.setup()
    renderPage({ messages: [{ id: 3, type: 'public_reply', body: 'x', author: null, attachments: [attachment(2, 'reply.txt')], created_at: '2026-03-21T09:00:00Z' }] })
    api.downloadAttachment.mockResolvedValueOnce().mockRejectedValueOnce({ status: 404, message: 'This file is no longer available.' })

    await user.click(await screen.findByRole('button', { name: /Download reply\.txt/ }))
    await waitFor(() => expect(api.downloadAttachment).toHaveBeenCalledWith(5, expect.objectContaining({ id: 2, name: 'reply.txt' })))

    await user.click(screen.getByRole('button', { name: /Download reply\.txt/ }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('This file is no longer available.'))
  })

  it('warns about a disallowed file before sending and does not add it', async () => {
    const user = userEvent.setup({ applyAccept: false })
    renderPage()

    await user.upload(await screen.findByLabelText('Attach files'), file('run.exe'))

    expect(await screen.findByRole('alert')).toHaveTextContent('run.exe: this file type is not allowed')
    expect(screen.queryByRole('list', { name: 'Selected files' })).not.toBeInTheDocument()
  })

  it('lets chosen files be reviewed and removed', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.upload(await screen.findByLabelText('Attach files'), [file('a.txt'), file('b.txt')])
    const list = screen.getByRole('list', { name: 'Selected files' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(2)

    await user.click(within(list).getByRole('button', { name: 'Remove a.txt' }))
    expect(within(list).getAllByRole('listitem')).toHaveLength(1)
    expect(screen.queryByText(/a\.txt/)).not.toBeInTheDocument()
  })

  it('sends the files with the reply, shows the new attachment and clears the selection', async () => {
    const user = userEvent.setup()
    renderPage()
    api.postReply.mockResolvedValue(sentResponse())

    await user.type(await screen.findByRole('textbox', { name: 'Reply' }), 'See file')
    await user.upload(screen.getByLabelText('Attach files'), file('log.txt'))
    await user.click(screen.getByRole('button', { name: 'Send reply' }))

    await waitFor(() => expect(api.postReply).toHaveBeenCalledWith(5, 'See file', [expect.objectContaining({ name: 'log.txt' })], expect.anything()))
    expect(await screen.findByRole('button', { name: /Download log\.txt/ })).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Selected files' })).not.toBeInTheDocument()
  })

  it('shows upload progress and lets the user cancel', async () => {
    const user = userEvent.setup()
    renderPage()
    let options
    api.postReply.mockImplementation((_id, _body, _files, opts) => {
      options = opts
      return new Promise((_, reject) => opts.signal.addEventListener('abort', () => reject({ name: 'CanceledError', code: 'ERR_CANCELED', __CANCEL__: true })))
    })

    await user.type(await screen.findByRole('textbox', { name: 'Reply' }), 'x')
    await user.upload(screen.getByLabelText('Attach files'), file('big.txt'))
    await user.click(screen.getByRole('button', { name: 'Send reply' }))

    const bar = await screen.findByRole('progressbar', { name: 'Upload progress' })
    expect(bar).toHaveAttribute('aria-valuenow', '0')
    options.onUploadProgress({ progress: 0.42 })
    await waitFor(() => expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '42'))
    expect(screen.getByRole('button', { name: /send reply/i })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Cancel upload' }))
    expect(await screen.findByText('Upload cancelled.')).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('shows the server message for each rejected file and keeps the selection', async () => {
    const user = userEvent.setup()
    renderPage()
    api.postReply.mockRejectedValue({
      status: 422,
      message: 'x',
      errors: { 'attachments.0': ['shell.png: The file content does not match its ".png" extension.'] },
    })

    await user.type(await screen.findByRole('textbox', { name: 'Reply' }), 'x')
    await user.upload(screen.getByLabelText('Attach files'), file('shell.png'))
    await user.click(screen.getByRole('button', { name: 'Send reply' }))

    expect(await screen.findByText(/does not match its "\.png" extension/)).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Selected files' })).toBeInTheDocument()
  })

  it('explains an over-large upload (413)', async () => {
    const user = userEvent.setup()
    renderPage()
    api.postReply.mockRejectedValue({ status: 413, code: 'payload_too_large', message: 'The upload is too large.', errors: {} })

    await user.type(await screen.findByRole('textbox', { name: 'Reply' }), 'x')
    await user.upload(screen.getByLabelText('Attach files'), file('a.txt'))
    await user.click(screen.getByRole('button', { name: 'Send reply' }))

    expect(await screen.findByText(/Attach fewer or smaller files/)).toBeInTheDocument()
  })

  it('keeps files per composer so a reply attachment is never sent as a note', async () => {
    const user = userEvent.setup()
    renderPage({ ability: abilities({ can_add_note: true, can_view_notes: true }), viewer: makeUser('agent') })
    api.postInternalNote.mockResolvedValue(sentResponse({ message: 'Note added.', abilities: abilities({ can_add_note: true, can_view_notes: true }) }))

    await user.type(await screen.findByRole('textbox', { name: 'Reply' }), 'x')
    await user.upload(screen.getByLabelText('Attach files'), file('for-customer.txt'))
    await user.click(screen.getByRole('button', { name: 'Internal note' }))

    expect(screen.queryByRole('list', { name: 'Selected files' })).not.toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: 'Internal note' }), 'note')
    await user.click(screen.getByRole('button', { name: 'Add note' }))
    await waitFor(() => expect(api.postInternalNote).toHaveBeenCalledWith(5, 'note', [], expect.anything()))

    await user.click(screen.getByRole('button', { name: 'Reply' }))
    expect(screen.getByRole('button', { name: 'Remove for-customer.txt' })).toBeInTheDocument()
  })

  it('does not offer a file picker on a closed ticket', async () => {
    renderPage({ ticket: { ...TICKET, status: 'closed' }, ability: abilities({ can_reply: false }) })

    expect(await screen.findByText(/this ticket is closed/i)).toBeInTheDocument()
    expect(screen.queryByLabelText('Attach files')).not.toBeInTheDocument()
  })
})
