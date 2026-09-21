import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { fetchReports } from './reportsApi'

/**
 * The reports for the current filters. Changing the filters cancels the request in flight, so a slow
 * earlier answer can never overwrite a newer one. The previous figures stay on screen while the
 * next ones load (`loading` is derived: the stored result belongs to a different request).
 */
export function useReports({ days, from, to, departmentId }) {
  const [reloadCount, setReloadCount] = useState(0)
  const [result, setResult] = useState({ key: null, data: null, error: null })

  const key = JSON.stringify([{ days, from, to, departmentId }, reloadCount])

  useEffect(() => {
    const controller = new AbortController()
    // Rebuilt from `key`, so the effect depends on exactly what it reads.
    const [params] = JSON.parse(key)

    fetchReports(params, controller.signal)
      .then((data) => setResult({ key, data, error: null }))
      .catch((error) => {
        if (axios.isCancel(error)) return
        setResult((current) => ({ ...current, key, error }))
      })

    return () => controller.abort()
  }, [key])

  const reload = useCallback(() => setReloadCount((count) => count + 1), [])

  return {
    data: result.data,
    error: result.key === key ? result.error : null,
    loading: result.key !== key,
    reload,
  }
}
