import { Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { UnauthorizedPage } from '../pages/errors/UnauthorizedPage'

/**
 * Renders its child routes only if the user holds the permission (or, when an
 * array is given, at least one of them). Otherwise shows the Unauthorized page
 * in place, keeping the URL. This is a UX guard; the backend enforces access.
 * Must be nested inside ProtectedRoute.
 */
export function PermissionRoute({ permission }) {
  const { hasPermission } = useAuth()
  const required = Array.isArray(permission) ? permission : [permission]

  if (!required.some(hasPermission)) return <UnauthorizedPage />

  return <Outlet />
}
