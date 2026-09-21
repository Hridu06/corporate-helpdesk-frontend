import { useEffect, useState } from 'react'
import { LoadingSpinner } from '../../../components/common/LoadingSpinner'
import { fetchRoleHistory } from '../rolesApi'

function formatDateTime(value) {
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

/** The most recent changes to one role. `refreshKey` changes after each save so the list stays current. */
export function RoleHistory({ roleName, labels, refreshKey }) {
  const [state, setState] = useState({ key: null, entries: [], error: null })
  const key = `${roleName}:${refreshKey}`

  useEffect(() => {
    let active = true
    fetchRoleHistory(roleName)
      .then((entries) => active && setState({ key, entries, error: null }))
      .catch((error) => active && setState({ key, entries: [], error }))
    return () => {
      active = false
    }
  }, [roleName, key])

  const label = (name) => labels[name] ?? name
  const list = (names) => names.map(label).join(', ')

  return (
    <section aria-labelledby="history-heading" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 id="history-heading" className="text-base font-semibold text-slate-900">
        Recent changes
      </h3>

      {state.key !== key && (
        <div className="mt-3 text-brand-600">
          <LoadingSpinner label="Loading history" />
        </div>
      )}
      {state.key === key && state.error && <p className="mt-3 text-sm text-red-700">{state.error.message}</p>}
      {state.key === key && !state.error && state.entries.length === 0 && <p className="mt-3 text-sm text-slate-500">No changes yet: this role still has its original permissions.</p>}

      {state.key === key && state.entries.length > 0 && (
        <ol className="mt-3 space-y-3 border-l border-slate-200 pl-4 text-sm">
          {state.entries.map((entry) => (
            <li key={entry.id}>
              <p className="text-slate-900">
                <span className="font-medium">{entry.actor?.name ?? 'A former team member'}</span> {entry.action === 'reset' ? 'reset the role to its defaults' : 'changed the role'}
              </p>
              {entry.added.length > 0 && <p className="text-green-800">Added: {list(entry.added)}</p>}
              {entry.removed.length > 0 && <p className="text-red-800">Removed: {list(entry.removed)}</p>}
              <p className="text-xs text-slate-500">{formatDateTime(entry.created_at)}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
