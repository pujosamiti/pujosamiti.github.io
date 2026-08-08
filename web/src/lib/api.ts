import type { ApiResult } from '@pujosamiti/shared'

// The Worker's URL. Local dev talks to `wrangler dev`; CI injects the real one.
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8787'

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  // Cookies where the browser allows them; the bearer token everywhere else
  // (iOS blocks third-party cookies outright) — see lib/auth.ts.
  const token = localStorage.getItem('pujosamiti.session')
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) {
    // surface the server's own error message when it sent one
    const fallback = `API ${res.status}: ${path}`
    const body = (await res.json().catch(() => null)) as ApiResult<T> | null
    throw new Error(body && !body.ok && body.error ? body.error : fallback)
  }
  const body = (await res.json()) as ApiResult<T>
  if (!body.ok) throw new Error(body.error)
  return body.data
}
