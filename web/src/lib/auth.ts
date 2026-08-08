import { createAuthClient } from 'better-auth/react'

import { API_URL } from '@/lib/api'

const TOKEN_KEY = 'pujosamiti.session'

/**
 * The site (GitHub Pages) and the API (workers.dev) are different origins, so
 * the session cookie is third-party — Safari, every browser on iOS and the
 * WhatsApp in-app browser drop it, and Chrome may follow. The portal is used
 * from phones, so the session travels as a bearer token instead:
 *
 *   sign in → Google → the API's /api/oauth/done → back here with #token=…
 *           → localStorage → `Authorization: Bearer …` on every request.
 *
 * Cookies are still sent when a browser accepts them; the token simply makes
 * them unnecessary.
 */
export const getToken = () => localStorage.getItem(TOKEN_KEY)

/** Auth header for plain fetches (see lib/api.ts). */
export function authHeaders(): Record<string, string> {
  const t = getToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

/**
 * The API redirects back with the session in the URL fragment. Move it into
 * localStorage and clean the address bar before React renders.
 */
export function captureTokenFromUrl(): void {
  const m = window.location.hash.match(/[#&]token=([^&]+)/)
  if (!m) return
  localStorage.setItem(TOKEN_KEY, decodeURIComponent(m[1]))
  history.replaceState(null, '', window.location.pathname + window.location.search)
}

export const authClient = createAuthClient({
  baseURL: API_URL,
  fetchOptions: {
    credentials: 'include',
    auth: { type: 'Bearer', token: () => getToken() ?? '' },
  },
})

export const { useSession } = authClient

/** Kick off the Google flow; better-auth redirects the browser to Google. */
export function signInWithGoogle() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  // Google returns to the API, which bridges the session back to /login
  return authClient.signIn.social({
    provider: 'google',
    callbackURL: `${API_URL}/api/oauth/done?to=${encodeURIComponent(`${base}/login`)}`,
    errorCallbackURL: `${window.location.origin}${base}/login?error=oauth`,
  })
}

export async function signOut() {
  try {
    await authClient.signOut()
  } finally {
    localStorage.removeItem(TOKEN_KEY)
  }
}
