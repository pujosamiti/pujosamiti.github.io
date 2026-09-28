import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'

import * as schema from '../db/schema'

type DB = ReturnType<typeof drizzle<typeof schema>>

/**
 * Households for bhog: a family, or the person when they belong to none.
 * `family` gates nothing elsewhere — here it is the unit a headcount, a
 * coupon allowance and a link belong to. One definition, used by the count
 * sheet, the link list and every headcount form.
 */
export interface HouseholdPerson {
  id: string
  name: string
  tier: 'non_member' | 'member' | 'core'
  familyId: string | null
  familyName: string | null
  phone: string | null
}

export interface Household {
  /** family id, or person id for someone without a family */
  key: string
  name: string
  people: HouseholdPerson[]
  /** core when anyone in it is core */
  tier: 'core' | 'member'
}

export interface Households {
  byKey: Map<string, Household>
  /** person id → household key */
  keyOf: Map<string, string>
}

export async function loadHouseholds(db: DB): Promise<Households> {
  const people = await db
    .select({
      id: schema.person.id,
      name: schema.person.displayName,
      tier: schema.person.tier,
      familyId: schema.person.familyId,
      familyName: schema.family.name,
      phone: schema.person.phone,
    })
    .from(schema.person)
    .leftJoin(schema.family, eq(schema.family.id, schema.person.familyId))
  const byKey = new Map<string, Household>()
  const keyOf = new Map<string, string>()
  for (const p of people) {
    const key = p.familyId ?? p.id
    keyOf.set(p.id, key)
    const h = byKey.get(key) ?? { key, name: p.familyName ?? p.name, people: [], tier: 'member' as const }
    h.people.push(p)
    if (p.tier === 'core') h.tier = 'core'
    byKey.set(key, h)
  }
  return { byKey, keyOf }
}

/** A household's season money: the sum over its people (see seasonMoney). */
export const householdTotal = (h: Household, money: Map<string, number>) =>
  h.people.reduce((s, p) => s + (money.get(p.id) ?? 0), 0)

/**
 * The household's contact: whoever gave the most this season, core before
 * member on a tie, then by name. A link's counts are saved against them.
 */
export function contactOf(h: Household, money: Map<string, number>): HouseholdPerson {
  const rank = { core: 0, member: 1, non_member: 2 } as const
  return [...h.people].sort(
    (a, b) =>
      (money.get(b.id) ?? 0) - (money.get(a.id) ?? 0) || rank[a.tier] - rank[b.tier] || a.name.localeCompare(b.name),
  )[0]!
}
