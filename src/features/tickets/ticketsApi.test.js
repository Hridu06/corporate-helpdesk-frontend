import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axiosClient } from '../../api/axiosClient'
import {
  createTicket,
  fetchAssignableAgents,
  listMessages,
  postInternalNote,
  postReply,
  listTickets,
  updateTicketAssignee,
  updateTicketPriority,
  updateTicketStatus,
} from './ticketsApi'

const okAdapter = () =>
  vi.fn(async (config) => ({ status: 200, data: { data: [], meta: {} }, headers: {}, config, statusText: '' }))

const lastConfig = () => axiosClient.defaults.adapter.mock.calls[0][0]

describe('ticketsApi', () => {
  beforeEach(() => {
    axiosClient.defaults.adapter = okAdapter()
  })

  it('omits empty filters and passes the rest through', async () => {
    await listTickets({ search: '', status: '', priority: 'high', assigned: 'me', page: 2, perPage: 15 })

    expect(lastConfig().params).toEqual({
      search: undefined,
      status: undefined,
      priority: 'high',
      assigned: 'me',
      page: 2,
      per_page: 15,
    })
  })

  it.each([
    ['updateTicketStatus', () => updateTicketStatus(5, 'resolved'), 'post', '/tickets/5/status', { status: 'resolved' }],
    ['updateTicketPriority', () => updateTicketPriority(5, 'high'), 'put', '/tickets/5/priority', { priority: 'high' }],
    ['updateTicketAssignee (agent)', () => updateTicketAssignee(5, 9), 'put', '/tickets/5/assignee', { assignee_id: 9 }],
    ['updateTicketAssignee (unassign)', () => updateTicketAssignee(5, null), 'put', '/tickets/5/assignee', { assignee_id: null }],
  ])('%s sends the right request', async (_name, call, method, url, body) => {
    await call()

    const config = lastConfig()
    expect(config.method).toBe(method)
    expect(config.url).toBe(url)
    expect(JSON.parse(config.data)).toEqual(body)
  })

  it('returns the assignable agents list', async () => {
    axiosClient.defaults.adapter = vi.fn(async (config) => ({ status: 200, data: { agents: [{ id: 1, name: 'A' }] }, headers: {}, config, statusText: '' }))

    expect(await fetchAssignableAgents(5)).toEqual([{ id: 1, name: 'A' }])
    expect(axiosClient.defaults.adapter.mock.calls[0][0].url).toBe('/tickets/5/assignable-agents')
  })

  it('posts the new ticket body as JSON', async () => {
    await createTicket({ subject: 'S', description: 'D', department_id: null })

    const config = lastConfig()
    expect(config.method).toBe('post')
    expect(config.url).toBe('/tickets')
    expect(JSON.parse(config.data)).toEqual({ subject: 'S', description: 'D', department_id: null })
  })
})

describe('ticket messages api', () => {
  beforeEach(() => {
    axiosClient.defaults.adapter = okAdapter()
  })

  it('reads the conversation, paging back with `before`', async () => {
    await listMessages(5, { before: 12 })
    const config = axiosClient.defaults.adapter.mock.calls[0][0]
    expect(config.url).toBe('/tickets/5/messages')
    expect(config.params).toEqual({ before: 12 })
  })

  it.each([
    ['postReply', () => postReply(5, 'hi'), '/tickets/5/replies'],
    ['postInternalNote', () => postInternalNote(5, 'hi'), '/tickets/5/internal-notes'],
  ])('%s posts the body to the right endpoint', async (_name, call, url) => {
    await call()
    const config = axiosClient.defaults.adapter.mock.calls[0][0]
    expect(config.method).toBe('post')
    expect(config.url).toBe(url)
    expect(JSON.parse(config.data)).toEqual({ body: 'hi' })
  })
})
