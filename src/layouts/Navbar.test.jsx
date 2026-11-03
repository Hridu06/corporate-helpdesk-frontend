import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { makeUser, renderWithProviders } from '../test/utils'
import { Navbar } from './Navbar'

function Destination() {
  const location = useLocation()
  return <p>{location.pathname}{location.search}</p>
}

describe('Navbar', () => {
  it('opens ticket search with the entered query', async () => {
    const user = userEvent.setup()
    renderWithProviders(<><Navbar onMenuClick={() => {}} /><Routes><Route path="*" element={<Destination />} /></Routes></>, { user: makeUser('customer') })
    await user.type(screen.getByRole('searchbox', { name: 'Search tickets' }), 'printer issue{Enter}')
    expect(screen.getByText('/tickets?search=printer%20issue')).toBeInTheDocument()
  })

  it('focuses search with Ctrl K and toggles navigation', async () => {
    const toggle = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<Navbar onMenuClick={toggle} />, { user: makeUser('admin') })
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    expect(screen.getByRole('searchbox')).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Toggle navigation menu' }))
    expect(toggle).toHaveBeenCalledOnce()
  })

  it('shows usable help and hides search without ticket permission', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Navbar onMenuClick={() => {}} />, { user: makeUser('customer', { permissions: [] }) })
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Help and guidance' }))
    expect(screen.getByRole('dialog', { name: 'A little help, right here' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close dialog' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
