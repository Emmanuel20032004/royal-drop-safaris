import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import useFetch from './useFetch'

describe('useFetch', () => {
  beforeEach(() => {
    // Replace the real fetch with a fake one before each test,
    // so we never actually hit a real network/server.
    global.fetch = vi.fn()
  })

  it('starts in a loading state with no data', () => {
    // Make the fake fetch return a never-resolving promise,
    // so we can inspect the very first render before anything finishes.
    global.fetch.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useFetch('http://fake-url.test'))

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBe(null)
    expect(result.current.error).toBe(null)
  })

  it('sets data and stops loading on a successful fetch', async () => {
    const fakeProduct = { id: 1, name: 'Tie rod', price: 6000 }

    // Simulate a real fetch response: an object with a .json() method.
    global.fetch.mockResolvedValue({
      json: () => Promise.resolve(fakeProduct),
    })

    const { result } = renderHook(() => useFetch('http://fake-url.test'))

    // Wait for the hook's internal state to update after the fake fetch resolves.
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual(fakeProduct)
    expect(result.current.error).toBe(null)
  })

  it('sets an error and stops loading when the fetch fails', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useFetch('http://fake-url.test'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
    expect(result.current.data).toBe(null)
  })
})