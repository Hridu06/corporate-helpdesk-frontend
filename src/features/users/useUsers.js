import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { listUsers } from './usersApi'

/**
 * Loads one page of users and refetches when the filters change. In-flight
 * requests are cancelled when the inputs change, so a slow earlier response
 * can never overwrite a newer one. `loading` is derived (the stored result is
 * for a different request than the current one), and the previous rows stay
 * visible while the next page loads.
 */
export function useUsers({ search, status, role, page, perPage }) {
  const [reloadCount, setReloadCount] = useState(0)
  const [result, setResult] = useState({ key: null, users: [], meta: null, error: null })

  const key = [search, status, role, page, perPage, reloadCount].join('|')

  useEffect(() => {
    const controller = new AbortController()

    listUsers({ search, status, role, page, perPage }, controller.signal)
      .then(({ data, meta }) => setResult({ key, users: data, meta, error: null }))
      .catch((error) => {
        if (axios.isCancel(error)) return
        setResult((current) => ({ ...current, key, error }))
      })

    return () => controller.abort()
  }, [key, search, status, role, page, perPage])

  const reload = useCallback(() => setReloadCount((count) => count + 1), [])
  const loading = result.key !== key

  return { users: result.users, meta: result.meta, error: loading ? null : result.error, loading, reload }
}
