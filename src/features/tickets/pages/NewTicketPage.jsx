import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import { Alert } from '../../../components/common/Alert'
import { Button } from '../../../components/common/Button'
import { Input } from '../../../components/common/Input'
import { PageHeader } from '../../../components/common/PageHeader'
import { Select } from '../../../components/forms/Select'
import { Textarea } from '../../../components/forms/Textarea'
import { AttachmentPicker } from '../components/AttachmentPicker'
import { uploadErrorMessages } from '../attachments'
import { TICKET_LIMITS } from '../constants'
import { newTicketSchema } from '../schemas'
import { createTicket, fetchTicketOptions } from '../ticketsApi'

export function NewTicketPage() {
  const navigate = useNavigate()
  const [departments, setDepartments] = useState([])
  const [optionsError, setOptionsError] = useState(null)
  const [formError, setFormError] = useState(null)
  const [files, setFiles] = useState([])
  const [progress, setProgress] = useState(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(newTicketSchema),
    defaultValues: { subject: '', description: '', department_id: '' },
  })

  useEffect(() => {
    let active = true
    fetchTicketOptions()
      .then((options) => active && setDepartments(options.departments))
      // The department is optional, so the form stays usable if this fails.
      .catch((error) => active && setOptionsError(error))
    return () => {
      active = false
    }
  }, [])

  const onSubmit = async ({ subject, description, department_id: departmentId }) => {
    setFormError(null)
    setProgress(files.length > 0 ? 0 : null)
    try {
      const { message, ticket } = await createTicket(
        {
          subject,
          description,
          department_id: departmentId ? Number(departmentId) : null,
        },
        files,
        { onUploadProgress: (upload) => setProgress(Math.round((upload.progress ?? 0) * 100)) },
      )
      toast.success(message)
      navigate(`/tickets/${ticket.id}`, { replace: true })
    } catch (error) {
      const fileFields = Object.keys(error.errors ?? {}).filter((field) => field.startsWith('attachments'))

      if (error.status === 422) {
        Object.entries(error.errors)
          .filter(([field]) => !field.startsWith('attachments'))
          .forEach(([field, messages]) => setError(field, { message: messages[0] }))
        if (fileFields.length > 0) setFormError(uploadErrorMessages(error).join(' '))
      } else if (error.status === 413) {
        setFormError(uploadErrorMessages(error).join(' '))
      } else if (error.status === 429) {
        setFormError('You have opened too many tickets recently. Please try again later.')
      } else {
        setFormError(error.message)
      }
    } finally {
      setProgress(null)
    }
  }

  return (
    <>
      <PageHeader title="New ticket" description="Tell us what's wrong and our team will pick it up." />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-2xl space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        {formError && <Alert variant="error">{formError}</Alert>}
        {optionsError && <Alert variant="warning">Departments could not be loaded. You can still submit without one.</Alert>}

        <Input label="Subject" required autoComplete="off" error={errors.subject?.message} {...register('subject')} />
        <Select
          label="Department"
          hint="Optional. If unsure, leave it and support will route your ticket."
          error={errors.department_id?.message}
          {...register('department_id')}
        >
          <option value="">No department</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </Select>
        <Textarea
          label="Description"
          required
          rows={8}
          hint={`Up to ${TICKET_LIMITS.description} characters.`}
          error={errors.description?.message}
          {...register('description')}
        />

        <AttachmentPicker files={files} onChange={setFiles} disabled={isSubmitting} />

        {progress !== null && (
          <div>
            <div role="progressbar" aria-label="Upload progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="h-2 overflow-hidden rounded bg-slate-200">
              <div className="h-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-1 text-xs text-slate-500">Uploading… {progress}%</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Link to="/tickets" className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
            Cancel
          </Link>
          <Button type="submit" loading={isSubmitting}>
            Submit ticket
          </Button>
        </div>
      </form>
    </>
  )
}
