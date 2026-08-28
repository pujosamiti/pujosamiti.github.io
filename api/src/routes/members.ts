import type { AccountsSummary, ApiResult, CollectorWallet, Me, MemberLite, PujoEvent } from '@pujosamiti/shared'
import { asc, eq, or } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'

import { createAuth } from '../auth'
import * as schema from '../db/schema'
import type { Env } from '../env'
import { readSheetRange } from '../lib/google'
import { ledgerRoutes } from './ledger'
import { procurementRoutes } from './procurement'
import { taskRoutes } from './tasks'

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data }
}

type Vars = { me: Me }

export const memberRoutes = new Hono<{ Bindings: Env; Variables: Vars }>()

/**
 * Signing in is not enough: the account's email must belong to an active
 * person whose tier isn't non_member. Enforcement lives here on the server —
 * hiding routes in the React bundle protects nothing.
 */
memberRoutes.use('*', async (c, next) => {
  const auth = createAuth(c.env)
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) return c.json({ ok: false, error: 'not signed in' }, 401)

  const db = drizzle(c.env.DB, { schema })
  const [p] = await db
    .select()
    .from(schema.person)
    .where(or(eq(schema.person.email, session.user.email), eq(schema.person.altEmail, session.user.email)))
    .limit(1)
  if (!p || !p.isActive || p.tier === 'non_member')
    return c.json({ ok: false, error: 'not a samiti member' }, 403)

  c.set('me', {
    id: session.user.id,
    personId: p.id,
    name: p.displayName,
    email: session.user.email,
    image: session.user.image ?? null,
    role: p.isAdmin ? 'admin' : p.isFinAdmin ? 'fin_admin' : p.tier === 'core' ? 'coremember' : 'member',
    portfolio: p.portfolio,
  })
  await next()
})

memberRoutes.get('/me', (c) => c.json(ok(c.get('me'))))

/** Light people list for owner/volunteer pickers (active members only). */
memberRoutes.get('/people', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  const rows = await db
    .select({ id: schema.person.id, name: schema.person.displayName, tier: schema.person.tier })
    .from(schema.person)
    .where(eq(schema.person.isActive, true))
    .orderBy(schema.person.displayName)
  return c.json(ok(rows as MemberLite[]))
})

/** Same list as the public feed, but carrying the purohit's phone. */
memberRoutes.get('/events', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  const rows = await db.select().from(schema.event).orderBy(asc(schema.event.startsOn))
  return c.json(ok(rows as unknown as PujoEvent[]))
})

memberRoutes.route('/tasks', taskRoutes)
memberRoutes.route('/ledger', ledgerRoutes)
memberRoutes.route('/procurement', procurementRoutes)

/**
 * Accounts summary straight from the treasurers' Google Sheet.
 * Expected "Wallets" tab columns: collector | collected | deposited
 */
memberRoutes.get('/accounts/:eventId', async (c) => {
  const eventId = c.req.param('eventId') as AccountsSummary['eventId']
  const rows = await readSheetRange(c.env, 'Wallets!A2:C')
  const wallets: CollectorWallet[] = rows.map(([name, collected, deposited]) => {
    const col = Number(collected ?? 0)
    const dep = Number(deposited ?? 0)
    return { collectorName: name ?? '?', collected: col, deposited: dep, inHand: col - dep }
  })
  const expenseRows = await readSheetRange(c.env, 'Expenses!A2:B')
  const totalExpense = expenseRows.reduce((sum, r) => sum + Number(r[1] ?? 0), 0)
  const totalCollected = wallets.reduce((sum, w) => sum + w.collected, 0)
  const summary: AccountsSummary = {
    eventId,
    totalCollected,
    totalExpense,
    balance: totalCollected - totalExpense,
    wallets,
    updatedAt: new Date().toISOString(),
  }
  return c.json(ok(summary))
})
