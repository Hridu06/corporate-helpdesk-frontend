import { z } from 'zod'

const name = z.string().trim().min(1, 'Full name is required').max(255, 'Name is too long')
const email = z.string().trim().min(1, 'Email is required').pipe(z.email('Enter a valid email address'))

export const createUserSchema = z.object({
  name,
  email,
  role: z.string().min(1, 'Choose a role'),
})

export const editUserSchema = z.object({ name, email })

export const changeRoleSchema = z.object({
  role: z.string().min(1, 'Choose a role'),
})
