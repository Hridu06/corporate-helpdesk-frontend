import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { moduleRoutes } from '../routes/moduleRoutes'
import { cn } from '../utils/cn'
import { config } from '../utils/config'

const dashboardItem = { key: 'dashboard', path: '/dashboard', label: 'Dashboard' }

function SidebarContent({ onNavigate }) {
  const { hasPermission } = useAuth()

  // Only modules the user's permissions allow are listed. This is UX, not security.
  const items = [dashboardItem, ...moduleRoutes.filter((route) => hasPermission(route.permission))]

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-200">
      <div className="flex h-16 shrink-0 items-center px-6 text-lg font-semibold text-white">
        {config.appName}
      </div>
      <nav aria-label="Main" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            end
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'block rounded-md px-3 py-2 text-sm font-medium',
                isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white',
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export function Sidebar({ open, onClose }) {
  // Escape closes the mobile drawer.
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  return (
    <>
      {/* Desktop: fixed column */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile: slide-over drawer */}
      <div className={cn('fixed inset-0 z-40 lg:hidden', !open && 'pointer-events-none')} aria-hidden={!open}>
        <div
          onClick={onClose}
          className={cn('absolute inset-0 bg-slate-900/50 transition-opacity', open ? 'opacity-100' : 'opacity-0')}
        />
        <aside
          className={cn(
            'absolute inset-y-0 left-0 w-64 max-w-[80%] transition-transform',
            open ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <SidebarContent onNavigate={onClose} />
        </aside>
      </div>
    </>
  )
}
