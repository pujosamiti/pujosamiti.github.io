import type { AdminFamily, ApiResult, FamilyTier, JoinRequestView } from '@pujosamiti/shared'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'

import { createAuth } from '../auth'
import * as schema from '../db/schema'
import type { Env } from '../env'

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data }
}

const TIERS: FamilyTier[] = ['non_member', 'member', 'core']

type Vars = { adminPersonId: string }

/** Admin-only: membership management. Gate = person.is_admin, family active. */
export const adminRoutes = new Hono<{ Bindings: Env; Variables: Vars }>()

adminRoutes.use('*', async (c, next) => {
  const auth = createAuth(c.env)
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) return c.json({ ok: false, error: 'not signed in' }, 401)

  const db = drizzle(c.env.DB, { schema })
  const [row] = await db
    .select({ personId: schema.person.id, isAdmin: schema.person.isAdmin, isActive: schema.family.isActive })
    .from(schema.person)
    .innerJoin(schema.family, eq(schema.person.familyId, schema.family.id))
    .where(eq(schema.person.email, session.user.email))
    .limit(1)
  if (!row?.isAdmin || !row.isActive) return c.json({ ok: false, error: 'not an admin' }, 403)

  c.set('adminPersonId', row.personId)
  await next()
})

adminRoutes.get('/families', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  const families = await db.select().from(schema.family).orderBy(schema.family.name)
  const people = await db.select().from(schema.person)
  const byFamily = new Map<string, typeof people>()
  for (const p of people) {
    const list = byFamily.get(p.familyId) ?? []
    list.push(p)
    byFamily.set(p.familyId, list)
  }
  const out: AdminFamily[] = families.map((f) => ({
    id: f.id,
    name: f.name,
    society: f.society,
    eligibility: f.eligibility,
    tier: f.tier,
    isActive: f.isActive,
    people: (byFamily.get(f.id) ?? []).map((p) => ({
      id: p.id,
      displayName: p.displayName,
      email: p.email,
      isAdmin: p.isAdmin,
      portfolio: p.portfolio,
    })),
  }))
  return c.json(ok(out))
})

adminRoutes.post('/families/:id/tier', async (c) => {
  const tier = ((await c.req.json()) as { tier: FamilyTier }).tier
  if (!TIERS.includes(tier)) return c.json({ ok: false, error: 'invalid tier' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const [fam] = await db
    .select({ id: schema.family.id })
    .from(schema.family)
    .where(eq(schema.family.id, c.req.param('id')))
    .limit(1)
  if (!fam) return c.json({ ok: false, error: 'family not found' }, 404)
  await db.update(schema.family).set({ tier }).where(eq(schema.family.id, fam.id))
  return c.json(ok({ id: fam.id, tier }))
})

adminRoutes.get('/join-requests', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  const rows = await db
    .select({ req: schema.joinRequest, familyName: schema.family.name })
    .from(schema.joinRequest)
    .innerJoin(schema.family, eq(schema.joinRequest.familyId, schema.family.id))
    .where(eq(schema.joinRequest.status, 'pending'))
  const out: JoinRequestView[] = rows.map(({ req, familyName }) => ({
    id: req.id,
    familyId: req.familyId,
    familyName,
    email: req.email,
    displayName: req.displayName,
    note: req.note,
    createdAt: req.createdAt.toISOString(),
  }))
  return c.json(ok(out))
})

adminRoutes.post('/join-requests/:id/decide', async (c) => {
  const action = ((await c.req.json()) as { action: 'approve' | 'reject' }).action
  if (action !== 'approve' && action !== 'reject')
    return c.json({ ok: false, error: 'invalid action' }, 400)

  const db = drizzle(c.env.DB, { schema })
  const [req] = await db
    .select()
    .from(schema.joinRequest)
    .where(eq(schema.joinRequest.id, c.req.param('id')))
    .limit(1)
  if (!req || req.status !== 'pending') return c.json({ ok: false, error: 'request not found' }, 404)

  if (action === 'approve') {
    await db.insert(schema.person).values({
      id: crypto.randomUUID(),
      familyId: req.familyId,
      displayName: req.displayName,
      email: req.email,
      createdAt: new Date(),
    })
  }
  await db
    .update(schema.joinRequest)
    .set({ status: action === 'approve' ? 'approved' : 'rejected', decidedBy: c.get('adminPersonId'), decidedAt: new Date() })
    .where(eq(schema.joinRequest.id, req.id))
  return c.json(ok({ id: req.id, status: action === 'approve' ? 'approved' : 'rejected' }))
})
