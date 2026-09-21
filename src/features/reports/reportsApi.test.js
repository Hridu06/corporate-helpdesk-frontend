import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axiosClient } from '../../api/axiosClient'
import { fetchReportOptions, fetchReports } from './reportsApi'

const answers = {
  overview: { range: { from: '2026-08-23', to: '2026-09-21', days: 30, timezone: 'UTC', granularity: 'day' }, data: { created: 6 } },
  timeline: { data: [{ date: '2026-09-21', created: 1, resolved: 0 }] },
  breakdown: { data: { status: [] } },
  agents: { data: [{ id: 1, name: 'A' }] },
}

describe('fetchReports', () => {
  beforeEach(() => {
    axiosClient.defaults.adapter = vi.fn(async (config) => {
      const section = config.url.split('/').pop()
      return { status: 200, data: answers[section], headers: {}, config, statusText: '' }
    })
  })

  const calls = () => axiosClient.defaults.adapter.mock.calls.map(([config]) => config)

  it('asks the four report endpoints and returns them together', async () => {
    const result = await fetchReports({ days: 30, from: '', to: '', departmentId: '' })

    expect(calls().map((config) => config.url).sort()).toEqual(['/reports/agents', '/reports/breakdown', '/reports/overview', '/reports/timeline'])
    expect(result.range.days).toBe(30)
    expect(result.overview).toEqual({ created: 6 })
    expect(result.timeline).toHaveLength(1)
    expect(result.agents[0].name).toBe('A')
  })

  it('sends a preset as `days` and leaves every empty filter out', async () => {
    await fetchReports({ days: 7, from: '', to: '', departmentId: '' })

    expect(calls()[0].params).toEqual({ days: 7, from: undefined, to: undefined, department_id: undefined })
  })

  it('sends a custom range and a department', async () => {
    await fetchReports({ days: null, from: '2026-09-01', to: '2026-09-15', departmentId: 'none' })

    expect(calls()[0].params).toEqual({ days: undefined, from: '2026-09-01', to: '2026-09-15', department_id: 'none' })
  })

  it('passes the abort signal along so a stale request can be cancelled', async () => {
    const controller = new AbortController()

    await fetchReports({ days: 30 }, controller.signal)

    expect(calls().every((config) => config.signal === controller.signal)).toBe(true)
  })

  it('rejects when any section fails', async () => {
    axiosClient.defaults.adapter = vi.fn(async (config) => {
      if (config.url.endsWith('/agents')) throw Object.assign(new Error('nope'), { config, response: { status: 403, data: { message: 'Forbidden' }, config, headers: {} } })
      return { status: 200, data: answers[config.url.split('/').pop()], headers: {}, config, statusText: '' }
    })

    await expect(fetchReports({ days: 30 })).rejects.toMatchObject({ status: 403 })
  })

  it('loads the departments for the filter from the reports endpoint, not the new-ticket one', async () => {
    axiosClient.defaults.adapter = vi.fn(async (config) => ({ status: 200, data: { departments: [{ id: 1, name: 'Billing' }] }, headers: {}, config, statusText: '' }))

    expect(await fetchReportOptions()).toEqual({ departments: [{ id: 1, name: 'Billing' }] })
    expect(axiosClient.defaults.adapter.mock.calls[0][0].url).toBe('/reports/options')
  })
})
