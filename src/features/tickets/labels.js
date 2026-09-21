import { TICKET_PRIORITY, TICKET_STATUS } from './constants'

const statusLabel = (value) => TICKET_STATUS[value]?.label ?? value
const priorityLabel = (value) => TICKET_PRIORITY[value]?.label ?? value

/** Button label for moving a ticket from one status to another. */
export function statusActionLabel(from, to) {
  if (to === 'closed') return 'Close ticket'
  if (to === 'resolved') return 'Mark resolved'
  if (to === 'in_progress') return from === 'open' ? 'Start progress' : 'Reopen'
  if (to === 'open') return from === 'resolved' || from === 'closed' ? 'Reopen' : 'Move back to open'
  return to
}

/** One readable sentence per history entry. */
export function describeEvent(event) {
  const who = event.actor?.name ?? 'A former team member'

  switch (event.type) {
    case 'status_changed':
      if (event.reason === 'customer_reply') {
        return `${who} replied to the ticket. Status changed from ${statusLabel(event.from)} to ${statusLabel(event.to)}.`
      }
      return `${who} changed the status from ${statusLabel(event.from)} to ${statusLabel(event.to)}.`
    case 'priority_changed':
      return `${who} changed the priority from ${priorityLabel(event.from)} to ${priorityLabel(event.to)}.`
    case 'assigned':
      return `${who} assigned the ticket to ${event.assignee_name ?? 'an agent'}.`
    case 'unassigned':
      return `${who} unassigned the ticket${event.from ? ` (was ${event.from})` : ''}.`
    default:
      return `${who} updated the ticket.`
  }
}
