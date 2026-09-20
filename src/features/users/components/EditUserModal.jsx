import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Alert } from '../../../components/common/Alert'
import { Button } from '../../../components/common/Button'
import { Input } from '../../../components/common/Input'
import { Modal } from '../../../components/common/Modal'
import { updateUser } from '../usersApi'
import { editUserSchema } from '../schemas'

/** Mount only while open. */
export function EditUserModal({ user, onClose, onSaved }) {
  const [formError, setFormError] = useState(null)
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(editUserSchema),
    defaultValues: { name: user.name, email: user.email },
  })

  const emailChanged = useWatch({ control, name: 'email' }).trim().toLowerCase() !== user.email

  const onSubmit = async (values) => {
    setFormError(null)
    try {
      const { message } = await updateUser(user.id, values)
      toast.success(message)
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
    <Modal open onClose={onClose} title={`Edit ${user.name}`}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError && <Alert variant="error">{formError}</Alert>}
        <Input label="Full name" error={errors.name?.message} {...register('name')} />
        <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
        {emailChanged && (
          <Alert variant="warning">
            Changing the email signs this user out everywhere and requires them to verify the new address.
          </Alert>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  )
}
