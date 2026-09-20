import { usePagedList } from '../../hooks/usePagedList'
import { listLoginActivities } from './activityApi'

/** One page of sign-in history, refetched when the filters change (see usePagedList). */
export function useLoginActivities({ search, status, from, to, page, perPage }) {
  const { items, ...rest } = usePagedList(listLoginActivities, { search, status, from, to, page, perPage })

  return { activities: items, ...rest }
}
