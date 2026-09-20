import { usePagedList } from '../../hooks/usePagedList'
import { listUsers } from './usersApi'

/** One page of users, refetched when the filters change (see usePagedList). */
export function useUsers({ search, status, role, page, perPage }) {
  const { items, ...rest } = usePagedList(listUsers, { search, status, role, page, perPage })

  return { users: items, ...rest }
}
