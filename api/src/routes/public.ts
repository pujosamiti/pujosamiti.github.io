import type { ApiResult, BhogLinkSaveInput, BhogLinkSheet, PujoEvent, TimeTableEntry } from '@pujosamiti/shared'
import { seasonOf } from '@pujosamiti/shared'
import { and, asc, eq, isNull } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'

import * as schema from '../db/schema'
import type { Env } from '../env'
import { CODE_PATTERN, headcountView, normaliseCode, responsesList, saveHeadcount } from '../lib/headcount'
import { contactOf } from '../lib/households'
import { currentSeason } from '../lib/pujo'

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data }
}

export const publicRoutes = new Hono<{ Bindings: Env }>()

publicRoutes.get('/events', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  // soonest first, so the current season tops the chooser
  const rows = await db.select().from(schema.event).orderBy(asc(schema.event.startsOn))
  // The purohit's number is the one personal detail on an otherwise public
  // page, so it is withheld here and served from the member route instead.
  const out = rows.map((e) => ({ ...e, purohitPhone: null }))
  return c.json(ok(out as unknown as PujoEvent[]))
})

publicRoutes.get('/timetable', async (c) => {
  const eventId = c.req.query('event')
  if (!eventId) return c.json({ ok: false, error: 'event query param required' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const rows = await db
    .select()
    .from(schema.timetableEntry)
    .where(eq(schema.timetableEntry.eventId, eventId))
    .orderBy(asc(schema.timetableEntry.dayDate), asc(schema.timetableEntry.sortOrder))
  return c.json(ok(rows as unknown as TimeTableEntry[]))
})

// ── The bhog headcount link: /bhog/count/?c=X481216, no sign-in ─────────────
//
// One code per event, shared with the samiti. It opens the Responses list to
// pick a household from, that household's days, and saving its counts under
// the same rules as the members' form (lib/headcount). Nothing else: no money,
// no other event, no names beyond the list.

type LinkOpen =
  | { ok: true; ev: typeof schema.event.$inferSelect; db: ReturnType<typeof drizzle<typeof schema>> }
  | { ok: false; status: 404 | 410 | 429; error: string }

async function openLink(env: Env, rawCode: string | undefined, ip: string): Promise<LinkOpen> {
  // Per-IP cap first, so codes can't be walked: a family needs a handful of calls
  if (env.HEADCOUNT_LIMITER) {
    const { success } = await env.HEADCOUNT_LIMITER.limit({ key: ip })
    if (!success) return { ok: false, status: 429, error: 'Too many tries — wait a minute and open the link again' }
  }
  const code = normaliseCode(rawCode)
  const invalid = { ok: false as const, status: 404 as const, error: 'This link isn’t valid — ask the samiti for the current one' }
  if (!CODE_PATTERN.test(code)) return invalid
  const db = drizzle(env.DB, { schema })
  const [link] = await db
    .select()
    .from(schema.bhogLink)
    .where(and(eq(schema.bhogLink.code, code), isNull(schema.bhogLink.revokedAt)))
    .limit(1)
  if (!link) return invalid
  const [ev] = await db.select().from(schema.event).where(eq(schema.event.id, link.eventId)).limit(1)
  if (!ev || seasonOf(ev.startsOn) !== currentSeason())
    return { ok: false, status: 410, error: 'This link has closed — the season is over' }
  return { ok: true, ev, db }
}

const clientIp = (h: (name: string) => string | undefined) => h('cf-connecting-ip') ?? 'local'

/** The event and the households to pick from — the Responses list, names only. */
publicRoutes.get('/bhog/headcount', async (c) => {
  const o = await openLink(c.env, c.req.query('c'), clientIp((n) => c.req.header(n)))
  if (!o.ok) return c.json({ ok: false, error: o.error }, o.status)
  const { listed } = await responsesList(o.db, o.ev)
  return c.json(
    ok({
      eventId: o.ev.id as BhogLinkSheet['eventId'],
      eventName: `${o.ev.nameEn} ${o.ev.year}`,
      eventNameBn: o.ev.nameBn,
      households: listed.map((h) => ({ key: h.key, name: h.name, tier: h.tier })),
    } satisfies BhogLinkSheet),
  )
})

/** One household's form: its days, counts, allowance, and which days are still open. */
publicRoutes.get('/bhog/headcount/household', async (c) => {
  const o = await openLink(c.env, c.req.query('c'), clientIp((n) => c.req.header(n)))
  if (!o.ok) return c.json({ ok: false, error: o.error }, o.status)
  const { listed } = await responsesList(o.db, o.ev)
  const h = listed.find((x) => x.key === c.req.query('h'))
  if (!h) return c.json({ ok: false, error: 'Pick your household from the list' }, 404)
  return c.json(ok(await headcountView(o.db, o.ev, h)))
})

/**
 * Save one household's counts. Recorded against the household's contact
 * (whoever gave the most this season); the members' rules apply — the
 * allowance, and each day closing four days before it.
 */
publicRoutes.post('/bhog/headcount', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Partial<BhogLinkSaveInput>
  const o = await openLink(c.env, body.code, clientIp((n) => c.req.header(n)))
  if (!o.ok) return c.json({ ok: false, error: o.error }, o.status)
  const { listed, money } = await responsesList(o.db, o.ev)
  const h = listed.find((x) => x.key === body.householdKey)
  if (!h) return c.json({ ok: false, error: 'Pick your household from the list' }, 404)
  const result = await saveHeadcount(o.db, {
    ev: o.ev,
    household: h,
    writerId: contactOf(h, money).id,
    counts: Array.isArray(body.counts) ? body.counts : [],
    note: null,
    atCounter: false,
  })
  if (!result.ok) return c.json({ ok: false, error: result.error }, result.status)
  return c.json(ok(await headcountView(o.db, o.ev, h)))
})
