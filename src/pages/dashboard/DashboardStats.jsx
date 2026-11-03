import { Icon } from '../../components/common/Icon'

const STATS = [
  { key: 'total', label: 'Total Tickets', icon: 'tickets', color: 'violet' },
  { key: 'open', label: 'Open', icon: 'open', color: 'blue' },
  { key: 'in_progress', label: 'In Progress', icon: 'progress', color: 'amber' },
  { key: 'resolved', label: 'Resolved', icon: 'check', color: 'green' },
  { key: 'closed', label: 'Closed', icon: 'close', color: 'rose' },
]

export function DashboardStats({ summary, loading }) {
  const total = summary ? Object.values(summary.counts).reduce((sum, count) => sum + count, 0) : null
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5 xl:gap-4" aria-label="Ticket overview" aria-busy={loading}>
      {STATS.map((stat) => {
        const value = stat.key === 'total' ? total : summary?.counts[stat.key]
        const share = total ? Math.round((value / total) * 100) : 0
        return (
          <div key={stat.key} className={`dashboard-stat dashboard-stat-${stat.color} dashboard-panel relative overflow-hidden p-4 sm:p-5`}>
            <div className="mb-4 flex items-center gap-2.5">
              <span className="stat-icon flex size-10 shrink-0 items-center justify-center rounded-2xl"><Icon name={stat.icon} className="size-[21px]" /></span>
              <dt className="text-[13px] font-medium text-slate-600">{stat.label}</dt>
            </div>
            <dd className="flex flex-wrap items-baseline justify-between gap-1">
              <span className="text-[29px] font-bold leading-none tracking-[-1.2px] text-slate-900 tabular-nums">{loading ? <span className="block h-7 w-14 animate-pulse rounded-md bg-slate-100" /> : value == null ? '—' : value.toLocaleString()}</span>
              <span className="text-[10px] font-medium text-slate-400">{value == null ? 'Awaiting data' : stat.key === 'total' ? 'All statuses' : `${share}% of total`}</span>
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
