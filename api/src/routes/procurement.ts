import type {
  ApiResult,
  Me,
  ProcurementCellInput,
  ProcurementDayInput,
  ProcurementItemInput,
  ProcurementItemYearInput,
  ProcurementSlot,
  ProcurementStatus,
  ProcurementView,
} from '@pujosamiti/shared'
import { PROCUREMENT_SLOTS } from '@pujosamiti/shared'
import { and, asc, eq, inArray } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'

import * as schema from '../db/schema'
import type { Env } from '../env'
import { activePujoYear } from '../lib/pujo'

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data }
}

/**
 * Durga Pujo shopping lists — the digital form of the samiti's yearly
 * procurement sheet: items (in category sections) × per-year day columns,
 * Morning/Evening. Mounted under the member gate (/api/members/procurement).
 * Any member reads; curating is core work — every write checks canEdit, and
 * per-year data (days, cells, totals) is writable only for the active pujo
 * year: past lists stay as the record of what was actually ordered.
 */
export const procurementRoutes = new Hono<{ Bindings: Env; Variables: { me: Me } }>()

const canEdit = (me: Me) => me.role !== 'member'
const STATUSES: ProcurementStatus[] = ['pending', 'partial', 'done']

const asSlot = (v: unknown): ProcurementSlot =>
  PROCUREMENT_SLOTS.includes(v as ProcurementSlot) ? (v as ProcurementSlot) : 'morning'

/** Core member + active-pujo-year check shared by every per-year write. */
async function yearWriteDenied(
  me: Me,
  db: ReturnType<typeof drizzle<typeof schema>>,
  year: number,
): Promise<[403 | 400, string] | null> {
  if (!canEdit(me)) return [403, 'core members only']
  if (!Number.isInteger(year)) return [400, 'year is required']
  if (year !== (await activePujoYear(db)))
    return [400, 'past years are archival — lists change only for the active pujo year']
  return null
}

procurementRoutes.get('/', async (c) => {
  const year = Number(c.req.query('year'))
  if (!Number.isInteger(year)) return c.json({ ok: false, error: 'year query param required' }, 400)
  const db = drizzle(c.env.DB, { schema })

  const days = await db
    .select()
    .from(schema.procurementDay)
    .where(eq(schema.procurementDay.year, year))
    .orderBy(asc(schema.procurementDay.sortOrder), asc(schema.procurementDay.date), asc(schema.procurementDay.label))
  const items = await db
    .select()
    .from(schema.procurementItem)
    .orderBy(asc(schema.procurementItem.sortOrder), asc(schema.procurementItem.title))
  const itemYears = await db
    .select()
    .from(schema.procurementItemYear)
    .where(eq(schema.procurementItemYear.year, year))
  const dayIds = days.map((d) => d.id)
  const cells = dayIds.length
    ? await db.select().from(schema.procurementNeed).where(inArray(schema.procurementNeed.dayId, dayIds))
    : []

  const out: ProcurementView = {
    days,
    items: items
      .filter((i) => i.isActive)
      .map((i) => {
        const y = itemYears.find((x) => x.itemId === i.id)
        return {
          id: i.id,
          category: i.category,
          title: i.title,
          details: i.details,
          sortOrder: i.sortOrder,
          isActive: i.isActive,
          totalQuantity: y?.totalQuantity ?? null,
          status: y?.status ?? 'pending',
          yearNotes: y?.notes ?? null,
          cells: cells
            .filter((n) => n.itemId === i.id)
            .map((n) => ({
              id: n.id,
              dayId: n.dayId,
              slot: n.slot,
              quantity: n.quantity,
              notes: n.notes,
              purchased: n.purchased,
            })),
        }
      }),
  }
  return c.json(ok(out))
})

/** Create a catalog item (core). */
procurementRoutes.post('/items', async (c) => {
  if (!canEdit(c.get('me'))) return c.json({ ok: false, error: 'core members only' }, 403)
  const body = (await c.req.json()) as ProcurementItemInput
  if (!body.title?.trim() || !body.category?.trim())
    return c.json({ ok: false, error: 'category and title are required' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const id = crypto.randomUUID()
  await db.insert(schema.procurementItem).values({
    id,
    category: body.category.trim(),
    title: body.title.trim(),
    details: body.details?.trim() || null,
    sortOrder: Number.isFinite(body.sortOrder) ? Math.trunc(body.sortOrder) : 1000,
    createdAt: new Date(),
  })
  return c.json(ok({ id }))
})

/** Update catalog fields (core). isActive=false is the soft delete. */
procurementRoutes.post('/items/:id', async (c) => {
  if (!canEdit(c.get('me'))) return c.json({ ok: false, error: 'core members only' }, 403)
  const body = (await c.req.json()) as ProcurementItemInput
  if (!body.title?.trim() || !body.category?.trim())
    return c.json({ ok: false, error: 'category and title are required' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const id = c.req.param('id')
  const [i] = await db
    .select({ id: schema.procurementItem.id })
    .from(schema.procurementItem)
    .where(eq(schema.procurementItem.id, id))
    .limit(1)
  if (!i) return c.json({ ok: false, error: 'item not found' }, 404)
  await db
    .update(schema.procurementItem)
    .set({
      category: body.category.trim(),
      title: body.title.trim(),
      details: body.details?.trim() || null,
      sortOrder: Number.isFinite(body.sortOrder) ? Math.trunc(body.sortOrder) : 1000,
      isActive: body.isActive !== false,
    })
    .where(eq(schema.procurementItem.id, id))
  return c.json(ok({ id }))
})

/** Upsert an item's Total Quantity / status / remarks for one year (core, active year). */
procurementRoutes.post('/items/:id/year', async (c) => {
  const body = (await c.req.json()) as ProcurementItemYearInput
  const db = drizzle(c.env.DB, { schema })
  const denied = await yearWriteDenied(c.get('me'), db, body.year)
  if (denied) return c.json({ ok: false, error: denied[1] }, denied[0])
  const id = c.req.param('id')
  const [i] = await db
    .select({ id: schema.procurementItem.id })
    .from(schema.procurementItem)
    .where(eq(schema.procurementItem.id, id))
    .limit(1)
  if (!i) return c.json({ ok: false, error: 'item not found' }, 404)
  const values = {
    totalQuantity: body.totalQuantity?.trim() || null,
    status: STATUSES.includes(body.status) ? body.status : 'pending',
    notes: body.notes?.trim() || null,
  }
  const [existing] = await db
    .select({ id: schema.procurementItemYear.id })
    .from(schema.procurementItemYear)
    .where(and(eq(schema.procurementItemYear.itemId, id), eq(schema.procurementItemYear.year, body.year)))
    .limit(1)
  if (existing)
    await db.update(schema.procurementItemYear).set(values).where(eq(schema.procurementItemYear.id, existing.id))
  else
    await db
      .insert(schema.procurementItemYear)
      .values({ id: crypto.randomUUID(), itemId: id, year: body.year, ...values })
  return c.json(ok({ id }))
})

/** Add a day column (core, active year). */
procurementRoutes.post('/days', async (c) => {
  const body = (await c.req.json()) as ProcurementDayInput
  const db = drizzle(c.env.DB, { schema })
  const denied = await yearWriteDenied(c.get('me'), db, body.year)
  if (denied) return c.json({ ok: false, error: denied[1] }, denied[0])
  if (!body.label?.trim()) return c.json({ ok: false, error: 'label is required' }, 400)
  const id = crypto.randomUUID()
  await db.insert(schema.procurementDay).values({
    id,
    year: body.year,
    label: body.label.trim(),
    date: body.date?.trim() || null,
    sortOrder: Number.isFinite(body.sortOrder) ? Math.trunc(body.sortOrder) : 1000,
    notes: body.notes?.trim() || null,
  })
  return c.json(ok({ id }))
})

/** Edit a day column (core, active year). */
procurementRoutes.post('/days/:id', async (c) => {
  const body = (await c.req.json()) as ProcurementDayInput
  const db = drizzle(c.env.DB, { schema })
  const [d] = await db
    .select()
    .from(schema.procurementDay)
    .where(eq(schema.procurementDay.id, c.req.param('id')))
    .limit(1)
  if (!d) return c.json({ ok: false, error: 'day not found' }, 404)
  const denied = await yearWriteDenied(c.get('me'), db, d.year)
  if (denied) return c.json({ ok: false, error: denied[1] }, denied[0])
  if (!body.label?.trim()) return c.json({ ok: false, error: 'label is required' }, 400)
  await db
    .update(schema.procurementDay)
    .set({
      label: body.label.trim(),
      date: body.date?.trim() || null,
      sortOrder: Number.isFinite(body.sortOrder) ? Math.trunc(body.sortOrder) : 1000,
      notes: body.notes?.trim() || null,
    })
    .where(eq(schema.procurementDay.id, d.id))
  return c.json(ok({ id: d.id }))
})

/** Remove a day column and its cells (core, active year). */
procurementRoutes.post('/days/:id/delete', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  const [d] = await db
    .select()
    .from(schema.procurementDay)
    .where(eq(schema.procurementDay.id, c.req.param('id')))
    .limit(1)
  if (!d) return c.json({ ok: false, error: 'day not found' }, 404)
  const denied = await yearWriteDenied(c.get('me'), db, d.year)
  if (denied) return c.json({ ok: false, error: denied[1] }, denied[0])
  await db.delete(schema.procurementDay).where(eq(schema.procurementDay.id, d.id)) // cells cascade
  return c.json(ok({ id: d.id }))
})

/** Upsert one cell (item × day × slot); a blank quantity clears it (core, active year). */
procurementRoutes.post('/cells', async (c) => {
  const body = (await c.req.json()) as ProcurementCellInput
  const db = drizzle(c.env.DB, { schema })
  const [d] = await db
    .select()
    .from(schema.procurementDay)
    .where(eq(schema.procurementDay.id, body.dayId ?? ''))
    .limit(1)
  if (!d) return c.json({ ok: false, error: 'day not found' }, 404)
  const denied = await yearWriteDenied(c.get('me'), db, d.year)
  if (denied) return c.json({ ok: false, error: denied[1] }, denied[0])
  const [i] = await db
    .select({ id: schema.procurementItem.id })
    .from(schema.procurementItem)
    .where(eq(schema.procurementItem.id, body.itemId ?? ''))
    .limit(1)
  if (!i) return c.json({ ok: false, error: 'item not found' }, 404)

  const slot = asSlot(body.slot)
  const where = and(
    eq(schema.procurementNeed.itemId, i.id),
    eq(schema.procurementNeed.dayId, d.id),
    eq(schema.procurementNeed.slot, slot),
  )
  const [existing] = await db.select().from(schema.procurementNeed).where(where).limit(1)
  const quantity = body.quantity?.trim() ?? ''
  if (!quantity) {
    if (existing) await db.delete(schema.procurementNeed).where(eq(schema.procurementNeed.id, existing.id))
    return c.json(ok({ cleared: true }))
  }
  if (existing) {
    await db
      .update(schema.procurementNeed)
      .set({ quantity, notes: body.notes?.trim() || null })
      .where(eq(schema.procurementNeed.id, existing.id))
    return c.json(ok({ id: existing.id }))
  }
  const id = crypto.randomUUID()
  await db.insert(schema.procurementNeed).values({
    id,
    itemId: i.id,
    dayId: d.id,
    slot,
    quantity,
    notes: body.notes?.trim() || null,
  })
  return c.json(ok({ id }))
})

/** Tick / untick a cell while shopping (core, active year). */
procurementRoutes.post('/cells/:id/purchased', async (c) => {
  const { purchased } = (await c.req.json()) as { purchased: boolean }
  const db = drizzle(c.env.DB, { schema })
  const [n] = await db
    .select({ id: schema.procurementNeed.id, dayId: schema.procurementNeed.dayId })
    .from(schema.procurementNeed)
    .where(eq(schema.procurementNeed.id, c.req.param('id')))
    .limit(1)
  if (!n) return c.json({ ok: false, error: 'cell not found' }, 404)
  const [d] = await db
    .select()
    .from(schema.procurementDay)
    .where(eq(schema.procurementDay.id, n.dayId))
    .limit(1)
  if (!d) return c.json({ ok: false, error: 'day not found' }, 404)
  const denied = await yearWriteDenied(c.get('me'), db, d.year)
  if (denied) return c.json({ ok: false, error: denied[1] }, denied[0])
  await db
    .update(schema.procurementNeed)
    .set({ purchased: !!purchased })
    .where(eq(schema.procurementNeed.id, n.id))
  return c.json(ok({ id: n.id, purchased: !!purchased }))
})
