import axios from 'axios'
import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Alert } from '../../../components/common/Alert'
import { Button } from '../../../components/common/Button'
import { Textarea } from '../../../components/forms/Textarea'
import { cn } from '../../../utils/cn'
import { uploadErrorMessages } from '../attachments'
import { TICKET_LIMITS } from '../constants'
import { postInternalNote, postReply } from '../ticketsApi'
import { AttachmentPicker } from './AttachmentPicker'

const MODES = {
  reply: { label: 'Reply', submit: 'Send reply', placeholder: 'Write your reply…', send: postReply },
  note: { label: 'Internal note', submit: 'Add note', placeholder: 'Only staff can see this note…', send: postInternalNote },
}

const EMPTY = { reply: { text: '', files: [] }, note: { text: '', files: [] } }

/**
 * Which composers appear comes from the API's `abilities` (can_reply / can_add_note);
 * the backend enforces the same. Text and files are kept separately per composer, so a
 * file chosen for a reply can never be sent as a note by switching tabs.
 * `onSent` receives the response ({ entry, ticket, abilities, events }).
 */
export function MessageComposer({ ticketId, abilities, onSent }) {
  const available = [abilities.can_reply && 'reply', abilities.can_add_note && 'note'].filter(Boolean)
  const [chosen, setChosen] = useState('reply')
  const [drafts, setDrafts] = useState(EMPTY)
  const [errors, setErrors] = useState([])
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState(null) // 0..100 while files upload
  const controllerRef = useRef(null)

  if (available.length === 0) return null

  // If the chosen composer stopped being available (e.g. permissions changed), fall back.
  const mode = available.includes(chosen) ? chosen : available[0]
  const config = MODES[mode]
  const { text: body, files } = drafts[mode]

  const setDraft = (patch) => setDrafts((current) => ({ ...current, [mode]: { ...current[mode], ...patch } }))

  const submit = async (event) => {
    event.preventDefault()
    const text = body.trim()
    if (!text) return setErrors(['Write a message first.'])
    if (text.length > TICKET_LIMITS.message) return setErrors([`Keep it under ${TICKET_LIMITS.message} characters.`])

    setErrors([])
    setSending(true)
    setProgress(files.length > 0 ? 0 : null)
    controllerRef.current = new AbortController()

    try {
      const { message, ...payload } = await config.send(ticketId, text, files, {
        signal: controllerRef.current.signal,
        onUploadProgress: (upload) => setProgress(Math.round((upload.progress ?? 0) * 100)),
      })
      toast.success(message)
      setDrafts((current) => ({ ...current, [mode]: { text: '', files: [] } }))
      onSent(payload)
    } catch (err) {
      setErrors(axios.isCancel(err) ? ['Upload cancelled.'] : (err.errors?.body?.[0] ? [err.errors.body[0]] : uploadErrorMessages(err)))
    } finally {
      setSending(false)
      setProgress(null)
      controllerRef.current = null
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-3" aria-label="Add to the conversation">
      {available.length > 1 && (
        <div role="group" aria-label="Message type" className="inline-flex rounded-md border border-slate-300 p-0.5">
          {available.map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={mode === key}
              disabled={sending}
              onClick={() => {
                setChosen(key)
                setErrors([])
              }}
              className={cn(
                'rounded px-3 py-1 text-sm font-medium',
                mode === key ? (key === 'note' ? 'bg-amber-100 text-amber-900' : 'bg-brand-600 text-white') : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              {MODES[key].label}
            </button>
          ))}
        </div>
      )}

      {mode === 'note' && <p className="text-xs text-amber-800">Internal notes are visible to staff only, never to the customer.</p>}

      <Textarea
        label={config.label}
        rows={4}
        value={body}
        placeholder={config.placeholder}
        disabled={sending}
        maxLength={TICKET_LIMITS.message}
        onChange={(event) => setDraft({ text: event.target.value })}
        className={mode === 'note' ? 'border-amber-300 bg-amber-50' : undefined}
      />

      <AttachmentPicker files={files} onChange={(next) => setDraft({ files: next })} disabled={sending} />

      {progress !== null && (
        <div>
          <div role="progressbar" aria-label="Upload progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="h-2 overflow-hidden rounded bg-slate-200">
            <div className="h-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 text-xs text-slate-500">Uploading… {progress}%</p>
        </div>
      )}

      {errors.length > 0 && (
        <Alert variant="error">
          <ul className="space-y-1">
            {errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={sending} disabled={sending}>
          {config.submit}
        </Button>
        {sending && files.length > 0 && (
          <Button variant="secondary" onClick={() => controllerRef.current?.abort()}>
            Cancel upload
          </Button>
        )}
      </div>
    </form>
  )
}
