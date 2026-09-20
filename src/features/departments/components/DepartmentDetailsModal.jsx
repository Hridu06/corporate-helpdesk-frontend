import { useEffect, useState } from 'react'
import { Alert } from '../../../components/common/Alert'
import { Badge } from '../../../components/common/Badge'
import { Button } from '../../../components/common/Button'
import { LoadingSpinner } from '../../../components/common/LoadingSpinner'
import { Modal } from '../../../components/common/Modal'
import { roleLabel } from '../../../utils/roles'
import { getDepartment } from '../departmentsApi'

/** Read-only view of a department and its members. Mount only while open. */
export function DepartmentDetailsModal({ departmentId, name, onClose }) {
  const [state, setState] = useState({ department: null, error: null })

  useEffect(() => {
    let active = true
    getDepartment(departmentId)
      .then((department) => active && setState({ department, error: null }))
      .catch((error) => active && setState({ department: null, error }))
    return () => {
      active = false
    }
  }, [departmentId])

  const { department, error } = state

  return (
    <Modal open onClose={onClose} title={name} footer={<Button variant="secondary" onClick={onClose}>Close</Button>}>
      {error && <Alert variant="error">{error.message}</Alert>}
      {!department && !error && (
        <div className="flex justify-center py-6 text-brand-600">
          <LoadingSpinner label="Loading department" />
        </div>
      )}
      {department && (
        <div className="space-y-4 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant={department.is_active ? 'success' : 'neutral'}>{department.is_active ? 'Active' : 'Inactive'}</Badge>
          </div>
          <p className="text-slate-600">{department.description || 'No description.'}</p>
          <div>
            <h3 className="font-medium text-slate-900">Members ({department.members.length})</h3>
            {department.members.length === 0 ? (
              <p className="mt-1 text-slate-500">No members yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-slate-100 rounded-md border border-slate-200">
                {department.members.map((member) => (
                  <li key={member.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{member.name}</p>
                      <p className="truncate text-slate-500">{member.email}</p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-500">{member.roles.map(roleLabel).join(', ')}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
