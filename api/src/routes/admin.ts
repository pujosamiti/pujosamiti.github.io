import type {
  AdminEventInput,
  AdminTimetableInput,
  AdminFamily,
  AdminFamilyInput,
  AdminPerson,
  AdminPersonInput,
  ApiResult,
  FamilyTier,
  PujoEvent,
} from '@pujosamiti/shared'
import { EVENT_KINDS } from '@pujosamiti/shared'
import { and, desc, eq, ne } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'

import { createAuth } from '../auth'
import * as schema from '../db/schema'
import type { Env } from '../env'

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data }
}

const TIERS: FamilyTier[] = ['non_member', 'member', 'core']

type Vars = { adminPersonId: string; isAdmin: boolean }

/**
 * Samiti administration. Gate = active CORE member (or admin): core members
 * can view everything here; every mutating route additionally requires
 * is_admin via requireAdmin().
 */
export const adminRoutes = new Hono<{ Bindings: Env; Variables: Vars }>()

adminRoutes.use('*', async (c, next) => {
  const auth = createAuth(c.env)
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) return c.json({ ok: false, error: 'not signed in' }, 401)

  const db = drizzle(c.env.DB, { schema })
  const [p] = await db
    .select({ id: schema.person.id, tier: schema.person.tier, isAdmin: schema.person.isAdmin, isActive: schema.person.isActive })
    .from(schema.person)
    .where(eq(schema.person.email, session.user.email))
    .limit(1)
  if (!p || !p.isActive || (p.tier !== 'core' && !p.isAdmin))
    return c.json({ ok: false, error: 'core members only' }, 403)

  c.set('adminPersonId', p.id)
  c.set('isAdmin', p.isAdmin)
  await next()
})

/** Returns an error response for non-admins, null when allowed to write. */
function requireAdmin(c: { get: (k: 'isAdmin') => boolean; json: (b: unknown, s: number) => Response }) {
  return c.get('isAdmin') ? null : c.json({ ok: false, error: 'admins only' }, 403)
}

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
  const eligibility =
    body.eligibility === 'works_in_mgp' || body.eligibility === 'by_invitation'
      ? body.eligibility
      : ('resident' as const)
  const invited = eligibility === 'by_invitation' // invited patrons carry no location
  return {
    familyId: body.familyId || null,
    displayName: body.displayName.trim(),
    society: invited ? null : body.society?.trim() || null,
    residenceDetail: invited ? null : body.residenceDetail?.trim() || null,
    workplace: invited ? null : body.workplace?.trim() || null,
    workplaceDetail: invited ? null : body.workplaceDetail?.trim() || null,
    eligibility,
    phone: body.phone?.trim() || null,
    gender: body.gender?.trim() || null,
    isAdmin: !!body.isAdmin,
    isActive: !!body.isActive,
    portfolio: body.portfolio?.trim() || null,
    notes: body.notes?.trim() || null,
  }
}

/**
 * People list with server-side search. Core members may SEARCH across
 * personal fields (name, society, email, WhatsApp…) but receive REDACTED
 * rows — names and samiti statuses only. Admins receive everything.
 */
adminRoutes.get('/people', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  const q = (c.req.query('q') ?? '').trim().toLowerCase()
  const digits = q.replace(/\D/g, '')
  const rows = await db
    .select({ p: schema.person, familyName: schema.family.name })
    .from(schema.person)
    .leftJoin(schema.family, eq(schema.person.familyId, schema.family.id))
    .orderBy(schema.person.displayName)
  const matches = ({ p, familyName }: (typeof rows)[number]) => {
    if (!q) return true
    const haystacks = [
      p.displayName, p.email, p.society, p.workplace,
      p.residenceDetail, p.workplaceDetail, familyName, p.portfolio,
    ]
    if (haystacks.some((h) => h?.toLowerCase().includes(q))) return true
    return digits.length >= 3 && !!p.phone?.replace(/\D/g, '').includes(digits)
  }
  const isAdmin = c.get('isAdmin')
  const out = rows.filter(matches).map(({ p, familyName }) => {
    const full = toAdminPerson(p, familyName)
    if (isAdmin) return full
    // names and samiti statuses only — no personal data leaves the server
    return {
      ...full,
      email: null, phone: null, gender: null, notes: null,
      society: null, residenceDetail: null, workplace: null, workplaceDetail: null,
      familyId: null, familyName: null,
    }
  })
  return c.json(ok(out))
})

adminRoutes.post('/people', async (c) => {
  const guard = requireAdmin(c)
  if (guard) return guard
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
  const guard = requireAdmin(c)
  if (guard) return guard
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
  const guard = requireAdmin(c)
  if (guard) return guard
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
  const guard = requireAdmin(c)
  if (guard) return guard
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
  const isAdmin = c.get('isAdmin')
  const rows = await db.select().from(schema.family).orderBy(schema.family.name)
  const out: AdminFamily[] = rows.map((f) => ({
    id: f.id,
    name: f.name,
    notes: isAdmin ? f.notes : null, // notes may hold personal context
    isActive: f.isActive,
  }))
  return c.json(ok(out))
})

adminRoutes.post('/families', async (c) => {
  const guard = requireAdmin(c)
  if (guard) return guard
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
  const guard = requireAdmin(c)
  if (guard) return guard
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

// ── Events CRUD ─────────────────────────────────────────────────────────────

function eventValues(body: AdminEventInput) {
  return {
    nameBn: body.nameBn.trim(),
    nameEn: body.nameEn.trim(),
    startsOn: body.startsOn,
    endsOn: body.endsOn || body.startsOn,
    isActive: !!body.isActive,
    purohitName: body.purohitName?.trim() || null,
    purohitPhone: body.purohitPhone?.trim() || null,
  }
}

adminRoutes.get('/events', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  const rows = await db.select().from(schema.event).orderBy(desc(schema.event.startsOn))
  return c.json(ok(rows as unknown as PujoEvent[]))
})

adminRoutes.post('/events', async (c) => {
  const guard = requireAdmin(c)
  if (guard) return guard
  const body = (await c.req.json()) as AdminEventInput
  if (!EVENT_KINDS.includes(body.kind)) return c.json({ ok: false, error: 'invalid kind' }, 400)
  if (!Number.isInteger(body.year)) return c.json({ ok: false, error: 'year is required' }, 400)
  if (!body.nameBn?.trim() || !body.nameEn?.trim() || !body.startsOn)
    return c.json({ ok: false, error: 'names and start date are required' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const id = `${body.kind}-${body.year}`
  const [dup] = await db.select({ id: schema.event.id }).from(schema.event).where(eq(schema.event.id, id)).limit(1)
  if (dup) return c.json({ ok: false, error: `${id} already exists` }, 409)
  await db.insert(schema.event).values({ id, kind: body.kind, year: body.year, ...eventValues(body) })
  return c.json(ok({ id }))
})

adminRoutes.post('/events/:id', async (c) => {
  const guard = requireAdmin(c)
  if (guard) return guard
  const body = (await c.req.json()) as AdminEventInput
  if (!body.nameBn?.trim() || !body.nameEn?.trim() || !body.startsOn)
    return c.json({ ok: false, error: 'names and start date are required' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const id = c.req.param('id')
  const [ev] = await db.select({ id: schema.event.id }).from(schema.event).where(eq(schema.event.id, id)).limit(1)
  if (!ev) return c.json({ ok: false, error: 'event not found' }, 404)
  // kind and year are immutable — they form the id other tables reference
  await db.update(schema.event).set(eventValues(body)).where(eq(schema.event.id, id))
  return c.json(ok({ id }))
})

adminRoutes.delete('/events/:id', async (c) => {
  const guard = requireAdmin(c)
  if (guard) return guard
  const db = drizzle(c.env.DB, { schema })
  const id = c.req.param('id')
  const [ev] = await db.select({ id: schema.event.id }).from(schema.event).where(eq(schema.event.id, id)).limit(1)
  if (!ev) return c.json({ ok: false, error: 'event not found' }, 404)
  try {
    await db.delete(schema.event).where(eq(schema.event.id, id))
  } catch {
    return c.json(
      { ok: false, error: 'this event is referenced by notices/timetable/gallery or other records — remove those first' },
      409,
    )
  }
  return c.json(ok({ id }))
})

// ── Nirghanto (timetable) CRUD — Durga Pujo only ────────────────────────────

function timetableValues(body: AdminTimetableInput) {
  return {
    dayDate: body.dayDate,
    dayLabelBn: body.dayLabelBn.trim(),
    dayLabelEn: body.dayLabelEn.trim(),
    titleBn: body.titleBn.trim(),
    titleEn: body.titleEn.trim(),
    timeFrom: body.timeFrom || null,
    timeTo: body.timeTo || null,
    comments: body.comments?.trim() || null,
    sortOrder: Number.isFinite(body.sortOrder) ? Math.trunc(body.sortOrder) : 0,
  }
}

adminRoutes.post('/timetable', async (c) => {
  const guard = requireAdmin(c)
  if (guard) return guard
  const body = (await c.req.json()) as AdminTimetableInput
  if (!body.eventId || !body.dayDate || !body.dayLabelBn?.trim() || !body.dayLabelEn?.trim() || !body.titleBn?.trim() || !body.titleEn?.trim())
    return c.json({ ok: false, error: 'day, labels and ritual names are required' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const [ev] = await db.select({ kind: schema.event.kind }).from(schema.event).where(eq(schema.event.id, body.eventId)).limit(1)
  if (!ev) return c.json({ ok: false, error: 'event not found' }, 404)
  if (ev.kind !== 'durga-pujo')
    return c.json({ ok: false, error: 'time tables are published for Durga Pujo only' }, 400)
  const id = crypto.randomUUID()
  await db.insert(schema.timetableEntry).values({ id, eventId: body.eventId, ...timetableValues(body) })
  return c.json(ok({ id }))
})

adminRoutes.post('/timetable/:id', async (c) => {
  const guard = requireAdmin(c)
  if (guard) return guard
  const body = (await c.req.json()) as AdminTimetableInput
  if (!body.dayDate || !body.dayLabelBn?.trim() || !body.dayLabelEn?.trim() || !body.titleBn?.trim() || !body.titleEn?.trim())
    return c.json({ ok: false, error: 'day, labels and ritual names are required' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const id = c.req.param('id')
  const [t] = await db.select({ id: schema.timetableEntry.id }).from(schema.timetableEntry).where(eq(schema.timetableEntry.id, id)).limit(1)
  if (!t) return c.json({ ok: false, error: 'entry not found' }, 404)
  await db.update(schema.timetableEntry).set(timetableValues(body)).where(eq(schema.timetableEntry.id, id))
  return c.json(ok({ id }))
})

adminRoutes.delete('/timetable/:id', async (c) => {
  const guard = requireAdmin(c)
  if (guard) return guard
  const db = drizzle(c.env.DB, { schema })
  const id = c.req.param('id')
  await db.delete(schema.timetableEntry).where(eq(schema.timetableEntry.id, id))
  return c.json(ok({ id }))
})
