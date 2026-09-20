/**
 * Single source of truth for permission-gated modules. Sidebar items, dashboard
 * cards and the router all read from here, so a module is added in one place.
 *
 * `permission` uses the backend's permission names. Hiding an item is UX only:
 * the backend authorises every API call independently.
 *
 * Every module is currently a "coming soon" page; real pages replace them as
 * the ticket, user and reporting features are built.
 */
export const moduleRoutes = [
  {
    key: 'tickets',
    path: '/tickets',
    label: 'Tickets',
    description: 'View and follow support tickets.',
    permission: 'ticket.view',
  },
  {
    key: 'newTicket',
    path: '/tickets/new',
    label: 'New Ticket',
    description: 'Submit a new support request.',
    permission: 'ticket.create',
  },
  {
    key: 'users',
    path: '/users',
    label: 'Users',
    description: 'Manage customer and staff accounts.',
    permission: 'user.view',
  },
  {
    key: 'roles',
    path: '/roles',
    label: 'Roles & Permissions',
    description: 'Control what each role can do.',
    permission: 'role.view',
  },
  {
    key: 'departments',
    path: '/departments',
    label: 'Departments',
    description: 'Organise support teams.',
    permission: 'department.view',
  },
  {
    key: 'reports',
    path: '/reports',
    label: 'Reports',
    description: 'Analytics and agent performance.',
    permission: 'report.view',
  },
  {
    key: 'activity',
    path: '/activity',
    label: 'Login Activity',
    description: 'Review sign-in history.',
    permission: 'activity.view',
  },
  {
    key: 'settings',
    path: '/settings',
    label: 'System Settings',
    description: 'Configure the helpdesk.',
    permission: 'settings.manage',
  },
]

export const moduleByKey = Object.fromEntries(moduleRoutes.map((route) => [route.key, route]))
