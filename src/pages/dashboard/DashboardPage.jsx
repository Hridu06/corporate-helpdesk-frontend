import { EmptyState } from '../../components/common/EmptyState'
import { PageHeader } from '../../components/common/PageHeader'

export function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="Overview of your helpdesk activity." />
      <EmptyState
        title="Nothing to show yet"
        description="Placeholder page. Authentication, role-based dashboards and ticket data arrive in later phases; this route is not protected yet."
      />
    </>
  )
}
