import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { bearer } from 'better-auth/plugins'
import { drizzle } from 'drizzle-orm/d1'

import * as schema from './db/schema'
import type { Env } from './env'

/**
 * Auth lives on the Worker's origin (…workers.dev) while the site lives on
 * GitHub Pages — so every auth cookie is third-party. Safari and every browser
 * on iOS (WhatsApp's in-app browser included) refuse to store or send those,
 * as do Chrome incognito and Firefox. The portal is used almost entirely from
 * phones, so sign-in must not depend on cookies at all:
 *
 *  - `bearer()` lets the app authenticate with `Authorization: Bearer <token>`,
 *    the token kept in localStorage (see web/src/lib/auth.ts).
 *  - `skipStateCookieCheck` drops the OAuth state *cookie* as a second check.
 *    The state itself is still random, stored in the verification table,
 *    matched on callback and deleted after a single use — that is the actual
 *    CSRF protection. Without this, iOS never completes the Google flow: the
 *    state cookie is discarded on the way out and missing on the way back.
 *
 * Cookies are still issued, so browsers that accept them keep working.
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
    plugins: [bearer()],
    oauthConfig: {
      skipStateCookieCheck: true,
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
