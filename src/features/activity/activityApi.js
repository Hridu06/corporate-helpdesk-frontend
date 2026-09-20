import { axiosClient } from '../../api/axiosClient'

/** Sign-in history. Needs the `activity.view` permission; returns { data: [...], meta: {...} }. */
export async function listLoginActivities({ search, status, from, to, page, perPage }, signal) {
  const { data } = await axiosClient.get('/login-activities', {
    params: {
      search: search || undefined,
      status: status || undefined,
      from: from || undefined,
      to: to || undefined,
      page,
      per_page: perPage,
    },
    signal,
  })
  return data
}
