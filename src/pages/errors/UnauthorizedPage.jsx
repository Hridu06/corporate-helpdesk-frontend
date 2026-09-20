import { Link } from 'react-router-dom'
import { EmptyState } from '../../components/common/EmptyState'

export function UnauthorizedPage() {
  return (
    <EmptyState
      className="mt-8"
      title="You don't have access to this page"
      description="Your role doesn't include the permission required here. If you think this is a mistake, contact your administrator."
      action={
        <Link to="/dashboard" className="text-sm font-medium text-brand-600 hover:text-brand-700">
          Back to dashboard
        </Link>
      }
      icon={
        <svg className="size-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <rect x="4" y="10" width="16" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 018 0v3" />
        </svg>
      }
    />
  )
}
