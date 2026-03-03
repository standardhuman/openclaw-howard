import { useState, useEffect, useCallback } from 'react'

export function useFetch(url, intervalMs = null) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(() => {
    fetch(url)
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json() })
      .then(d => { setData(d); setLoading(false); setError(null) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [url])

  useEffect(() => {
    fetchData()
    if (intervalMs) {
      const id = setInterval(fetchData, intervalMs)
      return () => clearInterval(id)
    }
  }, [fetchData, intervalMs])

  return { data, loading, error, refetch: fetchData }
}
