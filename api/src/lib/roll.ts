import { CORE_CONTRIBUTION_THRESHOLD, seasonOf } from '@pujosamiti/shared'
import { and, eq, gte, inArray, lt, sum } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'

import * as schema from '../db/schema'

type DB = ReturnType<typeof drizzle<typeof schema>>

/**
 * Who QUALIFIES for core — never who IS core. A person whose puja
 * subscriptions and puja sponsorships in one season (1 July → 30 June; active
 * entries in the pujo ledger) total ≥ ₹CORE_CONTRIBUTION_THRESHOLD qualifies.
 * Donations, food coupons and the Poila Baishakh book don't count.
 *
 * Nothing here writes to `person`. Tier and active status change only when an
 * admin sets them on /membership; these figures are shown there as a marker
 * so the admin can decide.
 */

/** What counts toward core: puja subscriptions and puja sponsorships, nothing else. */
const CORE_CATEGORIES = ['subscription', 'sponsorship']

const seasonFilter = (season: number) =>
  and(
    eq(schema.ledgerEntry.bookId, 'pujo-ledger'),
    eq(schema.ledgerEntry.kind, 'contribution'),
    eq(schema.ledgerEntry.isActive, true),
    inArray(schema.ledgerEntry.category, CORE_CATEGORIES),
    gte(schema.ledgerEntry.entryDate, `${season}-07-01`),
    lt(schema.ledgerEntry.entryDate, `${season + 1}-07-01`),
  )

/**
 * Everyone who qualifies for core in a season but isn't core yet, with their
 * season total. One grouped query — cheap enough for every roster load.
 */
export async function coreQualifiers(db: DB, season: number): Promise<Map<string, number>> {
  const rows = await db
    .select({ personId: schema.ledgerEntry.personId, total: sum(schema.ledgerEntry.amount), tier: schema.person.tier })
    .from(schema.ledgerEntry)
    .innerJoin(schema.person, eq(schema.person.id, schema.ledgerEntry.personId))
    .where(seasonFilter(season))
    .groupBy(schema.ledgerEntry.personId)
  const out = new Map<string, number>()
  for (const r of rows) {
    const total = Number(r.total ?? 0)
    if (r.personId && r.tier !== 'core' && total >= CORE_CONTRIBUTION_THRESHOLD) out.set(r.personId, total)
  }
  return out
}

/**
 * Does this person qualify for core in the season of `paidOn` without being
 * core? The ledger reports it after a contribution is saved; it changes nothing.
 */
export async function qualifiesForCore(db: DB, personId: string, paidOn: string): Promise<boolean> {
  const [p] = await db
    .select({ tier: schema.person.tier })
    .from(schema.person)
    .where(eq(schema.person.id, personId))
    .limit(1)
  if (!p || p.tier === 'core') return false
  const [row] = await db
    .select({ total: sum(schema.ledgerEntry.amount) })
    .from(schema.ledgerEntry)
    .where(and(eq(schema.ledgerEntry.personId, personId), seasonFilter(seasonOf(paidOn))))
  return Number(row?.total ?? 0) >= CORE_CONTRIBUTION_THRESHOLD
}
