import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '../../components/common/Alert'
import { Icon } from '../../components/common/Icon'
import { useAuth } from '../../hooks/useAuth'
import { moduleByKey } from '../../routes/moduleRoutes'
import { getPrimaryRole, roleLabel } from '../../utils/roles'
import { dashboardByRole, fallbackDashboard } from './dashboardConfig'
import { ActivityChart, DepartmentChart, PriorityChart } from './DashboardCharts'
import { DashboardStats } from './DashboardStats'
import { DashboardTickets } from './DashboardTickets'
import { useDashboard } from './useDashboard'

function greeting() {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

export function DashboardPage() {
  const { user, hasPermission } = useAuth()
  const [days, setDays] = useState(30)
  const canReport = hasPermission('report.view')
  const canViewTickets = hasPermission('ticket.view')
  const canCreate = hasPermission('ticket.create')
  const isCustomer = getPrimaryRole(user) === 'customer'
  const config = dashboardByRole[getPrimaryRole(user)] ?? fallbackDashboard
  const cards = config.cards.map((card) => ({ ...moduleByKey[card.key], ...(card.description && { description: card.description }) })).filter((card) => hasPermission(card.permission))
  const { data, loading, reload } = useDashboard({ userId: user.id, canReport, canViewTickets, days })
  const summary = data?.summary
  const recent = data?.tickets ?? []
  const recentPriority = ['urgent', 'high', 'medium', 'low'].map((key) => ({ key, count: recent.filter((ticket) => ticket.priority === key).length }))
  const error = data?.summaryError || data?.ticketsError

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-indigo-500"><span className="h-px w-4 bg-indigo-400" />{config.title}</p>
          <h1 className="text-[25px] font-bold leading-tight tracking-[-1px] text-slate-950 sm:text-[28px]">{greeting()}, {user.name.split(' ')[0]} <span className="ml-1 text-[25px]" aria-hidden="true">👋</span></h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-500 sm:text-[13px]">{isCustomer ? 'A little less waiting. A lot more getting things done.' : 'Here’s what’s happening with your helpdesk today.'}</p>
        </div>
        {canReport ? <label className="relative flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-600 shadow-sm"><Icon name="calendar" className="size-4 text-slate-500" /><span className="sr-only">Dashboard period</span><select value={days} onChange={(event) => setDays(Number(event.target.value))} className="cursor-pointer appearance-none bg-transparent pr-5 outline-none"><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select><Icon name="down" className="pointer-events-none absolute right-3 size-3" /></label> : <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-3.5 py-2.5 text-xs text-slate-500"><Icon name="calendar" className="size-4" />Your workspace · All time</div>}
      </div>

      {error && <Alert variant="error"><div className="flex items-center justify-between gap-3"><span>Some dashboard information could not be loaded.</span><button type="button" onClick={reload} className="inline-flex items-center gap-1.5 text-xs font-semibold"><Icon name="refresh" className="size-3.5" />Try again</button></div></Alert>}

      {(canViewTickets || canReport) && <>
        <DashboardStats summary={summary} loading={loading} />
        <p className="!mt-2 flex items-center gap-1.5 text-[10px] text-slate-400"><span className="size-1 rounded-full bg-indigo-300" />{canReport ? `Ticket counts and breakdowns cover requests created in the last ${days} days${summary?.range?.timezone ? ` (${summary.range.timezone})` : ''}.` : 'Counts include all tickets you can access. Only your permitted requests are shown.'}</p>
      </>}

      {canReport ? <div className="grid items-start gap-5 min-[1280px]:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-5"><ActivityChart timeline={summary?.timeline} loading={loading} />{canViewTickets && <DashboardTickets tickets={recent} loading={loading} error={data?.ticketsError} canCreate={canCreate} isCustomer={isCustomer} />}</div>
        <div className="min-w-0 space-y-5"><PriorityChart priority={summary?.priority} loading={loading} /><DepartmentChart departments={summary?.departments} loading={loading} /></div>
      </div> : canViewTickets ? <>
        <section className="workspace-welcome relative overflow-hidden rounded-[18px] border border-indigo-100 p-6 sm:p-7"><div className="relative z-10 max-w-lg"><span className="mb-3 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-indigo-500"><Icon name="sparkles" className="size-3.5" />{isCustomer ? 'Help is one ticket away' : 'Make someone’s day a little easier'}</span><h2 className="text-xl font-bold tracking-[-0.6px] text-slate-800">{isCustomer ? 'Big question or small hiccup?' : 'A clear view. A better workflow.'}</h2><p className="mt-2 max-w-sm text-xs leading-relaxed text-slate-500">{isCustomer ? 'Our team is here to help. Tell us what you need, and follow every update from your workspace.' : 'See what needs your attention, keep conversations moving, and help your team get back to what matters.'}</p><Link to={canCreate ? '/tickets/new' : '/tickets'} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-200 transition-colors hover:bg-indigo-700"><Icon name={canCreate ? 'newTicket' : 'tickets'} className="size-4" />{canCreate ? 'Create a ticket' : 'View assigned tickets'}<Icon name="arrow" className="ml-2 size-3.5" /></Link></div><Icon name="headset" className="pointer-events-none absolute -right-3 bottom-1 size-48 rotate-[-12deg] text-indigo-300/25 sm:right-8" /></section>
        <div className="grid items-start gap-5 min-[1280px]:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]"><DashboardTickets tickets={recent} loading={loading} error={data?.ticketsError} canCreate={canCreate} isCustomer={isCustomer} /><PriorityChart priority={recentPriority} loading={loading} subtitle="Priority across your latest five tickets" /></div>
      </> : !canReport && <div className="dashboard-panel p-8"><h2 className="panel-title">{cards.length ? 'Your workspace is ready' : 'No modules available'}</h2><p className="mt-2 text-sm text-slate-500">{cards.length ? 'Use a shortcut below to get started.' : 'Contact your administrator to get access to your workspace.'}</p></div>}

      {cards.length > 0 && <section aria-label="Quick access" className="dashboard-panel px-5 py-4"><div className="mb-3 flex items-center gap-2"><Icon name="sparkles" className="size-3.5 text-indigo-400" /><h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">Quick access</h2></div><div className="flex flex-wrap gap-2">{cards.map((card) => <Link key={card.key} to={card.path} title={card.description} className="group inline-flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 text-[11px] font-medium text-slate-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"><Icon name={card.key} className="size-3.5 text-slate-400 group-hover:text-indigo-500" />{card.label}<Icon name="arrow" className="ml-2 size-3 text-slate-300 group-hover:text-indigo-400" /></Link>)}</div></section>}
      <footer className="flex flex-wrap items-center justify-between gap-2 px-1 pb-1 text-[10px] text-slate-400"><p>Corporate Helpdesk <span className="mx-1.5 text-slate-300">/</span> A better way to help.</p><p>{user.roles.length ? user.roles.map(roleLabel).join(', ') : 'No role assigned'} · {user.permissions.length} permissions</p></footer>
    </div>
  )
}