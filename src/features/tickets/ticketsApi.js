import { axiosClient } from '../../api/axiosClient'

// The backend decides who may see or change which ticket; the UI only mirrors it.

/** Returns { data: [...tickets], meta: {...} } (the list omits each ticket's description). */
export async function listTickets({ search, status, priority, assigned, page, perPage }, signal) {
  const { data } = await axiosClient.get('/tickets', {
    params: {
      search: search || undefined,
      status: status || undefined,
      priority: priority || undefined,
      assigned: assigned || undefined,
      page,
      per_page: perPage,
    },
    signal,
  })
  return data
}

/**
 * The ticket plus what the current user may do to it and its history:
 * { ticket, abilities: { allowed_statuses, can_change_status, can_change_priority, can_assign }, events }.
 * The change calls below return the same shape (with a `message`).
 */
export async function getTicket(id) {
  const { data } = await axiosClient.get(`/tickets/${id}`)
  return data
}

export async function createTicket(payload) {
  const { data } = await axiosClient.post('/tickets', payload)
  return data
}

/** Choices for the new-ticket form (active departments). */
export async function fetchTicketOptions() {
  const { data } = await axiosClient.get('/tickets/options')
  return data
}

export async function updateTicketStatus(id, status) {
  const { data } = await axiosClient.post(`/tickets/${id}/status`, { status })
  return data
}

export async function updateTicketPriority(id, priority) {
  const { data } = await axiosClient.put(`/tickets/${id}/priority`, { priority })
  return data
}

/** `assigneeId` null unassigns. */
export async function updateTicketAssignee(id, assigneeId) {
  const { data } = await axiosClient.put(`/tickets/${id}/assignee`, { assignee_id: assigneeId })
  return data
}

/** Active agents this ticket can be assigned to (members of its department, when it has one). */
export async function fetchAssignableAgents(id) {
  const { data } = await axiosClient.get(`/tickets/${id}/assignable-agents`)
  return data.agents
}
