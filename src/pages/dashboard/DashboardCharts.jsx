import { useId, useState } from 'react'
import { Icon } from '../../components/common/Icon'
import { formatBucket } from '../../features/reports/format'

const PRIORITIES = [
  { key: 'urgent', label: 'Urgent', color: '#f6536a' },
  { key: 'high', label: 'High', color: '#ffb020' },
  { key: 'medium', label: 'Medium', color: '#3185fc' },
  { key: 'low', label: 'Low', color: '#48c781' },
]
const DEPARTMENT_COLORS = ['#8055ef', '#3185fc', '#25bd83', '#ffb020', '#b882ed']

export function ActivityChart({ timeline = [], loading }) {
  const gradientId = useId().replaceAll(':', '')
  const [table, setTable] = useState(false)
  const width = 700, height = 225
  const pad = { x: 36, top: 16, bottom: 34 }
  const maximum = Math.max(4, ...timeline.flatMap((item) => [item.created, item.resolved]))
  const max = Math.ceil(maximum / 4) * 4
  const x = (index) => pad.x + (index / Math.max(1, timeline.length - 1)) * (width - pad.x - 12)
  const y = (value) => height - pad.bottom - (value / max) * (height - pad.bottom - pad.top)
  const line = (key) => timeline.map((item, index) => `${index ? 'L' : 'M'}${x(index)},${y(item[key])}`).join(' ')
  const area = (key) => timeline.length ? `${line(key)} L${x(timeline.length - 1)},${y(0)} L${x(0)},${y(0)} Z` : ''
  const empty = !timeline.some((item) => item.created || item.resolved)
  const labelsEvery = Math.max(1, Math.ceil(timeline.length / 7))

  return (
    <section className="dashboard-panel min-w-0 p-5 sm:p-6" aria-label="Tickets over time" aria-busy={loading}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="panel-title">Tickets over time</h2><p className="mt-1 text-[11px] text-slate-400">A little perspective on your support flow</p></div>
        <div className="flex items-center gap-4 text-[11px] text-slate-500"><span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-blue-500" />Created</span><span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-emerald-500" />Resolved</span></div>
      </div>
      <div className="relative mt-5">
        {table ? <div className="max-h-[225px] overflow-auto"><table className="w-full text-left text-xs"><caption className="sr-only">Ticket activity by date</caption><thead className="sticky top-0 bg-white text-slate-500"><tr><th className="py-2">Date</th><th>Created</th><th>Resolved</th></tr></thead><tbody>{timeline.map((item) => <tr key={item.date} className="border-t border-slate-100"><td className="py-2">{formatBucket(item.date, 'day')}</td><td>{item.created}</td><td>{item.resolved}</td></tr>)}</tbody></table></div> : <>
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className={`h-[210px] w-full ${loading ? 'animate-pulse opacity-40' : ''}`} role="img" aria-label={empty ? 'No ticket activity for this period' : 'Created and resolved tickets by date. Use View data for exact values.'}>
            <defs><linearGradient id={`${gradientId}-created`} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity=".15" /><stop offset="100%" stopColor="#3b82f6" stopOpacity="0" /></linearGradient><linearGradient id={`${gradientId}-resolved`} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity=".15" /><stop offset="100%" stopColor="#10b981" stopOpacity="0" /></linearGradient></defs>
            {[0, 1, 2, 3, 4].map((step) => <g key={step}><line x1={pad.x} x2={width - 12} y1={y(step * max / 4)} y2={y(step * max / 4)} stroke="#edf0f7" /><text x={pad.x - 10} y={y(step * max / 4) + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{step * max / 4}</text></g>)}
            {!empty && <><path d={area('created')} fill={`url(#${gradientId}-created)`} /><path d={area('resolved')} fill={`url(#${gradientId}-resolved)`} /><path d={line('created')} fill="none" stroke="#3185fc" strokeWidth="2.5" strokeLinejoin="round" /><path d={line('resolved')} fill="none" stroke="#22be81" strokeWidth="2.5" strokeLinejoin="round" /></>}
            {timeline.map((item, index) => <g key={item.date}><title>{`${formatBucket(item.date, 'day')}: ${item.created} created, ${item.resolved} resolved`}</title>{!empty && (index % labelsEvery === 0 || index === timeline.length - 1) && <><circle cx={x(index)} cy={y(item.created)} r="3.5" fill="#3185fc" stroke="white" strokeWidth="1.5" /><circle cx={x(index)} cy={y(item.resolved)} r="3.5" fill="#22be81" stroke="white" strokeWidth="1.5" /></>}{(index % labelsEvery === 0 || index === timeline.length - 1) && <text x={x(index)} y={height - 8} textAnchor={index === 0 ? 'start' : index === timeline.length - 1 ? 'end' : 'middle'} fontSize="10" fill="#94a3b8">{formatBucket(item.date, 'day')}</text>}</g>)}
          </svg>
          {empty && !loading && <div className="absolute inset-x-0 top-1/3 text-center"><span className="inline-flex rounded-full border border-slate-100 bg-white px-4 py-2 text-xs font-medium text-slate-500 shadow-sm">Your next ticket starts the story</span><p className="mt-2 text-[11px] text-slate-400">Activity will appear here as tickets come in.</p></div>}
        </>}
      </div>
      <button type="button" onClick={() => setTable((current) => !current)} className="mt-2 text-[10px] font-medium text-indigo-500 hover:text-indigo-700">{table ? 'View chart' : 'View data'} <span aria-hidden="true">↗</span></button>
    </section>
  )
}

export function PriorityChart({ priority = [], loading, subtitle = 'Tickets created in the selected period' }) {
  const total = priority.reduce((sum, item) => sum + item.count, 0)
  const counts = PRIORITIES.map((item) => ({ ...item, count: priority.find((entry) => entry.key === item.key)?.count ?? 0 }))
  const segments = counts.map((item, index) => {
    const share = total ? item.count / total * 100 : 0
    const start = total ? counts.slice(0, index).reduce((sum, previous) => sum + previous.count, 0) / total * 100 : 0
    return { ...item, share, start, end: start + share }
  })
  const background = total ? `conic-gradient(${segments.map((item) => `${item.color} ${item.start}% ${item.end}%`).join(', ')})` : '#ede9fe'
  return (
    <section className="dashboard-panel p-5 sm:p-6" aria-label="Tickets by priority" aria-busy={loading}>
      <h2 className="panel-title">Tickets by priority</h2><p className="mt-1 text-[11px] text-slate-400">{subtitle}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-6 min-[1450px]:gap-7">
        <div className={`relative flex size-[150px] shrink-0 items-center justify-center rounded-full ${!total ? 'opacity-70' : ''}`} style={{ background }} role="img" aria-label={loading ? 'Loading priority distribution' : `${total} tickets by priority`}>
          <div className="flex size-[106px] flex-col items-center justify-center rounded-full bg-white shadow-[0_0_16px_rgb(255_255_255/0.7)]"><strong className="text-[27px] font-bold tracking-[-1px] text-slate-900">{loading ? '—' : total.toLocaleString()}</strong><span className="text-[11px] text-slate-400">Tickets</span></div>
        </div>
        <ul className="min-w-[130px] flex-1 space-y-4">{segments.map((item) => <li key={item.key} className="flex items-center gap-2 text-[11px]"><span className="size-2 shrink-0 rounded-full" style={{ background: item.color }} /><span className="text-slate-600">{item.label}</span><span className="ml-auto font-semibold text-slate-800">{loading ? '—' : `${Math.round(item.share)}%`} <span className="font-normal text-slate-400">({loading ? '—' : item.count})</span></span></li>)}</ul>
      </div>
    </section>
  )
}

export function DepartmentChart({ departments = [], loading }) {
  const total = departments.reduce((sum, item) => sum + item.created, 0)
  const sorted = total ? [...departments].sort((a, b) => b.created - a.created) : []
  const items = sorted.length > 5 ? [...sorted.slice(0, 4), { id: 'other', name: 'Other departments', created: sorted.slice(4).reduce((sum, item) => sum + item.created, 0) }] : sorted
  return (
    <section className="dashboard-panel p-5 sm:p-6" aria-label="Tickets by department" aria-busy={loading}>
      <h2 className="panel-title">Tickets by department</h2><p className="mt-1 text-[11px] text-slate-400">Where your requests are coming in</p>
      <div className="mt-6 space-y-5">{items.map((item, index) => {
        const share = total ? Math.round(item.created / total * 100) : 0
        return <div key={item.id} className="flex items-center gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-500"><Icon name="departments" className="size-4" /></span><span title={item.name || 'No department'} className="w-24 shrink-0 truncate text-[11px] font-medium text-slate-600">{item.name || 'No department'}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${share}%`, background: DEPARTMENT_COLORS[index] }} /></div><span className="w-8 text-right text-[11px] font-semibold text-slate-600">{share}%</span></div>
      })}</div>
      {!items.length && <div className="flex min-h-[180px] flex-col items-center justify-center text-center"><span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-400"><Icon name="departments" className="size-6" /></span><p className="text-xs font-medium text-slate-500">{loading ? 'Loading departments...' : 'A place for every request'}</p><p className="mt-1.5 max-w-52 text-[11px] leading-relaxed text-slate-400">Department activity appears here when tickets are created.</p></div>}
    </section>
  )
}
