/**
 * A horizontal bar per item, scaled to the largest. The number is always written out, so the
 * bars are a visual aid and never the only way to read a value.
 */
export function BarList({ title, items, labels, barClass = 'bg-brand-600' }) {
  const max = Math.max(1, ...items.map((item) => item.count))

  return (
    <section aria-label={title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.key}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-slate-700">{labels[item.key] ?? item.key}</span>
              <span className="font-medium text-slate-900">{item.count}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded bg-slate-100" aria-hidden="true">
              <div className={`h-full rounded ${barClass}`} style={{ width: `${(item.count / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
