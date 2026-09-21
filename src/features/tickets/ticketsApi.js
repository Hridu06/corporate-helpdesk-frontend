import { axiosClient } from '../../api/axiosClient'

// The backend decides who may see or open which ticket; the UI only mirrors it.

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

export async function getTicket(id) {
  const { data } = await axiosClient.get(`/tickets/${id}`)
  return data.ticket
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
