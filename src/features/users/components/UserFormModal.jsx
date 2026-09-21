import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Alert } from '../../../components/common/Alert'
import { Button } from '../../../components/common/Button'
import { Input } from '../../../components/common/Input'
import { Modal } from '../../../components/common/Modal'
import { Select } from '../../../components/forms/Select'
import { roleLabel } from '../../../utils/roles'
import { createUser } from '../usersApi'
import { createUserSchema } from '../schemas'

/** Mount only while open. The new user sets their own password through an emailed link. */
export function UserFormModal({ roles, onClose, onSaved }) {
  const [formError, setFormError] = useState(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: '', email: '', role: '' },
  })

  const onSubmit = async (values) => {
    setFormError(null)
    try {
      const { message, email_sent: emailSent } = await createUser(values)
      // The account exists either way; when the invitation mail failed the admin must know.
      if (emailSent === false) toast.error(message, { duration: 8000 })
      else toast.success(message)
      onSaved()
    } catch (error) {
      if (error.status === 422) {
        Object.entries(error.errors).forEach(([field, messages]) => setError(field, { message: messages[0] }))
      } else {
        setFormError(error.message)
      }
    }
  }

  return (
    <Modal open onClose={onClose} title="Add user">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError && <Alert variant="error">{formError}</Alert>}
        <Input label="Full name" autoComplete="off" error={errors.name?.message} {...register('name')} />
        <Input label="Email" type="email" autoComplete="off" error={errors.email?.message} {...register('email')} />
        <Select label="Role" error={errors.role?.message} {...register('role')}>
          <option value="">Select a role…</option>
          {roles.map((role) => (
            <option key={role} value={role}>
              {roleLabel(role)}
            </option>
          ))}
        </Select>
        <p className="text-sm text-slate-500">
          They'll receive an email with a link to choose their own password.
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Create user
          </Button>
        </div>
      </form>
    </Modal>
  )
}
