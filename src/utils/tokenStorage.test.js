import { afterEach, describe, expect, it, vi } from 'vitest'
import { tokenStorage } from './tokenStorage'

const KEY = 'helpdesk_token'

describe('tokenStorage', () => {
  afterEach(() => vi.restoreAllMocks())

  it('persists in localStorage when "remember me" is on', () => {
    tokenStorage.set('abc', true)
    expect(localStorage.getItem(KEY)).toBe('abc')
    expect(sessionStorage.getItem(KEY)).toBeNull()
  })

  it('uses sessionStorage otherwise, so it ends with the browser session', () => {
    tokenStorage.set('abc', false)
    expect(sessionStorage.getItem(KEY)).toBe('abc')
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('reads from whichever store holds the token', () => {
    tokenStorage.set('remembered', true)
    expect(tokenStorage.get()).toBe('remembered')
    tokenStorage.set('temporary', false)
    expect(tokenStorage.get()).toBe('temporary')
  })

  it('never leaves a stale copy behind when the mode changes', () => {
    tokenStorage.set('old', true)
    tokenStorage.set('new', false)
    expect(localStorage.getItem(KEY)).toBeNull()
    expect(tokenStorage.get()).toBe('new')
  })

  it('clears both stores', () => {
    tokenStorage.set('abc', true)
    sessionStorage.setItem(KEY, 'other')
    tokenStorage.clear()
    expect(tokenStorage.get()).toBeNull()
  })

  it('does not throw when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(tokenStorage.get()).toBeNull()
    expect(() => tokenStorage.set('abc', true)).not.toThrow()
  })
})
