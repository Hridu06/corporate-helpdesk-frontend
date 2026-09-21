import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert } from '../../../components/common/Alert'
import { Button } from '../../../components/common/Button'
import { EmptyState } from '../../../components/common/EmptyState'
import { LoadingSpinner } from '../../../components/common/LoadingSpinner'
import { UnauthorizedPage } from '../../../pages/errors/UnauthorizedPage'
import { PriorityBadge, StatusBadge } from '../components/TicketBadges'
import { AttachmentList } from '../components/AttachmentList'
import { TicketActions } from '../components/TicketActions'
import { TicketConversation } from '../components/TicketConversation'
import { TicketTimeline } from '../components/TicketTimeline'
import { getTicket } from '../ticketsApi'

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'
}

function Meta({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{children}</dd>
    </div>
  )
}

export function TicketDetailPage() {
  const { id } = useParams()
  // payload = { ticket, abilities, events } exactly as the API returns it.
  const [state, setState] = useState({ id: null, payload: null, error: null })
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    let active = true
    getTicket(id)
      .then((payload) => active && setState({ id, payload, error: null }))
      .catch((error) => active && setState({ id, payload: null, error }))
    return () => {
      active = false
    }
  }, [id, reloadCount])

  const reload = useCallback(() => setReloadCount((count) => count + 1), [])
  // Every change response carries the fresh ticket, abilities and history.
  const applyUpdate = useCallback((payload) => setState({ id, payload, error: null }), [id])

  const { payload, error } = state.id === id ? state : { payload: null, error: null }

  const back = (
    <Link to="/tickets" className="text-sm font-medium text-brand-600 hover:text-brand-700">
      ← Back to tickets
    </Link>
  )

  if (error?.status === 403) return <UnauthorizedPage />

  if (error?.status === 404) {
    return <EmptyState className="mt-8" title="Ticket not found" description="It may not exist, or the link is wrong." action={back} />
  }

  if (error) {
    return (
      <div className="space-y-4">
        {back}
        <Alert variant="error">
          <div className="flex items-center justify-between gap-4">
            <span>{error.message}</span>
            <Button variant="secondary" size="sm" onClick={reload}>
              Retry
            </Button>
          </div>
        </Alert>
      </div>
    )
  }

  if (!payload) {
    return (
      <div className="flex justify-center py-12 text-brand-600">
        <LoadingSpinner size="lg" label="Loading ticket" />
      </div>
    )
  }

  const { ticket, abilities, events } = payload

  return (
    <div className="space-y-6">
      {back}

      <div>
        <p className="text-sm font-medium text-slate-500">{ticket.number}</p>
        <h1 className="mt-1 break-words text-2xl font-semibold text-slate-900">{ticket.subject}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </div>

      <TicketActions ticket={ticket} abilities={abilities} onUpdated={applyUpdate} />

      <dl className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
        <Meta label="Customer">
          {ticket.customer ? (
            <>
              {ticket.customer.name}
              <span className="block text-slate-500">{ticket.customer.email}</span>
            </>
          ) : (
            '—'
          )}
        </Meta>
        <Meta label="Department">{ticket.department?.name ?? 'Not assigned to a department'}</Meta>
        <Meta label="Assigned to">{ticket.assignee?.name ?? 'Unassigned'}</Meta>
        <Meta label="Opened">{formatDateTime(ticket.created_at)}</Meta>
        <Meta label="Last updated">{formatDateTime(ticket.updated_at)}</Meta>
        {ticket.resolved_at && <Meta label="Resolved">{formatDateTime(ticket.resolved_at)}</Meta>}
        {ticket.closed_at && <Meta label="Closed">{formatDateTime(ticket.closed_at)}</Meta>}
      </dl>

      <section aria-labelledby="description-heading" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 id="description-heading" className="text-base font-semibold text-slate-900">
          Description
        </h2>
        {/* Rendered as plain text (React escapes it), keeping the customer's line breaks. */}
        <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-700">{ticket.description}</p>
        <AttachmentList ticketId={ticket.id} attachments={ticket.attachments} />
      </section>

      <TicketConversation ticket={ticket} abilities={abilities} onUpdated={applyUpdate} />

      <TicketTimeline openedAt={ticket.created_at} events={events} />
    </div>
  )
}
