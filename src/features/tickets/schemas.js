import { z } from 'zod'
import { TICKET_LIMITS } from './constants'

export const newTicketSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(1, 'Subject is required')
    .max(TICKET_LIMITS.subject, `Subject must be ${TICKET_LIMITS.subject} characters or fewer`),
  description: z
    .string()
    .trim()
    .min(1, 'Please describe the problem')
    .max(TICKET_LIMITS.description, `Description must be ${TICKET_LIMITS.description} characters or fewer`),
  // '' means "no department"; otherwise the id as a string from the <select>.
  department_id: z.string(),
})
