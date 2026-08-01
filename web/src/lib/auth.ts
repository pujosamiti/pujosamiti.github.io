import { createAuthClient } from 'better-auth/react'

import { API_URL } from '@/lib/api'

/**
 * better-auth client against the Worker. The session cookie is cross-site
 * (Pages ↔ workers.dev), so every call must carry credentials.
 */
export const authClient = createAuthClient({
  baseURL: API_URL,
  fetchOptions: { credentials: 'include' },
})

export const { useSession } = authClient

/** Kick off the Google flow; better-auth redirects the browser to Google. */
export function signInWithGoogle() {
  const here = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, '')}/login`
  return authClient.signIn.social({
    provider: 'google',
    callbackURL: here,
    errorCallbackURL: `${here}?error=oauth`,
  })
}

export function signOut() {
  return authClient.signOut()
}
