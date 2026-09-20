import { describe, expect, it } from 'vitest'
import { normalizeApiError } from './apiError'

describe('normalizeApiError', () => {
  it('reports a network error when there is no response', () => {
    const error = normalizeApiError(new Error('Network Error'))
    expect(error).toMatchObject({ status: null, code: 'network_error', errors: {} })
    expect(error.message).toMatch(/unable to reach the server/i)
  })

  it('keeps Laravel validation errors, status and the backend reason code', () => {
    const error = normalizeApiError({
      response: { status: 422, data: { message: 'Invalid', errors: { email: ['Taken'] }, code: 'some_code' } },
    })
    expect(error).toEqual({ status: 422, code: 'some_code', message: 'Invalid', errors: { email: ['Taken'] } })
  })

  it('falls back to a generic message and empty defaults', () => {
    const error = normalizeApiError({ response: { status: 500, data: {} } })
    expect(error).toMatchObject({ status: 500, code: null, errors: {} })
    expect(error.message).toMatch(/something went wrong/i)
  })
})
