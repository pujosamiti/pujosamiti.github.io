import type {
  ApiResult,
  BhogCountSheet,
  BhogDayInput,
  BhogHousehold,
  BhogItemsInput,
  BhogLinkInfo,
  GuestBhogReceiveInput,
  BhogMenuView,
  BhogRsvpInput,
  Me,
} from '@pujosamiti/shared'
import { GUEST_BHOG_SUBCATEGORY, bhogAllowance, bhogFits, isCoreRole, isProxyRole } from '@pujosamiti/shared'
import { and, asc, eq, inArray, isNull } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'

import * as schema from '../db/schema'
import type { Env } from '../env'
import { currentSeason, seasonOf, tithiOf } from '../lib/pujo'
import { bhogSettingOf, guestBoard, headcountView, newCode, responsesList, saveHeadcount } from '../lib/headcount'
import { contactOf, householdTotal, loadHouseholds } from '../lib/households'
import { seasonMoney } from '../lib/roll'

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data }
}

/**
 * Bhog & food menus — one menu per calendar DATE per EVENT, five occasions a
 * season (1 Jul → 30 Jun): multi-day Durga Pujo bhog (admin-seeded from the
 * finalised Puja Days), single-meal Kojagari/Saraswati bhog and Bijoya
 * Sammelani/Poila Baishakh food menus. Mounted under the member gate
 * (/api/members/bhog). Every member reads PUBLISHED days; drafts and all
 * writes are core work, and only the CURRENT season is writable — past
 * seasons stay as the record of what was served.
 */
export const bhogRoutes = new Hono<{ Bindings: Env; Variables: { me: Me } }>()

const canEdit = (me: Me) => isCoreRole(me.role)

type DB = ReturnType<typeof drizzle<typeof schema>>

async function loadEvent(db: DB, id: string) {
  const [e] = await db.select().from(schema.event).where(eq(schema.event.id, id)).limit(1)
  return e
}

/** Core member + current-season check shared by every write. */
function seasonWriteDenied(me: Me, ev: { startsOn: string } | undefined): [403 | 400, string] | null {
  if (!canEdit(me)) return [403, 'core members only']
  if (!ev) return [400, 'event not found']
  if (seasonOf(ev.startsOn) !== currentSeason())
    return [400, 'past seasons are archival — menus change only for the current season']
  return null
}

bhogRoutes.get('/', async (c) => {
  const season = Number(c.req.query('season'))
  if (!Number.isInteger(season)) return c.json({ ok: false, error: 'season query param required' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const me = c.get('me')
  const events = (await db.select().from(schema.event)).filter((e) => seasonOf(e.startsOn) === season)
  if (events.length === 0) return c.json(ok([] as BhogMenuView[]))
  const days = await db
    .select()
    .from(schema.bhogMenu)
    .where(inArray(schema.bhogMenu.eventId, events.map((e) => e.id)))
    .orderBy(asc(schema.bhogMenu.date), asc(schema.bhogMenu.sortOrder))
  const visible = canEdit(me) ? days : days.filter((d) => d.isPublished)
  const items = visible.length
    ? await db
        .select()
        .from(schema.bhogMenuItem)
        .where(inArray(schema.bhogMenuItem.menuId, visible.map((d) => d.id)))
        .orderBy(asc(schema.bhogMenuItem.sortOrder))
    : []
  const rsvps = visible.length
    ? await db
        .select()
        .from(schema.bhogRsvp)
        .where(inArray(schema.bhogRsvp.menuId, visible.map((d) => d.id)))
    : []
  // "Your count" is the household's: a family answers once, whoever answered.
  const { keyOf } = await loadHouseholds(db)
  const myKey = keyOf.get(me.personId) ?? me.personId
  const view: BhogMenuView[] = visible.map((d) => {
    const dayRsvps = rsvps.filter((r) => r.menuId === d.id)
    const mine = dayRsvps.filter((r) => (keyOf.get(r.personId) ?? r.personId) === myKey)
    return {
      id: d.id,
      eventId: d.eventId as BhogMenuView['eventId'],
      pujaDayId: d.pujaDayId,
      date: d.date,
      label: d.label,
      labelBn: d.labelBn,
      perPlateCost: d.perPlateCost,
      notes: d.notes,
      isPublished: d.isPublished,
      sortOrder: d.sortOrder,
      items: items
        .filter((i) => i.menuId === d.id)
        .map((i) => ({ id: i.id, title: i.title, titleBn: i.titleBn, sortOrder: i.sortOrder })),
      myCount: mine.length ? mine.reduce((s, r) => s + r.count, 0) : null,
      totalCount: dayRsvps.reduce((s, r) => s + r.count, 0),
      responses: new Set(dayRsvps.map((r) => keyOf.get(r.personId) ?? r.personId)).size,
    }
  })
  return c.json(ok(view))
})

/**
 * The household a headcount request is about: the member's own, or — for
 * admin/fin_admin recording at the counter — the household they picked from
 * the Responses list (`householdKey`, saved against its contact), or the
 * household of the person they picked (`personId`, the walk-in case).
 */
async function targetHousehold(
  db: DB,
  me: Me,
  personId: string | null | undefined,
  householdKey?: string | null,
  ev?: { startsOn: string },
) {
  const { byKey, keyOf } = await loadHouseholds(db)
  if (householdKey) {
    if (!isProxyRole(me.role)) return { error: 'only admins record counts for someone else', status: 403 as const }
    const h = byKey.get(householdKey)
    if (!h) return { error: 'household not found', status: 404 as const }
    const money = ev ? await seasonMoney(db, seasonOf(ev.startsOn)) : new Map<string, number>()
    return { household: h, personId: contactOf(h, money).id }
  }
  const id = personId && personId !== me.personId ? personId : me.personId
  if (id !== me.personId && !isProxyRole(me.role))
    return { error: 'only admins record counts for someone else', status: 403 as const }
  const key = keyOf.get(id)
  if (!key) return { error: 'person not found', status: 404 as const }
  return { household: byKey.get(key)!, personId: id }
}

/** A household's headcount form for one event: its days, counts, allowance and which days are still open. */
bhogRoutes.get('/headcount', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  const ev = await loadEvent(db, c.req.query('eventId') ?? '')
  if (!ev) return c.json({ ok: false, error: 'event not found' }, 404)
  const t = await targetHousehold(db, c.get('me'), c.req.query('personId'), c.req.query('householdKey'), ev)
  if ('error' in t) return c.json({ ok: false, error: t.error }, t.status)
  return c.json(ok(await headcountView(db, ev, t.household)))
})

/**
 * Headcount: a member gives their household's counts for an event's
 * PUBLISHED days — Durga Puja in one go, single-meal events as one row. 0 is
 * a valid answer; resubmitting updates. Durga Pujo holds the household to its
 * allowance and closes each day four days before it (lib/headcount); an admin
 * or fin_admin recording for someone may still change a closed day.
 */
bhogRoutes.post('/rsvp', async (c) => {
  const body = (await c.req.json()) as BhogRsvpInput
  const me = c.get('me')
  const db = drizzle(c.env.DB, { schema })
  const ev = await loadEvent(db, body.eventId ?? '')
  if (!ev) return c.json({ ok: false, error: 'event not found' }, 404)
  const t = await targetHousehold(db, me, body.personId, body.householdKey, ev)
  if ('error' in t) return c.json({ ok: false, error: t.error }, t.status)
  const proxy = isProxyRole(me.role)
  const result = await saveHeadcount(db, {
    ev,
    household: t.household,
    writerId: t.personId,
    counts: body.counts ?? [],
    note: proxy ? body.note?.trim() || null : null,
    atCounter: proxy,
  })
  if (!result.ok) return c.json({ ok: false, error: result.error }, result.status)
  return c.json(ok({ saved: result.saved }))
})

/**
 * The household-by-household count sheet for one event (core): the
 * Responses list (lib/headcount responsesList — the same households, in the
 * same order, as the link's picker), answered or not. A family's answers are
 * the sum of its people's rows. Durga Pujo households whose counts are over
 * their allowance (a pledge cancelled after they answered) are flagged.
 */
bhogRoutes.get('/counts', async (c) => {
  const me = c.get('me')
  if (!canEdit(me)) return c.json({ ok: false, error: 'core members only' }, 403)
  const db = drizzle(c.env.DB, { schema })
  const ev = await loadEvent(db, c.req.query('eventId') ?? '')
  if (!ev) return c.json({ ok: false, error: 'event not found' }, 404)
  const { menus, rsvps, listed, keyOf, money } = await responsesList(db, ev)
  const households: BhogHousehold[] = listed.map((h) => {
    const counts = menus.map((m) =>
      rsvps.filter((r) => r.menuId === m.id && keyOf.get(r.personId) === h.key).reduce((s, r) => s + r.count, 0),
    )
    const allowance = ev.kind === 'durga-pujo' ? bhogAllowance(householdTotal(h, money)) : null
    return { key: h.key, name: h.name, tier: h.tier, overAllowance: !!allowance && !bhogFits(allowance, counts) }
  })
  const names = new Map(listed.flatMap((h) => h.people.map((p) => [p.id, p.name] as const)))
  const sheet: BhogCountSheet = {
    households,
    rows: rsvps.map((r) => ({
      personId: r.personId,
      name: names.get(r.personId) ?? '',
      householdKey: keyOf.get(r.personId) ?? r.personId,
      menuId: r.menuId,
      count: r.count,
      guests: r.guests,
      notes: r.notes,
    })),
  }
  return c.json(ok(sheet))
})

// ── Guest bhog (admin / fin_admin) ──────────────────────────────────────────

/**
 * The guest bhog board: settings (in-charge, rate), and every household with
 * guests or guest money — due, received (from the ledger), balance. Also what
 * the ledger form's "Guest bhog payment" toggle picks a household from.
 */
bhogRoutes.get('/guests', async (c) => {
  if (!isProxyRole(c.get('me').role)) return c.json({ ok: false, error: 'admins only' }, 403)
  const db = drizzle(c.env.DB, { schema })
  const ev = await loadEvent(db, c.req.query('eventId') ?? '')
  if (!ev) return c.json({ ok: false, error: 'event not found' }, 404)
  if (ev.kind !== 'durga-pujo') return c.json({ ok: false, error: 'guest bhog is for Durga Pujo' }, 400)
  return c.json(ok(await guestBoard(db, ev)))
})

/**
 * Set the event's Food & Bhog in-charge and guest rate (₹ per head; null
 * turns guest bhog off). Current season only.
 */
bhogRoutes.post('/setting', async (c) => {
  const me = c.get('me')
  if (!isProxyRole(me.role)) return c.json({ ok: false, error: 'admins only' }, 403)
  const body = (await c.req.json()) as { eventId: string; inchargePersonId: string | null; guestRate: number | null }
  const db = drizzle(c.env.DB, { schema })
  const ev = await loadEvent(db, body.eventId ?? '')
  if (!ev) return c.json({ ok: false, error: 'event not found' }, 404)
  if (ev.kind !== 'durga-pujo') return c.json({ ok: false, error: 'guest bhog is for Durga Pujo' }, 400)
  if (seasonOf(ev.startsOn) !== currentSeason())
    return c.json({ ok: false, error: 'settings change only for the current season' }, 400)
  const rate = body.guestRate == null ? null : Number(body.guestRate)
  if (rate != null && (!Number.isInteger(rate) || rate <= 0 || rate > 10000))
    return c.json({ ok: false, error: 'the guest rate is whole rupees per head' }, 400)
  if (body.inchargePersonId) {
    const [p] = await db.select({ id: schema.person.id }).from(schema.person).where(eq(schema.person.id, body.inchargePersonId)).limit(1)
    if (!p) return c.json({ ok: false, error: 'person not found' }, 404)
  }
  const values = { inchargePersonId: body.inchargePersonId || null, guestRate: rate, updatedBy: me.personId, updatedAt: new Date() }
  await db
    .insert(schema.bhogSetting)
    .values({ eventId: ev.id, ...values })
    .onConflictDoUpdate({ target: schema.bhogSetting.eventId, set: values })
  return c.json(ok(await bhogSettingOf(db, ev.id)))
})

/**
 * Guest bhog received: a ledger entry — contribution · misc_income · Guest
 * Bhog, tagged to the event, paid by the household's contact, into the
 * receiver's wallet — exactly what the ledger form's toggle writes. The board
 * reads received money back from the ledger, so there is nothing else to keep.
 */
bhogRoutes.post('/guests/receive', async (c) => {
  const me = c.get('me')
  if (!isProxyRole(me.role)) return c.json({ ok: false, error: 'finance admins only' }, 403)
  const body = (await c.req.json()) as GuestBhogReceiveInput
  const db = drizzle(c.env.DB, { schema })
  const ev = await loadEvent(db, body.eventId ?? '')
  if (!ev) return c.json({ ok: false, error: 'event not found' }, 404)
  if (ev.kind !== 'durga-pujo') return c.json({ ok: false, error: 'guest bhog is for Durga Pujo' }, 400)
  if (seasonOf(ev.startsOn) !== currentSeason())
    return c.json({ ok: false, error: 'past seasons are archival' }, 400)
  const amount = Number(body.amount)
  if (!Number.isInteger(amount) || amount <= 0) return c.json({ ok: false, error: 'amount must be whole rupees above 0' }, 400)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.entryDate ?? '')) return c.json({ ok: false, error: 'date must be YYYY-MM-DD' }, 400)
  if (!body.walletPersonId) return c.json({ ok: false, error: 'who received it?' }, 400)
  // Counter guests first: they are validated (the 20-a-day cap; the cut-off
  // doesn't bind an admin at the counter) and saved before any money is
  // written, so a refused count never leaves a payment behind.
  const addGuests = Number(body.guests ?? 0)
  if (!Number.isInteger(addGuests) || addGuests < 0) return c.json({ ok: false, error: 'guests must be a whole number' }, 400)
  let board = await guestBoard(db, ev)
  const eligible = board.eligible.find((e) => e.householdKey === body.householdKey)
  if (addGuests > 0) {
    if (!eligible) return c.json({ ok: false, error: 'guest bhog is for core households — ₹10,000 or more this season' }, 400)
    const day = board.days.find((d) => d.menuId === body.menuId)
    if (!day) return c.json({ ok: false, error: 'pick the bhog day the guests ate' }, 400)
    const { byKey } = await loadHouseholds(db)
    const h = byKey.get(body.householdKey)!
    const view = await headcountView(db, ev, h)
    const today = view.days.find((d) => d.menuId === day.menuId)!
    const saved = await saveHeadcount(db, {
      ev,
      household: h,
      writerId: eligible.contactPersonId,
      counts: [{ menuId: day.menuId, count: today.count ?? 0, guests: today.guests + addGuests }],
      note: null,
      atCounter: true,
    })
    if (!saved.ok) return c.json({ ok: false, error: saved.error }, saved.status)
    board = await guestBoard(db, ev)
  }
  const row = board.rows.find((r) => r.householdKey === body.householdKey)
  if (!row && !eligible) return c.json({ ok: false, error: 'that household has no guest bhog on record' }, 400)
  const name = row?.name ?? eligible!.name
  const heads = row?.heads ?? 0
  const days = row
    ? board.days
        .map((d, i) => (row.guestsByDay[i] ? `${d.label.replace(/\s+Bhog$/i, '')} ${row.guestsByDay[i]}` : null))
        .filter(Boolean)
        .join(', ')
    : ''
  const counter = addGuests > 0 ? ` · ${addGuests} at the counter` : ''
  const remark = body.note?.trim() ? ` · ${body.note.trim()}` : ''
  const id = crypto.randomUUID()
  await db.insert(schema.ledgerEntry).values({
    id,
    bookId: 'pujo-ledger',
    eventId: ev.id,
    entryDate: body.entryDate,
    kind: 'contribution',
    category: 'misc_income',
    subCategory: GUEST_BHOG_SUBCATEGORY,
    amount,
    personId: row?.contactPersonId ?? eligible!.contactPersonId,
    walletPersonId: body.walletPersonId,
    notes: `Guest bhog · ${name} · ${heads} head${heads === 1 ? '' : 's'}${days ? ` (${days})` : ''}${counter}${remark}`,
    createdBy: me.personId,
    createdAt: new Date(),
  })
  return c.json(ok({ id }))
})

// ── The headcount link (admin / fin_admin) ──────────────────────────────────

/** A fresh code no live or revoked link has used — collisions are rare, but checked. */
async function uniqueCode(db: DB): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const code = newCode()
    const [taken] = await db
      .select({ id: schema.bhogLink.id })
      .from(schema.bhogLink)
      .where(eq(schema.bhogLink.code, code))
      .limit(1)
    if (!taken) return code
  }
  throw new Error('could not find a free code')
}

const liveLink = async (db: DB, eventId: string) =>
  (
    await db
      .select()
      .from(schema.bhogLink)
      .where(and(eq(schema.bhogLink.eventId, eventId), isNull(schema.bhogLink.revokedAt)))
      .limit(1)
  )[0]

/**
 * The event's live link, null until one is issued. The code opens every
 * paying household's counts, so only admin and fin_admin see it.
 */
bhogRoutes.get('/link', async (c) => {
  if (!isProxyRole(c.get('me').role)) return c.json({ ok: false, error: 'admins only' }, 403)
  const db = drizzle(c.env.DB, { schema })
  const link = await liveLink(db, c.req.query('eventId') ?? '')
  return c.json(ok(link ? ({ code: link.code, createdAt: link.createdAt.getTime() } satisfies BhogLinkInfo) : null))
})

/**
 * Issue the event's link — Durga Pujo, current season. With a live one
 * already out, `replace` revokes it first (a link that went astray); without
 * it, the live one is returned unchanged.
 */
bhogRoutes.post('/link', async (c) => {
  const me = c.get('me')
  if (!isProxyRole(me.role)) return c.json({ ok: false, error: 'admins only' }, 403)
  const body = (await c.req.json()) as { eventId: string; replace?: boolean }
  const db = drizzle(c.env.DB, { schema })
  const ev = await loadEvent(db, body.eventId ?? '')
  if (!ev) return c.json({ ok: false, error: 'event not found' }, 404)
  if (ev.kind !== 'durga-pujo') return c.json({ ok: false, error: 'the headcount link is for Durga Pujo' }, 400)
  if (seasonOf(ev.startsOn) !== currentSeason())
    return c.json({ ok: false, error: 'links are issued only for the current season' }, 400)
  const live = await liveLink(db, ev.id)
  if (live && !body.replace) return c.json(ok({ code: live.code, createdAt: live.createdAt.getTime() } satisfies BhogLinkInfo))
  const now = new Date()
  if (live) await db.update(schema.bhogLink).set({ revokedAt: now }).where(eq(schema.bhogLink.id, live.id))
  const code = await uniqueCode(db)
  await db.insert(schema.bhogLink).values({ id: crypto.randomUUID(), eventId: ev.id, code, createdBy: me.personId, createdAt: now })
  return c.json(ok({ code, createdAt: now.getTime() } satisfies BhogLinkInfo))
})

/** Tithis that get bhog by default — Devi Baran and Bodhon days don't. */
const BHOG_TITHIS = ['Saptami', 'Ashtami', 'Nabami', 'Dashami']

/**
 * ADMIN: create a Durga Pujo event's bhog days from its Puja Days, one per
 * calendar date — tithis sharing a date share one lunch ("Saptami / Ashtami
 * Bhog"). Single-meal events don't seed; core members add their one menu.
 * NOTE: registered before /days/:id so the param route can't swallow it.
 */
bhogRoutes.post('/days/seed', async (c) => {
  const me = c.get('me')
  if (me.role !== 'admin') return c.json({ ok: false, error: 'admins only' }, 403)
  const { eventId } = (await c.req.json()) as { eventId: string }
  const db = drizzle(c.env.DB, { schema })
  const ev = await loadEvent(db, eventId ?? '')
  if (!ev) return c.json({ ok: false, error: 'event not found' }, 404)
  if (ev.kind !== 'durga-pujo')
    return c.json({ ok: false, error: 'only Durga Pujo seeds from Puja Days — add the single menu directly' }, 400)
  if (seasonOf(ev.startsOn) !== currentSeason())
    return c.json({ ok: false, error: 'bhog days seed only for the current season' }, 400)
  const existing = await db
    .select({ id: schema.bhogMenu.id })
    .from(schema.bhogMenu)
    .where(eq(schema.bhogMenu.eventId, ev.id))
  if (existing.length > 0)
    return c.json({ ok: false, error: 'bhog days already exist — remove them first to reseed' }, 400)
  const pujaDays = await db
    .select()
    .from(schema.pujaDay)
    .where(eq(schema.pujaDay.eventId, ev.id))
    .orderBy(asc(schema.pujaDay.sortOrder))
  const bhogDays = pujaDays.filter((pd) => BHOG_TITHIS.includes(tithiOf(pd.labelEn) ?? ''))
  if (bhogDays.length === 0)
    return c.json(
      { ok: false, error: 'no Puja Days yet — finalise the nirghanto and seed Puja Days first' },
      400,
    )
  // Group by DATE: bhog is one lunch per day, whatever the tithis say
  const byDate = new Map<string, typeof bhogDays>()
  for (const pd of bhogDays) {
    const list = byDate.get(pd.date) ?? []
    list.push(pd)
    byDate.set(pd.date, list)
  }
  let created = 0
  for (const [date, group] of byDate) {
    // A shared date is one lunch for both tithis ("Saptami / Ashtami Bhog");
    // a lone day keeps its full identity ("Ashtami · Day-2 Bhog"). "Day-2",
    // not the Puja Day's "Day 2": hyphenated it never breaks across a line,
    // so a narrow column or a spreadsheet heading can't strand the "2".
    const label =
      group.length > 1
        ? [...new Set(group.map((pd) => tithiOf(pd.labelEn) ?? pd.labelEn))].join(' / ')
        : group[0].labelEn.replace(/\bDay (\d+)\b/, 'Day-$1')
    await db.insert(schema.bhogMenu).values({
      id: crypto.randomUUID(),
      eventId: ev.id,
      pujaDayId: group[0].id,
      date,
      label: `${label} Bhog`,
      labelBn: group[0].labelBn,
      sortOrder: group[0].sortOrder,
    })
    created++
  }
  return c.json(ok({ created }))
})

/** Add a menu day to an event (core, current season). */
bhogRoutes.post('/days', async (c) => {
  const body = (await c.req.json()) as BhogDayInput
  const db = drizzle(c.env.DB, { schema })
  const ev = await loadEvent(db, body.eventId ?? '')
  const denied = seasonWriteDenied(c.get('me'), ev)
  if (denied) return c.json({ ok: false, error: denied[1] }, denied[0])
  if (!body.label?.trim()) return c.json({ ok: false, error: 'label is required' }, 400)
  if (!body.date?.trim()) return c.json({ ok: false, error: 'date is required' }, 400)
  const id = crypto.randomUUID()
  await db.insert(schema.bhogMenu).values({
    id,
    eventId: ev!.id,
    label: body.label.trim(),
    labelBn: body.labelBn?.trim() || null,
    date: body.date.trim(),
    perPlateCost: isProxyRole(c.get('me').role) && Number.isInteger(body.perPlateCost) ? body.perPlateCost : null,
    notes: body.notes?.trim() || null,
    sortOrder: body.sortOrder ?? 1000,
  })
  return c.json(ok({ id }))
})

async function loadDay(db: DB, id: string) {
  const [d] = await db.select().from(schema.bhogMenu).where(eq(schema.bhogMenu.id, id)).limit(1)
  return d
}

/** Edit a menu day's label/date/cost/notes (core, current season). */
bhogRoutes.post('/days/:id', async (c) => {
  const body = (await c.req.json()) as BhogDayInput
  const db = drizzle(c.env.DB, { schema })
  const d = await loadDay(db, c.req.param('id'))
  if (!d) return c.json({ ok: false, error: 'menu day not found' }, 404)
  const denied = seasonWriteDenied(c.get('me'), await loadEvent(db, d.eventId))
  if (denied) return c.json({ ok: false, error: denied[1] }, denied[0])
  if (!body.label?.trim()) return c.json({ ok: false, error: 'label is required' }, 400)
  if (!body.date?.trim()) return c.json({ ok: false, error: 'date is required' }, 400)
  await db
    .update(schema.bhogMenu)
    .set({
      label: body.label.trim(),
      labelBn: body.labelBn?.trim() || null,
      date: body.date.trim(),
      // Only admin/fin_admin price a plate; a core member's edit keeps what is there.
      perPlateCost: isProxyRole(c.get('me').role)
        ? (Number.isInteger(body.perPlateCost) ? body.perPlateCost : null)
        : d.perPlateCost,
      notes: body.notes?.trim() || null,
      sortOrder: body.sortOrder ?? d.sortOrder,
    })
    .where(eq(schema.bhogMenu.id, d.id))
  return c.json(ok({ id: d.id }))
})

/** Remove a menu day and its dishes (core, current season). */
bhogRoutes.post('/days/:id/delete', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  const d = await loadDay(db, c.req.param('id'))
  if (!d) return c.json({ ok: false, error: 'menu day not found' }, 404)
  const denied = seasonWriteDenied(c.get('me'), await loadEvent(db, d.eventId))
  if (denied) return c.json({ ok: false, error: denied[1] }, denied[0])
  await db.delete(schema.bhogMenu).where(eq(schema.bhogMenu.id, d.id)) // dishes cascade
  return c.json(ok({ deleted: true }))
})

/** Publish / unpublish a day to the members (core, current season). */
bhogRoutes.post('/days/:id/publish', async (c) => {
  const { published } = (await c.req.json()) as { published: boolean }
  const db = drizzle(c.env.DB, { schema })
  const d = await loadDay(db, c.req.param('id'))
  if (!d) return c.json({ ok: false, error: 'menu day not found' }, 404)
  const denied = seasonWriteDenied(c.get('me'), await loadEvent(db, d.eventId))
  if (denied) return c.json({ ok: false, error: denied[1] }, denied[0])
  await db.update(schema.bhogMenu).set({ isPublished: !!published }).where(eq(schema.bhogMenu.id, d.id))
  return c.json(ok({ id: d.id, published: !!published }))
})

/** Replace a day's dishes wholesale (core, current season). */
bhogRoutes.post('/days/:id/items', async (c) => {
  const body = (await c.req.json()) as BhogItemsInput
  const db = drizzle(c.env.DB, { schema })
  const d = await loadDay(db, c.req.param('id'))
  if (!d) return c.json({ ok: false, error: 'menu day not found' }, 404)
  const denied = seasonWriteDenied(c.get('me'), await loadEvent(db, d.eventId))
  if (denied) return c.json({ ok: false, error: denied[1] }, denied[0])
  const items = (body.items ?? [])
    .map((i) => ({ title: i.title?.trim() ?? '', titleBn: i.titleBn?.trim() || null }))
    .filter((i) => i.title)
  await db.delete(schema.bhogMenuItem).where(eq(schema.bhogMenuItem.menuId, d.id))
  for (const [idx, i] of items.entries()) {
    await db.insert(schema.bhogMenuItem).values({
      id: crypto.randomUUID(),
      menuId: d.id,
      title: i.title,
      titleBn: i.titleBn,
      sortOrder: (idx + 1) * 10,
    })
  }
  return c.json(ok({ count: items.length }))
})
