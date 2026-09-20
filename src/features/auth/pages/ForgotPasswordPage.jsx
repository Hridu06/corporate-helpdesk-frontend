import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Alert } from '../../../components/common/Alert'
import { Button } from '../../../components/common/Button'
import { Input } from '../../../components/common/Input'
import { forgotPassword } from '../authApi'
import { forgotPasswordSchema } from '../schemas'

export function ForgotPasswordPage() {
  const [formError, setFormError] = useState(null)
  const [sentTo, setSentTo] = useState(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async ({ email }) => {
    setFormError(null)

    try {
      await forgotPassword(email)
      setSentTo(email)
    } catch (error) {
      if (error.status === 422) {
        setError('email', { message: error.errors.email?.[0] ?? error.message })
      } else if (error.status === 429) {
        setFormError('Too many requests. Please wait a minute and try again.')
      } else {
        setFormError(error.message)
      }
    }
  }

  if (sentTo) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Check your email</h1>
        {/* Same wording whether or not the account exists (the backend does not reveal it). */}
        <Alert variant="success">
          If an account exists for <strong className="font-medium">{sentTo}</strong>, we've sent a link to reset
          your password. It expires in 60 minutes.
        </Alert>
        <Link to="/login" className="inline-block text-sm font-medium text-brand-600 hover:text-brand-700">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Forgot your password?</h1>
        <p className="mt-1 text-sm text-slate-600">Enter your email and we'll send you a reset link.</p>
      </div>

      {formError && (
        <Alert variant="error" className="mb-4">
          {formError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Button type="submit" fullWidth loading={isSubmitting}>
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Remembered it?{' '}
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </>
  )
}
