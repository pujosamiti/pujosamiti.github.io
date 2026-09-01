import { CORE_CONTRIBUTION_THRESHOLD } from '@pujosamiti/shared'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'

import * as schema from '../db/schema'

type DB = ReturnType<typeof drizzle<typeof schema>>

/**
 * The automatic membership rule for counter entries: recording participation
 * for someone updates the roll to match reality. A recorded subscription or
 * sponsorship of ≥ ₹CORE_CONTRIBUTION_THRESHOLD makes them CORE; any other
 * recorded participation (smaller payment, headcount) makes a non-member a
 * MEMBER; someone who had left is reactivated. Upgrades only — never
 * demotes, never touches admin/fin flags.
 */
export async function applyParticipationRule(
  db: DB,
  personId: string,
  contribution?: { amount: number; category: string | null },
): Promise<'core' | 'member' | 'reactivated' | null> {
  const [p] = await db
    .select({ tier: schema.person.tier, isActive: schema.person.isActive })
    .from(schema.person)
    .where(eq(schema.person.id, personId))
    .limit(1)
  if (!p) return null
  const coreQualifies =
    !!contribution &&
    (contribution.category === 'subscription' || contribution.category === 'sponsorship') &&
    contribution.amount >= CORE_CONTRIBUTION_THRESHOLD
  const target: 'core' | 'member' | null =
    coreQualifies && p.tier !== 'core' ? 'core' : p.tier === 'non_member' ? 'member' : null
  const revive = !p.isActive
  if (!target && !revive) return null
  await db
    .update(schema.person)
    .set({ ...(target ? { tier: target } : {}), ...(revive ? { isActive: true } : {}) })
    .where(eq(schema.person.id, personId))
  return target ?? 'reactivated'
}
