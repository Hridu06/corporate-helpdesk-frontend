import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Alert } from '../../../components/common/Alert'
import { Button } from '../../../components/common/Button'
import { Input } from '../../../components/common/Input'
import { resetPassword } from '../authApi'
import { resetPasswordSchema } from '../schemas'

function InvalidLink({ message }) {
  return (
    <div className="space-y-4 text-center">
      <h1 className="text-xl font-semibold text-slate-900">Reset link invalid</h1>
      <Alert variant="error">{message}</Alert>
      <Link to="/forgot-password" className="inline-block text-sm font-medium text-brand-600 hover:text-brand-700">
        Request a new reset link
      </Link>
    </div>
  )
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // Read once into state, then strip them from the URL so the token does not
  // linger in the address bar or browser history.
  const [{ token, email }] = useState(() => ({ token: params.get('token'), email: params.get('email') }))
  const [formError, setFormError] = useState(null)
  const [linkInvalid, setLinkInvalid] = useState(false)

  useEffect(() => {
    navigate('/reset-password', { replace: true })
  }, [navigate])

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', password_confirmation: '' },
  })

  const onSubmit = async (values) => {
    setFormError(null)

    try {
      await resetPassword({ token, email, ...values })
      toast.success('Password reset. Please sign in with your new password.')
      navigate('/login', { replace: true })
    } catch (error) {
      if (error.code === 'invalid_reset_token') {
        setLinkInvalid(true)
      } else if (error.status === 422) {
        Object.entries(error.errors).forEach(([field, messages]) => {
          if (field === 'token' || field === 'email') setLinkInvalid(true)
          else setError(field, { message: messages[0] })
        })
      } else if (error.status === 429) {
        setFormError('Too many attempts. Please wait a minute and try again.')
      } else {
        setFormError(error.message)
      }
    }
  }

  if (!token || !email) {
    return <InvalidLink message="This password reset link is incomplete. Please request a new one." />
  }

  if (linkInvalid) {
    return <InvalidLink message="This password reset link is invalid or has expired. Please request a new one." />
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Choose a new password</h1>
        <p className="mt-1 text-sm text-slate-600">
          Resetting the password for <strong className="font-medium">{email}</strong>. You'll be signed out on all
          devices.
        </p>
      </div>

      {formError && (
        <Alert variant="error" className="mb-4">
          {formError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters with upper and lower case letters, a number and a symbol."
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          error={errors.password_confirmation?.message}
          {...register('password_confirmation')}
        />
        <Button type="submit" fullWidth loading={isSubmitting}>
          Reset password
        </Button>
      </form>
    </>
  )
}
