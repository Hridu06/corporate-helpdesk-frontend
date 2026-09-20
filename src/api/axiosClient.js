import axios from 'axios'
import { normalizeApiError } from '../utils/apiError'
import { config } from '../utils/config'

/**
 * Shared HTTP client for the Laravel API.
 *
 * Authentication (Bearer token attachment, 401 handling) is added in Phase 5.
 * Errors are rejected as the normalised { status, message, errors } object.
 */
export const axiosClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeApiError(error)),
)
