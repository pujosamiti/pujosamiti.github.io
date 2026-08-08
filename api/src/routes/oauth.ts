import { Hono } from 'hono'

import { createAuth } from '../auth'
import type { Env } from '../env'

/**
 * The bridge that carries a session across origins without a cookie.
 *
 * Google sends the browser back to the Worker, and better-auth completes the
 * sign-in here — a top-level navigation, so the session cookie IS accepted
 * even on iOS (the Worker is first-party at that instant). It is useless to
 * the site, though, which lives on another origin and can never send it back.
 *
 * So the social flow's callbackURL points at this route: it reads the session
 * it has just been given and hands the token to the site in the URL fragment,
 * which the app moves into localStorage and then sends as a bearer token.
 * A fragment (not a query string) keeps the token out of server logs and out
 * of the Referer header.
 */
export const oauthRoutes = new Hono<{ Bindings: Env }>()

oauthRoutes.get('/done', async (c) => {
  const site = c.env.WEB_ORIGIN.replace(/\/$/, '')
  // A session token is about to ride on this URL, so the destination is only
  // ever a plain path on our own site — anything else falls back to /login.
  const asked = c.req.query('to') ?? '/login'
  const path = /^\/[A-Za-z0-9\-_/]*$/.test(asked) ? asked : '/login'
  const target = `${site}${path}`

  const auth = createAuth(c.env)
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session?.session?.token) return c.redirect(`${target}?error=oauth`, 302)

  return c.redirect(`${target}#token=${encodeURIComponent(session.session.token)}`, 302)
})
