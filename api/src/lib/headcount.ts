import type { BhogAllowance, BhogHeadcountView, BhogSettingInfo, GuestBhogSheet } from '@pujosamiti/shared'
import {
  BHOG_GUEST_CAP,
  GUEST_BHOG_SUBCATEGORY,
  bhogAllowance,
  bhogAllowanceText,
  bhogDayOpen,
  bhogFits,
  bhogLastChange,
  seasonOf,
} from '@pujosamiti/shared'
import { and, asc, eq, gte, inArray, isNull, lt, or, sum } from 'drizzle-orm'
import type { BatchItem } from 'drizzle-orm/batch'
import { drizzle } from 'drizzle-orm/d1'

import * as schema from '../db/schema'
import { type Household, contactOf, householdTotal, loadHouseholds } from './households'
import { currentSeason } from './pujo'
import { seasonMoney } from './roll'

type DB = ReturnType<typeof drizzle<typeof schema>>
type Event = typeof schema.event.$inferSelect

/**
 * A household's headcount for one event, and the rules for changing it —
 * one implementation behind the ?c= link, the signed-in member's form and
 * the admin's counter entry, so all three answer alike.
 *
 * Durga Pujo carries the coupon rules (shared: bhogAllowance): a family's
 * season money sets how many may come, and each day closes BHOG_CUTOFF_DAYS
 * before it. A core household (₹10,000+) may also bring guests — office
 * colleagues and friends, up to BHOG_GUEST_CAP a day — paid per head at the
 * event's guest rate (bhog_setting). Other occasions keep the old way — any
 * member, any count, open until the season closes, no guests.
 */

const isDurga = (ev: Event) => ev.kind === 'durga-pujo'

/** The event's published days, in serving order. The form is for counts — the menus live on /bhog. */
const publishedDays = (db: DB, ev: Event) =>
  db
    .select()
    .from(schema.bhogMenu)
    .where(and(eq(schema.bhogMenu.eventId, ev.id), eq(schema.bhogMenu.isPublished, true)))
    .orderBy(asc(schema.bhogMenu.date), asc(schema.bhogMenu.sortOrder))

/** The household's rows on these days: count and guests per day (the sum of its people's rows) and any remark. */
async function householdRows(db: DB, menuIds: string[], h: Household) {
  const rows =
    menuIds.length && h.people.length
      ? await db
          .select()
          .from(schema.bhogRsvp)
          .where(
            and(
              inArray(schema.bhogRsvp.menuId, menuIds),
              inArray(
                schema.bhogRsvp.personId,
                h.people.map((p) => p.id),
              ),
            ),
          )
      : []
  const count = new Map<string, number>()
  const guests = new Map<string, number>()
  const note = new Map<string, string>()
  for (const r of rows) {
    count.set(r.menuId, (count.get(r.menuId) ?? 0) + r.count)
    guests.set(r.menuId, (guests.get(r.menuId) ?? 0) + r.guests)
    if (r.notes) note.set(r.menuId, r.notes)
  }
  return { count, guests, note }
}

/**
 * The Responses list of one event — the households the count sheet shows and
 * the link's picker offers, in the same order: every household where someone
 * paid a subscription or sponsorship, or pledged one, in the event's season,
 * plus any household that has already answered (a counter entry never drops
 * out). Core first, then by name. Lifetime members who no longer pay aren't
 * on it.
 */
export async function responsesList(db: DB, ev: Event) {
  const menus = await db
    .select({ id: schema.bhogMenu.id })
    .from(schema.bhogMenu)
    .where(eq(schema.bhogMenu.eventId, ev.id))
    .orderBy(asc(schema.bhogMenu.date), asc(schema.bhogMenu.sortOrder))
  const rsvps = menus.length
    ? await db
        .select()
        .from(schema.bhogRsvp)
        .where(inArray(schema.bhogRsvp.menuId, menus.map((m) => m.id)))
    : []
  const { byKey, keyOf } = await loadHouseholds(db)
  const money = await seasonMoney(db, seasonOf(ev.startsOn))
  const answered = new Set(rsvps.map((r) => keyOf.get(r.personId) ?? r.personId))
  const listed = [...byKey.values()]
    .filter((h) => answered.has(h.key) || h.people.some((p) => money.has(p.id)))
    .sort((a, b) => (a.tier === b.tier ? a.name.localeCompare(b.name) : a.tier === 'core' ? -1 : 1))
  return { menus, rsvps, listed, keyOf, money }
}

/** The household's allowance for this event: Durga Pujo only, from its season money. */
export async function allowanceFor(db: DB, ev: Event, h: Household): Promise<BhogAllowance | null> {
  if (!isDurga(ev)) return null
  return bhogAllowance(householdTotal(h, await seasonMoney(db, seasonOf(ev.startsOn))))
}

/** The event's bhog settings — the Food & Bhog in-charge (with name) and the guest rate. */
export async function bhogSettingOf(db: DB, eventId: string): Promise<BhogSettingInfo> {
  const [row] = await db
    .select({
      inchargePersonId: schema.bhogSetting.inchargePersonId,
      guestRate: schema.bhogSetting.guestRate,
      inchargeName: schema.person.displayName,
    })
    .from(schema.bhogSetting)
    .leftJoin(schema.person, eq(schema.person.id, schema.bhogSetting.inchargePersonId))
    .where(eq(schema.bhogSetting.eventId, eventId))
    .limit(1)
  return {
    inchargePersonId: row?.inchargePersonId ?? null,
    inchargeName: row?.inchargeName ?? null,
    guestRate: row?.guestRate ?? null,
  }
}

/**
 * Guest bhog money received, by payer: active pujo-ledger entries under
 * misc_income · Guest Bhog tagged to this event — or untagged but dated in
 * its season, for entries typed without the ledger form's toggle. The ledger
 * is the only record: void an entry there and the balance reopens here.
 */
export async function guestReceivedByPerson(db: DB, ev: Event): Promise<Map<string, number>> {
  const season = seasonOf(ev.startsOn)
  const e = schema.ledgerEntry
  const rows = await db
    .select({ personId: e.personId, total: sum(e.amount) })
    .from(e)
    .where(
      and(
        eq(e.bookId, 'pujo-ledger'),
        eq(e.kind, 'contribution'),
        eq(e.category, 'misc_income'),
        eq(e.subCategory, GUEST_BHOG_SUBCATEGORY),
        eq(e.isActive, true),
        or(
          eq(e.eventId, ev.id),
          and(isNull(e.eventId), gte(e.entryDate, `${season}-07-01`), lt(e.entryDate, `${season + 1}-07-01`)),
        ),
      ),
    )
    .groupBy(e.personId)
  const out = new Map<string, number>()
  for (const r of rows) if (r.personId) out.set(r.personId, Number(r.total ?? 0))
  return out
}

/** Guest bhog is open to a household: Durga Pujo, a guest rate set, and ₹10,000+ this season (core). */
const guestsAllowed = (ev: Event, allowance: BhogAllowance | null, setting: BhogSettingInfo) =>
  isDurga(ev) && allowance?.kind === 'per_day' && setting.guestRate != null

export async function headcountView(db: DB, ev: Event, h: Household, now = new Date()): Promise<BhogHeadcountView> {
  const days = await publishedDays(db, ev)
  const { count, guests } = await householdRows(
    db,
    days.map((d) => d.id),
    h,
  )
  const allowance = await allowanceFor(db, ev, h)
  const setting = await bhogSettingOf(db, ev.id)
  const heads = days.reduce((s, d) => s + (guests.get(d.id) ?? 0), 0)
  const canAdd = guestsAllowed(ev, allowance, setting)
  let guestBhog: BhogHeadcountView['guestBhog'] = null
  // Shown to core households; to anyone else only while guests or payments
  // are already on record, so they can see them — and bring them down.
  if (setting.guestRate != null && isDurga(ev)) {
    const received = await guestReceivedByPerson(db, ev)
    const got = h.people.reduce((s, p) => s + (received.get(p.id) ?? 0), 0)
    if (canAdd || heads > 0 || got > 0)
      guestBhog = {
        canAdd,
        rate: setting.guestRate,
        inchargeName: setting.inchargeName,
        heads,
        due: heads * setting.guestRate,
        received: got,
      }
  }
  return {
    eventId: ev.id as BhogHeadcountView['eventId'],
    eventName: `${ev.nameEn} ${ev.year}`,
    eventNameBn: ev.nameBn,
    household: { key: h.key, name: h.name },
    allowance,
    overAllowance: !!allowance && !bhogFits(allowance, days.map((d) => count.get(d.id) ?? 0)),
    days: days.map((d) => ({
      menuId: d.id,
      date: d.date,
      label: d.label,
      labelBn: d.labelBn,
      count: count.get(d.id) ?? null,
      guests: guests.get(d.id) ?? 0,
      open: !isDurga(ev) || bhogDayOpen(d.date, now),
      lastChange: isDurga(ev) ? bhogLastChange(d.date) : d.date,
    })),
    guestBhog,
  }
}

/**
 * The guest bhog board of one event (admin / fin_admin): every listed
 * household with guests on record or guest money received — guests by day,
 * what is due at the event's rate, what the ledger shows received, and the
 * balance. No refunds: an overpaid household simply shows a negative balance.
 */
export async function guestBoard(db: DB, ev: Event): Promise<GuestBhogSheet> {
  const setting = await bhogSettingOf(db, ev.id)
  const days = await publishedDays(db, ev)
  const { rsvps, listed, money } = await responsesList(db, ev)
  const received = await guestReceivedByPerson(db, ev)
  const rate = setting.guestRate ?? 0
  const rows = listed
    .map((h) => {
      const ids = new Set(h.people.map((p) => p.id))
      const guestsByDay = days.map((d) =>
        rsvps.filter((r) => r.menuId === d.id && ids.has(r.personId)).reduce((s, r) => s + r.guests, 0),
      )
      const heads = guestsByDay.reduce((s, n) => s + n, 0)
      const got = h.people.reduce((s, p) => s + (received.get(p.id) ?? 0), 0)
      return {
        householdKey: h.key,
        name: h.name,
        contactPersonId: contactOf(h, money).id,
        guestsByDay,
        heads,
        due: heads * rate,
        received: got,
        balance: heads * rate - got,
      }
    })
    .filter((r) => r.heads > 0 || r.received > 0)
  const eligible = listed
    .filter((h) => bhogAllowance(householdTotal(h, money)).kind === 'per_day')
    .map((h) => ({ householdKey: h.key, name: h.name, contactPersonId: contactOf(h, money).id }))
    .sort((a, b) => a.name.localeCompare(b.name))
  return { setting, days: days.map((d) => ({ menuId: d.id, label: d.label, date: d.date })), rows, eligible }
}

const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' })

export type SaveResult = { ok: true; saved: number } | { ok: false; status: 400 | 403; error: string }

/**
 * Save a household's counts. The household keeps ONE row per day: whatever
 * its people had on a day is replaced by a single row recorded against
 * `writerId` (the member answering, the person an admin picked, or the link's
 * contact).
 *
 * - Counts are whole numbers 0–99, guests 0–BHOG_GUEST_CAP; a day not in
 *   `counts` is left as it is, and so are its guests when `guests` is absent.
 * - Durga Pujo: a closed day can't change, except at the counter
 *   (`atCounter`, admin / fin_admin). The allowance holds for everyone.
 * - Counts that are already over the allowance — a pledge cancelled after
 *   they were given — stand, and may come down, but no day may go up until
 *   the whole fits again. Guests likewise: only a core household may add
 *   them; anyone may bring them down.
 */
export async function saveHeadcount(
  db: DB,
  {
    ev,
    household: h,
    writerId,
    counts,
    note,
    atCounter,
    now = new Date(),
  }: {
    ev: Event
    household: Household
    writerId: string
    counts: { menuId: string; count: number; guests?: number }[]
    note: string | null
    atCounter: boolean
    now?: Date
  },
): Promise<SaveResult> {
  if (seasonOf(ev.startsOn) !== currentSeason())
    return { ok: false, status: 400, error: 'this season is closed — counts are the record now' }
  const days = await publishedDays(db, ev)
  const byId = new Map(days.map((d) => [d.id, d]))
  const current = await householdRows(
    db,
    days.map((d) => d.id),
    h,
  )

  const proposed = new Map(current.count)
  const changes: { menuId: string; count: number; guests: number }[] = []
  for (const entry of counts) {
    const d = byId.get(entry.menuId)
    if (!d) continue // unpublished or another event's day
    const n = Number(entry.count)
    if (!Number.isInteger(n) || n < 0 || n > 99)
      return { ok: false, status: 400, error: `${d.label}: give a whole number from 0 to 99` }
    const wasGuests = current.guests.get(d.id) ?? 0
    const g = entry.guests === undefined ? wasGuests : Number(entry.guests)
    if (!Number.isInteger(g) || g < 0 || g > BHOG_GUEST_CAP)
      return { ok: false, status: 400, error: `${d.label}: guests from 0 to ${BHOG_GUEST_CAP}` }
    const was = current.count.get(d.id)
    const same = n === was && g === wasGuests
    if (isDurga(ev) && !atCounter && !bhogDayOpen(d.date, now)) {
      if (same) continue
      return {
        ok: false,
        status: 400,
        error: `${d.label} closed on ${shortDate(bhogLastChange(d.date))} — ask the samiti to change it`,
      }
    }
    if (same && !note) continue
    proposed.set(d.id, n)
    changes.push({ menuId: d.id, count: n, guests: g })
  }
  if (changes.length === 0) return { ok: true, saved: 0 }

  const allowance = await allowanceFor(db, ev, h)
  if (allowance) {
    const all = days.map((d) => proposed.get(d.id) ?? 0)
    const rises = changes.some((c) => c.count > (current.count.get(c.menuId) ?? 0))
    if (!bhogFits(allowance, all) && rises) {
      if (allowance.kind === 'coupons' && allowance.coupons === 0)
        return {
          ok: false,
          status: 403,
          error: 'No bhog coupons for this household yet — they come with the season’s subscription or sponsorship',
        }
      if (allowance.kind === 'per_day') {
        const over = days.find((d) => (proposed.get(d.id) ?? 0) > allowance.perDay)!
        return { ok: false, status: 400, error: `${bhogAllowanceText(allowance, days.length)} — ${over.label} has ${proposed.get(over.id)}` }
      }
      const asked = all.reduce((s, n) => s + n, 0)
      return {
        ok: false,
        status: 400,
        error: `${asked} coupons asked for, ${allowance.coupons} available for the ${days.length} days`,
      }
    }
  }
  if (changes.some((c) => c.guests > (current.guests.get(c.menuId) ?? 0))) {
    const setting = await bhogSettingOf(db, ev.id)
    if (!guestsAllowed(ev, allowance, setting))
      return {
        ok: false,
        status: 403,
        error:
          isDurga(ev) && setting.guestRate != null
            ? 'Guest bhog is for core households — ₹10,000 or more this season'
            : 'Guest bhog isn’t open for this event',
      }
  }

  // One batch, so a household never ends up half-saved: its old rows for a
  // day go and the single new one lands together.
  const ids = h.people.map((p) => p.id)
  const at = now.toISOString()
  const writes: BatchItem<'sqlite'>[] = changes.flatMap((c) => [
    db.delete(schema.bhogRsvp).where(and(eq(schema.bhogRsvp.menuId, c.menuId), inArray(schema.bhogRsvp.personId, ids))),
    db.insert(schema.bhogRsvp).values({
      id: crypto.randomUUID(),
      menuId: c.menuId,
      personId: writerId,
      count: c.count,
      guests: c.guests,
      notes: note ?? current.note.get(c.menuId) ?? null,
      updatedAt: at,
    }),
  ])
  await db.batch(writes as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]])
  return { ok: true, saved: changes.length }
}

// ── Link codes ──────────────────────────────────────────────────────────────

/** No I or O, which read as 1 and 0 when typed off a phone screen. */
const CODE_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
export const CODE_PATTERN = /^[A-HJ-NP-Z]\d{6}$/

/** "X481216": a letter and six digits, from the Worker's CSPRNG. */
export function newCode(): string {
  const [a, b] = crypto.getRandomValues(new Uint32Array(2))
  return CODE_LETTERS[a! % CODE_LETTERS.length] + String(b! % 1_000_000).padStart(6, '0')
}

/** Tidy what someone typed or pasted: spaces out, letters up. */
export const normaliseCode = (raw: string | undefined | null) => (raw ?? '').replace(/\s+/g, '').toUpperCase()
