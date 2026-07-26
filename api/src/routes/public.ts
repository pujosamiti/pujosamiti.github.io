import type {
  ApiResult,
  GalleryItem,
  Notice,
  PujoEvent,
  TimeTableEntry,
} from '@pujosamiti/shared'
import { GALLERY_MAX_ITEMS } from '@pujosamiti/shared'
import { asc, desc, eq } from 'drizzle-orm'
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

publicRoutes.get('/notices', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  const pinnedOnly = c.req.query('pinned') === 'true'
  const rows = await db
    .select()
    .from(schema.notice)
    .where(pinnedOnly ? eq(schema.notice.pinned, true) : undefined)
    .orderBy(desc(schema.notice.pinned), desc(schema.notice.publishedAt))
    .limit(pinnedOnly ? 5 : 100)
  const notices: Notice[] = rows.map((r) => ({
    ...r,
    eventId: r.eventId as Notice['eventId'],
    publishedAt: r.publishedAt.toISOString(),
  }))
  return c.json(ok(notices))
})

publicRoutes.get('/timetable', async (c) => {
  const eventId = c.req.query('event')
  if (!eventId) return c.json({ ok: false, error: 'event query param required' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const rows = await db
    .select()
    .from(schema.timetableEntry)
    .where(eq(schema.timetableEntry.eventId, eventId))
    .orderBy(asc(schema.timetableEntry.sortOrder), asc(schema.timetableEntry.startsAt))
  return c.json(ok(rows as unknown as TimeTableEntry[]))
})

publicRoutes.get('/gallery', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  const rows = await db
    .select()
    .from(schema.galleryItem)
    .orderBy(asc(schema.galleryItem.sortOrder))
    .limit(GALLERY_MAX_ITEMS)
  return c.json(ok(rows as unknown as GalleryItem[]))
})
