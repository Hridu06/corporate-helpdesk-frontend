import { EmptyState } from '../../components/common/EmptyState'
import { PageHeader } from '../../components/common/PageHeader'

/** Placeholder for modules that are gated and routed but not built yet. */
export function ComingSoonPage({ title, description }) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <EmptyState
        title="Coming soon"
        description="This module isn't available yet. Access to it is already controlled by your role's permissions."
      />
    </>
  )
}
