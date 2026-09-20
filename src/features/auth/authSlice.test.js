import { configureStore } from '@reduxjs/toolkit'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { tokenStorage } from '../../utils/tokenStorage'
import * as authApi from './authApi'
import authReducer, { initializeAuth, loginUser, logoutUser, sessionEnded } from './authSlice'

vi.mock('./authApi')

const user = { id: 1, name: 'Jane', roles: ['customer'], permissions: ['ticket.view'] }
const makeStore = () => configureStore({ reducer: { auth: authReducer } })

describe('authSlice', () => {
  beforeEach(() => vi.resetAllMocks())

  describe('initializeAuth', () => {
    it('becomes unauthenticated without calling the API when no token is stored', async () => {
      const store = makeStore()
      await store.dispatch(initializeAuth())

      expect(store.getState().auth).toMatchObject({ status: 'unauthenticated', user: null })
      expect(authApi.fetchUser).not.toHaveBeenCalled()
    })

    it('restores the user from /user when a token exists', async () => {
      tokenStorage.set('token', false)
      authApi.fetchUser.mockResolvedValue({ user })
      const store = makeStore()

      const pending = store.dispatch(initializeAuth())
      expect(store.getState().auth.status).toBe('loading')
      await pending

      expect(store.getState().auth).toMatchObject({ status: 'authenticated', user })
    })

    it('ends up unauthenticated when the request fails', async () => {
      tokenStorage.set('token', false)
      authApi.fetchUser.mockRejectedValue({ status: 401 })
      const store = makeStore()

      await store.dispatch(initializeAuth())

      expect(store.getState().auth).toMatchObject({ status: 'unauthenticated', user: null })
    })

    it('runs only once even if dispatched twice (StrictMode)', async () => {
      tokenStorage.set('token', false)
      authApi.fetchUser.mockResolvedValue({ user })
      const store = makeStore()

      await Promise.all([store.dispatch(initializeAuth()), store.dispatch(initializeAuth())])

      expect(authApi.fetchUser).toHaveBeenCalledTimes(1)
    })
  })

  describe('loginUser', () => {
    it('stores the token in localStorage for "remember me" and authenticates', async () => {
      authApi.login.mockResolvedValue({ token: 'tok', user })
      const store = makeStore()

      await store.dispatch(loginUser({ email: 'a@b.co', password: 'x', remember: true }))

      expect(store.getState().auth).toMatchObject({ status: 'authenticated', user })
      expect(localStorage.getItem('helpdesk_token')).toBe('tok')
      expect(sessionStorage.getItem('helpdesk_token')).toBeNull()
    })

    it('uses sessionStorage without "remember me"', async () => {
      authApi.login.mockResolvedValue({ token: 'tok', user })
      const store = makeStore()

      await store.dispatch(loginUser({ email: 'a@b.co', password: 'x', remember: false }))

      expect(sessionStorage.getItem('helpdesk_token')).toBe('tok')
      expect(localStorage.getItem('helpdesk_token')).toBeNull()
    })

    it('rejects with the API error and stores nothing when login fails', async () => {
      const apiError = { status: 401, code: 'invalid_credentials', message: 'Bad', errors: {} }
      authApi.login.mockRejectedValue(apiError)
      const store = makeStore()

      await expect(
        store.dispatch(loginUser({ email: 'a@b.co', password: 'x', remember: false })).unwrap(),
      ).rejects.toEqual(apiError)

      expect(store.getState().auth.status).toBe('idle')
      expect(tokenStorage.get()).toBeNull()
    })

    it('clears a previous session-ended notice on success', async () => {
      authApi.login.mockResolvedValue({ token: 'tok', user })
      const store = makeStore()
      store.dispatch(sessionEnded('expired'))
      expect(store.getState().auth.sessionEndedReason).toBe('expired')

      await store.dispatch(loginUser({ email: 'a@b.co', password: 'x', remember: false }))

      expect(store.getState().auth.sessionEndedReason).toBeNull()
    })
  })

  describe('logoutUser', () => {
    it('clears the token and user', async () => {
      tokenStorage.set('tok', false)
      authApi.logout.mockResolvedValue({})
      const store = makeStore()

      await store.dispatch(logoutUser())

      expect(tokenStorage.get()).toBeNull()
      expect(store.getState().auth).toMatchObject({ status: 'unauthenticated', user: null })
    })

    it('still signs out locally when the API call fails', async () => {
      tokenStorage.set('tok', false)
      authApi.logout.mockRejectedValue({ status: 401 })
      const store = makeStore()

      await store.dispatch(logoutUser())

      expect(tokenStorage.get()).toBeNull()
      expect(store.getState().auth.status).toBe('unauthenticated')
    })
  })

  it('sessionEnded drops the user and records why', () => {
    const store = makeStore()
    store.dispatch(sessionEnded('inactive'))

    expect(store.getState().auth).toMatchObject({ user: null, status: 'unauthenticated', sessionEndedReason: 'inactive' })
  })
})
