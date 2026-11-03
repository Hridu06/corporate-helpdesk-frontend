import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { Icon } from '../components/common/Icon'
import { useAuth } from '../hooks/useAuth'
import { moduleRoutes } from '../routes/moduleRoutes'
import { cn } from '../utils/cn'
import { config } from '../utils/config'
import { roleLabel } from '../utils/roles'

function SidebarContent({ onNavigate, collapsed = false }) {
  const { user, hasPermission } = useAuth()
  const items = [{ key: 'dashboard', path: '/dashboard', label: 'Dashboard' }, ...moduleRoutes.filter((route) => hasPermission(route.permission))]

  return (
    <div className="sidebar-surface flex h-full flex-col text-slate-300">
      <div className={cn('flex h-[84px] shrink-0 items-center gap-3 border-b border-white/[0.07]', collapsed ? 'justify-center px-3' : 'px-5')}>
        <span className="brand-mark flex size-10 shrink-0 items-center justify-center rounded-2xl text-white"><Icon name="headset" className="size-6" /></span>
        {!collapsed && <div className="min-w-0"><p className="whitespace-nowrap text-[16px] font-bold tracking-[-0.5px] text-white">{config.appName}</p><p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">Support, simplified.</p></div>}
      </div>
      <nav aria-label="Main" className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-6">
        {!collapsed && <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Workspace</p>}
        {items.map((item) => (
          <NavLink key={item.key} to={item.path} end onClick={onNavigate} title={collapsed ? item.label : undefined}
            className={({ isActive }) => cn('sidebar-link group flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all', collapsed && 'justify-center', isActive ? 'sidebar-link-active text-white' : 'text-slate-300 hover:bg-white/[0.055] hover:text-white')}>
            <Icon name={item.key} className="size-[21px] shrink-0" />
            <span className={collapsed ? 'sr-only' : ''}>{item.label}</span>
            {!collapsed && item.key === 'tickets' && <Icon name="chevron" className="ml-auto size-3.5 text-slate-500" />}
          </NavLink>
        ))}
      </nav>
      {!collapsed && <div className="mx-5 mb-5 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3.5"><div className="mb-1.5 flex items-center gap-2 text-xs font-medium text-slate-300"><span className="size-1.5 rounded-full bg-emerald-400" />A little support goes a long way.</div><p className="text-[11px] leading-relaxed text-slate-500">One workspace. Every request. A better way to help.</p></div>}
      <div className={cn('mx-3 mb-4 flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.06] p-3', collapsed && 'justify-center px-0')}>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-indigo-600 text-base font-semibold text-white shadow-lg shadow-indigo-950/30">{user?.name?.charAt(0).toUpperCase() ?? '?'}</span>
        {!collapsed && <div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{user?.name}</p><p className="mt-0.5 truncate text-[11px] text-slate-400">{user?.roles?.map(roleLabel).join(', ') || 'Member'}</p></div>}
      </div>
    </div>
  )
}

export function Sidebar({ open, onClose, collapsed = false }) {
  const drawer = useRef(null)
  useEffect(() => {
    if (open) drawer.current?.showModal()
    else drawer.current?.close()
  }, [open])

  return (
    <>
      <aside className={cn('fixed inset-y-0 left-0 z-30 hidden transition-[width] duration-200 lg:block', collapsed ? 'w-[88px]' : 'w-[264px]')}>
        <SidebarContent collapsed={collapsed} />
      </aside>
      <dialog ref={drawer} aria-label="Navigation menu" onCancel={onClose} onClick={(event) => event.target === event.currentTarget && onClose()} className="m-0 h-dvh max-h-none w-[280px] max-w-[85vw] border-0 bg-transparent p-0 backdrop:bg-slate-950/60 lg:hidden">
        <button type="button" onClick={onClose} aria-label="Close navigation menu" className="absolute right-2 top-[90px] rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"><Icon name="close" className="size-4" /></button>
        <SidebarContent onNavigate={onClose} />
      </dialog>
    </>
  )
}
