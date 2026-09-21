import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axiosClient } from '../../api/axiosClient'
import { createTicket, listTickets } from './ticketsApi'

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

  it('posts the new ticket body as JSON', async () => {
    await createTicket({ subject: 'S', description: 'D', department_id: null })

    const config = lastConfig()
    expect(config.method).toBe('post')
    expect(config.url).toBe('/tickets')
    expect(JSON.parse(config.data)).toEqual({ subject: 'S', description: 'D', department_id: null })
  })
})
