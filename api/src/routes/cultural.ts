import type { ApiResult, CulturalEvening, CulturalItem, CulturalItemInput, Me } from '@pujosamiti/shared'
import { canRunCulture, CULTURAL_ITEM_TYPES, CULTURAL_PERFORMERS } from '@pujosamiti/shared'
import { and, asc, eq, max } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'

import * as schema from '../db/schema'
import type { Env } from '../env'

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data }
}

/**
 * Cultural function — the evening programmes. An evening is a Puja Day of the
 * active Durga Pujo that an admin has marked (puja_day.has_cultural_evening),
 * so its name and date come from the Days of the Pujo. Mounted under the
 * member gate (/api/members/cultural). The whole programme is the cultural
 * admins' (canRunCulture: core members with the flag, and admins) — they
 * read it, and add, edit, delete and arrange items, on the active pujo's
 * evenings only, past years being the record. Other members see none of it.
 */
export const culturalRoutes = new Hono<{ Bindings: Env; Variables: { me: Me } }>()

type DB = ReturnType<typeof drizzle<typeof schema>>
type Row = typeof schema.culturalProgram.$inferSelect

const text = (v: string | null | undefined) => v?.trim() || null

culturalRoutes.use('*', async (c, next) => {
  if (!canRunCulture(c.get('me'))) return c.json({ ok: false, error: 'cultural admins only' }, 403)
  await next()
})

function toView(r: Row, createdByName: string): CulturalItem {
  return {
    id: r.id,
    pujaDayId: r.pujaDayId,
    itemName: r.itemName,
    itemType: r.itemType,
    itemTypeOther: r.itemTypeOther,
    performers: r.performers,
    durationMin: r.durationMin,
    participants: r.participants,
    createdById: r.createdBy,
    createdByName,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }
}

/** The active Durga Pujo's marked evenings, in the order of the pujo. */
async function activeEvenings(db: DB): Promise<CulturalEvening[]> {
  return db
    .select({
      pujaDayId: schema.pujaDay.id,
      date: schema.pujaDay.date,
      labelEn: schema.pujaDay.labelEn,
      labelBn: schema.pujaDay.labelBn,
    })
    .from(schema.pujaDay)
    .innerJoin(schema.event, eq(schema.event.id, schema.pujaDay.eventId))
    .where(and(eq(schema.event.kind, 'durga-pujo'), eq(schema.event.isActive, true), eq(schema.pujaDay.hasCulturalEvening, true)))
    .orderBy(asc(schema.pujaDay.sortOrder))
}

/** Writes go only to the active pujo's marked evenings. */
async function writableEvening(db: DB, pujaDayId: string) {
  return (await activeEvenings(db)).some((e) => e.pujaDayId === pujaDayId)
}

async function loadItem(db: DB, id: string) {
  const [r] = await db.select().from(schema.culturalProgram).where(eq(schema.culturalProgram.id, id)).limit(1)
  return r
}

/** Check an input against the rules the form shows. */
function invalid(b: CulturalItemInput): string | null {
  if (!b.itemName?.trim()) return 'item name is required'
  if (!(b.itemType in CULTURAL_ITEM_TYPES)) return 'pick an item type'
  if (b.itemType === 'others' && !b.itemTypeOther?.trim()) return 'describe the item when its type is Others'
  if (!(b.performers in CULTURAL_PERFORMERS)) return 'pick who performs'
  if (b.durationMin != null && (!Number.isInteger(b.durationMin) || b.durationMin < 1))
    return 'duration must be a whole number of minutes'
  return null
}

/** The active pujo's evenings with a cultural programme. */
culturalRoutes.get('/evenings', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  return c.json(ok(await activeEvenings(db)))
})

/** An evening's items in running order (ties — never expected — fall back to the order added). */
async function eveningItems(db: DB, pujaDayId: string) {
  return db
    .select()
    .from(schema.culturalProgram)
    .where(eq(schema.culturalProgram.pujaDayId, pujaDayId))
    .orderBy(asc(schema.culturalProgram.sortOrder), asc(schema.culturalProgram.createdAt))
}

/** An evening's schedule, in running order. */
culturalRoutes.get('/', async (c) => {
  const day = c.req.query('day')
  if (!day) return c.json({ ok: false, error: 'day query param required' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const rows = await db
    .select({ item: schema.culturalProgram, name: schema.person.displayName })
    .from(schema.culturalProgram)
    .innerJoin(schema.person, eq(schema.person.id, schema.culturalProgram.createdBy))
    .where(eq(schema.culturalProgram.pujaDayId, day))
    .orderBy(asc(schema.culturalProgram.sortOrder), asc(schema.culturalProgram.createdAt))
  return c.json(ok(rows.map((r) => toView(r.item, r.name))))
})

/** One item, for its edit form. */
culturalRoutes.get('/:id', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  const [r] = await db
    .select({ item: schema.culturalProgram, name: schema.person.displayName })
    .from(schema.culturalProgram)
    .innerJoin(schema.person, eq(schema.person.id, schema.culturalProgram.createdBy))
    .where(eq(schema.culturalProgram.id, c.req.param('id')))
    .limit(1)
  if (!r) return c.json({ ok: false, error: 'item not found' }, 404)
  return c.json(ok(toView(r.item, r.name)))
})

/** Add an item to an evening. */
culturalRoutes.post('/', async (c) => {
  const me = c.get('me')
  const b = (await c.req.json()) as CulturalItemInput
  const bad = invalid(b)
  if (bad) return c.json({ ok: false, error: bad }, 400)
  const db = drizzle(c.env.DB, { schema })
  if (!(await writableEvening(db, b.pujaDayId)))
    return c.json({ ok: false, error: 'that evening has no cultural programme this year' }, 400)
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  // a new item joins the end of the running order
  const [{ last }] = await db
    .select({ last: max(schema.culturalProgram.sortOrder) })
    .from(schema.culturalProgram)
    .where(eq(schema.culturalProgram.pujaDayId, b.pujaDayId))
  await db.insert(schema.culturalProgram).values({
    id,
    pujaDayId: b.pujaDayId,
    sortOrder: (last ?? 0) + 10,
    itemName: b.itemName.trim(),
    itemType: b.itemType,
    itemTypeOther: b.itemType === 'others' ? text(b.itemTypeOther) : null,
    performers: b.performers,
    durationMin: b.durationMin ?? null,
    participants: text(b.participants),
    createdBy: me.personId,
    createdAt: now,
    updatedAt: now,
  })
  return c.json(ok({ id }))
})

/** Edit an item. The evening stays as created. */
culturalRoutes.post('/:id', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  const row = await loadItem(db, c.req.param('id'))
  if (!row) return c.json({ ok: false, error: 'item not found' }, 404)
  if (!(await writableEvening(db, row.pujaDayId)))
    return c.json({ ok: false, error: 'past programmes are the record — they no longer change' }, 400)
  const b = { ...((await c.req.json()) as CulturalItemInput), pujaDayId: row.pujaDayId }
  const bad = invalid(b)
  if (bad) return c.json({ ok: false, error: bad }, 400)
  await db
    .update(schema.culturalProgram)
    .set({
      itemName: b.itemName.trim(),
      itemType: b.itemType,
      itemTypeOther: b.itemType === 'others' ? text(b.itemTypeOther) : null,
      performers: b.performers,
      durationMin: b.durationMin ?? null,
      participants: text(b.participants),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.culturalProgram.id, row.id))
  return c.json(ok({ id: row.id }))
})

/** Delete an item. */
culturalRoutes.post('/:id/delete', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  const row = await loadItem(db, c.req.param('id'))
  if (!row) return c.json({ ok: false, error: 'item not found' }, 404)
  if (!(await writableEvening(db, row.pujaDayId)))
    return c.json({ ok: false, error: 'past programmes are the record — they no longer change' }, 400)
  await db.delete(schema.culturalProgram).where(eq(schema.culturalProgram.id, row.id))
  return c.json(ok({ deleted: true }))
})

/**
 * Move an item one place up or down its evening's running order (cultural
 * admins). The neighbour is
 * found from the database as it is now, not from the caller's copy, so two
 * people arranging at once each move exactly one step. The evening is
 * renumbered 10, 20, 30… in one batch, which also heals any tie.
 */
culturalRoutes.post('/:id/move', async (c) => {
  const { direction } = (await c.req.json()) as { direction: 'up' | 'down' }
  if (direction !== 'up' && direction !== 'down') return c.json({ ok: false, error: 'direction must be up or down' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const row = await loadItem(db, c.req.param('id'))
  if (!row) return c.json({ ok: false, error: 'item not found' }, 404)
  if (!(await writableEvening(db, row.pujaDayId)))
    return c.json({ ok: false, error: 'past programmes are the record — they no longer change' }, 400)
  const items = await eveningItems(db, row.pujaDayId)
  const from = items.findIndex((i) => i.id === row.id)
  const to = direction === 'up' ? from - 1 : from + 1
  if (to < 0 || to >= items.length) return c.json(ok({ moved: false })) // already at that end
  ;[items[from], items[to]] = [items[to]!, items[from]!]
  const updates = items
    .map((item, i) => ({ item, sortOrder: (i + 1) * 10 }))
    .filter(({ item, sortOrder }) => item.sortOrder !== sortOrder)
    .map(({ item, sortOrder }) =>
      db.update(schema.culturalProgram).set({ sortOrder }).where(eq(schema.culturalProgram.id, item.id)),
    )
  if (updates.length) await db.batch(updates as [(typeof updates)[number], ...(typeof updates)[number][]])
  return c.json(ok({ moved: true }))
})
