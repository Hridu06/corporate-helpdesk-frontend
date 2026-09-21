import { axiosClient } from '../../api/axiosClient'

// Who may change which role, and what each role may hold, is decided by the backend; the screen only mirrors it.

/**
 * The four roles and the permission catalogue, loaded together.
 * Resolves to { roles: [...], groups: [...] }; see RoleManager on the backend for the shapes.
 */
export async function fetchRolesAndCatalog(signal) {
  const [roles, catalog] = await Promise.all([
    axiosClient.get('/roles', { signal }).then((response) => response.data.roles),
    axiosClient.get('/permissions', { signal }).then((response) => response.data.groups),
  ])
  return { roles, groups: catalog }
}

/** `version` is the role's state as last seen; if someone changed it since, the API answers 409. */
export async function updateRolePermissions(roleName, permissions, version) {
  const { data } = await axiosClient.put(`/roles/${roleName}/permissions`, { permissions, version })
  return data
}

export async function resetRole(roleName, version) {
  const { data } = await axiosClient.post(`/roles/${roleName}/reset`, { version })
  return data
}

/** Recent changes to one role, newest first. */
export async function fetchRoleHistory(roleName, signal) {
  const { data } = await axiosClient.get(`/roles/${roleName}/history`, { signal })
  return data.data
}
