{/* Neo Mwashi */}
import { useState, useEffect } from 'react'

function useFetch(url, options = {}) {
  const { fetcher } = options
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const doFetch = fetcher || fetch
    doFetch(url)
      .then((response) => response.json())
      .then((data) => {
        setData(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [url])

  return { data, loading, error }
}

export default useFetch