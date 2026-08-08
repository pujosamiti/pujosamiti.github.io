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
  // Inactive = left the portal: they re-register (profile form) like a new user.
  const state: OnboardingState = !p || !p.isActive
    ? { state: 'no_person' }
    : p.tier !== 'non_member'
      ? { state: 'member' }
      : { state: 'awaiting_activation' }
  return c.json(ok(state))
})

/** Own profile for pre-filling forms; null if never registered. */
onboardingRoutes.get('/me', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  const [p] = await db
    .select()
    .from(schema.person)
    .where(eq(schema.person.email, c.get('email')))
    .limit(1)
  if (!p) return c.json(ok<ProfileInput | null>(null))
  return c.json(
    ok<ProfileInput>({
      displayName: p.displayName,
      eligibility: p.eligibility,
      society: p.society,
      residenceDetail: p.residenceDetail,
      workplace: p.workplace,
      workplaceDetail: p.workplaceDetail,
      phone: p.phone,
      gender: p.gender,
    }),
  )
})

/**
 * Leave the portal: soft delete — deactivate and drop to non_member. Signing
 * in later re-registers through the normal flow (admin re-activates tier).
 */
onboardingRoutes.post('/leave', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  const [p] = await db
    .select({ id: schema.person.id, isAdmin: schema.person.isAdmin })
    .from(schema.person)
    .where(eq(schema.person.email, c.get('email')))
    .limit(1)
  if (!p) return c.json({ ok: false, error: 'not registered' }, 404)
  if (p.isAdmin)
    return c.json({ ok: false, error: 'admins must hand over admin access before leaving' }, 400)
  await db
    .update(schema.person)
    .set({ isActive: false, tier: 'non_member' })
    .where(eq(schema.person.id, p.id))
  return c.json(ok({ left: true }))
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
    // Profile completion/update for an already-registered person. Self-service
    // never touches tier/admin; isActive flips true so someone who left and
    // signs back in re-registers through this same path (tier stays
    // non_member until an admin re-activates membership).
    await db
      .update(schema.person)
      .set({ ...values, isActive: true })
      .where(eq(schema.person.id, existing.id))
    return c.json(ok({ id: existing.id }))
  }

  const id = crypto.randomUUID()
  await db.insert(schema.person).values({ id, email, origin: 'self', createdAt: new Date(), ...values })
  return c.json(ok({ id }))
})
