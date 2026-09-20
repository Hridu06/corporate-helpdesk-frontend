import { useSelector } from 'react-redux'

/**
 * Read-only view of auth state. `hasPermission` / `hasRole` are for UI
 * decisions only; the backend enforces every action independently.
 */
export function useAuth() {
  const { user, status, sessionEndedReason } = useSelector((state) => state.auth)

  return {
    user,
    status,
    sessionEndedReason,
    isAuthenticated: status === 'authenticated',
    isInitializing: status === 'idle' || status === 'loading',
    hasPermission: (permission) => user?.permissions?.includes(permission) ?? false,
    hasRole: (role) => user?.roles?.includes(role) ?? false,
  }
}
