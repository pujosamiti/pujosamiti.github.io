import type { ApiResult, OnboardingState, ProfileInput } from '@pujosamiti/shared'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'

import { createAuth } from '../auth'
import * as schema from '../db/schema'
import type { Env } from '../env'

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data }
}

type Vars = { email: string }

/**
 * First-sign-in / profile flow. Session required, membership NOT required —
 * these routes exist precisely for signed-in users who aren't members yet.
 * Completing the profile creates the person at tier non_member; an admin
 * promotes them to member/core after the subscription.
 */
export const onboardingRoutes = new Hono<{ Bindings: Env; Variables: Vars }>()

onboardingRoutes.use('*', async (c, next) => {
  const auth = createAuth(c.env)
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) return c.json({ ok: false, error: 'not signed in' }, 401)
  c.set('email', session.user.email)
  await next()
})

onboardingRoutes.get('/status', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  const [p] = await db
    .select({ tier: schema.person.tier, isActive: schema.person.isActive })
    .from(schema.person)
    .where(eq(schema.person.email, c.get('email')))
    .limit(1)
  const state: OnboardingState = !p
    ? { state: 'no_person' }
    : p.isActive && p.tier !== 'non_member'
      ? { state: 'member' }
      : { state: 'awaiting_activation' }
  return c.json(ok(state))
})

onboardingRoutes.post('/profile', async (c) => {
  const email = c.get('email')
  const body = (await c.req.json()) as ProfileInput
  if (!body.displayName?.trim())
    return c.json({ ok: false, error: 'your name is required' }, 400)

  const db = drizzle(c.env.DB, { schema })
  const eligibility =
    body.eligibility === 'works_in_mgp' || body.eligibility === 'by_invitation'
      ? body.eligibility
      : ('resident' as const)
  const invited = eligibility === 'by_invitation' // invited patrons carry no location
  const values = {
    displayName: body.displayName.trim(),
    society: invited ? null : body.society?.trim() || null,
    residenceDetail: invited ? null : body.residenceDetail?.trim() || null,
    workplace: invited ? null : body.workplace?.trim() || null,
    workplaceDetail: invited ? null : body.workplaceDetail?.trim() || null,
    eligibility,
    phone: body.phone?.trim() || null,
    gender: body.gender?.trim() || null,
  }

  const [existing] = await db
    .select({ id: schema.person.id })
    .from(schema.person)
    .where(eq(schema.person.email, email))
    .limit(1)
  if (existing) {
    // Profile completion/update for an already-registered person (self-service
    // only touches profile fields — never tier/admin/active).
    await db.update(schema.person).set(values).where(eq(schema.person.id, existing.id))
    return c.json(ok({ id: existing.id }))
  }

  const id = crypto.randomUUID()
  await db.insert(schema.person).values({ id, email, createdAt: new Date(), ...values })
  return c.json(ok({ id }))
})
