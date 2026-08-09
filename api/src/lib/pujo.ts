import { and, eq } from 'drizzle-orm'
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
