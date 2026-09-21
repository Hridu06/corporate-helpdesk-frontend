import { useState } from 'react'
import { Button } from '../../../components/common/Button'
import { formatBucket } from '../format'

const WIDTH = 720
const HEIGHT = 220
const PAD = { top: 12, right: 8, bottom: 26, left: 32 }

/**
 * Tickets opened and resolved per day (per week on long periods) as paired bars, drawn as plain SVG.
 * "Show as table" swaps in the same numbers as a table, for screen readers and exact values.
 */
export function TimelineChart({ timeline, granularity }) {
  const [asTable, setAsTable] = useState(false)

  const totals = timeline.reduce((sum, bucket) => ({ created: sum.created + bucket.created, resolved: sum.resolved + bucket.resolved }), { created: 0, resolved: 0 })
  const max = Math.max(1, ...timeline.flatMap((bucket) => [bucket.created, bucket.resolved]))
  const innerWidth = WIDTH - PAD.left - PAD.right
  const innerHeight = HEIGHT - PAD.top - PAD.bottom
  const slot = innerWidth / Math.max(1, timeline.length)
  const barWidth = Math.max(1, Math.min(14, slot / 2 - 1))
  const y = (value) => PAD.top + innerHeight - (value / max) * innerHeight
  const labelAt = new Set([0, Math.floor((timeline.length - 1) / 2), timeline.length - 1])
  const unit = granularity === 'week' ? 'week' : 'day'
  const summary = `Tickets opened and resolved per ${unit}: ${totals.created} opened and ${totals.resolved} resolved in total.`

  return (
    <section aria-labelledby="timeline-heading" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 id="timeline-heading" className="text-base font-semibold text-slate-900">
            Opened and resolved per {unit}
          </h3>
          <p className="mt-1 flex flex-wrap gap-x-4 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-brand-600" aria-hidden="true" /> Opened ({totals.created})
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-emerald-500" aria-hidden="true" /> Resolved ({totals.resolved})
            </span>
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setAsTable((current) => !current)}>
          {asTable ? 'Show as chart' : 'Show as table'}
        </Button>
      </div>

      {asTable ? (
        <div className="mt-4 max-h-80 overflow-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{summary}</caption>
            <thead className="sticky top-0 bg-white text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="py-2 pr-4 font-semibold">
                  {unit === 'week' ? 'Week starting' : 'Day'}
                </th>
                <th scope="col" className="py-2 pr-4 font-semibold">
                  Opened
                </th>
                <th scope="col" className="py-2 font-semibold">
                  Resolved
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {timeline.map((bucket) => (
                <tr key={bucket.date}>
                  <th scope="row" className="py-1.5 pr-4 font-normal text-slate-700">
                    {formatBucket(bucket.date, 'day')}
                  </th>
                  <td className="py-1.5 pr-4">{bucket.created}</td>
                  <td className="py-1.5">{bucket.resolved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={summary} className="mt-4 h-auto w-full">
          <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(0)} y2={y(0)} stroke="#cbd5e1" />
          <text x={PAD.left - 6} y={PAD.top + 4} textAnchor="end" fontSize="10" fill="#64748b">
            {max}
          </text>
          <text x={PAD.left - 6} y={y(0)} textAnchor="end" fontSize="10" fill="#64748b">
            0
          </text>
          {timeline.map((bucket, index) => {
            const x = PAD.left + index * slot + slot / 2
            return (
              <g key={bucket.date}>
                <title>{`${formatBucket(bucket.date, granularity)}: ${bucket.created} opened, ${bucket.resolved} resolved`}</title>
                <rect x={x - barWidth - 0.5} y={y(bucket.created)} width={barWidth} height={y(0) - y(bucket.created)} rx="1" fill="#2563eb" />
                <rect x={x + 0.5} y={y(bucket.resolved)} width={barWidth} height={y(0) - y(bucket.resolved)} rx="1" fill="#10b981" />
                {labelAt.has(index) && (
                  <text x={x} y={HEIGHT - 8} textAnchor={index === 0 ? 'start' : index === timeline.length - 1 ? 'end' : 'middle'} fontSize="10" fill="#64748b">
                    {formatBucket(bucket.date, granularity)}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      )}
    </section>
  )
}
