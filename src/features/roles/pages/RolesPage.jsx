import { useState } from 'react'
import { Alert } from '../../../components/common/Alert'
import { Badge } from '../../../components/common/Badge'
import { Button } from '../../../components/common/Button'
import { LoadingSpinner } from '../../../components/common/LoadingSpinner'
import { PageHeader } from '../../../components/common/PageHeader'
import { cn } from '../../../utils/cn'
import { UnauthorizedPage } from '../../../pages/errors/UnauthorizedPage'
import { RoleEditor } from '../components/RoleEditor'
import { RoleHistory } from '../components/RoleHistory'
import { useRoles } from '../useRoles'

export function RolesPage() {
  const { roles, groups, error, loading, reload } = useRoles()
  const [selected, setSelected] = useState(null)
  const [saves, setSaves] = useState(0) // bumps after each save so the history list refreshes

  if (error?.status === 403) return <UnauthorizedPage />

  if (error && !roles) {
    return (
      <>
        <PageHeader title="Roles & Permissions" />
        <Alert variant="error">
          <div className="flex items-center justify-between gap-4">
            <span>{error.message}</span>
            <Button variant="secondary" size="sm" onClick={reload}>
              Retry
            </Button>
          </div>
        </Alert>
      </>
    )
  }

  if (!roles || !groups) {
    return (
      <div className="flex justify-center py-16 text-brand-600">
        <LoadingSpinner size="lg" label="Loading roles" />
      </div>
    )
  }

  const role = roles.find((item) => item.name === selected) ?? roles.find((item) => item.editable) ?? roles[0]
  const labels = Object.fromEntries(groups.flatMap((group) => group.permissions).map((permission) => [permission.name, permission.label]))
  const canEditAny = roles.some((item) => item.editable)

  return (
    <>
      <PageHeader title="Roles & Permissions" description="What each role is allowed to do. Changes take effect at once for everyone with that role." />

      {!canEditAny && (
        <Alert variant="info" className="mb-4">
          You can look at the roles but not change them.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <nav aria-label="Roles">
          <ul className="space-y-2">
            {roles.map((item) => (
              <li key={item.name}>
                <button
                  type="button"
                  aria-current={item.name === role.name ? 'true' : undefined}
                  onClick={() => setSelected(item.name)}
                  className={cn(
                    'w-full rounded-lg border p-3 text-left',
                    item.name === role.name ? 'border-brand-600 bg-brand-50' : 'border-slate-200 bg-white hover:bg-slate-50',
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-900">{item.label}</span>{' '}
                    {!item.editable && <Badge variant="neutral">Read only</Badge>}
                  </span>{' '}
                  <span className="mt-0.5 block text-xs text-slate-600">
                    {item.user_count} {item.user_count === 1 ? 'person' : 'people'}
                    {item.editable && !item.is_default ? ' · customised' : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{role.label}</h2>
            <p className="mt-1 text-sm text-slate-600">{role.description}</p>
            {loading && <p className="mt-1 text-xs text-brand-600">Updating…</p>}
          </div>

          <RoleEditor
            key={`${role.name}:${role.version}`}
            role={role}
            groups={groups}
            onReload={reload}
            onSaved={() => {
              setSaves((count) => count + 1)
              reload()
            }}
          />

          <RoleHistory roleName={role.name} labels={labels} refreshKey={saves} />
        </div>
      </div>
    </>
  )
}
