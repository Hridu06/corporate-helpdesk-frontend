import { ROLES } from '../../utils/roles'

/**
 * What each role's dashboard shows. Cards reference `moduleRoutes` keys and are
 * still filtered by the user's actual permissions, so removing a permission
 * from a role on the backend removes the card without a frontend change.
 * A card may override the module's default description.
 */
export const dashboardByRole = {
  [ROLES.SUPER_ADMIN]: {
    title: 'Admin Dashboard',
    description: 'System-wide administration and oversight.',
    cards: [
      { key: 'users' },
      { key: 'roles' },
      { key: 'departments' },
      { key: 'tickets', description: 'All tickets across the system.' },
      { key: 'reports' },
      { key: 'activity' },
      { key: 'settings' },
    ],
  },
  [ROLES.ADMIN]: {
    title: 'Support Dashboard',
    description: 'Oversee tickets, agents and departments.',
    cards: [
      { key: 'tickets', description: 'Review and assign incoming tickets.' },
      { key: 'departments' },
      { key: 'users' },
      { key: 'reports' },
    ],
  },
  [ROLES.AGENT]: {
    title: 'Agent Dashboard',
    description: 'Work through the tickets assigned to you.',
    cards: [
      { key: 'tickets', description: 'Your assigned tickets.' },
      { key: 'departments', description: 'Information about your department.' },
    ],
  },
  [ROLES.CUSTOMER]: {
    title: 'Customer Dashboard',
    description: 'Get help and track your support requests.',
    cards: [
      { key: 'newTicket' },
      { key: 'tickets', description: 'Follow your open and past requests.' },
    ],
  },
}

// Users with no standard role (e.g. a custom role) still get a permission-driven page.
export const fallbackDashboard = {
  title: 'Dashboard',
  description: 'Shortcuts based on your permissions.',
  cards: [{ key: 'tickets' }, { key: 'newTicket' }, { key: 'users' }, { key: 'departments' }, { key: 'reports' }],
}
