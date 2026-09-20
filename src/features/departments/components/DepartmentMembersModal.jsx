import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Alert } from '../../../components/common/Alert'
import { Button } from '../../../components/common/Button'
import { Input } from '../../../components/common/Input'
import { LoadingSpinner } from '../../../components/common/LoadingSpinner'
import { Modal } from '../../../components/common/Modal'
import { roleLabel } from '../../../utils/roles'
import { fetchAssignableStaff, getDepartment, updateDepartmentMembers } from '../departmentsApi'

/**
 * Choose which staff belong to a department. Mount only while open.
 * Members who are no longer eligible (deactivated, or no longer staff) are not
 * shown and are dropped on save; a note says how many.
 */
export function DepartmentMembersModal({ department, onClose, onSaved }) {
  const [load, setLoad] = useState({ status: 'loading', staff: [], selected: new Set(), dropped: 0, error: null })
  const [filter, setFilter] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    let active = true
    Promise.all([fetchAssignableStaff(), getDepartment(department.id)])
      .then(([staff, details]) => {
        if (!active) return
        const eligible = new Set(staff.map((person) => person.id))
        const current = details.members.map((member) => member.id)
        const kept = current.filter((id) => eligible.has(id))
        setLoad({ status: 'ready', staff, selected: new Set(kept), dropped: current.length - kept.length, error: null })
      })
      .catch((error) => active && setLoad((state) => ({ ...state, status: 'error', error })))
    return () => {
      active = false
    }
  }, [department.id])

  const visibleStaff = useMemo(() => {
    const term = filter.trim().toLowerCase()
    return term
      ? load.staff.filter((person) => person.name.toLowerCase().includes(term) || person.email.toLowerCase().includes(term))
      : load.staff
  }, [load.staff, filter])

  const toggle = (id) =>
    setLoad((state) => {
      const selected = new Set(state.selected)
      if (selected.has(id)) selected.delete(id)
      else selected.add(id)
      return { ...state, selected }
    })

  const save = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const { message } = await updateDepartmentMembers(department.id, [...load.selected])
      toast.success(message)
      onSaved()
    } catch (error) {
      setSaveError(error.errors?.user_ids?.[0] ?? error.message)
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Members of ${department.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving} disabled={load.status !== 'ready'}>
            Save members
          </Button>
        </>
      }
    >
      {load.status === 'loading' && (
        <div className="flex justify-center py-6 text-brand-600">
          <LoadingSpinner label="Loading staff" />
        </div>
      )}
      {load.status === 'error' && <Alert variant="error">{load.error.message}</Alert>}
      {load.status === 'ready' && (
        <div className="space-y-3">
          {saveError && <Alert variant="error">{saveError}</Alert>}
          {load.dropped > 0 && (
            <Alert variant="warning">
              {load.dropped} current member{load.dropped === 1 ? ' is' : 's are'} no longer eligible (deactivated or not
              staff) and will be removed when you save.
            </Alert>
          )}
          <Input label="Filter staff" type="search" placeholder="Name or email" value={filter} onChange={(event) => setFilter(event.target.value)} />
          {load.staff.length === 0 ? (
            <p className="text-sm text-slate-500">There are no active agents or admins to add yet.</p>
          ) : (
            <fieldset>
              <legend className="mb-1 text-sm font-medium text-slate-700">
                Staff ({load.selected.size} selected)
              </legend>
              <ul className="max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-md border border-slate-200">
                {visibleStaff.map((person) => (
                  <li key={person.id}>
                    <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={load.selected.has(person.id)}
                        onChange={() => toggle(person.id)}
                        className="size-4 rounded border-slate-300 text-brand-600"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-slate-900">{person.name}</span>
                        <span className="block truncate text-slate-500">{person.email}</span>
                      </span>
                      <span className="shrink-0 text-xs text-slate-500">{person.roles.map(roleLabel).join(', ')}</span>
                    </label>
                  </li>
                ))}
                {visibleStaff.length === 0 && <li className="px-3 py-2 text-sm text-slate-500">No staff match your filter.</li>}
              </ul>
            </fieldset>
          )}
        </div>
      )}
    </Modal>
  )
}
