import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Alert } from '../../../components/common/Alert'
import { Button } from '../../../components/common/Button'
import { Modal } from '../../../components/common/Modal'
import { Select } from '../../../components/forms/Select'
import { roleLabel } from '../../../utils/roles'
import { changeUserRole } from '../usersApi'
import { changeRoleSchema } from '../schemas'

/** Mount only while open. Replaces the user's role (a user holds one role here). */
export function ChangeRoleModal({ user, roles, onClose, onSaved }) {
  const [formError, setFormError] = useState(null)
  const currentRole = user.roles[0]
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(changeRoleSchema),
    defaultValues: { role: roles.includes(currentRole) ? currentRole : '' },
  })

  const unchanged = useWatch({ control, name: 'role' }) === currentRole

  const onSubmit = async ({ role }) => {
    setFormError(null)
    try {
      const { message } = await changeUserRole(user.id, role)
      toast.success(message)
      onSaved()
    } catch (error) {
      if (error.status === 422) {
        const roleError = error.errors.role?.[0]
        if (roleError) setError('role', { message: roleError })
        else setFormError(error.message)
      } else {
        setFormError(error.message)
      }
    }
  }

  return (
    <Modal open onClose={onClose} title={`Change role for ${user.name}`}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError && <Alert variant="error">{formError}</Alert>}
        <p className="text-sm text-slate-600">Current role: {currentRole ? roleLabel(currentRole) : 'None'}</p>
        <Select label="New role" error={errors.role?.message} {...register('role')}>
          <option value="">Select a role…</option>
          {roles.map((role) => (
            <option key={role} value={role}>
              {roleLabel(role)}
            </option>
          ))}
        </Select>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting} disabled={unchanged}>
            Update role
          </Button>
        </div>
      </form>
    </Modal>
  )
}
