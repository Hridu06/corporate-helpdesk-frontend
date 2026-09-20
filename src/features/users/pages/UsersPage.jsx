import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Alert } from '../../../components/common/Alert'
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
import { ROLES, roleLabel } from '../../../utils/roles'
import { ChangeRoleModal } from '../components/ChangeRoleModal'
import { EditUserModal } from '../components/EditUserModal'
import { UserFormModal } from '../components/UserFormModal'
import { UsersTable } from '../components/UsersTable'
import { useUsers } from '../useUsers'
import { activateUser, deactivateUser, fetchAssignableRoles } from '../usersApi'

const PER_PAGE = 15

export function UsersPage() {
  const { user: me, hasPermission, hasRole } = useAuth()
  const iAmSuperAdmin = hasRole(ROLES.SUPER_ADMIN)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search.trim())

  const { users, meta, loading, error, reload } = useUsers({
    search: debouncedSearch,
    status,
    role,
    page,
    perPage: PER_PAGE,
  })

  const [assignableRoles, setAssignableRoles] = useState([])
  useEffect(() => {
    fetchAssignableRoles().then(setAssignableRoles).catch(() => setAssignableRoles([]))
  }, [])

  // One dialog at a time: { type: 'create' | 'edit' | 'role' | 'deactivate', user? }
  const [dialog, setDialog] = useState(null)
  const [busy, setBusy] = useState(false)
  const closeDialog = () => setDialog(null)
  const saved = () => {
    closeDialog()
    reload()
  }

  const resetToFirstPage = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  const runAction = async (request, onDone) => {
    setBusy(true)
    try {
      const { message } = await request()
      toast.success(message)
      onDone?.()
      reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  // Mirrors the backend rules for convenience only: no self-actions, and only
  // a Super Admin may act on a Super Admin. The API enforces all of this.
  const rowActions = (target) => {
    const isSelf = target.id === me.id
    const protectedTarget = target.roles.includes(ROLES.SUPER_ADMIN) && !iAmSuperAdmin
    if (protectedTarget) return []

    const actions = []
    if (hasPermission('user.update')) actions.push({ label: 'Edit', onClick: () => setDialog({ type: 'edit', user: target }) })
    if (!isSelf) {
      if (hasPermission('user.assign_role')) actions.push({ label: 'Change role', onClick: () => setDialog({ type: 'role', user: target }) })
      if (target.status === 'active' && hasPermission('user.deactivate')) {
        actions.push({ label: 'Deactivate', variant: 'danger', onClick: () => setDialog({ type: 'deactivate', user: target }) })
      }
      if (target.status !== 'active' && hasPermission('user.activate')) {
        actions.push({ label: 'Activate', onClick: () => runAction(() => activateUser(target.id)) })
      }
    }
    return actions
  }

  const filtersActive = Boolean(debouncedSearch || status || role)

  return (
    <>
      <PageHeader
        title="Users"
        description="Manage customer and staff accounts."
        actions={hasPermission('user.create') && <Button onClick={() => setDialog({ type: 'create' })}>Add user</Button>}
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Input
          label="Search"
          type="search"
          placeholder="Name or email"
          value={search}
          onChange={(event) => resetToFirstPage(setSearch)(event.target.value)}
        />
        <Select label="Status" value={status} onChange={(event) => resetToFirstPage(setStatus)(event.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
        <Select label="Role" value={role} onChange={(event) => resetToFirstPage(setRole)(event.target.value)}>
          <option value="">All roles</option>
          {Object.values(ROLES).map((value) => (
            <option key={value} value={value}>
              {roleLabel(value)}
            </option>
          ))}
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
            <LoadingSpinner size="sm" label="Loading users" />
          </div>
        )}

        {users.length > 0 ? (
          <div className={cn(loading && 'opacity-60')}>
            <UsersTable users={users} currentUserId={me.id} actions={rowActions} />
            <Pagination meta={meta} onPageChange={setPage} disabled={loading} />
          </div>
        ) : (
          !loading &&
          !error && (
            <EmptyState
              className="border-0"
              title={filtersActive ? 'No users match your filters' : 'No users yet'}
              description={filtersActive ? 'Try a different search or clear the filters.' : undefined}
            />
          )
        )}
        {loading && users.length === 0 && <div className="h-40" aria-hidden="true" />}
      </div>

      {dialog?.type === 'create' && <UserFormModal roles={assignableRoles} onClose={closeDialog} onSaved={saved} />}
      {dialog?.type === 'edit' && <EditUserModal user={dialog.user} onClose={closeDialog} onSaved={saved} />}
      {dialog?.type === 'role' && (
        <ChangeRoleModal user={dialog.user} roles={assignableRoles} onClose={closeDialog} onSaved={saved} />
      )}
      {dialog?.type === 'deactivate' && (
        <ConfirmDialog
          title={`Deactivate ${dialog.user.name}?`}
          confirmLabel="Deactivate"
          danger
          loading={busy}
          onCancel={closeDialog}
          onConfirm={() => runAction(() => deactivateUser(dialog.user.id), closeDialog)}
        >
          They will be signed out everywhere immediately and won't be able to sign in until reactivated.
        </ConfirmDialog>
      )}
    </>
  )
}
