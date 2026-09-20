import { axiosClient } from '../../api/axiosClient'

// Public endpoints set skipAuth so a stale token is never sent with them.

export async function register(payload) {
  const { data } = await axiosClient.post('/register', payload, { skipAuth: true })
  return data
}

export async function login({ email, password, remember }) {
  const { data } = await axiosClient.post('/login', { email, password, remember }, { skipAuth: true })
  return data
}

export async function resendVerification(email) {
  const { data } = await axiosClient.post('/email/verification-notification', { email }, { skipAuth: true })
  return data
}

export async function logout() {
  const { data } = await axiosClient.post('/logout')
  return data
}

export async function fetchUser() {
  const { data } = await axiosClient.get('/user')
  return data
}

export async function forgotPassword(email) {
  const { data } = await axiosClient.post('/forgot-password', { email }, { skipAuth: true })
  return data
}

export async function resetPassword(payload) {
  const { data } = await axiosClient.post('/reset-password', payload, { skipAuth: true })
  return data
}
