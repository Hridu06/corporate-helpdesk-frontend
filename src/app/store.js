import { configureStore } from '@reduxjs/toolkit'
import { setSessionEndedHandler } from '../api/axiosClient'
import authReducer, { sessionEnded } from '../features/auth/authSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
})

// When the server rejects our token (expired/revoked) or the account was
// deactivated, drop the in-memory session so route guards redirect to login.
setSessionEndedHandler((reason) => store.dispatch(sessionEnded(reason)))
