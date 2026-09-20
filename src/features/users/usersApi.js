import { axiosClient } from '../../api/axiosClient'

// All calls need a permission on the backend; the UI only mirrors that for convenience.

/** Returns Laravel's paginated payload: { data: [...users], meta: {...} }. */
export async function listUsers({ search, status, role, page, perPage }, signal) {
  const { data } = await axiosClient.get('/users', {
    params: { search: search || undefined, status: status || undefined, role: role || undefined, page, per_page: perPage },
    signal,
  })
  return data
}

export async function fetchAssignableRoles() {
  const { data } = await axiosClient.get('/users/assignable-roles')
  return data.roles
}

export async function createUser(payload) {
  const { data } = await axiosClient.post('/users', payload)
  return data
}

export async function updateUser(id, payload) {
  const { data } = await axiosClient.patch(`/users/${id}`, payload)
  return data
}

export async function activateUser(id) {
  const { data } = await axiosClient.post(`/users/${id}/activate`)
  return data
}

export async function deactivateUser(id) {
  const { data } = await axiosClient.post(`/users/${id}/deactivate`)
  return data
}

export async function changeUserRole(id, role) {
  const { data } = await axiosClient.put(`/users/${id}/role`, { role })
  return data
}
