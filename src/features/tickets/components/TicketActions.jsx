import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Button } from '../../../components/common/Button'
import { ConfirmDialog } from '../../../components/common/ConfirmDialog'
import { Select } from '../../../components/forms/Select'
import { TICKET_PRIORITY } from '../constants'
import { statusActionLabel } from '../labels'
import { fetchAssignableAgents, updateTicketAssignee, updateTicketPriority, updateTicketStatus } from '../ticketsApi'

/**
 * What the current user may do to the ticket. Everything shown here comes from
 * the API's `abilities` (the backend enforces the same rules), so this renders
 * nothing when the user has no actions. `onUpdated` receives each change
 * response ({ ticket, abilities, events }).
 */
export function TicketActions({ ticket, abilities, onUpdated }) {
  const [busy, setBusy] = useState(false)
  const [confirmingClose, setConfirmingClose] = useState(false)
  const [agents, setAgents] = useState([])

  const canAssign = abilities.can_assign
  useEffect(() => {
    if (!canAssign) return undefined
    let active = true
    fetchAssignableAgents(ticket.id)
      .then((list) => active && setAgents(list))
      .catch(() => active && setAgents([]))
    return () => {
      active = false
    }
  }, [canAssign, ticket.id, ticket.department?.id])

  const run = async (request) => {
    setBusy(true)
    try {
      const { message, ...payload } = await request()
      toast.success(message)
      onUpdated(payload)
    } catch (error) {
      toast.error(error.errors?.assignee_id?.[0] ?? error.errors?.priority?.[0] ?? error.message)
    } finally {
      setBusy(false)
      setConfirmingClose(false)
    }
  }

  const changeStatus = (status) => {
    if (status === 'closed') setConfirmingClose(true)
    else run(() => updateTicketStatus(ticket.id, status))
  }

  const hasStatusActions = abilities.can_change_status && abilities.allowed_statuses.length > 0
  if (!hasStatusActions && !abilities.can_change_priority && !abilities.can_assign) return null

  // Keep the current assignee selectable even if they are no longer eligible.
  const assigneeOptions = ticket.assignee && !agents.some((agent) => agent.id === ticket.assignee.id) ? [ticket.assignee, ...agents] : agents

  return (
    <section aria-labelledby="actions-heading" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 id="actions-heading" className="text-base font-semibold text-slate-900">
        Actions
      </h2>

      {hasStatusActions && (
        <div className="mt-3 flex flex-wrap gap-2">
          {abilities.allowed_statuses.map((status) => (
            <Button
              key={status}
              variant={status === 'closed' ? 'danger' : 'secondary'}
              size="sm"
              disabled={busy}
              onClick={() => changeStatus(status)}
            >
              {statusActionLabel(ticket.status, status)}
            </Button>
          ))}
        </div>
      )}

      {(abilities.can_change_priority || abilities.can_assign) && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {abilities.can_change_priority && (
            <Select
              label="Priority"
              value={ticket.priority}
              disabled={busy}
              onChange={(event) => run(() => updateTicketPriority(ticket.id, event.target.value))}
            >
              {Object.entries(TICKET_PRIORITY).map(([value, { label }]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          )}
          {abilities.can_assign && (
            <Select
              label="Assigned to"
              value={ticket.assignee?.id ?? ''}
              disabled={busy}
              hint={ticket.department ? `Agents in ${ticket.department.name}.` : 'Any active agent.'}
              onChange={(event) => run(() => updateTicketAssignee(ticket.id, event.target.value ? Number(event.target.value) : null))}
            >
              <option value="">Unassigned</option>
              {assigneeOptions.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </Select>
          )}
        </div>
      )}

      {confirmingClose && (
        <ConfirmDialog
          title="Close this ticket?"
          confirmLabel="Close ticket"
          danger
          loading={busy}
          onCancel={() => setConfirmingClose(false)}
          onConfirm={() => run(() => updateTicketStatus(ticket.id, 'closed'))}
        >
          A closed ticket is read-only. It can be reopened later if the problem comes back.
        </ConfirmDialog>
      )}
    </section>
  )
}
