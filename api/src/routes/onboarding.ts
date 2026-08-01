import type {
  ApiResult,
  CreateFamilyInput,
  FamilySearchResult,
  JoinFamilyInput,
  OnboardingState,
} from '@pujosamiti/shared'
import { and, eq, like } from 'drizzle-orm'
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
 * The first-sign-in funnel. Session required, membership NOT required — these
 * routes exist precisely for signed-in users who aren't members yet. Creating
 * a family is self-service but lands at tier non_member (no member content
 * until an admin promotes); joining an existing family needs admin approval.
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
  const email = c.get('email')

  const [row] = await db
    .select({ tier: schema.family.tier, isActive: schema.family.isActive, name: schema.family.name })
    .from(schema.person)
    .innerJoin(schema.family, eq(schema.person.familyId, schema.family.id))
    .where(eq(schema.person.email, email))
    .limit(1)
  if (row) {
    const state: OnboardingState =
      row.isActive && row.tier !== 'non_member'
        ? { state: 'member' }
        : { state: 'awaiting_activation', familyName: row.name }
    return c.json(ok(state))
  }

  const [pending] = await db
    .select({ name: schema.family.name })
    .from(schema.joinRequest)
    .innerJoin(schema.family, eq(schema.joinRequest.familyId, schema.family.id))
    .where(and(eq(schema.joinRequest.email, email), eq(schema.joinRequest.status, 'pending')))
    .limit(1)
  if (pending) return c.json(ok<OnboardingState>({ state: 'request_pending', familyName: pending.name }))

  return c.json(ok<OnboardingState>({ state: 'no_person' }))
})

onboardingRoutes.get('/families', async (c) => {
  const q = (c.req.query('q') ?? '').trim()
  if (q.length < 2) return c.json(ok<FamilySearchResult[]>([]))
  const db = drizzle(c.env.DB, { schema })
  const rows = await db
    .select({ id: schema.family.id, name: schema.family.name, society: schema.family.society })
    .from(schema.family)
    .where(and(like(schema.family.name, `%${q}%`), eq(schema.family.isActive, true)))
    .limit(10)
  return c.json(ok(rows))
})

onboardingRoutes.post('/family', async (c) => {
  const email = c.get('email')
  const body = (await c.req.json()) as CreateFamilyInput
  if (!body.familyName?.trim() || !body.displayName?.trim())
    return c.json({ ok: false, error: 'family name and your name are required' }, 400)

  const db = drizzle(c.env.DB, { schema })
  const [existing] = await db
    .select({ id: schema.person.id })
    .from(schema.person)
    .where(eq(schema.person.email, email))
    .limit(1)
  if (existing) return c.json({ ok: false, error: 'you are already registered' }, 409)

  const now = new Date()
  const familyId = crypto.randomUUID()
  await db.insert(schema.family).values({
    id: familyId,
    name: body.familyName.trim(),
    society: body.society?.trim() || null,
    residenceDetail: body.residenceDetail?.trim() || null,
    workplace: body.workplace?.trim() || null,
    workplaceDetail: body.workplaceDetail?.trim() || null,
    eligibility: body.eligibility === 'works_in_mgp' ? 'works_in_mgp' : 'resident',
    phone: body.familyPhone?.trim() || null,
    createdAt: now, // tier stays default non_member until an admin promotes
  })
  await db.insert(schema.person).values({
    id: crypto.randomUUID(),
    familyId,
    displayName: body.displayName.trim(),
    email,
    phone: body.phone?.trim() || null,
    gender: body.gender?.trim() || null,
    createdAt: now,
  })
  return c.json(ok({ familyId }))
})

onboardingRoutes.post('/join', async (c) => {
  const email = c.get('email')
  const body = (await c.req.json()) as JoinFamilyInput
  if (!body.familyId || !body.displayName?.trim())
    return c.json({ ok: false, error: 'family and your name are required' }, 400)

  const db = drizzle(c.env.DB, { schema })
  const [existing] = await db
    .select({ id: schema.person.id })
    .from(schema.person)
    .where(eq(schema.person.email, email))
    .limit(1)
  if (existing) return c.json({ ok: false, error: 'you are already registered' }, 409)
  const [pending] = await db
    .select({ id: schema.joinRequest.id })
    .from(schema.joinRequest)
    .where(and(eq(schema.joinRequest.email, email), eq(schema.joinRequest.status, 'pending')))
    .limit(1)
  if (pending) return c.json({ ok: false, error: 'you already have a pending request' }, 409)
  const [fam] = await db
    .select({ id: schema.family.id })
    .from(schema.family)
    .where(eq(schema.family.id, body.familyId))
    .limit(1)
  if (!fam) return c.json({ ok: false, error: 'family not found' }, 404)

  await db.insert(schema.joinRequest).values({
    id: crypto.randomUUID(),
    familyId: body.familyId,
    email,
    displayName: body.displayName.trim(),
    note: body.note?.trim() || null,
    createdAt: new Date(),
  })
  return c.json(ok({ requested: true }))
})
