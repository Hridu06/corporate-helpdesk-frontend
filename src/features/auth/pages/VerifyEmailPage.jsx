import { Link, useSearchParams } from 'react-router-dom'
import { Alert } from '../../../components/common/Alert'
import { ResendVerification } from '../components/ResendVerification'

/**
 * Landing page for the redirect from the emailed verification link:
 * /verify-email?status=success | invalid
 */
export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const status = params.get('status')

  if (status === 'success') {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Email verified</h1>
        <Alert variant="success">Your email address has been verified. You can now sign in.</Alert>
        <Link to="/login" className="inline-block text-sm font-medium text-brand-600 hover:text-brand-700">
          Continue to sign in
        </Link>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="space-y-4">
        <h1 className="text-center text-xl font-semibold text-slate-900">Link invalid or expired</h1>
        <Alert variant="error">
          This verification link is invalid or has expired. Enter your email to receive a new one.
        </Alert>
        <ResendVerification />
        <Link to="/login" className="block text-center text-sm font-medium text-brand-600 hover:text-brand-700">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4 text-center">
      <h1 className="text-xl font-semibold text-slate-900">Verify your email</h1>
      <p className="text-sm text-slate-600">
        Open the verification link we emailed you. Didn't get it? Request a new one below.
      </p>
      <ResendVerification />
      <Link to="/login" className="block text-sm font-medium text-brand-600 hover:text-brand-700">
        Back to sign in
      </Link>
    </div>
  )
}
