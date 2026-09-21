// Values match the backend enums (App\Enums\TicketStatus / TicketPriority).

export const TICKET_STATUS = {
  open: { label: 'Open', variant: 'info' },
  in_progress: { label: 'In progress', variant: 'warning' },
  resolved: { label: 'Resolved', variant: 'success' },
  closed: { label: 'Closed', variant: 'neutral' },
}

export const TICKET_PRIORITY = {
  low: { label: 'Low', variant: 'neutral' },
  medium: { label: 'Medium', variant: 'info' },
  high: { label: 'High', variant: 'warning' },
  urgent: { label: 'Urgent', variant: 'danger' },
}

export const TICKET_LIMITS = { subject: 150, description: 5000, message: 5000 }

// Mirrors config/helpdesk.php on the backend so the form can warn early. The server
// judges every file by its content and is the only real check.
export const ATTACHMENT_LIMITS = {
  maxFiles: 5,
  maxFileBytes: 5 * 1024 * 1024,
  maxTotalBytes: 15 * 1024 * 1024,
  extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf', 'txt', 'csv', 'docx', 'xlsx'],
}
