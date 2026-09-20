import axios from 'axios'
import { normalizeApiError } from '../utils/apiError'
import { config } from '../utils/config'
import { tokenStorage } from '../utils/tokenStorage'

/**
 * Shared HTTP client for the Laravel API.
 *
 * - Attaches the Bearer token unless a request sets `skipAuth: true`
 *   (login, register, resend: they must never send a stale token).
 * - Rejects errors as the normalised { status, code, message, errors } object.
 *   Cancelled requests (AbortController) are passed through untouched; check
 *   them with `axios.isCancel(error)`.
 * - When an authenticated request comes back 401 (expired/revoked token) or 403
 *   `account_inactive`, the token is cleared and the registered handler is
 *   called so app state can log the user out.
 */
export const axiosClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

let onSessionEnded = null

/** Register the callback invoked with 'expired' | 'inactive' (kept out of this file to avoid a store import cycle). */
export function setSessionEndedHandler(handler) {
  onSessionEnded = handler
}

axiosClient.interceptors.request.use((request) => {
  if (!request.skipAuth) {
    const token = tokenStorage.get()
    if (token) request.headers.Authorization = `Bearer ${token}`
  }
  return request
})

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) return Promise.reject(error)

    const normalized = normalizeApiError(error)

    if (!error.config?.skipAuth) {
      if (normalized.status === 401) {
        tokenStorage.clear()
        onSessionEnded?.('expired')
      } else if (normalized.status === 403 && normalized.code === 'account_inactive') {
        tokenStorage.clear()
        onSessionEnded?.('inactive')
      }
    }

    return Promise.reject(normalized)
  },
)
