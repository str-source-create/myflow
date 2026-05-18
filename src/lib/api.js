/**
 * api.js
 * Shared API utility for frontend requests.
 * Automatically prefixes backend URL, adds auth header when available,
 * and enforces a consistent response/error contract.
 */
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

/**
 * Reads stored JWT token for current signed-in role.
 */
export function getStoredToken(role = 'admin') {
  if (role === 'worker') return localStorage.getItem('cf_worker_token') || ''
  return localStorage.getItem('cf_admin_token') || ''
}

/**
 * Makes an authenticated JSON request.
 */
export async function apiRequest(path, options = {}, role = 'admin') {
  const token = getStoredToken(role)
  const headers = {
    ...(options.headers || {}),
  }

  if (!headers.Authorization && token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  const data = await response.json().catch(() => ({ success: false, message: 'Invalid server response' }))

  if (!response.ok || data.success === false) {
    const error = new Error(data.message || 'Request failed')
    error.status = response.status
    error.payload = data
    // Only dispatch cf:unauthorized when the user already had a token
    // (expired session). A 401 during login means wrong credentials, not a
    // stale session — dispatching here would cause a page reload that wipes
    // the error state before React can render it.
    if (response.status === 401 && token) {
      window.dispatchEvent(new CustomEvent('cf:unauthorized', { detail: { role } }))
    }
    throw error
  }

  return data
}

/**
 * Makes an authenticated FormData request.
 */
export async function apiFormRequest(path, formData, method = 'POST', role = 'admin') {
  const token = getStoredToken(role)
  const headers = {}

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: formData,
  })

  const data = await response.json().catch(() => ({ success: false, message: 'Invalid server response' }))

  if (!response.ok || data.success === false) {
    const error = new Error(data.message || 'Request failed')
    error.status = response.status
    error.payload = data
    // Only dispatch when a token was sent (stale session), not during login attempts.
    if (response.status === 401 && token) {
      window.dispatchEvent(new CustomEvent('cf:unauthorized', { detail: { role } }))
    }
    throw error
  }

  return data
}

export { API_BASE }
