/**
 * The bhog count sheet of one event — household by household, day by day —
 * defined once, so the screen, the spreadsheet and the PDF always hold the
 * same households, the same counts and the same totals.
 *
 * Plates are family and guests together — what the caterer cooks for —
 * with guest bhog heads kept apart too, so they can be shown and charged.
 *
 * Every household that paid or pledged this season is listed, answered or
 * not: printed before anyone has answered, it is the blank sheet for the
 * counter. No PDF or spreadsheet code here; each builder loads its library
 * only on download.
 */
import type { BhogCountSheet, BhogMenuView, PujoEvent } from '@pujosamiti/shared'

export interface BhogReportInput {
  event: Pick<PujoEvent, 'id' | 'nameEn' | 'year'>
  /** The event's days, in serving order. */
  days: BhogMenuView[]
  sheet: BhogCountSheet
  /** Per-plate cost and the ₹ rows: fin_admin and admin only. */
  showMoney: boolean
}

export interface BhogReportDay {
  id: string
  label: string
  /** The column heading: the label without its trailing "Bhog" — the sheet's title says it. "Ashtami · Day-2" */
  heading: string
  /** ISO date */
  date: string
  /** "17 Oct" */
  shortDate: string
  perPlateCost: number | null
}

export interface BhogReportHousehold {
  key: string
  name: string
  tier: 'core' | 'member'
  /** Durga Pujo: counts above the household's allowance (a pledge cancelled after it answered). */
  overAllowance: boolean
  /** One per day, in day order; null = not answered. A family's is the sum of its people's. */
  counts: (number | null)[]
  /** Guest bhog heads per day, on top of `counts` (0 when none). */
  guests: number[]
  /** Guests across the days. */
  guestTotal: number
  /** Plates across the days: family and guests. */
  total: number
  /** The day-wise remarks, "Ashtami Bhog: paid for 4 guests; …" */
  remarks: string
}

export interface BhogReport {
  title: string
  /** "Durga Pujo 2026" */
  subtitle: string
  days: BhogReportDay[]
  households: BhogReportHousehold[]
  /** Households that have answered at least one day. */
  answered: number
  /** Plates per day — family and guests, what the caterer cooks for. */
  plates: number[]
  grandPlates: number
  /** Guest heads per day, and in all; any guests at all decides whether the Guests column shows. */
  guestPlates: number[]
  grandGuests: number
  /** Plates × per-plate ₹ per day, null where the day is unpriced; null altogether without showMoney. */
  money: (number | null)[] | null
  grandMoney: number | null
  showMoney: boolean
  /** "bhog-headcount-durga-pujo-2026" — the caller adds .pdf or .xlsx. */
  fileStem: string
}

const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' })

const heading = (label: string) => label.replace(/\s+Bhog$/i, '') || label

export function bhogReport({ event, days, sheet, showMoney }: BhogReportInput): BhogReport {
  const households = sheet.households.map((h) => {
    const rows = sheet.rows.filter((r) => r.householdKey === h.key)
    const counts = days.map((d) => {
      const mine = rows.filter((r) => r.menuId === d.id)
      return mine.length ? mine.reduce((s, r) => s + r.count, 0) : null
    })
    const guests = days.map((d) => rows.filter((r) => r.menuId === d.id).reduce((s, r) => s + r.guests, 0))
    const guestTotal = guests.reduce((s, n) => s + n, 0)
    const remarks = days
      .flatMap((d) => rows.filter((r) => r.menuId === d.id && r.notes).map((r) => `${heading(d.label)}: ${r.notes}`))
      .join('; ')
    return { ...h, counts, guests, guestTotal, total: counts.reduce<number>((s, n) => s + (n ?? 0), 0) + guestTotal, remarks }
  })
  const guestPlates = days.map((_, i) => households.reduce((s, h) => s + h.guests[i], 0))
  const plates = days.map((_, i) => households.reduce((s, h) => s + (h.counts[i] ?? 0), 0) + guestPlates[i])
  const money = showMoney ? days.map((d, i) => (d.perPlateCost != null ? plates[i] * d.perPlateCost : null)) : null
  return {
    title: 'Bhog headcount',
    subtitle: `${event.nameEn} ${event.year}`,
    days: days.map((d) => ({ id: d.id, label: d.label, heading: heading(d.label), date: d.date, shortDate: shortDate(d.date), perPlateCost: d.perPlateCost })),
    households,
    answered: households.filter((h) => h.counts.some((n) => n != null)).length,
    plates,
    grandPlates: plates.reduce((s, n) => s + n, 0),
    guestPlates,
    grandGuests: guestPlates.reduce((s, n) => s + n, 0),
    money,
    grandMoney: money?.some((m) => m != null) ? money.reduce<number>((s, m) => s + (m ?? 0), 0) : null,
    showMoney,
    fileStem: `bhog-headcount-${event.id}`,
  }
}
