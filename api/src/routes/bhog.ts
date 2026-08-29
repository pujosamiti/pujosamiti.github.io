import type { ApiResult, BhogDayInput, BhogItemsInput, BhogMenuView, Me } from '@pujosamiti/shared'
import { asc, eq, inArray } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'

import * as schema from '../db/schema'
import type { Env } from '../env'
import { activePujoYear, tithiOf } from '../lib/pujo'

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data }
}

/**
 * The daily bhog menu — one menu per calendar DATE with dishes and a
 * per-plate cost, admin-seeded from the finalised Puja Days (Saptami →
 * Dashami by default; a crunched year's shared date serves both tithis in
 * one lunch). Mounted under the member gate (/api/members/bhog). Every
 * member reads PUBLISHED days; drafts and all writes are core work, and
 * only the active pujo year is writable — past menus are the record.
 */
export const bhogRoutes = new Hono<{ Bindings: Env; Variables: { me: Me } }>()

const canEdit = (me: Me) => me.role !== 'member'

/** Core member + active-pujo-year check shared by every write. */
async function yearWriteDenied(
  me: Me,
  db: ReturnType<typeof drizzle<typeof schema>>,
  year: number,
): Promise<[403 | 400, string] | null> {
  if (!canEdit(me)) return [403, 'core members only']
  if (!Number.isInteger(year)) return [400, 'year is required']
  if (year !== (await activePujoYear(db)))
    return [400, 'past years are archival — the menu changes only for the active pujo year']
  return null
}

bhogRoutes.get('/', async (c) => {
  const year = Number(c.req.query('year'))
  if (!Number.isInteger(year)) return c.json({ ok: false, error: 'year query param required' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const me = c.get('me')
  const days = await db
    .select()
    .from(schema.bhogMenu)
    .where(eq(schema.bhogMenu.year, year))
    .orderBy(asc(schema.bhogMenu.sortOrder), asc(schema.bhogMenu.date))
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
    year: d.year,
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
 * ADMIN: create the year's bhog days from its Puja Days, one per calendar
 * date — tithis sharing a date share one lunch ("Saptami / Ashtami Bhog").
 * NOTE: registered before /days/:id so the param route can't swallow it.
 */
bhogRoutes.post('/days/seed', async (c) => {
  const me = c.get('me')
  if (me.role !== 'admin') return c.json({ ok: false, error: 'admins only' }, 403)
  const { year } = (await c.req.json()) as { year: number }
  const db = drizzle(c.env.DB, { schema })
  if (year !== (await activePujoYear(db)))
    return c.json({ ok: false, error: 'bhog days seed only for the active pujo year' }, 400)
  const existing = await db
    .select({ id: schema.bhogMenu.id })
    .from(schema.bhogMenu)
    .where(eq(schema.bhogMenu.year, year))
  if (existing.length > 0)
    return c.json({ ok: false, error: 'bhog days already exist — remove them first to reseed' }, 400)
  const pujaDays = await db
    .select()
    .from(schema.pujaDay)
    .where(eq(schema.pujaDay.eventId, `durga-pujo-${year}`))
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
      year,
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

/** Add a free-form bhog day (core, active year). */
bhogRoutes.post('/days', async (c) => {
  const body = (await c.req.json()) as BhogDayInput
  const db = drizzle(c.env.DB, { schema })
  const denied = await yearWriteDenied(c.get('me'), db, body.year)
  if (denied) return c.json({ ok: false, error: denied[1] }, denied[0])
  if (!body.label?.trim()) return c.json({ ok: false, error: 'label is required' }, 400)
  if (!body.date?.trim()) return c.json({ ok: false, error: 'date is required' }, 400)
  const id = crypto.randomUUID()
  await db.insert(schema.bhogMenu).values({
    id,
    year: body.year,
    label: body.label.trim(),
    labelBn: body.labelBn?.trim() || null,
    date: body.date.trim(),
    perPlateCost: Number.isInteger(body.perPlateCost) ? body.perPlateCost : null,
    notes: body.notes?.trim() || null,
    sortOrder: body.sortOrder ?? 1000,
  })
  return c.json(ok({ id }))
})

async function loadDay(db: ReturnType<typeof drizzle<typeof schema>>, id: string) {
  const [d] = await db.select().from(schema.bhogMenu).where(eq(schema.bhogMenu.id, id)).limit(1)
  return d
}

/** Edit a bhog day's label/date/cost/notes (core, active year). */
bhogRoutes.post('/days/:id', async (c) => {
  const body = (await c.req.json()) as BhogDayInput
  const db = drizzle(c.env.DB, { schema })
  const d = await loadDay(db, c.req.param('id'))
  if (!d) return c.json({ ok: false, error: 'bhog day not found' }, 404)
  const denied = await yearWriteDenied(c.get('me'), db, d.year)
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

/** Remove a bhog day and its dishes (core, active year). */
bhogRoutes.post('/days/:id/delete', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  const d = await loadDay(db, c.req.param('id'))
  if (!d) return c.json({ ok: false, error: 'bhog day not found' }, 404)
  const denied = await yearWriteDenied(c.get('me'), db, d.year)
  if (denied) return c.json({ ok: false, error: denied[1] }, denied[0])
  await db.delete(schema.bhogMenu).where(eq(schema.bhogMenu.id, d.id)) // dishes cascade
  return c.json(ok({ deleted: true }))
})

/** Publish / unpublish a day to the members (core, active year). */
bhogRoutes.post('/days/:id/publish', async (c) => {
  const { published } = (await c.req.json()) as { published: boolean }
  const db = drizzle(c.env.DB, { schema })
  const d = await loadDay(db, c.req.param('id'))
  if (!d) return c.json({ ok: false, error: 'bhog day not found' }, 404)
  const denied = await yearWriteDenied(c.get('me'), db, d.year)
  if (denied) return c.json({ ok: false, error: denied[1] }, denied[0])
  await db.update(schema.bhogMenu).set({ isPublished: !!published }).where(eq(schema.bhogMenu.id, d.id))
  return c.json(ok({ id: d.id, published: !!published }))
})

/** Replace a day's dishes wholesale (core, active year). */
bhogRoutes.post('/days/:id/items', async (c) => {
  const body = (await c.req.json()) as BhogItemsInput
  const db = drizzle(c.env.DB, { schema })
  const d = await loadDay(db, c.req.param('id'))
  if (!d) return c.json({ ok: false, error: 'bhog day not found' }, 404)
  const denied = await yearWriteDenied(c.get('me'), db, d.year)
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
