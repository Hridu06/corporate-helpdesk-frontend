import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '../../../components/common/Alert'
import { Button } from '../../../components/common/Button'
import { EmptyState } from '../../../components/common/EmptyState'
import { Input } from '../../../components/common/Input'
import { LoadingSpinner } from '../../../components/common/LoadingSpinner'
import { PageHeader } from '../../../components/common/PageHeader'
import { Pagination } from '../../../components/common/Pagination'
import { Select } from '../../../components/forms/Select'
import { useAuth } from '../../../hooks/useAuth'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { cn } from '../../../utils/cn'
import { ROLES } from '../../../utils/roles'
import { PriorityBadge, StatusBadge } from '../components/TicketBadges'
import { TICKET_PRIORITY, TICKET_STATUS } from '../constants'
import { useTickets } from '../useTickets'

const PER_PAGE = 15

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—'
}

export function TicketsPage() {
  const { hasPermission, hasRole } = useAuth()
  // Customers only ever see their own tickets, so who-opened-it and assignment filters add nothing for them.
  const isStaffView = !hasRole(ROLES.CUSTOMER)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [assigned, setAssigned] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search.trim())

  const { tickets, meta, loading, error, reload } = useTickets({
    search: debouncedSearch,
    status,
    priority,
    assigned,
    page,
    perPage: PER_PAGE,
  })

  // Changing a filter returns to the first page.
  const setFilter = (setter) => (event) => {
    setter(event.target.value)
    setPage(1)
  }

  const filtersActive = Boolean(debouncedSearch || status || priority || assigned)

  return (
    <>
      <PageHeader
        title="Tickets"
        description={isStaffView ? 'Support requests you can access.' : 'Your support requests.'}
        actions={
          hasPermission('ticket.create') && (
            <Link
              to="/tickets/new"
              className="inline-flex items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              New ticket
            </Link>
          )
        }
      />

      <div className={cn('mb-4 grid gap-4 sm:grid-cols-2', isStaffView ? 'lg:grid-cols-4' : 'lg:grid-cols-3')}>
        <Input label="Search" type="search" placeholder="Subject or TCK-000123" value={search} onChange={setFilter(setSearch)} />
        <Select label="Status" value={status} onChange={setFilter(setStatus)}>
          <option value="">All statuses</option>
          {Object.entries(TICKET_STATUS).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select label="Priority" value={priority} onChange={setFilter(setPriority)}>
          <option value="">All priorities</option>
          {Object.entries(TICKET_PRIORITY).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        {isStaffView && (
          <Select label="Assignment" value={assigned} onChange={setFilter(setAssigned)}>
            <option value="">Anyone</option>
            <option value="me">Assigned to me</option>
            <option value="unassigned">Unassigned</option>
          </Select>
        )}
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          <div className="flex items-center justify-between gap-4">
            <span>{error.message}</span>
            <Button variant="secondary" size="sm" onClick={reload}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {loading && (
          <div className="absolute right-4 top-3 text-brand-600">
            <LoadingSpinner size="sm" label="Loading tickets" />
          </div>
        )}

        {tickets.length > 0 ? (
          <div className={cn(loading && 'opacity-60')}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <caption className="sr-only">Tickets</caption>
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3">Ticket</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3">Priority</th>
                    <th scope="col" className="px-4 py-3">Department</th>
                    {isStaffView && <th scope="col" className="px-4 py-3">Customer</th>}
                    <th scope="col" className="px-4 py-3">Assigned to</th>
                    <th scope="col" className="px-4 py-3">Opened</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-slate-500">{ticket.number}</p>
                        <Link to={`/tickets/${ticket.id}`} className="font-medium text-brand-700 hover:underline">
                          {ticket.subject}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">{ticket.department?.name ?? '—'}</td>
                      {isStaffView && (
                        <td className="px-4 py-3">
                          <p className="text-slate-900">{ticket.customer?.name}</p>
                          <p className="text-slate-500">{ticket.customer?.email}</p>
                        </td>
                      )}
                      <td className="px-4 py-3 text-slate-600">{ticket.assignee?.name ?? 'Unassigned'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(ticket.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={meta} onPageChange={setPage} disabled={loading} />
          </div>
        ) : (
          !loading &&
          !error && (
            <EmptyState
              className="border-0"
              title={filtersActive ? 'No tickets match your filters' : 'No tickets yet'}
              description={
                filtersActive
                  ? 'Try a different search or clear the filters.'
                  : hasPermission('ticket.create')
                    ? 'Open a ticket when you need help and it will appear here.'
                    : 'Tickets assigned to you will appear here.'
              }
            />
          )
        )}
        {loading && tickets.length === 0 && <div className="h-40" aria-hidden="true" />}
      </div>
    </>
  )
}
