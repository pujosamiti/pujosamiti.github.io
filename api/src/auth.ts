import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { drizzle } from 'drizzle-orm/d1'

import * as schema from './db/schema'
import type { Env } from './env'

/**
 * Auth lives on the Worker's origin (…workers.dev) while the site lives on
 * GitHub Pages, so the session cookie must be cross-site: SameSite=None+Secure,
 * and the Pages origin must be a trusted origin for CSRF checks.
 */
export function createAuth(env: Env) {
  const db = drizzle(env.DB, { schema })
  return betterAuth({
    database: drizzleAdapter(db, { provider: 'sqlite', schema }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [env.WEB_ORIGIN],
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
      facebook: {
        clientId: env.FACEBOOK_CLIENT_ID,
        clientSecret: env.FACEBOOK_CLIENT_SECRET,
      },
    },
    advanced: {
      defaultCookieAttributes: {
        sameSite: 'none',
        secure: true,
      },
    },
  })
}

export type Auth = ReturnType<typeof createAuth>
