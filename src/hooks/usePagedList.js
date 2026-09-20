import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'

/**
 * Loads one page of a paginated Laravel list and refetches when `params`
 * change. `fetchPage(params, signal)` must resolve to `{ data, meta }`.
 *
 * In-flight requests are cancelled when the inputs change, so a slow earlier
 * response can never overwrite a newer one. `loading` is derived (the stored
 * result belongs to a different request than the current one), and the previous
 * rows stay visible while the next page loads. `params` must hold primitives.
 */
export function usePagedList(fetchPage, params) {
  const [reloadCount, setReloadCount] = useState(0)
  const [result, setResult] = useState({ key: null, items: [], meta: null, error: null })

  const key = JSON.stringify([params, reloadCount])

  useEffect(() => {
    const controller = new AbortController()
    // Rebuilt from `key`, so the effect depends on exactly what it reads.
    const [currentParams] = JSON.parse(key)

    fetchPage(currentParams, controller.signal)
      .then(({ data, meta }) => setResult({ key, items: data, meta, error: null }))
      .catch((error) => {
        if (axios.isCancel(error)) return
        setResult((current) => ({ ...current, key, error }))
      })

    return () => controller.abort()
  }, [key, fetchPage])

  const reload = useCallback(() => setReloadCount((count) => count + 1), [])
  const loading = result.key !== key

  return { items: result.items, meta: result.meta, error: loading ? null : result.error, loading, reload }
}
