import { Badge } from '../../../components/common/Badge'
import { Button } from '../../../components/common/Button'
import { roleLabel } from '../../../utils/roles'

function formatDate(value) {
  return value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Never'
}

/**
 * `actions(user)` returns the buttons the current viewer may use on that row.
 * (UX only: the backend authorises every action.)
 */
export function UsersTable({ users, currentUserId, actions }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <caption className="sr-only">Users</caption>
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-3">User</th>
            <th scope="col" className="px-4 py-3">Role</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3">Last sign-in</th>
            <th scope="col" className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">
                  {user.name}
                  {user.id === currentUserId && <span className="ml-2 text-xs font-normal text-slate-500">(you)</span>}
                </p>
                <p className="text-slate-500">{user.email}</p>
                {!user.email_verified_at && <p className="text-xs text-amber-700">Email not verified</p>}
              </td>
              <td className="px-4 py-3">
                {user.roles.length ? user.roles.map((role) => <Badge key={role} variant="info">{roleLabel(role)}</Badge>) : '—'}
              </td>
              <td className="px-4 py-3">
                <Badge variant={user.status === 'active' ? 'success' : 'danger'}>
                  {user.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(user.last_login_at)}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  {actions(user).map((action) => (
                    <Button key={action.label} variant={action.variant ?? 'secondary'} size="sm" onClick={action.onClick}>
                      {action.label}
                      <span className="sr-only"> {user.name}</span>
                    </Button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
