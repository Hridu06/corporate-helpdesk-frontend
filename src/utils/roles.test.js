import { describe, expect, it } from 'vitest'
import { getPrimaryRole, ROLES, roleLabel } from './roles'

describe('getPrimaryRole', () => {
  it('returns the most privileged known role when several are held', () => {
    expect(getPrimaryRole({ roles: ['customer', 'admin'] })).toBe(ROLES.ADMIN)
    expect(getPrimaryRole({ roles: ['agent', 'super-admin', 'customer'] })).toBe(ROLES.SUPER_ADMIN)
  })

  it('returns null when the user has no standard role', () => {
    expect(getPrimaryRole({ roles: ['auditor'] })).toBeNull()
    expect(getPrimaryRole({ roles: [] })).toBeNull()
    expect(getPrimaryRole(null)).toBeNull()
  })
})

describe('roleLabel', () => {
  it('turns slugs into readable labels', () => {
    expect(roleLabel('super-admin')).toBe('Super Admin')
    expect(roleLabel('agent')).toBe('Agent')
  })
})
