/**
 * Convert an Axios error into the shape the UI works with:
 * { status, message, errors } where `errors` maps field names to message arrays
 * (Laravel's 422 validation format).
 */
export function normalizeApiError(error) {
  const response = error?.response

  if (!response) {
    return {
      status: null,
      message: 'Unable to reach the server. Check your connection and try again.',
      errors: {},
    }
  }

  const { status, data } = response

  return {
    status,
    message: data?.message || 'Something went wrong. Please try again.',
    errors: data?.errors || {},
  }
}
