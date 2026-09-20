import { Link } from 'react-router-dom'

// Placeholder: the form, validation and API integration are built in Phase 5.
export function LoginPage() {
  return (
    <div className="text-center">
      <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
      <p className="mt-2 text-sm text-slate-600">The login form will be added in Phase 5.</p>
      <p className="mt-6 text-sm text-slate-600">
        No account?{' '}
        <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
          Register
        </Link>
      </p>
    </div>
  )
}
