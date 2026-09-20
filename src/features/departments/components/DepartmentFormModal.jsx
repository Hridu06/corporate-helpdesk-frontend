import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Alert } from '../../../components/common/Alert'
import { Button } from '../../../components/common/Button'
import { Input } from '../../../components/common/Input'
import { Modal } from '../../../components/common/Modal'
import { Checkbox } from '../../../components/forms/Checkbox'
import { Textarea } from '../../../components/forms/Textarea'
import { createDepartment, updateDepartment } from '../departmentsApi'
import { departmentSchema } from '../schemas'

/** Mount only while open. Creates a department, or edits `department` when given. */
export function DepartmentFormModal({ department, onClose, onSaved }) {
  const isEdit = Boolean(department)
  const [formError, setFormError] = useState(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: department?.name ?? '',
      description: department?.description ?? '',
      is_active: department?.is_active ?? true,
    },
  })

  const onSubmit = async (values) => {
    setFormError(null)
    // An empty description is sent as null so it clears the stored value.
    const payload = { ...values, description: values.description || null }

    try {
      const { message } = isEdit ? await updateDepartment(department.id, payload) : await createDepartment(payload)
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
    <Modal open onClose={onClose} title={isEdit ? `Edit ${department.name}` : 'New department'}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError && <Alert variant="error">{formError}</Alert>}
        <Input label="Name" autoComplete="off" error={errors.name?.message} {...register('name')} />
        <Textarea label="Description" error={errors.description?.message} {...register('description')} />
        <Checkbox label="Active (available for tickets)" {...register('is_active')} />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Create department'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
