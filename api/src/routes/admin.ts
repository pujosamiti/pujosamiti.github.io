import type {
  AdminFamily,
  AdminFamilyInput,
  AdminPerson,
  AdminPersonInput,
  ApiResult,
  FamilyTier,
} from '@pujosamiti/shared'
import { and, eq, ne } from 'drizzle-orm'
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

/** Admin-only: membership management. Gate = active person with is_admin. */
export const adminRoutes = new Hono<{ Bindings: Env; Variables: Vars }>()

adminRoutes.use('*', async (c, next) => {
  const auth = createAuth(c.env)
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) return c.json({ ok: false, error: 'not signed in' }, 401)

  const db = drizzle(c.env.DB, { schema })
  const [p] = await db
    .select({ id: schema.person.id, isAdmin: schema.person.isAdmin, isActive: schema.person.isActive })
    .from(schema.person)
    .where(eq(schema.person.email, session.user.email))
    .limit(1)
  if (!p?.isAdmin || !p.isActive) return c.json({ ok: false, error: 'not an admin' }, 403)

  c.set('adminPersonId', p.id)
  await next()
})

function toAdminPerson(p: typeof schema.person.$inferSelect, familyName: string | null): AdminPerson {
  return {
    id: p.id,
    familyId: p.familyId,
    familyName,
    displayName: p.displayName,
    email: p.email,
    society: p.society,
    residenceDetail: p.residenceDetail,
    workplace: p.workplace,
    workplaceDetail: p.workplaceDetail,
    eligibility: p.eligibility,
    tier: p.tier,
    phone: p.phone,
    gender: p.gender,
    isAdmin: p.isAdmin,
    isActive: p.isActive,
    portfolio: p.portfolio,
    notes: p.notes,
  }
}

function personValues(body: AdminPersonInput) {
  return {
    familyId: body.familyId || null,
    displayName: body.displayName.trim(),
    society: body.society?.trim() || null,
    residenceDetail: body.residenceDetail?.trim() || null,
    workplace: body.workplace?.trim() || null,
    workplaceDetail: body.workplaceDetail?.trim() || null,
    eligibility: body.eligibility === 'works_in_mgp' ? ('works_in_mgp' as const) : ('resident' as const),
    phone: body.phone?.trim() || null,
    gender: body.gender?.trim() || null,
    isAdmin: !!body.isAdmin,
    isActive: !!body.isActive,
    portfolio: body.portfolio?.trim() || null,
    notes: body.notes?.trim() || null,
  }
}

adminRoutes.get('/people', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  const rows = await db
    .select({ p: schema.person, familyName: schema.family.name })
    .from(schema.person)
    .leftJoin(schema.family, eq(schema.person.familyId, schema.family.id))
    .orderBy(schema.person.displayName)
  return c.json(ok(rows.map(({ p, familyName }) => toAdminPerson(p, familyName))))
})

adminRoutes.post('/people', async (c) => {
  const body = (await c.req.json()) as AdminPersonInput
  if (!body.displayName?.trim()) return c.json({ ok: false, error: 'name is required' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const email = body.email?.trim() || null
  if (email) {
    const [dup] = await db.select({ id: schema.person.id }).from(schema.person).where(eq(schema.person.email, email)).limit(1)
    if (dup) return c.json({ ok: false, error: 'that email already belongs to a person' }, 409)
  }
  const id = crypto.randomUUID()
  await db.insert(schema.person).values({ id, email, createdAt: new Date(), ...personValues(body) })
  return c.json(ok({ id }))
})

adminRoutes.post('/people/:id', async (c) => {
  const body = (await c.req.json()) as AdminPersonInput
  if (!body.displayName?.trim()) return c.json({ ok: false, error: 'name is required' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const id = c.req.param('id')
  const [p] = await db.select({ id: schema.person.id }).from(schema.person).where(eq(schema.person.id, id)).limit(1)
  if (!p) return c.json({ ok: false, error: 'person not found' }, 404)
  if (id === c.get('adminPersonId') && (!body.isAdmin || !body.isActive))
    return c.json({ ok: false, error: 'you cannot deactivate or de-admin yourself' }, 400)
  const email = body.email?.trim() || null
  if (email) {
    const [dup] = await db
      .select({ id: schema.person.id })
      .from(schema.person)
      .where(and(eq(schema.person.email, email), ne(schema.person.id, id)))
      .limit(1)
    if (dup) return c.json({ ok: false, error: 'that email already belongs to a person' }, 409)
  }
  await db.update(schema.person).set({ email, ...personValues(body) }).where(eq(schema.person.id, id))
  return c.json(ok({ id }))
})

adminRoutes.post('/people/:id/tier', async (c) => {
  const tier = ((await c.req.json()) as { tier: FamilyTier }).tier
  if (!TIERS.includes(tier)) return c.json({ ok: false, error: 'invalid tier' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const id = c.req.param('id')
  const [p] = await db.select({ id: schema.person.id }).from(schema.person).where(eq(schema.person.id, id)).limit(1)
  if (!p) return c.json({ ok: false, error: 'person not found' }, 404)
  await db.update(schema.person).set({ tier }).where(eq(schema.person.id, id))
  return c.json(ok({ id, tier }))
})

adminRoutes.delete('/people/:id', async (c) => {
  const id = c.req.param('id')
  if (id === c.get('adminPersonId')) return c.json({ ok: false, error: 'you cannot delete yourself' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const [p] = await db.select({ id: schema.person.id }).from(schema.person).where(eq(schema.person.id, id)).limit(1)
  if (!p) return c.json({ ok: false, error: 'person not found' }, 404)
  await db.delete(schema.person).where(eq(schema.person.id, id))
  return c.json(ok({ id }))
})

adminRoutes.get('/families', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  const rows = await db.select().from(schema.family).orderBy(schema.family.name)
  const out: AdminFamily[] = rows.map((f) => ({ id: f.id, name: f.name, notes: f.notes, isActive: f.isActive }))
  return c.json(ok(out))
})

adminRoutes.post('/families', async (c) => {
  const body = (await c.req.json()) as AdminFamilyInput
  if (!body.name?.trim()) return c.json({ ok: false, error: 'name is required' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const id = crypto.randomUUID()
  await db.insert(schema.family).values({
    id,
    name: body.name.trim(),
    notes: body.notes?.trim() || null,
    isActive: body.isActive !== false,
    createdAt: new Date(),
  })
  return c.json(ok({ id }))
})

adminRoutes.post('/families/:id', async (c) => {
  const body = (await c.req.json()) as AdminFamilyInput
  if (!body.name?.trim()) return c.json({ ok: false, error: 'name is required' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const id = c.req.param('id')
  const [f] = await db.select({ id: schema.family.id }).from(schema.family).where(eq(schema.family.id, id)).limit(1)
  if (!f) return c.json({ ok: false, error: 'family not found' }, 404)
  await db
    .update(schema.family)
    .set({ name: body.name.trim(), notes: body.notes?.trim() || null, isActive: !!body.isActive })
    .where(eq(schema.family.id, id))
  return c.json(ok({ id }))
})
