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

const UPLOAD_TIMEOUT_MS = 120000

/**
 * JSON when there are no files (unchanged), multipart otherwise. Null fields are
 * left out of the form data since it cannot carry null.
 */
function requestBody(fields, files) {
  if (!files || files.length === 0) return fields

  const form = new FormData()
  Object.entries(fields).forEach(([key, value]) => value != null && form.append(key, value))
  files.forEach((file) => form.append('attachments[]', file))
  return form
}

/** `options`: { onUploadProgress, signal } for showing and cancelling an upload. */
function uploadConfig(files, options = {}) {
  // Without this override axios would follow the client-wide JSON header and serialise the FormData as JSON.
  return files && files.length > 0
    ? { timeout: UPLOAD_TIMEOUT_MS, headers: { 'Content-Type': 'multipart/form-data' }, ...options }
    : { signal: options.signal }
}

export async function createTicket(payload, files = [], options) {
  const { data } = await axiosClient.post('/tickets', requestBody(payload, files), uploadConfig(files, options))
  return data
}

/** Save a fetched file under its own (already sanitised) name. */
function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Download through the API with the Bearer token (never a link with a token in it).
 * Rejects with a readable message when the file is gone or not visible.
 */
export async function downloadAttachment(ticketId, attachment) {
  try {
    const { data } = await axiosClient.get(`/tickets/${ticketId}/attachments/${attachment.id}`, {
      responseType: 'blob',
      timeout: UPLOAD_TIMEOUT_MS,
    })
    saveBlob(data, attachment.name)
  } catch (error) {
    if (error.status === 404) throw { ...error, message: 'This file is no longer available.' }
    throw error
  }
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

/**
 * The conversation, oldest first: { data: [messages], has_more }. Returns the latest
 * page; pass `before` (a message id) for older ones. The server leaves out internal
 * notes unless the viewer may see them.
 */
export async function listMessages(id, { before } = {}) {
  const { data } = await axiosClient.get(`/tickets/${id}/messages`, { params: { before: before || undefined } })
  return data
}

/** Both return { message, entry, ticket, abilities, events }. */
export async function postReply(id, body, files = [], options) {
  const { data } = await axiosClient.post(`/tickets/${id}/replies`, requestBody({ body }, files), uploadConfig(files, options))
  return data
}

export async function postInternalNote(id, body, files = [], options) {
  const { data } = await axiosClient.post(`/tickets/${id}/internal-notes`, requestBody({ body }, files), uploadConfig(files, options))
  return data
}
