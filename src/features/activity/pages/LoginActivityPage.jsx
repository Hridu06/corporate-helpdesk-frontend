import { useState } from 'react'
import { Alert } from '../../../components/common/Alert'
import { Badge } from '../../../components/common/Badge'
import { Button } from '../../../components/common/Button'
import { EmptyState } from '../../../components/common/EmptyState'
import { Input } from '../../../components/common/Input'
import { LoadingSpinner } from '../../../components/common/LoadingSpinner'
import { PageHeader } from '../../../components/common/PageHeader'
import { Pagination } from '../../../components/common/Pagination'
import { Select } from '../../../components/forms/Select'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { cn } from '../../../utils/cn'
import { describeUserAgent } from '../../../utils/userAgent'
import { useLoginActivities } from '../useLoginActivities'

const PER_PAGE = 15

const STATUS = {
  success: { label: 'Signed in', variant: 'success' },
  failed: { label: 'Wrong password', variant: 'danger' },
  blocked: { label: 'Blocked', variant: 'warning' },
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : null
}

export function LoginActivityPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search.trim())

  const { activities, meta, loading, error, reload } = useLoginActivities({
    search: debouncedSearch,
    status,
    from,
    to,
    page,
    perPage: PER_PAGE,
  })

  // Changing a filter returns to the first page.
  const setFilter = (setter) => (event) => {
    setter(event.target.value)
    setPage(1)
  }

  const filtersActive = Boolean(debouncedSearch || status || from || to)

  return (
    <>
      <PageHeader
        title="Login Activity"
        description="Sign-in history for existing accounts. Attempts against unknown emails are never stored, and old records are removed automatically."
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input label="Search" type="search" placeholder="Name or email" value={search} onChange={setFilter(setSearch)} />
        <Select label="Result" value={status} onChange={setFilter(setStatus)}>
          <option value="">All results</option>
          {Object.entries(STATUS).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Input label="From" type="date" value={from} max={to || undefined} onChange={setFilter(setFrom)} />
        <Input label="To" type="date" value={to} min={from || undefined} onChange={setFilter(setTo)} />
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
            <LoadingSpinner size="sm" label="Loading activity" />
          </div>
        )}

        {activities.length > 0 ? (
          <div className={cn(loading && 'opacity-60')}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <caption className="sr-only">Sign-in history</caption>
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3">User</th>
                    <th scope="col" className="px-4 py-3">Result</th>
                    <th scope="col" className="px-4 py-3">Time</th>
                    <th scope="col" className="px-4 py-3">Signed out</th>
                    <th scope="col" className="px-4 py-3">IP address</th>
                    <th scope="col" className="px-4 py-3">Device</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {activities.map((activity) => {
                    const result = STATUS[activity.status] ?? { label: activity.status, variant: 'neutral' }

                    return (
                      <tr key={activity.id}>
                        <td className="px-4 py-3">
                          {activity.user ? (
                            <>
                              <p className="font-medium text-slate-900">{activity.user.name}</p>
                              <p className="text-slate-500">{activity.user.email}</p>
                            </>
                          ) : (
                            <p className="text-slate-500">Deleted account</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={result.variant}>{result.label}</Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateTime(activity.login_at)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {formatDateTime(activity.logout_at) ?? '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">{activity.ip_address ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-600" title={activity.user_agent ?? undefined}>
                          {describeUserAgent(activity.user_agent)}
                        </td>
                      </tr>
                    )
                  })}
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
              title={filtersActive ? 'No activity matches your filters' : 'No sign-in activity yet'}
              description={filtersActive ? 'Try a different search or widen the date range.' : undefined}
            />
          )
        )}
        {loading && activities.length === 0 && <div className="h-40" aria-hidden="true" />}
      </div>
    </>
  )
}
