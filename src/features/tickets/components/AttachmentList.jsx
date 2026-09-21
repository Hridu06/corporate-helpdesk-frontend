import { useState } from 'react'
import toast from 'react-hot-toast'
import { formatFileSize } from '../attachments'
import { downloadAttachment } from '../ticketsApi'

/**
 * Files on a ticket or message. The server only includes the files this viewer may
 * see. Names are plain text; downloads go through the authorised API.
 */
export function AttachmentList({ ticketId, attachments }) {
  const [busyId, setBusyId] = useState(null)

  if (!attachments || attachments.length === 0) return null

  const download = async (attachment) => {
    setBusyId(attachment.id)
    try {
      await downloadAttachment(ticketId, attachment)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <ul aria-label="Attachments" className="mt-3 space-y-1">
      {attachments.map((attachment) => (
        <li key={attachment.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded border border-slate-200 bg-white px-3 py-1.5 text-sm">
          <span className="min-w-0 break-words text-slate-800">
            {attachment.name} <span className="text-slate-500">({formatFileSize(attachment.size)})</span>
          </span>
          <button
            type="button"
            disabled={busyId === attachment.id}
            onClick={() => download(attachment)}
            className="font-medium text-brand-600 hover:text-brand-700 disabled:opacity-60"
          >
            {busyId === attachment.id ? 'Downloading…' : 'Download'}{' '}
            <span className="sr-only">{attachment.name}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
