import type { AccountsSummary, ApiResult, CollectorWallet, CounterPersonInput, Me, MemberLite, PickerPerson, PujaDaysView, PujoEvent, UmaSectionId } from '@pujosamiti/shared'
import { isProxyRole, openMembershipActive } from '@pujosamiti/shared'
import { asc, eq, or } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'

import { createAuth } from '../auth'
import * as schema from '../db/schema'
import type { Env } from '../env'
import { readSheetRange } from '../lib/google'
import { deriveDaysFromNirghanto } from '../lib/pujo'
import { bhogRoutes } from './bhog'
import { ledgerRoutes } from './ledger'
import { procurementRoutes } from './procurement'
import { taskRoutes } from './tasks'
import { umaDeskRoutes } from './uma'

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data }
}

type Vars = { me: Me }

export const memberRoutes = new Hono<{ Bindings: Env; Variables: Vars }>()

/**
 * Signing in is not enough: the account's email must belong to an active
 * person whose tier isn't non_member. Enforcement lives here on the server —
 * hiding routes in the React bundle protects nothing.
 *
 * OPEN MEMBERSHIP (until 30 Oct 2026, see shared): an active person whose
 * tier is still non_member gets in as NEWSIGNIN — view-only with exactly two
 * writes: their household's headcount and their own sponsorship pledge.
 * Admin activation grants the real role instantly; un-activated people fall
 * back to 403 when the window closes.
 */
memberRoutes.use('*', async (c, next) => {
  const auth = createAuth(c.env)
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) return c.json({ ok: false, error: 'not signed in' }, 401)

  const db = drizzle(c.env.DB, { schema })
  const [p] = await db
    .select()
    .from(schema.person)
    .where(or(eq(schema.person.email, session.user.email), eq(schema.person.altEmail, session.user.email)))
    .limit(1)
  const open = openMembershipActive()
  if (!p || !p.isActive || (!open && p.tier === 'non_member'))
    return c.json({ ok: false, error: 'not a samiti member' }, 403)

  // The Uma sections this person edits — the masthead's working half.
  const seats = await db
    .select({ section: schema.umaSectionEditor.section })
    .from(schema.umaSectionEditor)
    .where(eq(schema.umaSectionEditor.personId, p.id))
  const role: Me['role'] = p.isAdmin
    ? 'admin'
    : p.isFinAdmin
      ? 'fin_admin'
      : p.tier === 'core'
        ? 'coremember'
        : p.tier === 'member'
          ? 'member'
          : 'newsignin'
  // NewSignIn is view-only except two writes — their headcount and their
  // own sponsorship pledge — enforced centrally so no individual write route
  // needs to remember it.
  const newSignInWriteOk =
    c.req.path.endsWith('/bhog/rsvp') || /\/ledger\/sponsorship\/pledges$/.test(c.req.path)
  if (role === 'newsignin' && c.req.method !== 'GET' && !newSignInWriteOk)
    return c.json(
      {
        ok: false,
        error:
          'view-only until an admin activates your membership — you can still submit your headcount and pledge a sponsorship',
      },
      403,
    )
  c.set('me', {
    id: session.user.id,
    personId: p.id,
    name: p.displayName,
    email: session.user.email,
    image: session.user.image ?? null,
    role,
    portfolio: p.portfolio,
    umaRole: p.umaRole,
    umaSections: seats.map((s) => s.section as UmaSectionId),
  })
  await next()
})

memberRoutes.get('/me', (c) => c.json(ok(c.get('me'))))

/** Light people list for owner/volunteer pickers (active members only). */
memberRoutes.get('/people', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  const rows = await db
    .select({ id: schema.person.id, name: schema.person.displayName, tier: schema.person.tier })
    .from(schema.person)
    .where(eq(schema.person.isActive, true))
    .orderBy(schema.person.displayName)
  return c.json(ok(rows as MemberLite[]))
})

/**
 * The counter picker roster (admin/fin_admin): EVERY person — members,
 * ex-members, non-members, inactive — so participation can be recorded for
 * people who never sign in. Names, tier and society only; no contact data.
 */
memberRoutes.get('/people-full', async (c) => {
  if (!isProxyRole(c.get('me').role)) return c.json({ ok: false, error: 'admins only' }, 403)
  const db = drizzle(c.env.DB, { schema })
  const rows = await db
    .select({
      id: schema.person.id,
      name: schema.person.displayName,
      tier: schema.person.tier,
      isActive: schema.person.isActive,
      society: schema.person.society,
    })
    .from(schema.person)
    .orderBy(schema.person.displayName)
  return c.json(ok(rows as PickerPerson[]))
})

/**
 * Walk-up creation at the counter (admin/fin_admin): someone new pays cash
 * during the pujo — no sign-in, no email. They join the roll as an active
 * MEMBER with origin='counter' so these rows are findable for later cleanup
 * or merging; adding their email later links their Google sign-in.
 */
memberRoutes.post('/counter-person', async (c) => {
  const me = c.get('me')
  if (!isProxyRole(me.role)) return c.json({ ok: false, error: 'admins only' }, 403)
  const body = (await c.req.json()) as CounterPersonInput
  if (!body.displayName?.trim()) return c.json({ ok: false, error: 'name is required' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const id = crypto.randomUUID()
  await db.insert(schema.person).values({
    id,
    displayName: body.displayName.trim(),
    phone: body.phone?.trim() || null,
    society: body.society?.trim() || null,
    tier: 'member',
    origin: 'counter',
    isActive: true,
    notes: `Counter entry, ${new Date().toISOString().slice(0, 10)} (by ${me.name})`,
    createdAt: new Date(),
  })
  return c.json(ok({ id }))
})

/** Same list as the public feed, but carrying the purohit's phone. */
memberRoutes.get('/events', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  const rows = await db.select().from(schema.event).orderBy(asc(schema.event.startsOn))
  return c.json(ok(rows as unknown as PujoEvent[]))
})

/** The Days of the Pujo for a year — the calendar every day-scoped feature uses. */
memberRoutes.get('/puja-days', async (c) => {
  const year = Number(c.req.query('year'))
  if (!Number.isInteger(year)) return c.json({ ok: false, error: 'year query param required' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const eventId = `durga-pujo-${year}`
  const [ev] = await db.select().from(schema.event).where(eq(schema.event.id, eventId)).limit(1)
  if (!ev) return c.json({ ok: false, error: 'no such durga pujo year' }, 404)
  const days = await db
    .select()
    .from(schema.pujaDay)
    .where(eq(schema.pujaDay.eventId, eventId))
    .orderBy(asc(schema.pujaDay.sortOrder))
  const derived = await deriveDaysFromNirghanto(db, eventId)
  const sig = (xs: { date: string; labelEn: string }[]) => xs.map((x) => `${x.date}|${x.labelEn}`).sort().join(';')
  const out: PujaDaysView = {
    finalizedOn: ev.nirghantoFinalizedOn,
    hasNirghanto: derived.length > 0,
    inSync: days.length === 0 || sig(days) === sig(derived),
    days: days as unknown as PujaDaysView['days'],
  }
  return c.json(ok(out))
})

memberRoutes.route('/tasks', taskRoutes)
memberRoutes.route('/ledger', ledgerRoutes)
memberRoutes.route('/procurement', procurementRoutes)
memberRoutes.route('/bhog', bhogRoutes)
memberRoutes.route('/uma', umaDeskRoutes)

/**
 * Accounts summary straight from the treasurers' Google Sheet.
 * Expected "Wallets" tab columns: collector | collected | deposited
 */
memberRoutes.get('/accounts/:eventId', async (c) => {
  const eventId = c.req.param('eventId') as AccountsSummary['eventId']
  const rows = await readSheetRange(c.env, 'Wallets!A2:C')
  const wallets: CollectorWallet[] = rows.map(([name, collected, deposited]) => {
    const col = Number(collected ?? 0)
    const dep = Number(deposited ?? 0)
    return { collectorName: name ?? '?', collected: col, deposited: dep, inHand: col - dep }
  })
  const expenseRows = await readSheetRange(c.env, 'Expenses!A2:B')
  const totalExpense = expenseRows.reduce((sum, r) => sum + Number(r[1] ?? 0), 0)
  const totalCollected = wallets.reduce((sum, w) => sum + w.collected, 0)
  const summary: AccountsSummary = {
    eventId,
    totalCollected,
    totalExpense,
    balance: totalCollected - totalExpense,
    wallets,
    updatedAt: new Date().toISOString(),
  }
  return c.json(ok(summary))
})
