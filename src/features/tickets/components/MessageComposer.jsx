import { useState } from 'react'
import toast from 'react-hot-toast'
import { Alert } from '../../../components/common/Alert'
import { Button } from '../../../components/common/Button'
import { Textarea } from '../../../components/forms/Textarea'
import { cn } from '../../../utils/cn'
import { TICKET_LIMITS } from '../constants'
import { postInternalNote, postReply } from '../ticketsApi'

const MODES = {
  reply: { label: 'Reply', submit: 'Send reply', placeholder: 'Write your reply…', send: postReply },
  note: { label: 'Internal note', submit: 'Add note', placeholder: 'Only staff can see this note…', send: postInternalNote },
}

/**
 * Which composers appear comes from the API's `abilities` (can_reply / can_add_note);
 * the backend enforces the same. `onSent` receives the response ({ entry, ticket, abilities, events }).
 */
export function MessageComposer({ ticketId, abilities, onSent }) {
  const available = [abilities.can_reply && 'reply', abilities.can_add_note && 'note'].filter(Boolean)
  const [chosen, setChosen] = useState('reply')
  const [drafts, setDrafts] = useState({ reply: '', note: '' })
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)

  if (available.length === 0) return null

  // If the chosen composer stopped being available (e.g. permissions changed), fall back.
  const mode = available.includes(chosen) ? chosen : available[0]
  const config = MODES[mode]
  const body = drafts[mode]

  const submit = async (event) => {
    event.preventDefault()
    const text = body.trim()
    if (!text) return setError('Write a message first.')
    if (text.length > TICKET_LIMITS.message) return setError(`Keep it under ${TICKET_LIMITS.message} characters.`)

    setError(null)
    setSending(true)
    try {
      const { message, ...payload } = await config.send(ticketId, text)
      toast.success(message)
      setDrafts((current) => ({ ...current, [mode]: '' }))
      onSent(payload)
    } catch (err) {
      setError(err.errors?.body?.[0] ?? err.message)
    } finally {
      setSending(false)
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
              onClick={() => {
                setChosen(key)
                setError(null)
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
        onChange={(event) => setDrafts((current) => ({ ...current, [mode]: event.target.value }))}
        className={mode === 'note' ? 'border-amber-300 bg-amber-50' : undefined}
      />

      {error && <Alert variant="error">{error}</Alert>}

      <Button type="submit" loading={sending} disabled={sending}>
        {config.submit}
      </Button>
    </form>
  )
}
