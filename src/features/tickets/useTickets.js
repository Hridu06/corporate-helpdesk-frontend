import { usePagedList } from '../../hooks/usePagedList'
import { listTickets } from './ticketsApi'

/** One page of tickets, refetched when the filters change (see usePagedList). */
export function useTickets({ search, status, priority, assigned, page, perPage }) {
  const { items, ...rest } = usePagedList(listTickets, { search, status, priority, assigned, page, perPage })

  return { tickets: items, ...rest }
}
