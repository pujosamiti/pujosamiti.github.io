import type {
  ApiResult,
  BookId,
  LedgerEntry,
  LedgerEntryInput,
  LedgerSummary,
  Me,
  ReimbursementClaim,
  ReimbursementClaimInput,
  SponsorshipItemInput,
  SponsorshipItemView,
  WalletBalance,
} from '@pujosamiti/shared'
import { CONTRIBUTION_CATEGORIES } from '@pujosamiti/shared'
import { and, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'

import * as schema from '../db/schema'
import type { Env } from '../env'

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data }
}

type Vars = { me: Me }

/**
 * Money routes. Mounted inside memberRoutes (session + membership already
 * checked); this gate narrows to CORE members — the first area where
 * non-admin core members WRITE (entries, pledges, claims). Admin-only bits
 * (void, reject, catalog edits) check role inline.
 */
export const ledgerRoutes = new Hono<{ Bindings: Env; Variables: Vars }>()

ledgerRoutes.use('*', async (c, next) => {
  if (c.get('me').role === 'member') return c.json({ ok: false, error: 'core members only' }, 403)
  await next()
})

const isAdmin = (c: { get: (k: 'me') => Me }) => c.get('me').role === 'admin'

/** Today as an IST date string — IST is a fixed UTC+05:30, no DST. */
function todayIST(): string {
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10)
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

async function peopleMap(db: ReturnType<typeof drizzle>) {
  const rows = await db.select({ id: schema.person.id, name: schema.person.displayName }).from(schema.person)
  return new Map(rows.map((r) => [r.id, r.name]))
}

// ── Entries ─────────────────────────────────────────────────────────────────

ledgerRoutes.get('/entries', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  const rows = await db.select().from(schema.ledgerEntry)
  const names = await peopleMap(db)
  const out: LedgerEntry[] = rows
    .sort((a, b) => (a.entryDate < b.entryDate ? 1 : a.entryDate > b.entryDate ? -1 : 0))
    .map((e) => ({
      id: e.id,
      bookId: e.bookId as BookId,
      eventId: e.eventId,
      entryDate: e.entryDate,
      kind: e.kind,
      category: e.category,
      subCategory: e.subCategory,
      amount: e.amount,
      personId: e.personId,
      personName: e.personId ? (names.get(e.personId) ?? null) : null,
      counterparty: e.counterparty,
      walletPersonId: e.walletPersonId,
      walletName: names.get(e.walletPersonId) ?? '?',
      toWalletPersonId: e.toWalletPersonId,
      toWalletName: e.toWalletPersonId ? (names.get(e.toWalletPersonId) ?? null) : null,
      notes: e.notes,
      isActive: e.isActive,
      createdByName: names.get(e.createdBy) ?? '?',
    }))
  return c.json(ok(out))
})

function validateEntry(body: LedgerEntryInput): string | null {
  if (!['pujo-ledger', 'poila-baishakh-ledger'].includes(body.bookId)) return 'unknown book'
  if (!DATE_RE.test(body.entryDate)) return 'entry_date must be YYYY-MM-DD'
  if (!Number.isInteger(body.amount) || body.amount <= 0) return 'amount must be a positive whole number'
  if (!body.walletPersonId) return 'wallet person required'
  if (body.kind === 'contribution') {
    if (!CONTRIBUTION_CATEGORIES.includes(body.category as never)) return 'invalid contribution category'
    if ((body.category === 'subscription' || body.category === 'sponsorship') && !body.personId)
      return `${body.category} requires a person`
    if (!body.personId && !body.counterparty?.trim()) return 'person or counterparty required'
  } else if (body.kind === 'expense') {
    if (!body.category?.trim()) return 'expense category required'
    if (!body.personId && !body.counterparty?.trim()) return 'counterparty (vendor) required'
  } else if (body.kind === 'transfer') {
    if (!body.toWalletPersonId) return 'transfer requires a receiving wallet'
    if (body.toWalletPersonId === body.walletPersonId) return 'transfer wallets must differ'
  } else return 'unknown kind'
  return null
}

ledgerRoutes.post('/entries', async (c) => {
  const body = await c.req.json<LedgerEntryInput>()
  const err = validateEntry(body)
  if (err) return c.json({ ok: false, error: err }, 400)
  const db = drizzle(c.env.DB, { schema })
  const transfer = body.kind === 'transfer'
  const id = crypto.randomUUID()
  await db.insert(schema.ledgerEntry).values({
    id,
    bookId: body.bookId,
    eventId: body.eventId || null,
    entryDate: body.entryDate,
    kind: body.kind,
    category: transfer ? null : body.category,
    subCategory: transfer ? null : body.subCategory?.trim() || null,
    amount: body.amount,
    personId: transfer ? null : body.personId || null,
    counterparty: transfer ? null : body.counterparty?.trim() || null,
    walletPersonId: body.walletPersonId,
    toWalletPersonId: transfer ? body.toWalletPersonId : null,
    notes: body.notes?.trim() || null,
    createdBy: c.get('me').personId!,
    createdAt: new Date(),
  })
  return c.json(ok({ id }))
})

/** Void an entry (admin). Reverts any pledge/claim that pointed at it. */
ledgerRoutes.post('/entries/:id/void', async (c) => {
  if (!isAdmin(c)) return c.json({ ok: false, error: 'admin only' }, 403)
  const id = c.req.param('id')
  const db = drizzle(c.env.DB, { schema })
  await db.update(schema.ledgerEntry).set({ isActive: false }).where(eq(schema.ledgerEntry.id, id))
  await db
    .update(schema.sponsorshipPledge)
    .set({ status: 'pledged', ledgerEntryId: null })
    .where(and(eq(schema.sponsorshipPledge.ledgerEntryId, id), eq(schema.sponsorshipPledge.status, 'paid')))
  await db
    .update(schema.expenseReimbursement)
    .set({ status: 'requested', ledgerEntryId: null, settledBy: null, settledOn: null })
    .where(and(eq(schema.expenseReimbursement.ledgerEntryId, id), eq(schema.expenseReimbursement.status, 'settled')))
  return c.json(ok({ id }))
})

// ── Summary (wallet balances + 1-July season snapshot) ──────────────────────

ledgerRoutes.get('/summary', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  const entries = (await db.select().from(schema.ledgerEntry)).filter((e) => e.isActive)
  const names = await peopleMap(db)

  const today = todayIST()
  const y = Number(today.slice(0, 4))
  const seasonStart = today >= `${y}-07-01` ? `${y}-07-01` : `${y - 1}-07-01`

  const wallets = new Map<string, WalletBalance>()
  const w = (pid: string): WalletBalance => {
    let x = wallets.get(pid)
    if (!x) {
      x = {
        personId: pid,
        personName: names.get(pid) ?? '?',
        balance: 0,
        carriedForward: 0,
        collectedSince: 0,
        spentSince: 0,
        transfersInSince: 0,
        transfersOutSince: 0,
      }
      wallets.set(pid, x)
    }
    return x
  }

  let collectedSince = 0
  let spentSince = 0
  let carriedForward = 0
  for (const e of entries) {
    const since = e.entryDate >= seasonStart
    if (e.kind === 'contribution') {
      w(e.walletPersonId).balance += e.amount
      if (since) {
        collectedSince += e.amount
        w(e.walletPersonId).collectedSince += e.amount
      } else {
        carriedForward += e.amount
        w(e.walletPersonId).carriedForward += e.amount
      }
    } else if (e.kind === 'expense') {
      w(e.walletPersonId).balance -= e.amount
      if (since) {
        spentSince += e.amount
        w(e.walletPersonId).spentSince += e.amount
      } else {
        carriedForward -= e.amount
        w(e.walletPersonId).carriedForward -= e.amount
      }
    } else {
      w(e.walletPersonId).balance -= e.amount
      w(e.toWalletPersonId!).balance += e.amount
      if (since) {
        w(e.walletPersonId).transfersOutSince += e.amount
        w(e.toWalletPersonId!).transfersInSince += e.amount
      } else {
        w(e.walletPersonId).carriedForward -= e.amount
        w(e.toWalletPersonId!).carriedForward += e.amount
      }
    }
  }

  const claims = await db
    .select({ amount: schema.expenseReimbursement.amount })
    .from(schema.expenseReimbursement)
    .where(eq(schema.expenseReimbursement.status, 'requested'))
  const outstandingClaims = claims.reduce((s, r) => s + r.amount, 0)

  const summary: LedgerSummary = {
    seasonStart,
    totalBalance: carriedForward + collectedSince - spentSince,
    carriedForward,
    collectedSince,
    spentSince,
    outstandingClaims,
    wallets: [...wallets.values()]
      .filter((x) => x.balance !== 0 || x.collectedSince || x.spentSince || x.transfersInSince || x.transfersOutSince)
      .sort((a, b) => b.balance - a.balance),
  }
  return c.json(ok(summary))
})

// ── Sponsorship board ───────────────────────────────────────────────────────

ledgerRoutes.get('/sponsorship', async (c) => {
  const year = Number(c.req.query('year'))
  if (!year) return c.json({ ok: false, error: 'year required' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const items = await db.select().from(schema.sponsorshipItem)
  const years = await db.select().from(schema.sponsorshipItemYear).where(eq(schema.sponsorshipItemYear.year, year))
  const pledges = await db.select().from(schema.sponsorshipPledge).where(eq(schema.sponsorshipPledge.year, year))
  const names = await peopleMap(db)
  const yearBy = new Map(years.map((r) => [r.itemId, r]))
  const pledgeBy = new Map(
    pledges.filter((p) => p.status !== 'cancelled').map((p) => [p.itemId, p]),
  )
  const out: SponsorshipItemView[] = items
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((i) => {
      const iy = yearBy.get(i.id)
      const pl = pledgeBy.get(i.id)
      return {
        id: i.id,
        category: i.category,
        title: i.title,
        defaultAmount: i.defaultAmount,
        sortOrder: i.sortOrder,
        retired: !i.isActive,
        yearAmount: iy?.amount ?? null,
        offered: iy ? iy.isActive : i.isActive,
        yearNotes: iy?.notes ?? null,
        pledge: pl
          ? {
              id: pl.id,
              personId: pl.personId,
              personName: names.get(pl.personId) ?? '?',
              amount: pl.amount,
              status: pl.status,
              pledgedOn: pl.pledgedOn,
            }
          : null,
      }
    })
  return c.json(ok(out))
})

/** Create/update a master catalog item (admin). */
ledgerRoutes.post('/sponsorship/items', async (c) => {
  if (!isAdmin(c)) return c.json({ ok: false, error: 'admin only' }, 403)
  const body = await c.req.json<SponsorshipItemInput & { retired?: boolean }>()
  if (!body.title?.trim() || !body.category?.trim()) return c.json({ ok: false, error: 'title and category required' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const id = (body.id?.trim() || body.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
  const [existing] = await db.select().from(schema.sponsorshipItem).where(eq(schema.sponsorshipItem.id, id)).limit(1)
  const values = {
    category: body.category.trim(),
    title: body.title.trim(),
    defaultAmount: body.defaultAmount ?? null,
    sortOrder: body.sortOrder ?? existing?.sortOrder ?? 1000,
    isActive: body.retired === undefined ? (existing?.isActive ?? true) : !body.retired,
  }
  if (existing) await db.update(schema.sponsorshipItem).set(values).where(eq(schema.sponsorshipItem.id, id))
  else await db.insert(schema.sponsorshipItem).values({ id, ...values, createdAt: new Date() })
  return c.json(ok({ id }))
})

/** Upsert this year's offering for an item (admin): amount / offered / notes. */
ledgerRoutes.post('/sponsorship/items/:id/year', async (c) => {
  if (!isAdmin(c)) return c.json({ ok: false, error: 'admin only' }, 403)
  const itemId = c.req.param('id')
  const body = await c.req.json<{ year: number; amount: number | null; offered: boolean; notes: string | null }>()
  if (!body.year) return c.json({ ok: false, error: 'year required' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const [item] = await db.select().from(schema.sponsorshipItem).where(eq(schema.sponsorshipItem.id, itemId)).limit(1)
  if (!item) return c.json({ ok: false, error: 'unknown item' }, 404)
  const id = `siy-${itemId}-${body.year}`
  const values = { amount: body.amount ?? null, isActive: body.offered, notes: body.notes?.trim() || null }
  const [existing] = await db.select().from(schema.sponsorshipItemYear).where(eq(schema.sponsorshipItemYear.id, id)).limit(1)
  if (existing) await db.update(schema.sponsorshipItemYear).set(values).where(eq(schema.sponsorshipItemYear.id, id))
  else await db.insert(schema.sponsorshipItemYear).values({ id, itemId, year: body.year, ...values })
  return c.json(ok({ id }))
})

/** Record a pledge (core). One live pledge per item per year. */
ledgerRoutes.post('/sponsorship/pledges', async (c) => {
  const body = await c.req.json<{ itemId: string; year: number; personId: string; amount: number; notes?: string | null }>()
  if (!body.itemId || !body.year || !body.personId) return c.json({ ok: false, error: 'item, year and person required' }, 400)
  if (!Number.isInteger(body.amount) || body.amount <= 0) return c.json({ ok: false, error: 'amount must be a positive whole number' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const live = (
    await db
      .select()
      .from(schema.sponsorshipPledge)
      .where(and(eq(schema.sponsorshipPledge.itemId, body.itemId), eq(schema.sponsorshipPledge.year, body.year)))
  ).filter((p) => p.status !== 'cancelled')
  if (live.length) return c.json({ ok: false, error: 'this item is already pledged for the year' }, 409)
  const id = crypto.randomUUID()
  await db.insert(schema.sponsorshipPledge).values({
    id,
    itemId: body.itemId,
    year: body.year,
    personId: body.personId,
    amount: body.amount,
    pledgedOn: todayIST(),
    notes: body.notes?.trim() || null,
  })
  return c.json(ok({ id }))
})

/**
 * Pay a pledge (core) — ONE atomic action: create the ledger entry
 * (contribution/sponsorship, sub_category = item's catalog category) and flip
 * the pledge. Compare-and-set on status prevents double payment.
 */
ledgerRoutes.post('/sponsorship/pledges/:id/pay', async (c) => {
  const pledgeId = c.req.param('id')
  const body = await c.req.json<{ walletPersonId: string; entryDate?: string }>()
  if (!body.walletPersonId) return c.json({ ok: false, error: 'wallet person required' }, 400)
  const entryDate = body.entryDate ?? todayIST()
  if (!DATE_RE.test(entryDate)) return c.json({ ok: false, error: 'entry_date must be YYYY-MM-DD' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const [pl] = await db.select().from(schema.sponsorshipPledge).where(eq(schema.sponsorshipPledge.id, pledgeId)).limit(1)
  if (!pl) return c.json({ ok: false, error: 'unknown pledge' }, 404)
  if (pl.status !== 'pledged') return c.json({ ok: false, error: `pledge is ${pl.status}` }, 409)
  const [item] = await db.select().from(schema.sponsorshipItem).where(eq(schema.sponsorshipItem.id, pl.itemId)).limit(1)
  const entryId = crypto.randomUUID()
  await db.insert(schema.ledgerEntry).values({
    id: entryId,
    bookId: 'pujo-ledger',
    entryDate,
    kind: 'contribution',
    category: 'sponsorship',
    subCategory: item?.category ?? null,
    amount: pl.amount,
    personId: pl.personId,
    walletPersonId: body.walletPersonId,
    notes: item ? `Sponsorship: ${item.title} ${pl.year}` : null,
    createdBy: c.get('me').personId!,
    createdAt: new Date(),
  })
  const res = await db
    .update(schema.sponsorshipPledge)
    .set({ status: 'paid', ledgerEntryId: entryId })
    .where(and(eq(schema.sponsorshipPledge.id, pledgeId), eq(schema.sponsorshipPledge.status, 'pledged')))
  if (((res as unknown as { meta?: { changes?: number } }).meta?.changes ?? 1) === 0) {
    // lost the race — remove the just-created entry
    await db.delete(schema.ledgerEntry).where(eq(schema.ledgerEntry.id, entryId))
    return c.json({ ok: false, error: 'pledge was settled concurrently' }, 409)
  }
  return c.json(ok({ id: entryId }))
})

ledgerRoutes.post('/sponsorship/pledges/:id/cancel', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  const res = await db
    .update(schema.sponsorshipPledge)
    .set({ status: 'cancelled' })
    .where(and(eq(schema.sponsorshipPledge.id, c.req.param('id')), eq(schema.sponsorshipPledge.status, 'pledged')))
  if (((res as unknown as { meta?: { changes?: number } }).meta?.changes ?? 1) === 0)
    return c.json({ ok: false, error: 'only un-paid pledges can be cancelled' }, 409)
  return c.json(ok({}))
})

// ── Reimbursement claims ────────────────────────────────────────────────────

ledgerRoutes.get('/claims', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  const rows = await db.select().from(schema.expenseReimbursement)
  const names = await peopleMap(db)
  const out: ReimbursementClaim[] = rows
    .sort((a, b) => (a.expenseDate < b.expenseDate ? 1 : -1))
    .map((r) => ({
      id: r.id,
      bookId: r.bookId as BookId,
      eventId: r.eventId,
      personId: r.personId,
      personName: names.get(r.personId) ?? '?',
      expenseDate: r.expenseDate,
      amount: r.amount,
      category: r.category,
      subCategory: r.subCategory,
      counterparty: r.counterparty,
      details: r.details,
      status: r.status,
      assignedTo: r.assignedTo,
      assignedToName: r.assignedTo ? (names.get(r.assignedTo) ?? null) : null,
      assignedOn: r.assignedOn,
      settledBy: r.settledBy,
      settledByName: r.settledBy ? (names.get(r.settledBy) ?? null) : null,
      settledOn: r.settledOn,
      notes: r.notes,
    }))
  return c.json(ok(out))
})

ledgerRoutes.post('/claims', async (c) => {
  const body = await c.req.json<ReimbursementClaimInput>()
  if (!['pujo-ledger', 'poila-baishakh-ledger'].includes(body.bookId)) return c.json({ ok: false, error: 'unknown book' }, 400)
  if (!DATE_RE.test(body.expenseDate)) return c.json({ ok: false, error: 'expense_date must be YYYY-MM-DD' }, 400)
  if (!Number.isInteger(body.amount) || body.amount <= 0) return c.json({ ok: false, error: 'amount must be a positive whole number' }, 400)
  if (!body.category?.trim() || !body.counterparty?.trim()) return c.json({ ok: false, error: 'category and vendor required' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const id = crypto.randomUUID()
  await db.insert(schema.expenseReimbursement).values({
    id,
    bookId: body.bookId,
    eventId: body.eventId || null,
    personId: c.get('me').personId!, // always a claim for YOURSELF
    expenseDate: body.expenseDate,
    amount: body.amount,
    category: body.category.trim(),
    subCategory: body.subCategory?.trim() || null,
    counterparty: body.counterparty.trim(),
    details: body.details?.trim() || null,
    createdAt: new Date(),
  })
  return c.json(ok({ id }))
})

/** Take or hand over a claim. Dispatching is open to every core member. */
ledgerRoutes.post('/claims/:id/assign', async (c) => {
  const body = await c.req.json<{ assignedTo: string }>()
  if (!body.assignedTo) return c.json({ ok: false, error: 'assignedTo required' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const [claim] = await db
    .select()
    .from(schema.expenseReimbursement)
    .where(eq(schema.expenseReimbursement.id, c.req.param('id')))
    .limit(1)
  if (!claim) return c.json({ ok: false, error: 'unknown claim' }, 404)
  if (claim.status !== 'requested') return c.json({ ok: false, error: `claim is ${claim.status}` }, 409)
  if (body.assignedTo === claim.personId) return c.json({ ok: false, error: 'claimant cannot be their own payer' }, 400)
  const [payer] = await db.select().from(schema.person).where(eq(schema.person.id, body.assignedTo)).limit(1)
  if (!payer || !payer.isActive || payer.tier !== 'core')
    return c.json({ ok: false, error: 'payer must be an active core member' }, 400)
  await db
    .update(schema.expenseReimbursement)
    .set({ assignedTo: body.assignedTo, assignedOn: todayIST() })
    .where(eq(schema.expenseReimbursement.id, claim.id))
  return c.json(ok({}))
})

/**
 * Settle a claim — the settler pays from their own wallet. Settling an
 * unassigned claim self-assigns first; a claim assigned to someone else
 * needs reassignment. Compare-and-set on status prevents double settlement.
 */
ledgerRoutes.post('/claims/:id/settle', async (c) => {
  const me = c.get('me')
  const body = await c.req.json<{ entryDate?: string }>().catch(() => ({}) as { entryDate?: string })
  const entryDate = body.entryDate ?? todayIST()
  if (!DATE_RE.test(entryDate)) return c.json({ ok: false, error: 'entry_date must be YYYY-MM-DD' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const [claim] = await db
    .select()
    .from(schema.expenseReimbursement)
    .where(eq(schema.expenseReimbursement.id, c.req.param('id')))
    .limit(1)
  if (!claim) return c.json({ ok: false, error: 'unknown claim' }, 404)
  if (claim.status !== 'requested') return c.json({ ok: false, error: `claim is ${claim.status}` }, 409)
  if (claim.personId === me.personId) return c.json({ ok: false, error: 'you cannot settle your own claim' }, 400)
  if (claim.assignedTo && claim.assignedTo !== me.personId)
    return c.json({ ok: false, error: `assigned to ${claim.assignedTo} — reassign first` }, 409)
  const entryId = crypto.randomUUID()
  await db.insert(schema.ledgerEntry).values({
    id: entryId,
    bookId: claim.bookId as BookId,
    eventId: claim.eventId,
    entryDate, // when wallet cash actually moved; claim keeps expense_date
    kind: 'expense',
    category: claim.category,
    subCategory: claim.subCategory,
    amount: claim.amount,
    counterparty: claim.counterparty,
    walletPersonId: me.personId!,
    notes: `Reimbursement to ${claim.personId}${claim.details ? ` — ${claim.details}` : ''}`,
    createdBy: me.personId!,
    createdAt: new Date(),
  })
  const res = await db
    .update(schema.expenseReimbursement)
    .set({
      status: 'settled',
      assignedTo: claim.assignedTo ?? me.personId!,
      assignedOn: claim.assignedOn ?? todayIST(),
      ledgerEntryId: entryId,
      settledBy: me.personId!,
      settledOn: entryDate,
    })
    .where(and(eq(schema.expenseReimbursement.id, claim.id), eq(schema.expenseReimbursement.status, 'requested')))
  if (((res as unknown as { meta?: { changes?: number } }).meta?.changes ?? 1) === 0) {
    await db.delete(schema.ledgerEntry).where(eq(schema.ledgerEntry.id, entryId))
    return c.json({ ok: false, error: 'claim was settled concurrently' }, 409)
  }
  return c.json(ok({ id: entryId }))
})

ledgerRoutes.post('/claims/:id/reject', async (c) => {
  if (!isAdmin(c)) return c.json({ ok: false, error: 'admin only' }, 403)
  const body = await c.req.json<{ notes?: string | null }>().catch(() => ({}) as { notes?: string | null })
  const db = drizzle(c.env.DB, { schema })
  const res = await db
    .update(schema.expenseReimbursement)
    .set({ status: 'rejected', notes: body.notes?.trim() || null })
    .where(and(eq(schema.expenseReimbursement.id, c.req.param('id')), eq(schema.expenseReimbursement.status, 'requested')))
  if (((res as unknown as { meta?: { changes?: number } }).meta?.changes ?? 1) === 0)
    return c.json({ ok: false, error: 'only requested claims can be rejected' }, 409)
  return c.json(ok({}))
})

ledgerRoutes.post('/claims/:id/cancel', async (c) => {
  const me = c.get('me')
  const db = drizzle(c.env.DB, { schema })
  const [claim] = await db
    .select()
    .from(schema.expenseReimbursement)
    .where(eq(schema.expenseReimbursement.id, c.req.param('id')))
    .limit(1)
  if (!claim) return c.json({ ok: false, error: 'unknown claim' }, 404)
  if (claim.personId !== me.personId && !isAdmin(c))
    return c.json({ ok: false, error: 'only the claimant (or an admin) can cancel' }, 403)
  const res = await db
    .update(schema.expenseReimbursement)
    .set({ status: 'cancelled' })
    .where(and(eq(schema.expenseReimbursement.id, claim.id), eq(schema.expenseReimbursement.status, 'requested')))
  if (((res as unknown as { meta?: { changes?: number } }).meta?.changes ?? 1) === 0)
    return c.json({ ok: false, error: 'only requested claims can be cancelled' }, 409)
  return c.json(ok({}))
})
