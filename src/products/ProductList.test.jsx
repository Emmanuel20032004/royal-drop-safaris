{/* Neo Mwashi */}
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import ProductList from './ProductList'

describe('ProductList', () => {
  const fakeProducts = [
    { id: 1, name: 'Maasai Mara Big 5 Classic', type: 'Safari', location: 'Maasai Mara', duration: '3 Days / 2 Nights', price: 48000, image: 'https://example.com/1.jpg' },
    { id: 2, name: 'Diani Beach Holiday Escape', type: 'Hotel', location: 'Diani', duration: '4 Days / 3 Nights', price: 39500, image: 'https://example.com/2.jpg' },
    { id: 3, name: 'Amboseli Elephant Trail', type: 'Safari', location: 'Amboseli', duration: '2 Days / 1 Night', price: 32500, image: 'https://example.com/3.jpg' },
  ]

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(fakeProducts),
    })
  })

  function renderProductList() {
    return render(
      <MemoryRouter initialEntries={['/shop']}>
        <ProductList />
      </MemoryRouter>,
    )
  }

  it('renders all products once loaded', async () => {
    renderProductList()

    await waitFor(() => {
      expect(screen.getByText('Maasai Mara Big 5 Classic')).toBeInTheDocument()
    })

    expect(screen.getByText('Diani Beach Holiday Escape')).toBeInTheDocument()
    expect(screen.getByText('Amboseli Elephant Trail')).toBeInTheDocument()
  })

  it('filters the list when typing in the search box', async () => {
    const user = userEvent.setup()
    renderProductList()

    await waitFor(() => {
      expect(screen.getByText('Maasai Mara Big 5 Classic')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/search packages/i)
    await user.type(searchInput, 'diani')

    expect(screen.queryByText('Maasai Mara Big 5 Classic')).not.toBeInTheDocument()
    expect(screen.getByText('Diani Beach Holiday Escape')).toBeInTheDocument()
    expect(screen.queryByText('Amboseli Elephant Trail')).not.toBeInTheDocument()
  })

  it('shows no matching products when the search has no results', async () => {
    const user = userEvent.setup()
    renderProductList()

    await waitFor(() => {
      expect(screen.getByText('Maasai Mara Big 5 Classic')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/search packages/i)
    await user.type(searchInput, 'xyz-not-real')

    expect(screen.queryByText('Maasai Mara Big 5 Classic')).not.toBeInTheDocument()
    expect(screen.queryByText('Diani Beach Holiday Escape')).not.toBeInTheDocument()
    expect(screen.queryByText('Amboseli Elephant Trail')).not.toBeInTheDocument()
  })
})