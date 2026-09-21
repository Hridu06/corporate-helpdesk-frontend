import { useState } from 'react'
import toast from 'react-hot-toast'
import { Alert } from '../../../components/common/Alert'
import { Badge } from '../../../components/common/Badge'
import { Button } from '../../../components/common/Button'
import { ConfirmDialog } from '../../../components/common/ConfirmDialog'
import { cn } from '../../../utils/cn'
import { resetRole, updateRolePermissions } from '../rolesApi'

/**
 * Why a permission cannot be switched in this role, or null when it can. Mirrors the rules the
 * server enforces (ceiling, floor, reserved, "you cannot grant what you lack"): they are here
 * to explain, not to protect, since the API refuses anything the screen would allow by mistake.
 */
function lockedBecause(role, permission, checked, wasGranted) {
  if (!role.editable) return null // the banner above explains it once for the whole role
  if (permission.reserved) return 'Not used by any feature yet'
  if (permission.required_for.includes(role.name)) return 'Required: this role cannot work without it'
  if (!permission.allowed_for.includes(role.name)) return checked ? null : `Can never be given to the ${role.label} role`
  if (!checked && !wasGranted && !permission.can_grant) return "You don't hold this permission, so you can't grant it"
  return null
}

function PermissionRow({ role, permission, checked, wasGranted, onToggle }) {
  const reason = lockedBecause(role, permission, checked, wasGranted)
  const disabled = !role.editable || reason !== null

  return (
    <li className={cn('flex items-start gap-3 rounded-md px-3 py-2', disabled && 'bg-slate-50')}>
      <input
        id={`permission-${permission.name}`}
        type="checkbox"
        className="mt-1 size-4 rounded border-slate-300 text-brand-600"
        checked={checked}
        disabled={disabled}
        onChange={() => onToggle(permission.name)}
      />
      <label htmlFor={`permission-${permission.name}`} className="min-w-0 flex-1 text-sm">
        <span className="flex flex-wrap items-center gap-2">
          <span className={cn('font-medium', disabled ? 'text-slate-500' : 'text-slate-900')}>{permission.label}</span>
          {permission.sensitive && <Badge variant="warning">Sensitive</Badge>}
        </span>
        <span className="block text-slate-600">{permission.description}</span>
        {reason && <span className="mt-0.5 block text-xs text-slate-500">{reason}</span>}
      </label>
    </li>
  )
}

/**
 * One role's permissions as a checklist grouped by area. Changes stay in a draft until the person
 * confirms the exact list of what will be added and removed. Mount with `key` = role name + version
 * so the draft starts over whenever the saved role changes.
 */
export function RoleEditor({ role, groups, onSaved, onReload }) {
  const [draft, setDraft] = useState(role.permissions)
  const [confirming, setConfirming] = useState(null) // 'save' | 'reset'
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState(null) // { lines: [...], stale: bool }

  const current = new Set(role.permissions)
  const draftSet = new Set(draft)
  const added = draft.filter((name) => !current.has(name))
  const removed = role.permissions.filter((name) => !draftSet.has(name))
  const dirty = added.length > 0 || removed.length > 0

  const catalog = Object.fromEntries(groups.flatMap((group) => group.permissions).map((permission) => [permission.name, permission]))
  const labelOf = (name) => catalog[name]?.label ?? name

  const toggle = (name) => setDraft((list) => (list.includes(name) ? list.filter((item) => item !== name) : [...list, name]))

  const run = async (request) => {
    setBusy(true)
    setProblem(null)
    try {
      const { message, role: saved } = await request()
      toast.success(message)
      setConfirming(null)
      onSaved(saved)
    } catch (error) {
      setConfirming(null)
      if (error.status === 409) setProblem({ stale: true, lines: [error.message] })
      else setProblem({ lines: error.errors?.permissions ?? [error.message] })
    } finally {
      setBusy(false)
    }
  }

  const sensitiveAdded = added.filter((name) => catalog[name]?.sensitive)

  return (
    <div className="space-y-4">
      {!role.editable && (
        <Alert variant="info" title="Read only">
          {role.locked_reason}
        </Alert>
      )}

      {problem && (
        <Alert variant="error" title={problem.stale ? 'Someone else changed this role' : 'This change was not saved'}>
          <ul className="list-disc space-y-1 pl-5">
            {problem.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {problem.stale && (
            <Button className="mt-3" variant="secondary" size="sm" onClick={onReload}>
              Load the current permissions
            </Button>
          )}
        </Alert>
      )}

      {groups.map((group) => (
        <section key={group.key} aria-labelledby={`group-${group.key}`} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 id={`group-${group.key}`} className="mb-2 text-base font-semibold text-slate-900">
            {group.label}
          </h3>
          <ul className="space-y-1">
            {group.permissions.map((permission) => (
              <PermissionRow
                key={permission.name}
                role={role}
                permission={permission}
                checked={draftSet.has(permission.name)}
                wasGranted={current.has(permission.name)}
                onToggle={toggle}
              />
            ))}
          </ul>
        </section>
      ))}

      {role.editable && (
        <div className="sticky bottom-0 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-md">
          <p className="mr-auto text-sm text-slate-700" aria-live="polite">
            {dirty ? `${added.length} to add, ${removed.length} to remove` : 'No unsaved changes'}
          </p>
          {!role.is_default && !dirty && (
            <Button variant="secondary" onClick={() => setConfirming('reset')}>
              Reset to defaults
            </Button>
          )}
          <Button variant="secondary" disabled={!dirty} onClick={() => setDraft(role.permissions)}>
            Discard changes
          </Button>
          <Button disabled={!dirty} onClick={() => setConfirming('save')}>
            Save changes
          </Button>
        </div>
      )}

      {confirming === 'save' && (
        <ConfirmDialog
          title={`Change the ${role.label} role?`}
          confirmLabel="Save changes"
          loading={busy}
          onCancel={() => setConfirming(null)}
          onConfirm={() => run(() => updateRolePermissions(role.name, draft, role.version))}
        >
          <p>
            This takes effect immediately for the {role.user_count} {role.user_count === 1 ? 'person' : 'people'} with this role.
          </p>
          {added.length > 0 && (
            <div className="mt-3">
              <p className="font-medium text-slate-900">Will be added</p>
              <ul className="list-disc pl-5 text-green-800">
                {added.map((name) => (
                  <li key={name}>{labelOf(name)}</li>
                ))}
              </ul>
            </div>
          )}
          {removed.length > 0 && (
            <div className="mt-3">
              <p className="font-medium text-slate-900">Will be removed</p>
              <ul className="list-disc pl-5 text-red-800">
                {removed.map((name) => (
                  <li key={name}>{labelOf(name)}</li>
                ))}
              </ul>
            </div>
          )}
          {sensitiveAdded.length > 0 && (
            <Alert variant="warning" className="mt-3" title="Sensitive access">
              {sensitiveAdded.map(labelOf).join(', ')} give access to other people&apos;s data or to account controls. Be sure this role should have {sensitiveAdded.length === 1 ? 'it' : 'them'}.
            </Alert>
          )}
        </ConfirmDialog>
      )}

      {confirming === 'reset' && (
        <ConfirmDialog
          title={`Reset the ${role.label} role to its defaults?`}
          confirmLabel="Reset to defaults"
          danger
          loading={busy}
          onCancel={() => setConfirming(null)}
          onConfirm={() => run(() => resetRole(role.name, role.version))}
        >
          Every change made to this role is undone at once, for the {role.user_count} {role.user_count === 1 ? 'person' : 'people'} with it.
        </ConfirmDialog>
      )}
    </div>
  )
}
