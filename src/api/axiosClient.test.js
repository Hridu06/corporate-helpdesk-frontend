import axios, { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { tokenStorage } from '../utils/tokenStorage'
import { axiosClient, setSessionEndedHandler } from './axiosClient'

/** Fake network layer: resolves 2xx, rejects like a real HTTP error otherwise. */
function fakeAdapter(status, data = {}) {
  return vi.fn(async (config) => {
    const response = { status, data, headers: {}, config, statusText: '' }
    if (status >= 400) throw new AxiosError('failed', 'ERR_BAD_REQUEST', config, null, response)
    return response
  })
}

describe('axiosClient', () => {
  const onSessionEnded = vi.fn()

  beforeEach(() => {
    onSessionEnded.mockReset()
    setSessionEndedHandler(onSessionEnded)
  })

  it('attaches the stored Bearer token', async () => {
    tokenStorage.set('secret-token', false)
    axiosClient.defaults.adapter = fakeAdapter(200)

    await axiosClient.get('/user')

    const config = axiosClient.defaults.adapter.mock.calls[0][0]
    expect(config.headers.get('Authorization')).toBe('Bearer secret-token')
  })

  it('never sends the token on requests marked skipAuth', async () => {
    tokenStorage.set('stale-token', false)
    axiosClient.defaults.adapter = fakeAdapter(200)

    await axiosClient.post('/login', {}, { skipAuth: true })

    const config = axiosClient.defaults.adapter.mock.calls[0][0]
    expect(config.headers.get('Authorization')).toBeFalsy()
  })

  it('clears the token and ends the session on 401 for authenticated requests', async () => {
    tokenStorage.set('expired', false)
    axiosClient.defaults.adapter = fakeAdapter(401, { message: 'Unauthenticated.' })

    await expect(axiosClient.get('/user')).rejects.toMatchObject({ status: 401 })

    expect(tokenStorage.get()).toBeNull()
    expect(onSessionEnded).toHaveBeenCalledWith('expired')
  })

  it('does not treat a failed login (401 with skipAuth) as an expired session', async () => {
    tokenStorage.set('other-token', false)
    axiosClient.defaults.adapter = fakeAdapter(401, { code: 'invalid_credentials', message: 'Bad credentials' })

    await expect(axiosClient.post('/login', {}, { skipAuth: true })).rejects.toMatchObject({
      status: 401,
      code: 'invalid_credentials',
    })

    expect(onSessionEnded).not.toHaveBeenCalled()
    expect(tokenStorage.get()).toBe('other-token')
  })

  it('ends the session when the account has been deactivated', async () => {
    tokenStorage.set('token', false)
    axiosClient.defaults.adapter = fakeAdapter(403, { code: 'account_inactive', message: 'Deactivated' })

    await expect(axiosClient.get('/user')).rejects.toMatchObject({ code: 'account_inactive' })

    expect(onSessionEnded).toHaveBeenCalledWith('inactive')
    expect(tokenStorage.get()).toBeNull()
  })

  it('keeps the session on an ordinary 403 (missing permission)', async () => {
    tokenStorage.set('token', false)
    axiosClient.defaults.adapter = fakeAdapter(403, { message: 'This action is unauthorized.' })

    await expect(axiosClient.get('/users')).rejects.toMatchObject({ status: 403 })

    expect(onSessionEnded).not.toHaveBeenCalled()
    expect(tokenStorage.get()).toBe('token')
  })

  it('passes cancelled requests through untouched', async () => {
    axiosClient.defaults.adapter = vi.fn(async () => {
      throw new axios.CanceledError('canceled')
    })

    const error = await axiosClient.get('/users').catch((e) => e)

    expect(axios.isCancel(error)).toBe(true)
    expect(onSessionEnded).not.toHaveBeenCalled()
  })
})
