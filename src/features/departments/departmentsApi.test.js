import { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axiosClient } from '../../api/axiosClient'
import { listDepartments, updateDepartmentMembers } from './departmentsApi'

const okAdapter = () =>
  vi.fn(async (config) => ({ status: 200, data: { data: [], meta: {} }, headers: {}, config, statusText: '' }))

const sentParams = () => axiosClient.defaults.adapter.mock.calls[0][0].params

describe('departmentsApi', () => {
  beforeEach(() => {
    axiosClient.defaults.adapter = okAdapter()
  })

  it.each([
    ['active', 1],
    ['inactive', 0],
    ['', undefined],
  ])('maps the "%s" status filter to is_active=%s (Laravel rejects the string "false")', async (status, expected) => {
    await listDepartments({ search: '', status, page: 1, perPage: 15 })

    expect(sentParams().is_active).toBe(expected)
  })

  it('omits empty search and passes paging through', async () => {
    await listDepartments({ search: '', status: '', page: 3, perPage: 15 })

    expect(sentParams()).toMatchObject({ search: undefined, page: 3, per_page: 15 })
  })

  it('sends the member list as user_ids', async () => {
    await updateDepartmentMembers(7, [1, 2])

    const config = axiosClient.defaults.adapter.mock.calls[0][0]
    expect(config.method).toBe('put')
    expect(config.url).toBe('/departments/7/members')
    expect(JSON.parse(config.data)).toEqual({ user_ids: [1, 2] })
  })

  it('surfaces validation errors as normalised objects', async () => {
    axiosClient.defaults.adapter = vi.fn(async (config) => {
      const response = { status: 422, data: { message: 'Invalid', errors: { user_ids: ['Bad member'] } }, headers: {}, config, statusText: '' }
      throw new AxiosError('failed', 'ERR_BAD_REQUEST', config, null, response)
    })

    await expect(updateDepartmentMembers(1, [99])).rejects.toMatchObject({ status: 422, errors: { user_ids: ['Bad member'] } })
  })
})
