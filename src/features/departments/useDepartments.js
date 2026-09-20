import { usePagedList } from '../../hooks/usePagedList'
import { listDepartments } from './departmentsApi'

/** One page of departments, refetched when the filters change (see usePagedList). */
export function useDepartments({ search, status, page, perPage }) {
  const { items, ...rest } = usePagedList(listDepartments, { search, status, page, perPage })

  return { departments: items, ...rest }
}
