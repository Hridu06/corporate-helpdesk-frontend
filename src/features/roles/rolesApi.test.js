import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axiosClient } from '../../api/axiosClient'
import { fetchRoleHistory, fetchRolesAndCatalog, resetRole, updateRolePermissions } from './rolesApi'

const answer = (data) => vi.fn(async (config) => ({ status: 200, data, headers: {}, config, statusText: '' }))
const lastCall = () => axiosClient.defaults.adapter.mock.calls.at(-1)[0]

describe('rolesApi', () => {
  beforeEach(() => {
    axiosClient.defaults.adapter = answer({})
  })

  it('loads the roles and the catalogue together', async () => {
    axiosClient.defaults.adapter = vi.fn(async (config) => ({
      status: 200,
      data: config.url === '/roles' ? { roles: [{ name: 'agent' }] } : { groups: [{ key: 'tickets' }] },
      headers: {},
      config,
      statusText: '',
    }))

    expect(await fetchRolesAndCatalog()).toEqual({ roles: [{ name: 'agent' }], groups: [{ key: 'tickets' }] })
    expect(axiosClient.defaults.adapter.mock.calls.map(([config]) => config.url).sort()).toEqual(['/permissions', '/roles'])
  })

  it('saves the whole permission set together with the version it was based on', async () => {
    await updateRolePermissions('agent', ['ticket.view', 'report.view'], 'abc123')

    expect(lastCall().method).toBe('put')
    expect(lastCall().url).toBe('/roles/agent/permissions')
    expect(JSON.parse(lastCall().data)).toEqual({ permissions: ['ticket.view', 'report.view'], version: 'abc123' })
  })

  it('resets a role, again with the version', async () => {
    await resetRole('customer', 'v9')

    expect(lastCall().method).toBe('post')
    expect(lastCall().url).toBe('/roles/customer/reset')
    expect(JSON.parse(lastCall().data)).toEqual({ version: 'v9' })
  })

  it("reads one role's history", async () => {
    axiosClient.defaults.adapter = answer({ data: [{ id: 1 }] })

    expect(await fetchRoleHistory('agent')).toEqual([{ id: 1 }])
    expect(lastCall().url).toBe('/roles/agent/history')
  })
})
