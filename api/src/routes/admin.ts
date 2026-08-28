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
import { desc, eq, or } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'

import { createAuth } from '../auth'
import * as schema from '../db/schema'
import type { Env } from '../env'
import { deriveDaysFromNirghanto } from '../lib/pujo'

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
    .where(or(eq(schema.person.email, session.user.email), eq(schema.person.altEmail, session.user.email)))
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
    altEmail: p.altEmail,
    society: p.society,
    residenceDetail: p.residenceDetail,
    workplace: p.workplace,
    workplaceDetail: p.workplaceDetail,
    eligibility: p.eligibility,
    tier: p.tier,
    phone: p.phone,
    gender: p.gender,
    isAdmin: p.isAdmin,
    isFinAdmin: p.isFinAdmin,
    isActive: p.isActive,
    portfolio: p.portfolio,
    notes: p.notes,
    origin: p.origin,
    createdAt: p.createdAt.getTime(),
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
    isFinAdmin: !!body.isFinAdmin,
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

/**
 * An address identifies exactly one person, whichever column it sits in — so a
 * new email must clash with neither the primary nor the alternate of anyone else.
 */
async function emailClash(
  db: ReturnType<typeof drizzle<typeof schema>>,
  addresses: (string | null)[],
  excludeId?: string,
) {
  const wanted = addresses.filter(Boolean) as string[]
  if (!wanted.length) return null
  if (new Set(wanted).size !== wanted.length) return 'the two addresses must differ'
  const rows = await db
    .select({ id: schema.person.id, email: schema.person.email, altEmail: schema.person.altEmail })
    .from(schema.person)
  const hit = rows.find(
    (r) => r.id !== excludeId && wanted.some((w) => r.email === w || r.altEmail === w),
  )
  return hit ? 'that email already belongs to a person' : null
}

adminRoutes.post('/people', async (c) => {
  const guard = requireAdmin(c)
  if (guard) return guard
  const body = (await c.req.json()) as AdminPersonInput
  if (!body.displayName?.trim()) return c.json({ ok: false, error: 'name is required' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const email = body.email?.trim() || null
  const altEmail = body.altEmail?.trim() || null
  const clash = await emailClash(db, [email, altEmail])
  if (clash) return c.json({ ok: false, error: clash }, 409)
  const id = crypto.randomUUID()
  await db.insert(schema.person).values({ id, email, altEmail, createdAt: new Date(), ...personValues(body) })
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
  const altEmail = body.altEmail?.trim() || null
  const clash = await emailClash(db, [email, altEmail], id)
  if (clash) return c.json({ ok: false, error: clash }, 409)
  await db.update(schema.person).set({ email, altEmail, ...personValues(body) }).where(eq(schema.person.id, id))
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

/**
 * Merge one person into another (admin). The :id record SURVIVES and keeps
 * its id (foreign keys like task assignments may already point at it); the
 * source record's profile data overrides the survivor's, task assignments
 * are repointed, statuses keep the stronger value, then the source is
 * deleted.
 */
adminRoutes.post('/people/:id/merge', async (c) => {
  const guard = requireAdmin(c)
  if (guard) return guard
  const { sourceId } = (await c.req.json()) as { sourceId: string }
  const id = c.req.param('id')
  if (!sourceId || sourceId === id) return c.json({ ok: false, error: 'pick a different person to merge' }, 400)

  const db = drizzle(c.env.DB, { schema })
  const [a] = await db.select().from(schema.person).where(eq(schema.person.id, id)).limit(1)
  const [b] = await db.select().from(schema.person).where(eq(schema.person.id, sourceId)).limit(1)
  if (!a || !b) return c.json({ ok: false, error: 'person not found' }, 404)

  /**
   * The OLDER record always survives, whichever way round the admin picked
   * them. The old record is the one the samiti's history hangs off — ledger
   * entries, pledges, task assignments, a stable id — while the newer one is
   * almost always a fresh self-registration carrying just a name and an email.
   * Keeping the older row means a mis-clicked direction can't strand history
   * on a deleted id; the newer details still win, below.
   */
  const [survivor, src] = a.createdAt <= b.createdAt ? [a, b] : [b, a]
  if (src.id === c.get('adminPersonId'))
    return c.json({ ok: false, error: 'you cannot merge yourself away' }, 400)

  // Repoint the source's task assignments; drop those that would duplicate
  const srcAssignments = await db.select().from(schema.taskAssignment).where(eq(schema.taskAssignment.personId, src.id))
  const survivorAssignments = await db
    .select()
    .from(schema.taskAssignment)
    .where(eq(schema.taskAssignment.personId, survivor.id))
  for (const asg of srcAssignments) {
    const clash = survivorAssignments.some((k) => k.taskId === asg.taskId && k.year === asg.year)
    if (clash) await db.delete(schema.taskAssignment).where(eq(schema.taskAssignment.id, asg.id))
    else await db.update(schema.taskAssignment).set({ personId: survivor.id }).where(eq(schema.taskAssignment.id, asg.id))
  }

  // Everything else that names the absorbed person must follow them over, or
  // the delete below fails on a foreign key. A transfer between the two
  // records becomes a self-transfer (nets to zero) and is left as it is.
  const to = survivor.id
  const from = src.id
  await db.update(schema.ledgerEntry).set({ personId: to }).where(eq(schema.ledgerEntry.personId, from))
  await db.update(schema.ledgerEntry).set({ walletPersonId: to }).where(eq(schema.ledgerEntry.walletPersonId, from))
  await db.update(schema.ledgerEntry).set({ toWalletPersonId: to }).where(eq(schema.ledgerEntry.toWalletPersonId, from))
  await db.update(schema.ledgerEntry).set({ createdBy: to }).where(eq(schema.ledgerEntry.createdBy, from))
  await db.update(schema.sponsorshipPledge).set({ personId: to }).where(eq(schema.sponsorshipPledge.personId, from))
  await db.update(schema.expenseReimbursement).set({ personId: to }).where(eq(schema.expenseReimbursement.personId, from))
  await db.update(schema.expenseReimbursement).set({ assignedTo: to }).where(eq(schema.expenseReimbursement.assignedTo, from))
  await db.update(schema.expenseReimbursement).set({ settledBy: to }).where(eq(schema.expenseReimbursement.settledBy, from))

  // Delete the source first so its unique email is free for the survivor
  await db.delete(schema.person).where(eq(schema.person.id, src.id))

  const tierRank = { non_member: 0, member: 1, core: 2 } as const
  const notes =
    src.notes && src.notes !== survivor.notes
      ? survivor.notes
        ? `${survivor.notes} | ${src.notes}`
        : src.notes
      : survivor.notes
  const addresses = [...new Set([src.email, survivor.email, src.altEmail, survivor.altEmail].filter(Boolean))] as string[]
  await db
    .update(schema.person)
    .set({
      // latest (source) info overrides; nulls never erase known values
      displayName: src.displayName,
      // Both sign-in addresses survive the merge — that is the point of altEmail.
      email: addresses[0] ?? null,
      altEmail: addresses[1] ?? null,
      society: src.society ?? survivor.society,
      residenceDetail: src.residenceDetail ?? survivor.residenceDetail,
      workplace: src.workplace ?? survivor.workplace,
      workplaceDetail: src.workplaceDetail ?? survivor.workplaceDetail,
      eligibility: src.eligibility,
      phone: src.phone ?? survivor.phone,
      gender: src.gender ?? survivor.gender,
      familyId: src.familyId ?? survivor.familyId,
      portfolio: src.portfolio ?? survivor.portfolio,
      notes,
      tier: tierRank[src.tier] > tierRank[survivor.tier] ? src.tier : survivor.tier,
      isAdmin: survivor.isAdmin || src.isAdmin,
      isFinAdmin: survivor.isFinAdmin || src.isFinAdmin,
      isActive: survivor.isActive || src.isActive,
    })
    .where(eq(schema.person.id, survivor.id))
  return c.json(ok({ id: survivor.id, merged: src.id }))
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
    notes: body.notes?.trim() || null,
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
      { ok: false, error: 'this event is referenced by the timetable, ledger or other records — remove those first' },
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
    alertNote: body.alertNote?.trim() || null,
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

/**
 * Declare the year's nirghanto published & final (or reopen it). Finalisation
 * is the gate for seeding Puja Days — and everything downstream of them.
 */
adminRoutes.post('/events/:id/nirghanto-finalize', async (c) => {
  const deny = requireAdmin(c)
  if (deny) return deny
  const { finalized } = (await c.req.json()) as { finalized: boolean }
  const db = drizzle(c.env.DB, { schema })
  const id = c.req.param('id')
  const [ev] = await db.select().from(schema.event).where(eq(schema.event.id, id)).limit(1)
  if (!ev) return c.json({ ok: false, error: 'event not found' }, 404)
  if (finalized) {
    const derived = await deriveDaysFromNirghanto(db, id)
    if (derived.length === 0)
      return c.json({ ok: false, error: 'no nirghanto days to finalise — build the timetable first' }, 400)
  }
  const on = finalized ? new Date().toISOString().slice(0, 10) : null
  await db.update(schema.event).set({ nirghantoFinalizedOn: on }).where(eq(schema.event.id, id))
  return c.json({ ok: true, data: { id, nirghantoFinalizedOn: on } })
})

/** Create the Puja Days from the finalised nirghanto (admin; once per event). */
adminRoutes.post('/events/:id/seed-puja-days', async (c) => {
  const deny = requireAdmin(c)
  if (deny) return deny
  const db = drizzle(c.env.DB, { schema })
  const id = c.req.param('id')
  const [ev] = await db.select().from(schema.event).where(eq(schema.event.id, id)).limit(1)
  if (!ev) return c.json({ ok: false, error: 'event not found' }, 404)
  if (!ev.nirghantoFinalizedOn)
    return c.json({ ok: false, error: 'finalise the nirghanto first — Puja Days seed from it' }, 400)
  const existing = await db.select({ id: schema.pujaDay.id }).from(schema.pujaDay).where(eq(schema.pujaDay.eventId, id))
  if (existing.length > 0)
    return c.json({ ok: false, error: 'Puja Days already exist — use re-sync to update them' }, 400)
  const derived = await deriveDaysFromNirghanto(db, id)
  for (const d of derived) {
    await db.insert(schema.pujaDay).values({ id: crypto.randomUUID(), eventId: id, ...d })
  }
  return c.json({ ok: true, data: { created: derived.length } })
})

/**
 * Re-align Puja Days after the nirghanto changed (admin): matched days (by
 * label) get their date/source refreshed, new days are added; days no longer
 * in the nirghanto are kept but flagged in the response — deleting data that
 * features may reference is a human decision.
 */
adminRoutes.post('/events/:id/resync-puja-days', async (c) => {
  const deny = requireAdmin(c)
  if (deny) return deny
  const db = drizzle(c.env.DB, { schema })
  const id = c.req.param('id')
  const [ev] = await db.select().from(schema.event).where(eq(schema.event.id, id)).limit(1)
  if (!ev) return c.json({ ok: false, error: 'event not found' }, 404)
  if (!ev.nirghantoFinalizedOn)
    return c.json({ ok: false, error: 'finalise the nirghanto first' }, 400)
  const derived = await deriveDaysFromNirghanto(db, id)
  const existing = await db.select().from(schema.pujaDay).where(eq(schema.pujaDay.eventId, id))
  let updated = 0
  let created = 0
  const matchedIds = new Set<string>()
  for (const d of derived) {
    const m = existing.find((x) => x.labelEn === d.labelEn && !matchedIds.has(x.id))
    if (m) {
      matchedIds.add(m.id)
      if (m.date !== d.date || m.sourceLabel !== d.sourceLabel || m.sortOrder !== d.sortOrder) {
        await db
          .update(schema.pujaDay)
          .set({ date: d.date, labelBn: d.labelBn, sourceLabel: d.sourceLabel, sortOrder: d.sortOrder })
          .where(eq(schema.pujaDay.id, m.id))
        updated++
      }
    } else {
      await db.insert(schema.pujaDay).values({ id: crypto.randomUUID(), eventId: id, ...d })
      created++
    }
  }
  const orphaned = existing.filter((x) => !matchedIds.has(x.id)).map((x) => x.labelEn)
  return c.json({ ok: true, data: { updated, created, orphaned } })
})
