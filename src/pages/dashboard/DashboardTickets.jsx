import { Link } from 'react-router-dom'
import { Icon } from '../../components/common/Icon'
import { PriorityBadge, StatusBadge } from '../../features/tickets/components/TicketBadges'

function dateLabel(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function DashboardTickets({ tickets, loading, error, canCreate, isCustomer }) {
  return (
    <section className="dashboard-panel min-w-0 overflow-hidden" aria-label="Recent tickets" aria-busy={loading}>
      <div className="flex items-center justify-between gap-3 px-5 py-5 sm:px-6"><div><h2 className="panel-title">Recent tickets</h2><p className="mt-1 text-[11px] text-slate-400">Your latest requests, all in one place</p></div><Link to="/tickets" className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold text-indigo-600 hover:text-indigo-800">View all <Icon name="arrow" className="size-3.5" /></Link></div>
      {loading ? <div className="space-y-5 px-6 py-5" role="status"><span className="sr-only">Loading recent tickets</span>{[0, 1, 2, 3].map((key) => <div key={key} className="h-6 animate-pulse rounded-lg bg-slate-100" />)}</div> : error ? <div className="px-6 py-12 text-center text-sm text-slate-500">Recent tickets could not be loaded. Please try refreshing.</div> : tickets.length ? (
        <div className="overflow-x-auto"><table className="w-full whitespace-nowrap text-left text-[11px]">
          <caption className="sr-only">Latest tickets you can access, newest first</caption>
          <thead className="border-y border-slate-100 bg-slate-50/60 text-[10px] font-semibold text-slate-400"><tr><th className="py-3 pl-5 pr-3 sm:pl-6">Ticket</th><th className="px-3 py-3">Subject</th>{!isCustomer && <th className="px-3 py-3">Requester</th>}<th className="px-3 py-3">Priority</th><th className="px-3 py-3">Status</th><th className="py-3 pl-3 pr-6 text-right">Updated</th></tr></thead>
          <tbody className="divide-y divide-slate-100/80">{tickets.map((ticket) => <tr key={ticket.id} className="transition-colors hover:bg-indigo-50/35"><td className="py-4 pl-5 pr-3 sm:pl-6"><Link to={`/tickets/${ticket.id}`} className="rounded-md bg-indigo-50 px-1.5 py-1 font-semibold text-indigo-600 hover:underline">{ticket.number}</Link></td><td className="max-w-52 truncate px-3 py-4"><Link to={`/tickets/${ticket.id}`} className="font-medium text-slate-700 hover:text-indigo-600">{ticket.subject}</Link></td>{!isCustomer && <td className="max-w-28 truncate px-3 py-4 text-slate-500">{ticket.customer?.name ?? '—'}</td>}<td className="px-3 py-4"><PriorityBadge priority={ticket.priority} /></td><td className="px-3 py-4"><StatusBadge status={ticket.status} /></td><td className="py-4 pl-3 pr-6 text-right text-slate-400"><time dateTime={ticket.updated_at}>{dateLabel(ticket.updated_at)}</time></td></tr>)}</tbody>
        </table></div>
      ) : <div className="flex min-h-[244px] flex-col items-center justify-center px-6 py-8 text-center"><span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-400"><Icon name="tickets" className="size-7" /></span><h3 className="text-sm font-semibold text-slate-700">A fresh start for better support</h3><p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-400">{canCreate ? 'Open your first ticket and let the team take it from here.' : 'New support requests will appear here as they arrive.'}</p>{canCreate && <Link to="/tickets/new" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600">Create a ticket <Icon name="arrow" className="size-3.5" /></Link>}</div>}
    </section>
  )
}
