import { describeEvent } from '../labels'

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : ''
}

/** History, oldest first, starting with when the ticket was opened. */
export function TicketTimeline({ openedAt, events }) {
  return (
    <section aria-labelledby="history-heading" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 id="history-heading" className="text-base font-semibold text-slate-900">
        History
      </h2>
      <ol className="mt-3 space-y-3 border-l border-slate-200 pl-4 text-sm">
        <li>
          <p className="text-slate-900">Ticket opened.</p>
          <p className="text-xs text-slate-500">{formatDateTime(openedAt)}</p>
        </li>
        {events.map((event) => (
          <li key={event.id}>
            <p className="text-slate-900">{describeEvent(event)}</p>
            <p className="text-xs text-slate-500">{formatDateTime(event.created_at)}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
