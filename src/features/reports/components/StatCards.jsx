import { formatDuration, formatPercent } from '../format'

function Card({ label, value, note }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-2 text-2xl font-semibold text-slate-900">{value}</dd>
      {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
    </div>
  )
}

/** The headline numbers. The first four count the chosen period; "Open now" and "Unassigned now" are today's snapshot. */
export function StatCards({ overview }) {
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Card label="Tickets created" value={overview.created} note="In the period" />
      <Card label="Tickets resolved" value={overview.resolved} note="In the period" />
      <Card label="Open now" value={overview.open_now} note="Open or in progress, today" />
      <Card label="Unassigned now" value={overview.unassigned_now} note="Open with no agent, today" />
      <Card label="Average resolution time" value={formatDuration(overview.avg_resolution_seconds)} note="Created to resolved" />
      <Card
        label="Average first response"
        value={formatDuration(overview.avg_first_response_seconds)}
        note={`${overview.answered} ticket${overview.answered === 1 ? '' : 's'} answered`}
      />
      <Card label="Reopened tickets" value={overview.reopened} note="Worked on again after resolving" />
      <Card label="Reopen rate" value={formatPercent(overview.reopen_rate)} note="Reopened ÷ resolved" />
    </dl>
  )
}
