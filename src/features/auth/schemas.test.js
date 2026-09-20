import { describe, expect, it } from 'vitest'
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from './schemas'

const STRONG = 'Str0ng!Passw0rd'

const messages = (result) => result.error.issues.map((issue) => issue.message)

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse({ email: 'a@example.com', password: 'x', remember: false }).success).toBe(true)
  })

  it('requires email and password, and a valid email format', () => {
    const empty = loginSchema.safeParse({ email: '', password: '', remember: false })
    expect(messages(empty)).toEqual(expect.arrayContaining(['Email is required', 'Password is required']))
    expect(messages(loginSchema.safeParse({ email: 'nope', password: 'x', remember: false }))).toContain(
      'Enter a valid email address',
    )
  })
})

describe('registerSchema', () => {
  const valid = { name: 'Jane', email: 'jane@example.com', password: STRONG, password_confirmation: STRONG }

  it('accepts valid input', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it.each([
    ['too short', 'Sh0rt!a', 'Use at least 8 characters'],
    ['missing a lowercase letter', 'ALLUPPER1!', 'Include a lowercase letter'],
    ['missing an uppercase letter', 'alllower1!', 'Include an uppercase letter'],
    ['missing a number', 'NoNumbers!!', 'Include a number'],
    ['missing a symbol', 'NoSymbols123', 'Include a symbol'],
  ])('rejects a password that is %s', (_label, password, message) => {
    const result = registerSchema.safeParse({ ...valid, password, password_confirmation: password })
    expect(messages(result)).toContain(message)
  })

  it('reports a confirmation mismatch on the confirmation field', () => {
    const result = registerSchema.safeParse({ ...valid, password_confirmation: 'Different!1234' })
    const issue = result.error.issues.find((i) => i.message === 'Passwords do not match')
    expect(issue.path).toEqual(['password_confirmation'])
  })

  it('trims the name and rejects a blank one', () => {
    expect(messages(registerSchema.safeParse({ ...valid, name: '   ' }))).toContain('Full name is required')
  })
})

describe('resetPasswordSchema / forgotPasswordSchema', () => {
  it('applies the same password rules and confirmation check', () => {
    expect(resetPasswordSchema.safeParse({ password: STRONG, password_confirmation: STRONG }).success).toBe(true)
    expect(resetPasswordSchema.safeParse({ password: 'weak', password_confirmation: 'weak' }).success).toBe(false)
    expect(resetPasswordSchema.safeParse({ password: STRONG, password_confirmation: 'x' }).success).toBe(false)
  })

  it('validates the email for forgot password', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'a@example.com' }).success).toBe(true)
    expect(forgotPasswordSchema.safeParse({ email: 'bad' }).success).toBe(false)
  })
})
