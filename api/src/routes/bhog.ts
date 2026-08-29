import type { ApiResult, BhogDayInput, BhogItemsInput, BhogMenuView, Me } from '@pujosamiti/shared'
import { asc, eq, inArray } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'

import * as schema from '../db/schema'
import type { Env } from '../env'
import { currentSeason, seasonOf, tithiOf } from '../lib/pujo'

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

const canEdit = (me: Me) => me.role !== 'member'

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
  const view: BhogMenuView[] = visible.map((d) => ({
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
  }))
  return c.json(ok(view))
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
    // a lone day keeps its full identity ("Ashtami · Day 2 Bhog").
    const label =
      group.length > 1
        ? [...new Set(group.map((pd) => tithiOf(pd.labelEn) ?? pd.labelEn))].join(' / ')
        : group[0].labelEn
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
    perPlateCost: Number.isInteger(body.perPlateCost) ? body.perPlateCost : null,
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
      perPlateCost: Number.isInteger(body.perPlateCost) ? body.perPlateCost : null,
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
