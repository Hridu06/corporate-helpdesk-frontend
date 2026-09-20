import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { tokenStorage } from '../../utils/tokenStorage'
import * as authApi from './authApi'

/**
 * status: 'idle' (not checked yet) | 'loading' (restoring session) |
 *         'authenticated' | 'unauthenticated'
 * The user object comes from the backend (/api/user) and is kept in memory only;
 * only the token is persisted, and the user is re-fetched on every page load.
 */
const initialState = {
  user: null,
  status: 'idle',
  sessionEndedReason: null, // 'expired' | 'inactive' when the server ended the session
}

export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    if (!tokenStorage.get()) return null

    try {
      const { user } = await authApi.fetchUser()
      return user
    } catch (error) {
      // 401/inactive are handled by the Axios interceptor (token cleared).
      // On a network error the token is kept so a reload can retry.
      return rejectWithValue(error)
    }
  },
  { condition: (_, { getState }) => getState().auth.status === 'idle' },
)

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password, remember }, { rejectWithValue }) => {
    try {
      const data = await authApi.login({ email, password, remember })
      tokenStorage.set(data.token, remember)
      return data.user
    } catch (error) {
      return rejectWithValue(error)
    }
  },
)

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try {
    await authApi.logout()
  } catch {
    // The token may already be invalid; the local session is cleared regardless.
  }
  tokenStorage.clear()
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionEnded(state, action) {
      state.user = null
      state.status = 'unauthenticated'
      state.sessionEndedReason = action.payload
    },
    dismissSessionNotice(state) {
      state.sessionEndedReason = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.user = action.payload
        state.status = action.payload ? 'authenticated' : 'unauthenticated'
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.user = null
        state.status = 'unauthenticated'
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload
        state.status = 'authenticated'
        state.sessionEndedReason = null
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.status = 'unauthenticated'
        state.sessionEndedReason = null
      })
  },
})

export const { sessionEnded, dismissSessionNotice } = authSlice.actions
export default authSlice.reducer
