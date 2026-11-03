import { useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/common/Icon'
import { Modal } from '../components/common/Modal'
import { useAuth } from '../hooks/useAuth'
import { logoutUser } from '../features/auth/authSlice'
import { roleLabel } from '../utils/roles'

export function Navbar({ onMenuClick, collapsed = false }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, isAuthenticated, hasPermission } = useAuth()
  const [search, setSearch] = useState('')
  const [helpOpen, setHelpOpen] = useState(false)
  const searchInput = useRef(null)
  const canSearch = hasPermission('ticket.view')

  useEffect(() => {
    if (!canSearch) return
    const focusSearch = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchInput.current?.focus()
      }
    }
    document.addEventListener('keydown', focusSearch)
    return () => document.removeEventListener('keydown', focusSearch)
  }, [canSearch])

  const submitSearch = (event) => {
    event.preventDefault()
    navigate(search.trim() ? `/tickets?search=${encodeURIComponent(search.trim())}` : '/tickets')
  }

  return (
    <>
      <header className="sticky top-0 z-20 flex h-[76px] items-center gap-3 border-b border-slate-200/70 bg-white/90 px-4 backdrop-blur-xl sm:gap-5 sm:px-6 lg:px-7">
        <button type="button" onClick={onMenuClick} aria-label="Toggle navigation menu" title={collapsed ? 'Expand navigation' : 'Toggle navigation'} className="shrink-0 rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100"><Icon name="menu" className="size-[22px]" /></button>
        {canSearch && <form role="search" onSubmit={submitSearch} className="flex max-w-lg flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-[#f7f8fc] px-3 py-2.5 shadow-[inset_0_1px_2px_rgb(15_23_42/0.025)] focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100">
          <Icon name="search" className="size-[18px] shrink-0 text-slate-400" />
          <input ref={searchInput} aria-label="Search tickets" placeholder="Search tickets by subject or number..." type="search" value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400 sm:text-[13px]" />
          <kbd className="hidden shrink-0 rounded border border-slate-200 bg-white px-1.5 py-0.5 font-sans text-[10px] text-slate-400 md:block">Ctrl K</kbd>
        </form>}
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
          <button type="button" onClick={() => setHelpOpen(true)} aria-label="Help and guidance" className="hidden rounded-xl p-2 text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600 sm:block"><Icon name="help" className="size-[22px]" /></button>
          {isAuthenticated ? <>
            <div className="hidden h-7 w-px bg-slate-200 sm:block" />
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full border border-violet-200/60 bg-gradient-to-br from-violet-100 to-indigo-200 text-sm font-semibold text-indigo-700">{user.name.charAt(0).toUpperCase()}</span>
              <div className="hidden xl:block"><p className="text-xs font-semibold text-slate-800">{user.name}</p><p className="mt-0.5 text-[10px] text-slate-500">{user.roles.map(roleLabel).join(', ')}</p></div>
            </div>
            <button type="button" aria-label="Sign out" title="Sign out" onClick={() => dispatch(logoutUser())} className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"><Icon name="logout" className="size-[18px]" /></button>
          </> : <Link to="/login" className="text-sm font-medium text-brand-600">Sign in</Link>}
        </div>
      </header>
      {helpOpen && <Modal title="A little help, right here" open={helpOpen} onClose={() => setHelpOpen(false)}>
        <div className="space-y-4 text-sm leading-relaxed text-slate-600"><p>Use <strong>Tickets</strong> to follow your support requests and open a ticket to read or send replies. The navigation shows the tools available to your role.</p>{hasPermission('ticket.create') && <p>Need something? Choose <Link to="/tickets/new" onClick={() => setHelpOpen(false)} className="font-medium text-indigo-600 underline">New Ticket</Link> to get help from the support team.</p>}<p>Search by a ticket subject or ticket number using the search bar. Press <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">Ctrl K</kbd> to jump to it.</p></div>
      </Modal>}
    </>
  )
}
