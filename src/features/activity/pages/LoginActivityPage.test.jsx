import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeUser, renderWithProviders } from '../../../test/utils'
import * as activityApi from '../activityApi'
import { LoginActivityPage } from './LoginActivityPage'

vi.mock('../activityApi')

const EDGE_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0'

const ROWS = [
  {
    id: 3,
    user: { id: 2, name: 'Cara Customer', email: 'cara@example.com' },
    status: 'failed',
    ip_address: '203.0.113.9',
    user_agent: 'curl/8.16.0',
    login_at: '2026-03-20T09:00:00Z',
    logout_at: null,
  },
  {
    id: 2,
    user: { id: 2, name: 'Cara Customer', email: 'cara@example.com' },
    status: 'success',
    ip_address: '203.0.113.7',
    user_agent: EDGE_UA,
    login_at: '2026-03-19T09:00:00Z',
    logout_at: '2026-03-19T10:00:00Z',
  },
  { id: 1, user: null, status: 'blocked', ip_address: null, user_agent: null, login_at: '2026-03-01T09:00:00Z', logout_at: null },
]

const page = (rows) => ({
  data: rows,
  meta: { current_page: 1, last_page: 1, per_page: 15, total: rows.length, from: rows.length ? 1 : 0, to: rows.length },
})

const superAdmin = () => makeUser('super-admin', { id: 1 })

describe('LoginActivityPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    activityApi.listLoginActivities.mockResolvedValue(page(ROWS))
  })

  it('lists sign-in activity with user, result, device and IP', async () => {
    renderWithProviders(<LoginActivityPage />, { user: superAdmin() })

    expect(await screen.findAllByText('cara@example.com')).toHaveLength(2)
    // Scoped to the table: the same labels also appear as options in the "Result" filter.
    const table = within(screen.getByRole('table'))
    expect(table.getByText('Wrong password')).toBeInTheDocument()
    expect(table.getByText('Signed in')).toBeInTheDocument()
    expect(table.getByText('Blocked')).toBeInTheDocument()
    expect(table.getByText('Edge on Windows')).toBeInTheDocument()
    expect(table.getByText('203.0.113.7')).toBeInTheDocument()
  })

  it('keeps the raw user agent available as a tooltip', async () => {
    renderWithProviders(<LoginActivityPage />, { user: superAdmin() })

    const device = await screen.findByText('Edge on Windows')
    expect(device).toHaveAttribute('title', EDGE_UA)
  })

  it('labels activity from deleted accounts and shows a dash for missing values', async () => {
    renderWithProviders(<LoginActivityPage />, { user: superAdmin() })

    await screen.findAllByText('cara@example.com')
    const deletedRow = screen.getByText('Deleted account').closest('tr')
    expect(within(deletedRow).getByText('Unknown device')).toBeInTheDocument()
    expect(within(deletedRow).getAllByText('—').length).toBeGreaterThanOrEqual(2) // signed-out time and IP
  })

  it('is read-only: no row actions', async () => {
    renderWithProviders(<LoginActivityPage />, { user: superAdmin() })
    await screen.findAllByText('cara@example.com')

    const body = screen.getAllByRole('rowgroup')[1]
    expect(within(body).queryAllByRole('button')).toHaveLength(0)
  })

  it('requests the first page with the default page size', async () => {
    renderWithProviders(<LoginActivityPage />, { user: superAdmin() })
    await screen.findAllByText('cara@example.com')

    expect(activityApi.listLoginActivities).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, perPage: 15, status: '', from: '', to: '' }),
      expect.anything(),
    )
  })

  it('filters by result and returns to page 1', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginActivityPage />, { user: superAdmin() })
    await screen.findAllByText('cara@example.com')

    await user.selectOptions(screen.getByLabelText('Result'), 'failed')

    await waitFor(() =>
      expect(activityApi.listLoginActivities).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'failed', page: 1 }),
        expect.anything(),
      ),
    )
  })

  it('searches (debounced) and filters by date range', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginActivityPage />, { user: superAdmin() })
    await screen.findAllByText('cara@example.com')

    await user.type(screen.getByLabelText('Search'), 'cara')
    await waitFor(() =>
      expect(activityApi.listLoginActivities).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'cara' }),
        expect.anything(),
      ),
    )

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-03-01' } })
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-03-31' } })
    await waitFor(() =>
      expect(activityApi.listLoginActivities).toHaveBeenLastCalledWith(
        expect.objectContaining({ from: '2026-03-01', to: '2026-03-31' }),
        expect.anything(),
      ),
    )
  })

  it('stops the date pickers from crossing over', async () => {
    renderWithProviders(<LoginActivityPage />, { user: superAdmin() })
    await screen.findAllByText('cara@example.com')

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-03-10' } })

    expect(screen.getByLabelText('To')).toHaveAttribute('min', '2026-03-10')
  })

  it('distinguishes "no activity yet" from "no matches"', async () => {
    const user = userEvent.setup()
    activityApi.listLoginActivities.mockResolvedValue(page([]))
    renderWithProviders(<LoginActivityPage />, { user: superAdmin() })
    expect(await screen.findByText('No sign-in activity yet')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Result'), 'blocked')
    expect(await screen.findByText('No activity matches your filters')).toBeInTheDocument()
  })

  it('shows the error with a working Retry', async () => {
    const user = userEvent.setup()
    activityApi.listLoginActivities.mockRejectedValueOnce({ status: 500, message: 'Server exploded', errors: {} })
    renderWithProviders(<LoginActivityPage />, { user: superAdmin() })

    expect(await screen.findByText('Server exploded')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(await screen.findAllByText('cara@example.com')).toHaveLength(2)
    expect(screen.queryByText('Server exploded')).not.toBeInTheDocument()
  })
})
