// Emmanuel wema
// Authentication now goes through the JSON Server API instead of localStorage.
// Set VITE_API_BASE at build time to point production builds at the hosted API.
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'
export const adminSessionKey = 'royal-drop-safaris-admin-session'
export const userSessionKey = 'royal-drop-safaris-user-session'
export const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || ''

// Attach the admin token (and optional shared key) to API calls.
// Falls back to plain fetch when no admin session exists (local json-server dev).
export function apiFetch(url, options = {}) {
  const admin = getSession(adminSessionKey)
  const headers = { ...(options.headers || {}) }

  if (admin?.apiToken) {
    headers['X-Admin-Token'] = admin.apiToken
  }
  if (ADMIN_KEY) {
    headers['X-Admin-Key'] = ADMIN_KEY
  }

  return fetch(url, { ...options, headers })
}

export function setSession(key, user) {
  sessionStorage.setItem(key, JSON.stringify(user))
}

export function getSession(key) {
  try {
    return JSON.parse(sessionStorage.getItem(key))
  } catch {
    return null
  }
}

export function clearSession(key) {
  sessionStorage.removeItem(key)
}

export async function findUserByEmail(email) {
  const response = await fetch(`${API_BASE}/users?email=${encodeURIComponent(email.trim().toLowerCase())}`)
  if (!response.ok) throw new Error('Unable to reach the account service.')
  const matches = await response.json()
  return matches[0] || null
}

async function legacyLogin({ email, password, requiredRole }) {
  const user = await findUserByEmail(email)
  if (!user || user.password !== password) {
    throw new Error('The email or password is incorrect.')
  }
  if (requiredRole && user.role !== requiredRole) {
    throw new Error('This account does not have access to this area.')
  }
  return user
}

export async function loginWithApi({ email, password, requiredRole }) {
  const normalizedEmail = email.trim().toLowerCase()
  let response
  try {
    // The hosted PHP API verifies hashed passwords server-side.
    response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ADMIN_KEY ? { 'X-Admin-Key': ADMIN_KEY } : {}),
      },
      body: JSON.stringify({ email: normalizedEmail, password }),
    })
  } catch {
    throw new Error('Unable to reach the account service.')
  }

  // json-server (local dev) has no /auth/login route — keep the old flow there.
  if (response.status === 404) {
    return legacyLogin({ email: normalizedEmail, password, requiredRole })
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || 'The email or password is incorrect.')
  }
  if (requiredRole && data.role !== requiredRole) {
    throw new Error('This account does not have access to this area.')
  }
  return data
}

export async function registerCustomer({ name, phone, email, password }) {
  const existing = await findUserByEmail(email)
  if (existing) {
    throw new Error('An account with this email already exists.')
  }

  const response = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      phone,
      email: email.trim().toLowerCase(),
      password,
      role: 'Customer',
      verified: false,
    }),
  })

  if (!response.ok) throw new Error('Unable to create the account.')
  return response.json()
}
