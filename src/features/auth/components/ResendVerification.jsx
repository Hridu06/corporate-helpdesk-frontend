import { useState } from 'react'
import toast from 'react-hot-toast'
import { Button } from '../../../components/common/Button'
import { Input } from '../../../components/common/Input'
import { resendVerification } from '../authApi'

/**
 * Resend the verification email. Pass `email` when it is already known
 * (after login/registration); otherwise the user is asked for it. The backend
 * answers identically whether or not the account exists.
 */
export function ResendVerification({ email: knownEmail }) {
  const [typedEmail, setTypedEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const email = knownEmail || typedEmail

  const send = async (event) => {
    event.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      await resendVerification(email)
      setSent(true)
      toast.success('If the account needs verification, a new link is on its way.')
    } catch (error) {
      toast.error(error.status === 429 ? 'Too many requests. Please wait a minute and try again.' : error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={send} className="space-y-3">
      {!knownEmail && (
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          value={typedEmail}
          onChange={(event) => setTypedEmail(event.target.value)}
          required
        />
      )}
      <Button type="submit" variant="secondary" loading={loading} disabled={!email} fullWidth>
        {sent ? 'Send again' : 'Resend verification email'}
      </Button>
    </form>
  )
}
