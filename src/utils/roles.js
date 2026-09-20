// Role slugs as seeded by the backend (App\Enums\RoleName).
export const ROLES = {
  SUPER_ADMIN: 'super-admin',
  ADMIN: 'admin',
  AGENT: 'agent',
  CUSTOMER: 'customer',
}

// Highest privilege first. Used to pick a dashboard when a user holds several roles.
const ROLE_PRIORITY = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.AGENT, ROLES.CUSTOMER]

/** The user's most privileged known role, or null if they hold none of the standard roles. */
export function getPrimaryRole(user) {
  return ROLE_PRIORITY.find((role) => user?.roles?.includes(role)) ?? null
}

/** 'super-admin' -> 'Super Admin' */
export function roleLabel(role) {
  return role
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
