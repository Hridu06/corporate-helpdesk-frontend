import { Badge } from '../../../components/common/Badge'
import { TICKET_PRIORITY, TICKET_STATUS } from '../constants'

export function StatusBadge({ status }) {
  const { label, variant } = TICKET_STATUS[status] ?? { label: status, variant: 'neutral' }
  return <Badge variant={variant}>{label}</Badge>
}

export function PriorityBadge({ priority }) {
  const { label, variant } = TICKET_PRIORITY[priority] ?? { label: priority, variant: 'neutral' }
  return <Badge variant={variant}>{label}</Badge>
}
