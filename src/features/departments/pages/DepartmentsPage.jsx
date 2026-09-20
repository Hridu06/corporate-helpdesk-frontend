import { useState } from 'react'
import toast from 'react-hot-toast'
import { Alert } from '../../../components/common/Alert'
import { Badge } from '../../../components/common/Badge'
import { Button } from '../../../components/common/Button'
import { ConfirmDialog } from '../../../components/common/ConfirmDialog'
import { EmptyState } from '../../../components/common/EmptyState'
import { Input } from '../../../components/common/Input'
import { LoadingSpinner } from '../../../components/common/LoadingSpinner'
import { PageHeader } from '../../../components/common/PageHeader'
import { Pagination } from '../../../components/common/Pagination'
import { Select } from '../../../components/forms/Select'
import { useAuth } from '../../../hooks/useAuth'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { cn } from '../../../utils/cn'
import { DepartmentDetailsModal } from '../components/DepartmentDetailsModal'
import { DepartmentFormModal } from '../components/DepartmentFormModal'
import { DepartmentMembersModal } from '../components/DepartmentMembersModal'
import { deleteDepartment } from '../departmentsApi'
import { useDepartments } from '../useDepartments'

const PER_PAGE = 15

export function DepartmentsPage() {
  const { hasPermission } = useAuth()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search.trim())

  const { departments, meta, loading, error, reload } = useDepartments({
    search: debouncedSearch,
    status,
    page,
    perPage: PER_PAGE,
  })

  // One dialog at a time: { type: 'create' | 'edit' | 'members' | 'details' | 'delete', department? }
  const [dialog, setDialog] = useState(null)
  const [busy, setBusy] = useState(false)
  const closeDialog = () => setDialog(null)
  const saved = () => {
    closeDialog()
    reload()
  }

  const setFilter = (setter) => (event) => {
    setter(event.target.value)
    setPage(1)
  }

  const confirmDelete = async () => {
    setBusy(true)
    try {
      const { message } = await deleteDepartment(dialog.department.id)
      toast.success(message)
      saved()
    } catch (err) {
      toast.error(err.message)
      closeDialog()
    } finally {
      setBusy(false)
    }
  }

  const canUpdate = hasPermission('department.update')
  const canDelete = hasPermission('department.delete')
  const filtersActive = Boolean(debouncedSearch || status)

  return (
    <>
      <PageHeader
        title="Departments"
        description="Support teams that tickets are routed to."
        actions={
          hasPermission('department.create') && <Button onClick={() => setDialog({ type: 'create' })}>New department</Button>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <Input label="Search" type="search" placeholder="Name or description" value={search} onChange={setFilter(setSearch)} />
        <Select label="Status" value={status} onChange={setFilter(setStatus)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
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
            <LoadingSpinner size="sm" label="Loading departments" />
          </div>
        )}

        {departments.length > 0 ? (
          <div className={cn(loading && 'opacity-60')}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <caption className="sr-only">Departments</caption>
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3">Department</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3">Members</th>
                    <th scope="col" className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {departments.map((department) => (
                    <tr key={department.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{department.name}</p>
                        {department.description && <p className="max-w-md truncate text-slate-500">{department.description}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={department.is_active ? 'success' : 'neutral'}>
                          {department.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{department.members_count}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <RowButton label="Details" name={department.name} onClick={() => setDialog({ type: 'details', department })} />
                          {canUpdate && <RowButton label="Members" name={department.name} onClick={() => setDialog({ type: 'members', department })} />}
                          {canUpdate && <RowButton label="Edit" name={department.name} onClick={() => setDialog({ type: 'edit', department })} />}
                          {canDelete && (
                            <RowButton label="Delete" name={department.name} variant="danger" onClick={() => setDialog({ type: 'delete', department })} />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
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
              title={filtersActive ? 'No departments match your filters' : 'No departments to show'}
              description={
                filtersActive
                  ? 'Try a different search or clear the filters.'
                  : hasPermission('department.create')
                    ? 'Create the first department to start routing tickets.'
                    : 'You are not a member of any department yet.'
              }
            />
          )
        )}
        {loading && departments.length === 0 && <div className="h-40" aria-hidden="true" />}
      </div>

      {dialog?.type === 'create' && <DepartmentFormModal onClose={closeDialog} onSaved={saved} />}
      {dialog?.type === 'edit' && <DepartmentFormModal department={dialog.department} onClose={closeDialog} onSaved={saved} />}
      {dialog?.type === 'members' && <DepartmentMembersModal department={dialog.department} onClose={closeDialog} onSaved={saved} />}
      {dialog?.type === 'details' && (
        <DepartmentDetailsModal departmentId={dialog.department.id} name={dialog.department.name} onClose={closeDialog} />
      )}
      {dialog?.type === 'delete' && (
        <ConfirmDialog
          title={`Delete ${dialog.department.name}?`}
          confirmLabel="Delete"
          danger
          loading={busy}
          onCancel={closeDialog}
          onConfirm={confirmDelete}
        >
          This permanently removes the department. A department that still has members can't be deleted; deactivate it
          instead.
        </ConfirmDialog>
      )}
    </>
  )
}

function RowButton({ label, name, variant = 'secondary', onClick }) {
  return (
    <Button variant={variant} size="sm" onClick={onClick}>
      {label}{' '}
      <span className="sr-only">{name}</span>
    </Button>
  )
}
