/**
 * Convert an Axios error into the shape the UI works with:
 * { status, code, message, errors } where `errors` maps field names to message
 * arrays (Laravel's 422 format) and `code` is the backend's machine-readable
 * reason (e.g. 'email_not_verified', 'account_inactive').
 */
export function normalizeApiError(error) {
  const response = error?.response

  if (!response) {
    return {
      status: null,
      code: 'network_error',
      message: 'Unable to reach the server. Check your connection and try again.',
      errors: {},
    }
  }

  const { status, data } = response

  return {
    status,
    code: data?.code ?? null,
    message: data?.message || 'Something went wrong. Please try again.',
    errors: data?.errors || {},
  }
}
