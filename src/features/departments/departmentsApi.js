import { axiosClient } from '../../api/axiosClient'

// The UI mirrors backend permissions for convenience only; every call is authorised by the API.

/**
 * `status` is '' | 'active' | 'inactive'. Laravel's boolean rule accepts 1/0
 * but not the string "false" that Axios would serialise, so it is mapped here.
 * Returns { data: [...departments], meta: {...} }.
 */
export async function listDepartments({ search, status, page, perPage }, signal) {
  const { data } = await axiosClient.get('/departments', {
    params: {
      search: search || undefined,
      is_active: status === 'active' ? 1 : status === 'inactive' ? 0 : undefined,
      page,
      per_page: perPage,
    },
    signal,
  })
  return data
}

export async function getDepartment(id) {
  const { data } = await axiosClient.get(`/departments/${id}`)
  return data.department
}

export async function createDepartment(payload) {
  const { data } = await axiosClient.post('/departments', payload)
  return data
}

export async function updateDepartment(id, payload) {
  const { data } = await axiosClient.patch(`/departments/${id}`, payload)
  return data
}

export async function deleteDepartment(id) {
  const { data } = await axiosClient.delete(`/departments/${id}`)
  return data
}

/** Active agents and admins who can be added to a department. */
export async function fetchAssignableStaff() {
  const { data } = await axiosClient.get('/departments/assignable-staff')
  return data.staff
}

/** Replaces the department's member list. */
export async function updateDepartmentMembers(id, userIds) {
  const { data } = await axiosClient.put(`/departments/${id}/members`, { user_ids: userIds })
  return data
}
