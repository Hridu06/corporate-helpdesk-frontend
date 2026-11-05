import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Alert } from '../../../components/common/Alert'
import { Button } from '../../../components/common/Button'
import { Icon } from '../../../components/common/Icon'
import { Checkbox } from '../../../components/forms/Checkbox'
import { useAuth } from '../../../hooks/useAuth'
import { ResendVerification } from '../components/ResendVerification'
import { loginSchema } from '../schemas'
import { loginUser } from '../authSlice'
import supportIllustration from '../../../assets/royal-blue-support.webp'
import '../login.css'

function LoginField({ label, error, registration, type, icon, autoComplete }) {
  const [visible, setVisible] = useState(false)
  const id = `login-${type}`
  const isPassword = type === 'password'

  return (
    <div className="login-field">
      <label className="sr-only" htmlFor={id}>{label}</label>
      <div className="login-field-control">
        <svg className="login-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {icon}
        </svg>
        <input
          {...registration}
          id={id}
          type={isPassword && visible ? 'text' : type}
          placeholder={label}
          autoComplete={autoComplete}
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {isPassword && (
          <button
            className="login-password-toggle"
            type="button"
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
              {!visible && <path d="m3 3 18 18" />}
            </svg>
          </button>
        )}
      </div>
      {error && <p id={`${id}-error`} className="login-field-error" role="alert">{error}</p>}
    </div>
  )
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285f4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.2h6.6c3.9-3.6 6.1-8.8 6.1-15.1Z" />
      <path fill="#34a853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.2c-1.8 1.2-4.1 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20.4 20.4 0 0 0 24 44Z" />
      <path fill="#fbbc05" d="M12.6 27.4a12.2 12.2 0 0 1 0-7.8v-5.3H5.8a20.3 20.3 0 0 0 0 18.4l6.8-5.3Z" />
      <path fill="#ea4335" d="M24 11.2c3 0 5.6 1 7.7 3l5.8-5.8A19.4 19.4 0 0 0 24 3 20.4 20.4 0 0 0 5.8 14.3l6.8 5.3A12 12 0 0 1 24 11.2Z" />
    </svg>
  )
}

function LoginIntroduction() {
  return (
    <aside className="login-introduction" aria-label="About Corporate Helpdesk">
      <div className="login-introduction-copy">
        <div className="login-brand-pill">
          <span><Icon name="headset" /></span>
          Corporate Helpdesk
        </div>
        <h2>Manage, Track, and<br />Resolve Support<br />Requests</h2>
        <p>A simple and powerful helpdesk to handle<br className="login-desktop-break" /> tickets, support, and team collaboration<br className="login-desktop-break" /> in one place.</p>
      </div>
      <img className="login-illustration" src={supportIllustration} alt="Support agent in a royal blue hoodie wearing glasses and a headset, working at a laptop" fetchPriority="high" />
      <ul className="login-features">
        <li>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m13 2-10 12h8l-1 8 11-13h-8l1-7Z" /></svg>
          <span>Raise Tickets<br />Easily</span>
        </li>
        <li><Icon name="users" /><span>Role-based<br />Access</span></li>
        <li><Icon name="reports" /><span>Track &amp; Resolve<br />Faster</span></li>
      </ul>
    </aside>
  )
}

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
    <div className="login-page">
      <div className="login-layout">
        <LoginIntroduction />
        <section className="login-form-panel" aria-labelledby="login-heading">
          <div className="login-form-content">
            <div className="login-brand">
              <span className="login-brand-icon"><Icon name="headset" /></span>
              <p>Corporate Helpdesk</p>
            </div>
            <header className="login-welcome">
              <h1 id="login-heading">Welcome Back <span className="login-wave" role="img" aria-label="waving hand">👋</span></h1>
              <p>Please log in to your account</p>
            </header>

            <div className="login-notices space-y-3">
              {sessionEndedReason && <Alert variant="warning">{SESSION_NOTICES[sessionEndedReason]}</Alert>}
              {formError && <Alert variant="error">{formError}</Alert>}
              {unverifiedEmail && (
                <Alert variant="warning" title="Verify your email to continue">
                  <p>Verify {unverifiedEmail} before signing in. Use the button below to request a verification link.</p>
                  <div className="mt-3">
                    <ResendVerification email={unverifiedEmail} />
                  </div>
                </Alert>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="login-form">
              <LoginField
                label="Email"
                type="email"
                autoComplete="email"
                error={errors.email?.message}
                registration={register('email')}
                icon={<><rect x="2.5" y="4.5" width="19" height="15" rx="2" /><path d="m3 6 9 7 9-7" /></>}
              />
              <LoginField
                label="Password"
                type="password"
                autoComplete="current-password"
                error={errors.password?.message}
                registration={register('password')}
                icon={<><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>}
              />
              <div className="login-form-options">
                <Checkbox label="Remember me" {...register('remember')} />
                <Link to="/forgot-password">
                  Forgot Password?
                </Link>
              </div>
              <Button type="submit" fullWidth loading={isSubmitting} className="login-submit">
                {isSubmitting ? 'Logging in…' : 'Login'}
              </Button>
            </form>

            <div className="login-social-divider"><span>or continue with</span></div>
            <div className="login-social-buttons">
              <button type="button" disabled aria-describedby="login-social-note"><GoogleMark />Google</button>
              <button type="button" disabled aria-describedby="login-social-note">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#f25022" d="M1 1h10v10H1z" /><path fill="#7fba00" d="M13 1h10v10H13z" /><path fill="#00a4ef" d="M1 13h10v10H1z" /><path fill="#ffb900" d="M13 13h10v10H13z" /></svg>
                Microsoft
              </button>
            </div>
            <p id="login-social-note" className="login-social-note">Social sign-in coming soon</p>
            <p className="login-register">
              No account?{' '}
              <Link to="/register">
                Register
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
