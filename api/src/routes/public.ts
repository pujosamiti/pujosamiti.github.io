import type { ApiResult, PujoEvent, TimeTableEntry } from '@pujosamiti/shared'
import { asc, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'

import * as schema from '../db/schema'
import type { Env } from '../env'

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data }
}

export const publicRoutes = new Hono<{ Bindings: Env }>()

publicRoutes.get('/events', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  // soonest first, so the current season tops the chooser
  const rows = await db.select().from(schema.event).orderBy(asc(schema.event.startsOn))
  return c.json(ok(rows as unknown as PujoEvent[]))
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
