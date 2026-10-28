{/* Neo Mwashi */}
import { useState, useEffect } from 'react'

function useFetch(url, options = {}) {
  const { fetcher } = options
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isActive = true
    const doFetch = fetcher || fetch

    queueMicrotask(() => {
      if (isActive) {
        setLoading(true)
        setError(null)
      }
    })

    doFetch(url)
      .then((response) => {
        if (!response) {
          throw new Error('The API did not return a response.')
        }

        const contentType = response.headers?.get?.('content-type') ?? ''
        if (contentType.includes('text/html')) {
          throw new Error('The API returned the website page instead of JSON. Check the Hostinger API files and routing.')
        }

        if (typeof response.ok === 'boolean' && !response.ok) {
          throw new Error(`Request failed with status ${response.status ?? 'unknown'}`)
        }

        if (typeof response.status === 'number' && response.status >= 400) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        return response.json()
      })
      .then((fetchedData) => {
        if (!isActive) return
        setData(fetchedData)
        setLoading(false)
      })
      .catch((err) => {
        if (!isActive) return
        setError(err?.message || 'Request failed')
        setLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [url, fetcher])

  return { data, loading, error }
}

export default useFetch