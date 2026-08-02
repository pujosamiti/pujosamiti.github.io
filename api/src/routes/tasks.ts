import type { ApiResult, Me, TaskMasterInput, TaskPhase, TaskView, TaskYearInput } from '@pujosamiti/shared'
import { TASK_MAX_OWNERS } from '@pujosamiti/shared'
import { and, asc, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'

import * as schema from '../db/schema'
import type { Env } from '../env'

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data }
}

const PHASES: TaskPhase[] = ['todo', 'in_progress', 'completed']

/**
 * Task distribution over the year-independent durgapuja_task catalog.
 * Mounted under the member gate (/api/members/tasks): members view and
 * volunteer themselves; core members/admins curate the catalog and yearly
 * assignments; owners can update their task's phase and checkdates.
 */
export const taskRoutes = new Hono<{ Bindings: Env; Variables: { me: Me } }>()

const canEdit = (me: Me) => me.role !== 'member'

type DB = ReturnType<typeof drizzle<typeof schema>>

async function isOwner(db: DB, taskId: string, year: number, personId: string) {
  const [row] = await db
    .select({ id: schema.taskAssignment.id })
    .from(schema.taskAssignment)
    .where(
      and(
        eq(schema.taskAssignment.taskId, taskId),
        eq(schema.taskAssignment.year, year),
        eq(schema.taskAssignment.personId, personId),
        eq(schema.taskAssignment.role, 'owner'),
        eq(schema.taskAssignment.isActive, true),
      ),
    )
    .limit(1)
  return !!row
}

taskRoutes.get('/', async (c) => {
  const year = Number(c.req.query('year'))
  if (!Number.isInteger(year)) return c.json({ ok: false, error: 'year query param required' }, 400)
  const db = drizzle(c.env.DB, { schema })

  const tasks = await db
    .select()
    .from(schema.durgapujaTask)
    .orderBy(asc(schema.durgapujaTask.category), asc(schema.durgapujaTask.title))
  const years = await db.select().from(schema.taskYear).where(eq(schema.taskYear.year, year))
  const assignments = await db
    .select({ a: schema.taskAssignment, name: schema.person.displayName })
    .from(schema.taskAssignment)
    .innerJoin(schema.person, eq(schema.taskAssignment.personId, schema.person.id))
    .where(and(eq(schema.taskAssignment.year, year), eq(schema.taskAssignment.isActive, true)))

  const out: TaskView[] = tasks
    .filter((t) => t.isActive)
    .map((t) => {
      const y = years.find((x) => x.taskId === t.id)
      return {
        id: t.id,
        category: t.category,
        title: t.title,
        details: t.details,
        isActive: t.isActive,
        skipped: y ? !y.isActive : false,
        phase: y?.phase ?? 'todo',
        checks: [
          { date: y?.check1Date ?? null, notes: y?.check1Notes ?? null },
          { date: y?.check2Date ?? null, notes: y?.check2Notes ?? null },
          { date: y?.check3Date ?? null, notes: y?.check3Notes ?? null },
        ],
        owners: assignments
          .filter((x) => x.a.taskId === t.id && x.a.role === 'owner')
          .map((x) => ({ id: x.a.personId, name: x.name })),
        volunteers: assignments
          .filter((x) => x.a.taskId === t.id && x.a.role === 'volunteer')
          .map((x) => ({ id: x.a.personId, name: x.name })),
      }
    })
  return c.json(ok(out))
})

/** Create a catalog task (core). */
taskRoutes.post('/', async (c) => {
  if (!canEdit(c.get('me'))) return c.json({ ok: false, error: 'core members only' }, 403)
  const body = (await c.req.json()) as TaskMasterInput
  if (!body.title?.trim() || !body.category?.trim())
    return c.json({ ok: false, error: 'category and title are required' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const id = crypto.randomUUID()
  await db.insert(schema.durgapujaTask).values({
    id,
    category: body.category.trim(),
    title: body.title.trim(),
    details: body.details?.trim() || null,
    createdAt: new Date(),
  })
  return c.json(ok({ id }))
})

/** Update catalog fields (core). isActive=false is the soft delete. */
taskRoutes.post('/:id', async (c) => {
  if (!canEdit(c.get('me'))) return c.json({ ok: false, error: 'core members only' }, 403)
  const body = (await c.req.json()) as TaskMasterInput
  if (!body.title?.trim() || !body.category?.trim())
    return c.json({ ok: false, error: 'category and title are required' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const id = c.req.param('id')
  const [t] = await db.select({ id: schema.durgapujaTask.id }).from(schema.durgapujaTask).where(eq(schema.durgapujaTask.id, id)).limit(1)
  if (!t) return c.json({ ok: false, error: 'task not found' }, 404)
  await db
    .update(schema.durgapujaTask)
    .set({
      category: body.category.trim(),
      title: body.title.trim(),
      details: body.details?.trim() || null,
      isActive: body.isActive !== false,
    })
    .where(eq(schema.durgapujaTask.id, id))
  return c.json(ok({ id }))
})

/** Upsert one year's phase/checkdates/assignments. Core, or (phase+checks only) an owner. */
taskRoutes.post('/:id/year', async (c) => {
  const me = c.get('me')
  const body = (await c.req.json()) as TaskYearInput
  if (!Number.isInteger(body.year)) return c.json({ ok: false, error: 'year is required' }, 400)
  if ((body.ownerIds ?? []).length > TASK_MAX_OWNERS)
    return c.json({ ok: false, error: `at most ${TASK_MAX_OWNERS} owners` }, 400)

  const db = drizzle(c.env.DB, { schema })
  const id = c.req.param('id')
  const [t] = await db.select({ id: schema.durgapujaTask.id }).from(schema.durgapujaTask).where(eq(schema.durgapujaTask.id, id)).limit(1)
  if (!t) return c.json({ ok: false, error: 'task not found' }, 404)

  const editor = canEdit(me)
  const owner = editor ? true : await isOwner(db, id, body.year, me.personId)
  if (!editor && !owner) return c.json({ ok: false, error: 'owners or core members only' }, 403)

  const checks = [0, 1, 2].map((i) => body.checks?.[i] ?? { date: null, notes: null })
  const phase = PHASES.includes(body.phase) ? body.phase : 'todo'
  const yearValues = {
    phase,
    check1Date: checks[0].date || null,
    check1Notes: checks[0].notes?.trim() || null,
    check2Date: checks[1].date || null,
    check2Notes: checks[1].notes?.trim() || null,
    check3Date: checks[2].date || null,
    check3Notes: checks[2].notes?.trim() || null,
  }
  const [existing] = await db
    .select({ id: schema.taskYear.id })
    .from(schema.taskYear)
    .where(and(eq(schema.taskYear.taskId, id), eq(schema.taskYear.year, body.year)))
    .limit(1)
  if (existing) await db.update(schema.taskYear).set(yearValues).where(eq(schema.taskYear.id, existing.id))
  else await db.insert(schema.taskYear).values({ id: crypto.randomUUID(), taskId: id, year: body.year, ...yearValues })

  // Assignments: core members only (owners can't reassign people)
  if (editor) {
    const owners = [...new Set(body.ownerIds ?? [])]
    const volunteers = [...new Set(body.volunteerIds ?? [])].filter((v) => !owners.includes(v))
    const current = await db
      .select()
      .from(schema.taskAssignment)
      .where(and(eq(schema.taskAssignment.taskId, id), eq(schema.taskAssignment.year, body.year)))
    const wanted = new Map<string, 'owner' | 'volunteer'>([
      ...owners.map((p) => [p, 'owner'] as const),
      ...volunteers.map((p) => [p, 'volunteer'] as const),
    ])
    for (const row of current) {
      const want = wanted.get(row.personId)
      if (!want) {
        if (row.isActive) await db.update(schema.taskAssignment).set({ isActive: false }).where(eq(schema.taskAssignment.id, row.id))
      } else {
        if (!row.isActive || row.role !== want)
          await db.update(schema.taskAssignment).set({ isActive: true, role: want }).where(eq(schema.taskAssignment.id, row.id))
        wanted.delete(row.personId)
      }
    }
    for (const [personId, role] of wanted) {
      await db
        .insert(schema.taskAssignment)
        .values({ id: crypto.randomUUID(), taskId: id, year: body.year, personId, role })
    }
  }
  return c.json(ok({ id, year: body.year }))
})

/** Skip / restore a task for one year (core). */
taskRoutes.post('/:id/skip', async (c) => {
  if (!canEdit(c.get('me'))) return c.json({ ok: false, error: 'core members only' }, 403)
  const { year, skipped } = (await c.req.json()) as { year: number; skipped: boolean }
  if (!Number.isInteger(year)) return c.json({ ok: false, error: 'year is required' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const id = c.req.param('id')
  const [t] = await db.select({ id: schema.durgapujaTask.id }).from(schema.durgapujaTask).where(eq(schema.durgapujaTask.id, id)).limit(1)
  if (!t) return c.json({ ok: false, error: 'task not found' }, 404)
  const [existing] = await db
    .select({ id: schema.taskYear.id })
    .from(schema.taskYear)
    .where(and(eq(schema.taskYear.taskId, id), eq(schema.taskYear.year, year)))
    .limit(1)
  if (existing) await db.update(schema.taskYear).set({ isActive: !skipped }).where(eq(schema.taskYear.id, existing.id))
  else await db.insert(schema.taskYear).values({ id: crypto.randomUUID(), taskId: id, year, isActive: !skipped })
  return c.json(ok({ id, year, skipped: !!skipped }))
})

/** Any member can volunteer themselves for a year (or withdraw). */
taskRoutes.post('/:id/volunteer', async (c) => {
  const me = c.get('me')
  const { year, join } = (await c.req.json()) as { year: number; join: boolean }
  if (!Number.isInteger(year)) return c.json({ ok: false, error: 'year is required' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const id = c.req.param('id')
  const [t] = await db.select({ id: schema.durgapujaTask.id }).from(schema.durgapujaTask).where(eq(schema.durgapujaTask.id, id)).limit(1)
  if (!t) return c.json({ ok: false, error: 'task not found' }, 404)

  const mine = and(
    eq(schema.taskAssignment.taskId, id),
    eq(schema.taskAssignment.year, year),
    eq(schema.taskAssignment.personId, me.personId),
  )
  const [existing] = await db.select().from(schema.taskAssignment).where(mine).limit(1)
  if (join) {
    if (existing) {
      if (!existing.isActive)
        await db.update(schema.taskAssignment).set({ isActive: true, role: existing.role === 'owner' ? 'owner' : 'volunteer' }).where(eq(schema.taskAssignment.id, existing.id))
      return c.json(ok({ joined: true }))
    }
    await db
      .insert(schema.taskAssignment)
      .values({ id: crypto.randomUUID(), taskId: id, year, personId: me.personId, role: 'volunteer' })
    return c.json(ok({ joined: true }))
  }
  if (existing?.role === 'owner' && existing.isActive)
    return c.json({ ok: false, error: 'owners cannot withdraw; ask a core member' }, 400)
  if (existing) await db.update(schema.taskAssignment).set({ isActive: false }).where(eq(schema.taskAssignment.id, existing.id))
  return c.json(ok({ joined: false }))
})
