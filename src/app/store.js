import { configureStore } from '@reduxjs/toolkit'

// Placeholder reducer so the store is valid before any feature slice exists.
// Phase 5 replaces this with `{ auth: authReducer }`.
const rootReducer = (state = {}) => state

export const store = configureStore({
  reducer: rootReducer,
})
