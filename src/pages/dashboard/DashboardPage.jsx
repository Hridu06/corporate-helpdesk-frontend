import { Link } from 'react-router-dom'
import { EmptyState } from '../../components/common/EmptyState'
import { PageHeader } from '../../components/common/PageHeader'
import { useAuth } from '../../hooks/useAuth'
import { moduleByKey } from '../../routes/moduleRoutes'
import { getPrimaryRole, roleLabel } from '../../utils/roles'
import { dashboardByRole, fallbackDashboard } from './dashboardConfig'

function ActionCard({ to, title, description }) {
  return (
    <Link
      to={to}
      className="group block rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-brand-500"
    >
      <h2 className="text-base font-semibold text-slate-900 group-hover:text-brand-700">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </Link>
  )
}

/**
 * One URL, role-specific content. The dashboard is chosen from the roles the
 * backend returned for the signed-in user, and cards from their permissions.
 */
export function DashboardPage() {
  const { user, hasPermission } = useAuth()

  const config = dashboardByRole[getPrimaryRole(user)] ?? fallbackDashboard
  const cards = config.cards
    .map((card) => ({ ...moduleByKey[card.key], ...(card.description && { description: card.description }) }))
    .filter((card) => hasPermission(card.permission))

  return (
    <>
      <PageHeader title={config.title} description={`Welcome back, ${user.name}. ${config.description}`} />

      {cards.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <ActionCard key={card.key} to={card.path} title={card.label} description={card.description} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No modules available"
          description="Your account doesn't have access to any modules yet. Contact your administrator."
        />
      )}

      <section aria-labelledby="access-heading" className="mt-8 rounded-lg border border-slate-200 bg-white p-5">
        <h2 id="access-heading" className="text-base font-semibold text-slate-900">
          Your access
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {user.roles.length > 0 ? user.roles.map(roleLabel).join(', ') : 'No role assigned'}
          {' · '}
          {user.permissions.length} permission{user.permissions.length === 1 ? '' : 's'}
        </p>
      </section>
    </>
  )
}
