import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Alert } from '../../../components/common/Alert'
import { Button } from '../../../components/common/Button'
import { Input } from '../../../components/common/Input'
import { register as registerRequest } from '../authApi'
import { ResendVerification } from '../components/ResendVerification'
import { registerSchema } from '../schemas'

export function RegisterPage() {
  const [formError, setFormError] = useState(null)
  const [registration, setRegistration] = useState(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', password_confirmation: '' },
  })

  const onSubmit = async (values) => {
    setFormError(null)

    try {
      const result = await registerRequest(values)
      setRegistration({
        email: values.email,
        requiresVerification: result.email_verification_required !== false,
      })
    } catch (error) {
      if (error.status === 422) {
        Object.entries(error.errors).forEach(([field, messages]) => {
          setError(field, { message: messages[0] })
        })
      } else if (error.status === 429) {
        setFormError('Too many attempts. Please wait a minute and try again.')
      } else {
        setFormError(error.message)
      }
    }
  }

  if (registration) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-slate-900">
            {registration.requiresVerification ? 'Check your email' : 'Account created'}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {registration.requiresVerification ? (
              <>Check <strong className="font-medium">{registration.email}</strong> for a verification link. Verify your address, then sign in.</>
            ) : (
              <>You can now sign in with <strong className="font-medium">{registration.email}</strong> and your password.</>
            )}
          </p>
        </div>
        {registration.requiresVerification && <ResendVerification email={registration.email} />}
        <Link
          to="/login"
          className="block text-center text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          Go to sign in
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Create an account</h1>
        <p className="mt-1 text-sm text-slate-600">Register as a customer to submit support requests.</p>
      </div>

      {formError && (
        <Alert variant="error" className="mb-4">
          {formError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input label="Full name" autoComplete="name" error={errors.name?.message} {...register('name')} />
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
          autoComplete="new-password"
          hint="At least 8 characters with upper and lower case letters, a number and a symbol."
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.password_confirmation?.message}
          {...register('password_confirmation')}
        />
        <Button type="submit" fullWidth loading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already registered?{' '}
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </>
  )
}
