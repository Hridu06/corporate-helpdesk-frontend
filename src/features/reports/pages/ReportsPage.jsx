import { useEffect, useState } from 'react'
import { Alert } from '../../../components/common/Alert'
import { Button } from '../../../components/common/Button'
import { EmptyState } from '../../../components/common/EmptyState'
import { LoadingSpinner } from '../../../components/common/LoadingSpinner'
import { PageHeader } from '../../../components/common/PageHeader'
import { UnauthorizedPage } from '../../../pages/errors/UnauthorizedPage'
import { BarList } from '../components/BarList'
import { AgentTable, DepartmentTable } from '../components/DataTables'
import { ReportFilters } from '../components/ReportFilters'
import { StatCards } from '../components/StatCards'
import { TimelineChart } from '../components/TimelineChart'
import { AGEING_LABELS, PRIORITY_LABELS, STATUS_LABELS } from '../format'
import { fetchReportOptions } from '../reportsApi'
import { useReports } from '../useReports'

function formatRange(range) {
  const format = (date) => new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
  return `${format(range.from)} to ${format(range.to)} (${range.days} day${range.days === 1 ? '' : 's'}, ${range.timezone} time)`
}

function Definitions() {
  return (
    <details className="mb-6 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
      <summary className="cursor-pointer font-medium text-slate-900">How these numbers are counted</summary>
      <ul className="mt-3 list-disc space-y-1.5 pl-5">
        <li>
          <strong>Created</strong> and <strong>resolved</strong> count tickets whose opening or resolving time falls in the period. A ticket that is reopened loses its
          resolved time and counts as resolved again only when it is resolved again.
        </li>
        <li>
          <strong>Open now</strong>, <strong>unassigned now</strong> and the waiting-time figures are today&apos;s picture, whatever period you choose.
        </li>
        <li>
          <strong>Resolution time</strong> runs from creation to resolving. <strong>First response</strong> runs from creation to the first public reply from someone other than the customer;
          internal notes and the customer&apos;s own messages do not count.
        </li>
        <li>
          <strong>Reopen rate</strong> is tickets reopened in the period divided by tickets resolved in it, so it can exceed 100%. Agent figures follow each ticket&apos;s current assignee.
        </li>
        <li>The status, priority and department breakdowns cover tickets created in the period.</li>
      </ul>
    </details>
  )
}

export function ReportsPage() {
  const [filters, setFilters] = useState({ days: 30, from: '', to: '', departmentId: '' })
  const [departments, setDepartments] = useState([])
  const { data, error, loading, reload } = useReports(filters)

  useEffect(() => {
    let active = true
    fetchReportOptions()
      .then((options) => active && setDepartments(options.departments))
      // Only the department filter needs this; the report itself still works without it.
      .catch(() => active && setDepartments([]))
    return () => {
      active = false
    }
  }, [])

  if (error?.status === 403) return <UnauthorizedPage />

  const empty = data && data.overview.created === 0 && data.overview.resolved === 0 && data.overview.open_now === 0

  return (
    <>
      <PageHeader title="Reports" description="How tickets are flowing, how fast they are answered and resolved, and who is carrying the load." />

      <ReportFilters filters={filters} departments={departments} onChange={setFilters} />

      {error && (
        <Alert variant="error">
          <div className="flex items-center justify-between gap-4">
            <span>{error.message}</span>
            <Button variant="secondary" size="sm" onClick={reload}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {!data && !error && (
        <div className="flex justify-center py-16 text-brand-600">
          <LoadingSpinner size="lg" label="Loading reports" />
        </div>
      )}

      {data && (
        <div className="space-y-6" aria-busy={loading || undefined}>
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <span>{formatRange(data.range)}</span>
            {loading && (
              <span className="inline-flex items-center gap-1 text-brand-600">
                <LoadingSpinner label="Updating reports" /> Updating…
              </span>
            )}
          </p>

          <Definitions />

          {empty ? (
            <EmptyState title="No tickets to report on" description="There are no tickets for this period and department. Try a longer period or another department." />
          ) : (
            <>
              <StatCards overview={data.overview} />
              <TimelineChart timeline={data.timeline} granularity={data.range.granularity} />
              <div className="grid gap-6 lg:grid-cols-3">
                <BarList title="By status" items={data.breakdown.status} labels={STATUS_LABELS} />
                <BarList title="By priority" items={data.breakdown.priority} labels={PRIORITY_LABELS} barClass="bg-amber-500" />
                <BarList title="Open tickets by age" items={data.breakdown.ageing} labels={AGEING_LABELS} barClass="bg-rose-500" />
              </div>
              <DepartmentTable departments={data.breakdown.departments} />
              <AgentTable agents={data.agents} />
            </>
          )}
        </div>
      )}
    </>
  )
}
