import { and, asc, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'

import * as schema from '../db/schema'

type DB = ReturnType<typeof drizzle<typeof schema>>

/**
 * The one pujo year open for edits — the event an admin has marked active.
 * Everything before it is history: the sponsorship board, the task plan and
 * their assignments are read-only, so a stray tap can never rewrite what a
 * past year's team actually did.
 */
export async function activePujoYear(db: DB): Promise<number | null> {
  const [active] = await db
    .select({ year: schema.event.year })
    .from(schema.event)
    .where(and(eq(schema.event.kind, 'durga-pujo'), eq(schema.event.isActive, true)))
  return active?.year ?? null
}

/** Canonical tithi for a nirghanto day label; null for non-pujo days (Mahalaya, Lakshmi Puja). */
export function tithiOf(label: string): string | null {
  const l = label.toLowerCase()
  if (l.includes('panchami')) return 'Panchami'
  if (l.includes('shashthi') || l.includes('sashthi') || l.includes('sasthi')) return 'Shashthi'
  if (l.includes('saptami')) return 'Saptami'
  if (l.includes('ashtami')) return 'Ashtami'
  if (l.includes('nabami') || l.includes('navami')) return 'Nabami'
  if (l.includes('dashami')) return 'Dashami'
  return null
}

export interface DerivedDay {
  date: string
  labelEn: string
  labelBn: string | null
  sourceLabel: string
  sortOrder: number
}

/**
 * The days of the pujo as the nirghanto states them: Panchami → Dashami in
 * tithi-date order, one entry per calendar day, duplicated tithis suffixed
 * ("Ashtami · Day 2" in an Adhik Diba year). Mahalaya and Lakshmi Puja rows
 * are not pujo days and are skipped.
 */
export async function deriveDaysFromNirghanto(db: DB, eventId: string): Promise<DerivedDay[]> {
  const rows = await db
    .select({
      dayDate: schema.timetableEntry.dayDate,
      labelEn: schema.timetableEntry.dayLabelEn,
      labelBn: schema.timetableEntry.dayLabelBn,
    })
    .from(schema.timetableEntry)
    .where(eq(schema.timetableEntry.eventId, eventId))
    .orderBy(asc(schema.timetableEntry.dayDate), asc(schema.timetableEntry.sortOrder))
  // A tithi-day, not a calendar day: in a crunched year two tithis share one
  // date (2024: Oct 10 was Saptami AND Ashtami) — dedupe by (date, label).
  const byDay = new Map<string, { date: string; labelEn: string; labelBn: string | null }>()
  for (const r of rows) {
    const key = `${r.dayDate}|${r.labelEn}`
    if (!byDay.has(key)) byDay.set(key, { date: r.dayDate, labelEn: r.labelEn, labelBn: r.labelBn })
  }
  const out: DerivedDay[] = []
  const seen: Record<string, number> = {}
  for (const { date, labelEn, labelBn } of [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date))) {
    const base = tithiOf(labelEn)
    if (!base) continue
    seen[base] = (seen[base] ?? 0) + 1
    out.push({
      date,
      labelEn: seen[base] > 1 ? `${base} · Day ${seen[base]}` : base,
      labelBn,
      sourceLabel: labelEn,
      sortOrder: (out.length + 1) * 10,
    })
  }
  return out
}

/** The nirghanto's Sandhi Puja row (ritual within a day), if present. */
export async function sandhiRow(db: DB, eventId: string) {
  const rows = await db
    .select()
    .from(schema.timetableEntry)
    .where(eq(schema.timetableEntry.eventId, eventId))
  return rows.find((r) => /sandhi/i.test(r.titleEn) || r.titleBn.includes('সন্ধি')) ?? null
}

/** Samiti season of an ISO date: 1 July → 30 June, named by its starting year. */
export function seasonOf(iso: string): number {
  const y = Number(iso.slice(0, 4))
  const m = Number(iso.slice(5, 7))
  return m >= 7 ? y : y - 1
}

/** The season we are in today. */
export function currentSeason(): number {
  return seasonOf(new Date().toISOString().slice(0, 10))
}
