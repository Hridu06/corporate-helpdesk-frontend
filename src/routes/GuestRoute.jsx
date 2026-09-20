import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { FullPageSpinner } from './ProtectedRoute'

/** Login/register are for signed-out users; signed-in users go to where they were headed. */
export function GuestRoute() {
  const { isAuthenticated, isInitializing } = useAuth()
  const location = useLocation()

  if (isInitializing) return <FullPageSpinner />
  if (isAuthenticated) return <Navigate to={location.state?.from?.pathname ?? '/dashboard'} replace />

  return <Outlet />
}
