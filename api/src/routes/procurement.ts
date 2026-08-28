import type {
  ApiResult,
  Me,
  ProcurementCellInput,
  ProcurementDayInput,
  ProcurementItemInput,
  ProcurementItemYearInput,
  ProcurementMasterItem,
  ProcurementSlot,
  ProcurementStatus,
  ProcurementSuggestion,
  ProcurementView,
} from '@pujosamiti/shared'
import { PROCUREMENT_SLOTS } from '@pujosamiti/shared'
import { and, asc, eq, inArray } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'

import * as schema from '../db/schema'
import type { Env } from '../env'
import { activePujoYear, sandhiRow, tithiOf } from '../lib/pujo'

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
          nameHi: i.nameHi,
          nameBn: i.nameBn,
          details: i.details,
          suggestedTotal: i.suggestedTotal,
          sortOrder: i.sortOrder,
          isActive: i.isActive,
          totalQuantity: y?.totalQuantity ?? null,
          status: y?.status ?? 'pending',
          dueDate: y?.dueDate ?? null,
          dueTime: y?.dueTime ?? null,
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
    nameHi: body.nameHi?.trim() || null,
    nameBn: body.nameBn?.trim() || null,
    details: body.details?.trim() || null,
    suggestedTotal: body.suggestedTotal?.trim() || null,
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
      nameHi: body.nameHi?.trim() || null,
      nameBn: body.nameBn?.trim() || null,
      details: body.details?.trim() || null,
      suggestedTotal: body.suggestedTotal?.trim() || null,
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
    dueDate: body.dueDate?.trim() || null,
    dueTime: body.dueTime?.trim() || null,
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
    time: body.time?.trim() || null,
    sortOrder: Number.isFinite(body.sortOrder) ? Math.trunc(body.sortOrder) : 1000,
    notes: body.notes?.trim() || null,
  })
  return c.json(ok({ id }))
})

/** Tithi a delivery column serves: via its puja day, else its own label. */
function dayTithi(
  d: { label: string; pujaDayId: string | null },
  pujaDays: { id: string; labelEn: string }[],
): string | null {
  const src = pujaDays.find((p) => p.id === d.pujaDayId)?.labelEn ?? d.label
  if (/sandhi/i.test(src)) return 'Sandhi Puja'
  return tithiOf(src)
}

/**
 * Create the year's delivery columns from its Puja Days (ADMIN, active year,
 * empty column list). Convention: delivery lands the EVENING BEFORE the tithi
 * at 19:00; a nirghanto Sandhi Puja row adds its own same-morning 10:00 column.
 */
procurementRoutes.post('/days/seed', async (c) => {
  const me = c.get('me')
  if (me.role !== 'admin') return c.json({ ok: false, error: 'admins only' }, 403)
  const { year } = (await c.req.json()) as { year: number }
  const db = drizzle(c.env.DB, { schema })
  if (year !== (await activePujoYear(db)))
    return c.json({ ok: false, error: 'columns seed only for the active pujo year' }, 400)
  const existing = await db
    .select({ id: schema.procurementDay.id })
    .from(schema.procurementDay)
    .where(eq(schema.procurementDay.year, year))
  if (existing.length > 0)
    return c.json({ ok: false, error: 'delivery columns already exist — remove them first to reseed' }, 400)
  const eventId = `durga-pujo-${year}`
  const pujaDays = await db
    .select()
    .from(schema.pujaDay)
    .where(eq(schema.pujaDay.eventId, eventId))
    .orderBy(asc(schema.pujaDay.sortOrder))
  if (pujaDays.length === 0)
    return c.json(
      { ok: false, error: 'no Puja Days yet — finalise the nirghanto and seed Puja Days first' },
      400,
    )
  const dayBefore = (iso: string) => {
    const t = new Date(`${iso}T12:00:00Z`)
    t.setUTCDate(t.getUTCDate() - 1)
    return t.toISOString().slice(0, 10)
  }
  let created = 0
  for (const pd of pujaDays) {
    await db.insert(schema.procurementDay).values({
      id: crypto.randomUUID(),
      year,
      pujaDayId: pd.id,
      label: pd.labelEn,
      date: dayBefore(pd.date),
      time: '19:00',
      sortOrder: pd.sortOrder,
      notes: `tithi ${pd.date} — delivery evening before, 19:00 default`,
    })
    created++
  }
  const sandhi = await sandhiRow(db, eventId)
  if (sandhi) {
    const host = pujaDays.find((p) => p.date === sandhi.dayDate)
    await db.insert(schema.procurementDay).values({
      id: crypto.randomUUID(),
      year,
      pujaDayId: host?.id ?? null,
      label: 'Sandhi Puja',
      date: sandhi.dayDate,
      time: '10:00',
      sortOrder: (host?.sortOrder ?? pujaDays.length * 10) + 5,
      notes: `Sandhi window ${[sandhi.timeFrom, sandhi.timeTo].filter(Boolean).join('–') || 'TBC'} — delivery same morning, 10:00 default`,
    })
    created++
  }
  return c.json(ok({ created }))
})

/**
 * Fill the active year from the master list (ADMIN): suggested totals become
 * item-year totals, suggested tithi × slot quantities become cells on every
 * matching delivery column (both Ashtamis in an Adhik Diba year). Existing
 * values are never overwritten — prefill only adds what's missing.
 */
procurementRoutes.post('/days/prefill', async (c) => {
  const me = c.get('me')
  if (me.role !== 'admin') return c.json({ ok: false, error: 'admins only' }, 403)
  const { year } = (await c.req.json()) as { year: number }
  const db = drizzle(c.env.DB, { schema })
  if (year !== (await activePujoYear(db)))
    return c.json({ ok: false, error: 'prefill applies only to the active pujo year' }, 400)
  const days = await db.select().from(schema.procurementDay).where(eq(schema.procurementDay.year, year))
  if (days.length === 0)
    return c.json({ ok: false, error: 'seed the delivery columns first' }, 400)
  const pujaDays = await db
    .select()
    .from(schema.pujaDay)
    .where(eq(schema.pujaDay.eventId, `durga-pujo-${year}`))
  const items = await db.select().from(schema.procurementItem)
  const suggestions = await db.select().from(schema.procurementSuggestion)
  const itemYears = await db
    .select()
    .from(schema.procurementItemYear)
    .where(eq(schema.procurementItemYear.year, year))
  const dayIds = days.map((d) => d.id)
  const cells = dayIds.length
    ? await db.select().from(schema.procurementNeed).where(inArray(schema.procurementNeed.dayId, dayIds))
    : []
  const haveCell = new Set(cells.map((n) => `${n.itemId}|${n.dayId}|${n.slot}`))
  let totals = 0
  let added = 0
  for (const item of items.filter((i) => i.isActive)) {
    const iy = itemYears.find((y) => y.itemId === item.id)
    if (item.suggestedTotal && !iy) {
      await db.insert(schema.procurementItemYear).values({
        id: crypto.randomUUID(),
        itemId: item.id,
        year,
        totalQuantity: item.suggestedTotal,
      })
      totals++
    }
    for (const sg of suggestions.filter((x) => x.itemId === item.id)) {
      for (const d of days) {
        if (dayTithi(d, pujaDays) !== sg.tithi) continue
        const key = `${item.id}|${d.id}|${sg.slot}`
        if (haveCell.has(key)) continue
        await db.insert(schema.procurementNeed).values({
          id: crypto.randomUUID(),
          itemId: item.id,
          dayId: d.id,
          slot: sg.slot,
          quantity: sg.quantity,
        })
        haveCell.add(key)
        added++
      }
    }
  }
  return c.json(ok({ totals, cells: added }))
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
      time: body.time?.trim() || null,
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

/** The master list: every catalog item with its suggested quantities. */
procurementRoutes.get('/master', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  const items = await db
    .select()
    .from(schema.procurementItem)
    .orderBy(asc(schema.procurementItem.sortOrder), asc(schema.procurementItem.title))
  const suggestions = await db.select().from(schema.procurementSuggestion)
  const out: ProcurementMasterItem[] = items
    .filter((i) => i.isActive)
    .map((i) => ({
      id: i.id,
      category: i.category,
      title: i.title,
      nameHi: i.nameHi,
      nameBn: i.nameBn,
      details: i.details,
      suggestedTotal: i.suggestedTotal,
      sortOrder: i.sortOrder,
      isActive: i.isActive,
      suggestions: suggestions
        .filter((sg) => sg.itemId === i.id)
        .map((sg) => ({ tithi: sg.tithi, slot: sg.slot, quantity: sg.quantity })),
    }))
  return c.json(ok(out))
})

/** Replace an item's suggested tithi × slot quantities (core). */
procurementRoutes.post('/items/:id/suggestions', async (c) => {
  if (!canEdit(c.get('me'))) return c.json({ ok: false, error: 'core members only' }, 403)
  const { suggestions } = (await c.req.json()) as { suggestions: ProcurementSuggestion[] }
  const db = drizzle(c.env.DB, { schema })
  const id = c.req.param('id')
  const [i] = await db
    .select({ id: schema.procurementItem.id })
    .from(schema.procurementItem)
    .where(eq(schema.procurementItem.id, id))
    .limit(1)
  if (!i) return c.json({ ok: false, error: 'item not found' }, 404)
  await db.delete(schema.procurementSuggestion).where(eq(schema.procurementSuggestion.itemId, id))
  let n = 0
  for (const sg of suggestions ?? []) {
    const quantity = sg.quantity?.trim()
    if (!quantity || !sg.tithi?.trim()) continue
    await db.insert(schema.procurementSuggestion).values({
      id: crypto.randomUUID(),
      itemId: id,
      tithi: sg.tithi.trim(),
      slot: asSlot(sg.slot),
      quantity,
    })
    n++
  }
  return c.json(ok({ id, saved: n }))
})

