import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { store } from './app/store'
import { initializeAuth } from './features/auth/authSlice'

// Restore the session (if a token is stored) before/while the first render.
store.dispatch(initializeAuth())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
