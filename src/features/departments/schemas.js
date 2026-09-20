import { z } from 'zod'

export const departmentSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be 100 characters or fewer'),
  description: z.string().trim().max(500, 'Description must be 500 characters or fewer'),
  is_active: z.boolean(),
})
