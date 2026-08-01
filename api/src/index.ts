import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { createAuth } from './auth'
import type { Env } from './env'
import { adminRoutes } from './routes/admin'
import { memberRoutes } from './routes/members'
import { onboardingRoutes } from './routes/onboarding'
import { postRoutes } from './routes/posts'
import { publicRoutes } from './routes/public'

const app = new Hono<{ Bindings: Env }>()

// The site lives on GitHub Pages, the API on workers.dev — cross-origin with cookies.
app.use('*', (c, next) =>
  cors({
    origin: c.env.WEB_ORIGIN,
    credentials: true,
  })(c, next),
)

app.get('/health', (c) => c.json({ ok: true }))

// better-auth owns /api/auth/* (social sign-in flows, session, sign-out)
app.on(['GET', 'POST'], '/api/auth/*', (c) => createAuth(c.env).handler(c.req.raw))

app.route('/api/public', publicRoutes)
app.route('/api/public', postRoutes)
app.route('/api/members', memberRoutes)
app.route('/api/onboarding', onboardingRoutes)
app.route('/api/admin', adminRoutes)

export default app
