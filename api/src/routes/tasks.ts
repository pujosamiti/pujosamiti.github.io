import type { ApiResult, Me, TaskInput, TaskPhase, TaskView } from '@pujosamiti/shared'
import { TASK_MAX_OWNERS } from '@pujosamiti/shared'
import { and, asc, eq, inArray } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'

import * as schema from '../db/schema'
import type { Env } from '../env'

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data }
}

const PHASES: TaskPhase[] = ['initiated', 'in_progress', 'completed']

/**
 * Task distribution. Mounted under the member gate (/api/members/tasks):
 * every member can view and volunteer themselves; core members and admins
 * create/edit/delete; owners can also move their task's phase.
 */
export const taskRoutes = new Hono<{ Bindings: Env; Variables: { me: Me } }>()

const canEdit = (me: Me) => me.role !== 'member'

async function loadTasks(db: ReturnType<typeof drizzle<typeof schema>>, eventId?: string) {
  const tasks = await db
    .select()
    .from(schema.task)
    .where(eventId ? eq(schema.task.eventId, eventId) : undefined)
    .orderBy(asc(schema.task.createdAt))
  if (!tasks.length) return []
  const assignments = await db
    .select({ a: schema.taskAssignment, name: schema.person.displayName })
    .from(schema.taskAssignment)
    .innerJoin(schema.person, eq(schema.taskAssignment.personId, schema.person.id))
    .where(inArray(schema.taskAssignment.taskId, tasks.map((t) => t.id)))
  const out: TaskView[] = tasks.map((t) => ({
    id: t.id,
    eventId: t.eventId as TaskView['eventId'],
    title: t.title,
    details: t.details,
    phase: t.phase,
    checks: [
      { date: t.check1Date, notes: t.check1Notes },
      { date: t.check2Date, notes: t.check2Notes },
      { date: t.check3Date, notes: t.check3Notes },
    ],
    owners: assignments
      .filter((x) => x.a.taskId === t.id && x.a.role === 'owner')
      .map((x) => ({ id: x.a.personId, name: x.name })),
    volunteers: assignments
      .filter((x) => x.a.taskId === t.id && x.a.role === 'volunteer')
      .map((x) => ({ id: x.a.personId, name: x.name })),
  }))
  return out
}

function taskValues(body: TaskInput) {
  const checks = [0, 1, 2].map((i) => body.checks?.[i] ?? { date: null, notes: null })
  return {
    title: body.title.trim(),
    details: body.details?.trim() || null,
    phase: PHASES.includes(body.phase) ? body.phase : ('initiated' as const),
    check1Date: checks[0].date || null,
    check1Notes: checks[0].notes?.trim() || null,
    check2Date: checks[1].date || null,
    check2Notes: checks[1].notes?.trim() || null,
    check3Date: checks[2].date || null,
    check3Notes: checks[2].notes?.trim() || null,
  }
}

async function replaceAssignments(
  db: ReturnType<typeof drizzle<typeof schema>>,
  taskId: string,
  ownerIds: string[],
  volunteerIds: string[],
) {
  const owners = [...new Set(ownerIds ?? [])]
  const volunteers = [...new Set(volunteerIds ?? [])].filter((v) => !owners.includes(v))
  await db.delete(schema.taskAssignment).where(eq(schema.taskAssignment.taskId, taskId))
  const rows = [
    ...owners.map((personId) => ({ id: crypto.randomUUID(), taskId, personId, role: 'owner' as const })),
    ...volunteers.map((personId) => ({ id: crypto.randomUUID(), taskId, personId, role: 'volunteer' as const })),
  ]
  if (rows.length) await db.insert(schema.taskAssignment).values(rows)
}

taskRoutes.get('/', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  return c.json(ok(await loadTasks(db, c.req.query('event') || undefined)))
})

taskRoutes.post('/', async (c) => {
  if (!canEdit(c.get('me'))) return c.json({ ok: false, error: 'core members only' }, 403)
  const body = (await c.req.json()) as TaskInput
  if (!body.title?.trim()) return c.json({ ok: false, error: 'title is required' }, 400)
  if ((body.ownerIds ?? []).length > TASK_MAX_OWNERS)
    return c.json({ ok: false, error: `at most ${TASK_MAX_OWNERS} owners` }, 400)
  const db = drizzle(c.env.DB, { schema })
  const [ev] = await db.select({ id: schema.event.id }).from(schema.event).where(eq(schema.event.id, body.eventId)).limit(1)
  if (!ev) return c.json({ ok: false, error: 'event not found' }, 404)
  const id = crypto.randomUUID()
  await db.insert(schema.task).values({ id, eventId: body.eventId, createdAt: new Date(), ...taskValues(body) })
  await replaceAssignments(db, id, body.ownerIds ?? [], body.volunteerIds ?? [])
  return c.json(ok({ id }))
})

taskRoutes.post('/:id', async (c) => {
  if (!canEdit(c.get('me'))) return c.json({ ok: false, error: 'core members only' }, 403)
  const body = (await c.req.json()) as TaskInput
  if (!body.title?.trim()) return c.json({ ok: false, error: 'title is required' }, 400)
  if ((body.ownerIds ?? []).length > TASK_MAX_OWNERS)
    return c.json({ ok: false, error: `at most ${TASK_MAX_OWNERS} owners` }, 400)
  const db = drizzle(c.env.DB, { schema })
  const id = c.req.param('id')
  const [t] = await db.select({ id: schema.task.id }).from(schema.task).where(eq(schema.task.id, id)).limit(1)
  if (!t) return c.json({ ok: false, error: 'task not found' }, 404)
  await db.update(schema.task).set(taskValues(body)).where(eq(schema.task.id, id))
  await replaceAssignments(db, id, body.ownerIds ?? [], body.volunteerIds ?? [])
  return c.json(ok({ id }))
})

/** Owners may move their task through phases even if not core members. */
taskRoutes.post('/:id/phase', async (c) => {
  const me = c.get('me')
  const phase = ((await c.req.json()) as { phase: TaskPhase }).phase
  if (!PHASES.includes(phase)) return c.json({ ok: false, error: 'invalid phase' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const id = c.req.param('id')
  const [t] = await db.select({ id: schema.task.id }).from(schema.task).where(eq(schema.task.id, id)).limit(1)
  if (!t) return c.json({ ok: false, error: 'task not found' }, 404)
  if (!canEdit(me)) {
    const [own] = await db
      .select({ id: schema.taskAssignment.id })
      .from(schema.taskAssignment)
      .where(
        and(
          eq(schema.taskAssignment.taskId, id),
          eq(schema.taskAssignment.personId, me.personId),
          eq(schema.taskAssignment.role, 'owner'),
        ),
      )
      .limit(1)
    if (!own) return c.json({ ok: false, error: 'owners only' }, 403)
  }
  await db.update(schema.task).set({ phase }).where(eq(schema.task.id, id))
  return c.json(ok({ id, phase }))
})

/** Any member can volunteer themselves (or withdraw). */
taskRoutes.post('/:id/volunteer', async (c) => {
  const me = c.get('me')
  const join = ((await c.req.json()) as { join: boolean }).join
  const db = drizzle(c.env.DB, { schema })
  const id = c.req.param('id')
  const [t] = await db.select({ id: schema.task.id }).from(schema.task).where(eq(schema.task.id, id)).limit(1)
  if (!t) return c.json({ ok: false, error: 'task not found' }, 404)
  const mine = and(eq(schema.taskAssignment.taskId, id), eq(schema.taskAssignment.personId, me.personId))
  const [existing] = await db.select().from(schema.taskAssignment).where(mine).limit(1)
  if (join) {
    if (existing) return c.json(ok({ joined: true })) // already owner or volunteer
    await db
      .insert(schema.taskAssignment)
      .values({ id: crypto.randomUUID(), taskId: id, personId: me.personId, role: 'volunteer' })
    return c.json(ok({ joined: true }))
  }
  if (existing?.role === 'owner') return c.json({ ok: false, error: 'owners cannot withdraw; ask a core member' }, 400)
  await db.delete(schema.taskAssignment).where(and(mine, eq(schema.taskAssignment.role, 'volunteer')))
  return c.json(ok({ joined: false }))
})

taskRoutes.delete('/:id', async (c) => {
  if (!canEdit(c.get('me'))) return c.json({ ok: false, error: 'core members only' }, 403)
  const db = drizzle(c.env.DB, { schema })
  const id = c.req.param('id')
  await db.delete(schema.taskAssignment).where(eq(schema.taskAssignment.taskId, id))
  await db.delete(schema.task).where(eq(schema.task.id, id))
  return c.json(ok({ id }))
})
