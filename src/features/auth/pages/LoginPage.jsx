import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Alert } from '../../../components/common/Alert'
import { Button } from '../../../components/common/Button'
import { Input } from '../../../components/common/Input'
import { Checkbox } from '../../../components/forms/Checkbox'
import { useAuth } from '../../../hooks/useAuth'
import { ResendVerification } from '../components/ResendVerification'
import { loginSchema } from '../schemas'
import { loginUser } from '../authSlice'

const SESSION_NOTICES = {
  expired: 'Your session has expired. Please sign in again.',
  inactive: 'Your account has been deactivated. Please contact support.',
}

export function LoginPage() {
  const dispatch = useDispatch()
  const { sessionEndedReason } = useAuth()
  const [formError, setFormError] = useState(null)
  const [unverifiedEmail, setUnverifiedEmail] = useState(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: false },
  })

  // On success the auth state changes and GuestRoute redirects to the intended page.
  const onSubmit = async (values) => {
    setFormError(null)
    setUnverifiedEmail(null)

    try {
      await dispatch(loginUser(values)).unwrap()
      toast.success('Signed in successfully.')
    } catch (error) {
      if (error.status === 422) {
        Object.entries(error.errors).forEach(([field, messages]) => {
          setError(field, { message: messages[0] })
        })
      } else if (error.code === 'email_not_verified') {
        setUnverifiedEmail(values.email)
      } else if (error.status === 429) {
        setFormError('Too many sign-in attempts. Please wait a minute and try again.')
      } else {
        setFormError(error.message)
      }
    }
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-600">Access your helpdesk account.</p>
      </div>

      <div className="mb-4 space-y-3">
        {sessionEndedReason && <Alert variant="warning">{SESSION_NOTICES[sessionEndedReason]}</Alert>}
        {formError && <Alert variant="error">{formError}</Alert>}
        {unverifiedEmail && (
          <Alert variant="warning" title="Verify your email to continue">
            <p>We sent a verification link to {unverifiedEmail}. Open it, then sign in again.</p>
            <div className="mt-3">
              <ResendVerification email={unverifiedEmail} />
            </div>
          </Alert>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <div className="flex items-center justify-between">
          <Checkbox label="Remember me" {...register('remember')} />
          <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" fullWidth loading={isSubmitting}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        No account?{' '}
        <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
          Register
        </Link>
      </p>
    </>
  )
}
