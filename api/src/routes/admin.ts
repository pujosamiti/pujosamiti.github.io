import type {
  AdminFamily,
  AdminFamilyUpdate,
  AdminPersonInput,
  ApiResult,
  FamilyTier,
  JoinRequestView,
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
    residenceDetail: f.residenceDetail,
    workplace: f.workplace,
    workplaceDetail: f.workplaceDetail,
    eligibility: f.eligibility,
    tier: f.tier,
    isActive: f.isActive,
    phone: f.phone,
    notes: f.notes,
    people: (byFamily.get(f.id) ?? []).map((p) => ({
      id: p.id,
      displayName: p.displayName,
      email: p.email,
      phone: p.phone,
      gender: p.gender,
      isAdmin: p.isAdmin,
      portfolio: p.portfolio,
      notes: p.notes,
    })),
  }))
  return c.json(ok(out))
})

adminRoutes.post('/families/:id', async (c) => {
  const body = (await c.req.json()) as AdminFamilyUpdate
  if (!body.name?.trim()) return c.json({ ok: false, error: 'name is required' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const id = c.req.param('id')
  const [fam] = await db.select({ id: schema.family.id }).from(schema.family).where(eq(schema.family.id, id)).limit(1)
  if (!fam) return c.json({ ok: false, error: 'family not found' }, 404)
  await db
    .update(schema.family)
    .set({
      name: body.name.trim(),
      society: body.society?.trim() || null,
      residenceDetail: body.residenceDetail?.trim() || null,
      workplace: body.workplace?.trim() || null,
      workplaceDetail: body.workplaceDetail?.trim() || null,
      eligibility: body.eligibility === 'works_in_mgp' ? 'works_in_mgp' : 'resident',
      phone: body.phone?.trim() || null,
      notes: body.notes?.trim() || null,
      isActive: !!body.isActive,
    })
    .where(eq(schema.family.id, id))
  return c.json(ok({ id }))
})

adminRoutes.post('/families/:id/people', async (c) => {
  const body = (await c.req.json()) as AdminPersonInput
  if (!body.displayName?.trim()) return c.json({ ok: false, error: 'name is required' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const familyId = c.req.param('id')
  const [fam] = await db.select({ id: schema.family.id }).from(schema.family).where(eq(schema.family.id, familyId)).limit(1)
  if (!fam) return c.json({ ok: false, error: 'family not found' }, 404)
  const email = body.email?.trim() || null
  if (email) {
    const [dup] = await db.select({ id: schema.person.id }).from(schema.person).where(eq(schema.person.email, email)).limit(1)
    if (dup) return c.json({ ok: false, error: 'that email already belongs to a person' }, 409)
  }
  const id = crypto.randomUUID()
  await db.insert(schema.person).values({
    id,
    familyId,
    displayName: body.displayName.trim(),
    email,
    phone: body.phone?.trim() || null,
    gender: body.gender?.trim() || null,
    isAdmin: !!body.isAdmin,
    portfolio: body.portfolio?.trim() || null,
    notes: body.notes?.trim() || null,
    createdAt: new Date(),
  })
  return c.json(ok({ id }))
})

adminRoutes.post('/people/:id', async (c) => {
  const body = (await c.req.json()) as AdminPersonInput
  if (!body.displayName?.trim()) return c.json({ ok: false, error: 'name is required' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const id = c.req.param('id')
  const [p] = await db.select({ id: schema.person.id }).from(schema.person).where(eq(schema.person.id, id)).limit(1)
  if (!p) return c.json({ ok: false, error: 'person not found' }, 404)
  if (id === c.get('adminPersonId') && !body.isAdmin)
    return c.json({ ok: false, error: 'you cannot remove your own admin access' }, 400)
  const email = body.email?.trim() || null
  if (email) {
    const [dup] = await db
      .select({ id: schema.person.id })
      .from(schema.person)
      .where(and(eq(schema.person.email, email), ne(schema.person.id, id)))
      .limit(1)
    if (dup) return c.json({ ok: false, error: 'that email already belongs to a person' }, 409)
  }
  await db
    .update(schema.person)
    .set({
      displayName: body.displayName.trim(),
      email,
      phone: body.phone?.trim() || null,
      gender: body.gender?.trim() || null,
      isAdmin: !!body.isAdmin,
      portfolio: body.portfolio?.trim() || null,
      notes: body.notes?.trim() || null,
    })
    .where(eq(schema.person.id, id))
  return c.json(ok({ id }))
})

adminRoutes.delete('/people/:id', async (c) => {
  const id = c.req.param('id')
  if (id === c.get('adminPersonId'))
    return c.json({ ok: false, error: 'you cannot delete yourself' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const [p] = await db.select({ id: schema.person.id }).from(schema.person).where(eq(schema.person.id, id)).limit(1)
  if (!p) return c.json({ ok: false, error: 'person not found' }, 404)
  await db.delete(schema.person).where(eq(schema.person.id, id))
  return c.json(ok({ id }))
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
