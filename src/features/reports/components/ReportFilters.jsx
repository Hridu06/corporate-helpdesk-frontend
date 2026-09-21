import { useState } from 'react'
import { Button } from '../../../components/common/Button'
import { Input } from '../../../components/common/Input'
import { Select } from '../../../components/forms/Select'
import { cn } from '../../../utils/cn'

const PRESETS = [7, 30, 90]

/**
 * Period and department. A preset sends `days` and lets the server work out today in its own
 * time zone; a custom range sends the two dates once both are filled in and in order.
 */
export function ReportFilters({ filters, departments, onChange }) {
  const custom = !filters.days
  const [from, setFrom] = useState(filters.from || '')
  const [to, setTo] = useState(filters.to || '')
  const customError = from && to && from > to ? 'The start date must not be after the end date.' : null
  const canApply = Boolean(from && to && !customError)

  return (
    <form
      className="mb-6 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-end"
      aria-label="Report filters"
      onSubmit={(event) => {
        event.preventDefault()
        if (canApply) onChange({ ...filters, days: null, from, to })
      }}
    >
      <div role="group" aria-label="Period" className="flex flex-wrap gap-2">
        {PRESETS.map((days) => (
          <button
            key={days}
            type="button"
            aria-pressed={filters.days === days}
            onClick={() => onChange({ ...filters, days, from: '', to: '' })}
            className={cn(
              'rounded-md border px-3 py-2 text-sm font-medium',
              filters.days === days ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 text-slate-700 hover:bg-slate-50',
            )}
          >
            Last {days} days
          </button>
        ))}
        <button
          type="button"
          aria-pressed={custom}
          onClick={() => onChange({ ...filters, days: null, from: from || '', to: to || '' })}
          className={cn(
            'rounded-md border px-3 py-2 text-sm font-medium',
            custom ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 text-slate-700 hover:bg-slate-50',
          )}
        >
          Custom
        </button>
      </div>

      {custom && (
        <div className="flex flex-wrap items-start gap-3">
          <Input label="From" type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} />
          <Input label="To" type="date" value={to} min={from || undefined} error={customError} onChange={(event) => setTo(event.target.value)} />
          <Button type="submit" variant="secondary" disabled={!canApply} className="mt-6">
            Apply
          </Button>
        </div>
      )}

      <div className="lg:ml-auto lg:w-56">
        <Select label="Department" value={filters.departmentId} onChange={(event) => onChange({ ...filters, departmentId: event.target.value })}>
          <option value="">All departments</option>
          <option value="none">No department</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </Select>
      </div>
    </form>
  )
}
