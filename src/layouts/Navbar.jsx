import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { Button } from '../components/common/Button'
import { useAuth } from '../hooks/useAuth'
import { logoutUser } from '../features/auth/authSlice'

export function Navbar({ onMenuClick }) {
  const dispatch = useDispatch()
  const { user, isAuthenticated } = useAuth()

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
        className="-ml-1 rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
      >
        <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex-1" />

      {isAuthenticated ? (
        <>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-900">{user.name}</p>
            <p className="text-xs capitalize text-slate-500">{user.roles.join(', ').replaceAll('-', ' ')}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => dispatch(logoutUser())}>
            Sign out
          </Button>
        </>
      ) : (
        <Link to="/login" className="text-sm font-medium text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      )}
    </header>
  )
}
