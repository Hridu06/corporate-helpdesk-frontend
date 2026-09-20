import { z } from 'zod'

// Client-side checks mirror the backend rules for fast feedback; the backend
// remains the authority and its 422 errors are also displayed.
const email = z.string().trim().min(1, 'Email is required').pipe(z.email('Enter a valid email address'))

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean(),
})

const newPassword = z
  .string()
  .min(8, 'Use at least 8 characters')
  .regex(/[a-z]/, 'Include a lowercase letter')
  .regex(/[A-Z]/, 'Include an uppercase letter')
  .regex(/\d/, 'Include a number')
  .regex(/[^A-Za-z0-9]/, 'Include a symbol')

const passwordsMatch = [
  (data) => data.password === data.password_confirmation,
  { path: ['password_confirmation'], message: 'Passwords do not match' },
]

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Full name is required').max(255, 'Name is too long'),
    email,
    password: newPassword,
    password_confirmation: z.string().min(1, 'Confirm your password'),
  })
  .refine(...passwordsMatch)

export const forgotPasswordSchema = z.object({ email })

export const resetPasswordSchema = z
  .object({
    password: newPassword,
    password_confirmation: z.string().min(1, 'Confirm your password'),
  })
  .refine(...passwordsMatch)
