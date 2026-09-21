import { useEffect, useState } from 'react'
import { Alert } from '../../../components/common/Alert'
import { Badge } from '../../../components/common/Badge'
import { Button } from '../../../components/common/Button'
import { LoadingSpinner } from '../../../components/common/LoadingSpinner'
import { cn } from '../../../utils/cn'
import { listMessages } from '../ticketsApi'
import { MessageComposer } from './MessageComposer'

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : ''
}

const roleLabel = (role) => (role ? role.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase()) : null)

function Message({ message }) {
  const internal = message.type === 'internal_note'
  const role = roleLabel(message.author?.role)

  return (
    <li className={cn('rounded-md border p-3', internal ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white')}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-sm font-medium text-slate-900">{message.author?.name ?? 'Former team member'}</span>
        {role && <span className="text-xs text-slate-500">{role}</span>}
        <Badge variant={internal ? 'warning' : 'info'}>{internal ? 'Internal note · Staff only' : 'Public reply'}</Badge>
        <span className="text-xs text-slate-500 sm:ml-auto">{formatDateTime(message.created_at)}</span>
      </div>
      {/* Plain text (React escapes it), keeping line breaks. */}
      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-800">{message.body}</p>
    </li>
  )
}

/**
 * Replies and internal notes. The server only sends the notes this viewer may see;
 * the composer options come from `abilities`. `onUpdated` receives the ticket,
 * abilities and history returned with each new message (e.g. Resolved -> Open).
 */
export function TicketConversation({ ticket, abilities, onUpdated }) {
  const [state, setState] = useState({ ticketId: null, messages: [], hasMore: false, error: null })
  const [loadingMore, setLoadingMore] = useState(false)
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    let active = true
    listMessages(ticket.id)
      .then((page) => active && setState({ ticketId: ticket.id, messages: page.data, hasMore: page.has_more, error: null }))
      .catch((error) => active && setState({ ticketId: ticket.id, messages: [], hasMore: false, error }))
    return () => {
      active = false
    }
  }, [ticket.id, reloadCount])

  const current = state.ticketId === ticket.id ? state : null

  const loadEarlier = async () => {
    setLoadingMore(true)
    try {
      const page = await listMessages(ticket.id, { before: current.messages[0]?.id })
      setState((prev) => ({ ...prev, messages: [...page.data, ...prev.messages], hasMore: page.has_more }))
    } catch (error) {
      setState((prev) => ({ ...prev, error }))
    } finally {
      setLoadingMore(false)
    }
  }

  const handleSent = ({ entry, ...payload }) => {
    setState((prev) => ({ ...prev, messages: [...prev.messages, entry] }))
    onUpdated(payload)
  }

  const canCompose = abilities.can_reply || abilities.can_add_note

  return (
    <section aria-labelledby="conversation-heading" className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 id="conversation-heading" className="text-base font-semibold text-slate-900">
        Conversation
      </h2>

      {!current && (
        <div className="flex justify-center py-4 text-brand-600">
          <LoadingSpinner label="Loading conversation" />
        </div>
      )}

      {current?.error && (
        <Alert variant="error">
          <div className="flex items-center justify-between gap-4">
            <span>{current.error.message}</span>
            <Button variant="secondary" size="sm" onClick={() => setReloadCount((n) => n + 1)}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {current && !current.error && current.messages.length === 0 && (
        <p className="text-sm text-slate-500">No replies yet.</p>
      )}

      {current?.hasMore && (
        <Button variant="secondary" size="sm" loading={loadingMore} onClick={loadEarlier}>
          Load earlier messages
        </Button>
      )}

      {current && current.messages.length > 0 && (
        <ol className="space-y-3" aria-label="Messages">
          {current.messages.map((message) => (
            <Message key={message.id} message={message} />
          ))}
        </ol>
      )}

      {canCompose ? (
        <MessageComposer ticketId={ticket.id} abilities={abilities} onSent={handleSent} />
      ) : (
        ticket.status === 'closed' && (
          <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">This ticket is closed, so no new messages can be added.</p>
        )
      )}
    </section>
  )
}
