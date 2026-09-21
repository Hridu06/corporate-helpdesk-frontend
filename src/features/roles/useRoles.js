import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { fetchRolesAndCatalog } from './rolesApi'

/** Roles and the permission catalogue, refetched by `reload()`. Cancel-safe like the other data hooks. */
export function useRoles() {
  const [reloadCount, setReloadCount] = useState(0)
  const [result, setResult] = useState({ key: null, data: null, error: null })

  useEffect(() => {
    const controller = new AbortController()

    fetchRolesAndCatalog(controller.signal)
      .then((data) => setResult({ key: reloadCount, data, error: null }))
      .catch((error) => {
        if (axios.isCancel(error)) return
        setResult((current) => ({ ...current, key: reloadCount, error }))
      })

    return () => controller.abort()
  }, [reloadCount])

  const reload = useCallback(() => setReloadCount((count) => count + 1), [])

  return {
    roles: result.data?.roles ?? null,
    groups: result.data?.groups ?? null,
    error: result.key === reloadCount ? result.error : null,
    loading: result.key !== reloadCount,
    reload,
  }
}
