/**
 * Bearer token persistence.
 *
 * - "Remember me" -> localStorage (survives browser restarts, until the server-side expiry).
 * - Otherwise     -> sessionStorage (cleared when the tab/browser closes).
 *
 * Security note: any script running on this origin (e.g. via an XSS bug) can read
 * either store, so neither is safe against XSS. The mitigations are server-side
 * token expiry and revocation, no unsanitised HTML rendering, and a strict CSP
 * in production. An HttpOnly-cookie strategy would avoid this exposure at the
 * cost of the cross-origin/CSRF setup we deliberately did not choose.
 */
const KEY = 'helpdesk_token'

function safe(fn, fallback = null) {
  try {
    return fn()
  } catch {
    // Storage can be unavailable (private mode, blocked cookies).
    return fallback
  }
}

export const tokenStorage = {
  get() {
    return safe(() => localStorage.getItem(KEY) || sessionStorage.getItem(KEY))
  },

  set(token, remember) {
    this.clear()
    safe(() => (remember ? localStorage : sessionStorage).setItem(KEY, token))
  },

  clear() {
    safe(() => localStorage.removeItem(KEY))
    safe(() => sessionStorage.removeItem(KEY))
  },
}
