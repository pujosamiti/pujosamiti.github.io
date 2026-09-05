import type {
  ApiResult,
  BookId,
  BookShare,
  BudgetLine,
  BudgetLineInput,
  LedgerEntry,
  LedgerEntryInput,
  LedgerSummary,
  Me,
  ReimbursementClaim,
  ReimbursementClaimInput,
  SponsorshipItemInput,
  SponsorshipItemView,
  SpendRow,
  WalletBalance,
} from '@pujosamiti/shared'
import { isCoreRole, isProxyRole, isWebmaster, CONTRIBUTION_CATEGORIES, SUBSCRIPTION_SUBCATS } from '@pujosamiti/shared'
import { applyParticipationRule } from '../lib/roll'
import { and, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'

import * as schema from '../db/schema'
import type { Env } from '../env'
import { activePujoYear } from '../lib/pujo'

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data }
}

type Vars = { me: Me }

/**
 * Money routes, in three rings.
 *
 * Every member reads: the season summary, the budget, spend by category and
 * the sponsorship board — the samiti's accounts are its own business — and may
 * pledge for an item (MEMBER_OPEN below). Taking a pledge back is not theirs:
 * a slot someone has claimed is released by an admin, who knows whether the
 * money is still coming.
 *
 * Core members read the ledger itself and run the day-to-day: raising a
 * reimbursement claim, taking one on to pay.
 *
 * Anything that WRITES THE BOOKS is finance work — fin_admin or admin, checked
 * inline with canFinance. That covers the obvious (adding, editing or voiding
 * an entry, budgets, sponsorship pricing) and the two side doors that also mint
 * ledger entries: recording a payment against a pledge, and settling a claim.
 * Money is only recorded as received or paid by the person answerable for the
 * wallet it moved through.
 */
export const ledgerRoutes = new Hono<{ Bindings: Env; Variables: Vars }>()

const MEMBER_OPEN: [string, RegExp][] = [
  ['GET', /\/ledger\/summary$/],
  ['GET', /\/ledger\/budget$/],
  ['GET', /\/ledger\/spend$/],
  ['GET', /\/ledger\/sponsorship$/],
  ['POST', /\/ledger\/sponsorship\/pledges$/],
  // Cancelling is NOT here: a pledge, once made, is released by an admin only.
]

ledgerRoutes.use('*', async (c, next) => {
  if (!isCoreRole(c.get('me').role)) {
    const open = MEMBER_OPEN.some(([method, path]) => method === c.req.method && path.test(c.req.path))
    if (!open) return c.json({ ok: false, error: 'core members only' }, 403)
  }
  await next()
})

/**
 * The money side: ledger entries, budgets, sponsorship pricing and claim
 * rejection. A fin_admin holds these without the membership roll; an admin
 * holds everything. Core members read, and do the day-to-day (pledges,
 * claims, dispatching) — they do not write the books.
 */
const canFinance = (c: { get: (k: 'me') => Me }) => {
  const role = c.get('me').role
  return role === 'admin' || role === 'fin_admin'
}

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
  // Contributor → family name, for the season reports that list households.
  const families = new Map(
    (await db.select({ id: schema.family.id, name: schema.family.name }).from(schema.family)).map((f) => [f.id, f.name]),
  )
  const familyOf = new Map(
    (await db.select({ id: schema.person.id, familyId: schema.person.familyId }).from(schema.person)).map((p) => [
      p.id,
      p.familyId ? (families.get(p.familyId) ?? null) : null,
    ]),
  )
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
      familyName: e.personId ? (familyOf.get(e.personId) ?? null) : null,
      counterparty: e.counterparty,
      walletPersonId: e.walletPersonId,
      walletName: names.get(e.walletPersonId) ?? '?',
      toWalletPersonId: e.toWalletPersonId,
      toWalletName: e.toWalletPersonId ? (names.get(e.toWalletPersonId) ?? null) : null,
      notes: e.notes,
      isActive: e.isActive,
      createdByName: names.get(e.createdBy) ?? '?',
      createdAt: e.createdAt.getTime(),
    }))
  return c.json(ok(out))
})

/** Entries harden 48 hours after creation — no edit or void afterwards, admin included. */
const EDIT_WINDOW_MS = 48 * 60 * 60 * 1000
const isLocked = (createdAt: Date) => Date.now() - createdAt.getTime() > EDIT_WINDOW_MS

function validateEntry(body: LedgerEntryInput): string | null {
  if (!['pujo-ledger', 'poila-baishakh-ledger'].includes(body.bookId)) return 'unknown book'
  if (!DATE_RE.test(body.entryDate)) return 'entry_date must be YYYY-MM-DD'
  if (!Number.isInteger(body.amount) || body.amount <= 0) return 'amount must be a positive whole number'
  if (!body.walletPersonId) return 'wallet person required'
  if (body.kind === 'contribution') {
    if (!CONTRIBUTION_CATEGORIES.includes(body.category as never)) return 'invalid contribution category'
    if ((body.category === 'subscription' || body.category === 'sponsorship') && !body.personId)
      return `${body.category} requires a person`
    if (body.category === 'subscription' && !SUBSCRIPTION_SUBCATS.includes(body.subCategory?.trim() as never))
      return 'subscription sub-category must be core or non-core'
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
  if (!canFinance(c)) return c.json({ ok: false, error: 'finance admins only' }, 403)
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
  // A recorded contribution updates the roll: ≥ threshold subscription/
  // sponsorship → core, anything else → member; ex-members reactivate.
  const rollUpdated =
    body.kind === 'contribution' && body.personId
      ? await applyParticipationRule(db, body.personId, { amount: body.amount, category: body.category })
      : null
  return c.json(ok({ id, rollUpdated }))
})

/** Rewrite an entry in place (admin). Kind is immutable — void and re-add instead. */
ledgerRoutes.post('/entries/:id/update', async (c) => {
  if (!canFinance(c)) return c.json({ ok: false, error: 'finance admins only' }, 403)
  const id = c.req.param('id')
  const body = await c.req.json<LedgerEntryInput>()
  const db = drizzle(c.env.DB, { schema })
  const [existing] = await db.select().from(schema.ledgerEntry).where(eq(schema.ledgerEntry.id, id))
  if (!existing) return c.json({ ok: false, error: 'entry not found' }, 404)
  if (!existing.isActive) return c.json({ ok: false, error: 'cannot edit a voided entry' }, 400)
  if (isLocked(existing.createdAt))
    return c.json({ ok: false, error: 'entry is locked — records can only be edited within 48 hours of creation' }, 400)
  if (body.kind !== existing.kind)
    return c.json({ ok: false, error: 'kind cannot be changed — void the entry and add a new one' }, 400)
  const err = validateEntry(body)
  if (err) return c.json({ ok: false, error: err }, 400)
  const transfer = body.kind === 'transfer'
  await db
    .update(schema.ledgerEntry)
    .set({
      bookId: body.bookId,
      eventId: body.eventId || null,
      entryDate: body.entryDate,
      category: transfer ? null : body.category,
      subCategory: transfer ? null : body.subCategory?.trim() || null,
      amount: body.amount,
      personId: transfer ? null : body.personId || null,
      counterparty: transfer ? null : body.counterparty?.trim() || null,
      walletPersonId: body.walletPersonId,
      toWalletPersonId: transfer ? body.toWalletPersonId : null,
      notes: body.notes?.trim() || null,
    })
    .where(eq(schema.ledgerEntry.id, id))
  return c.json(ok({ id }))
})

/** Void an entry (admin). Reverts any pledge/claim that pointed at it. */
ledgerRoutes.post('/entries/:id/void', async (c) => {
  if (!canFinance(c)) return c.json({ ok: false, error: 'finance admins only' }, 403)
  const id = c.req.param('id')
  const db = drizzle(c.env.DB, { schema })
  const [existing] = await db.select().from(schema.ledgerEntry).where(eq(schema.ledgerEntry.id, id))
  if (!existing) return c.json({ ok: false, error: 'entry not found' }, 404)
  if (isLocked(existing.createdAt))
    return c.json({ ok: false, error: 'entry is locked — records can only be voided within 48 hours of creation' }, 400)
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
  const allEntries = (await db.select().from(schema.ledgerEntry)).filter((e) => e.isActive)
  const names = await peopleMap(db)

  const today = todayIST()
  const y = Number(today.slice(0, 4))
  const currentSeasonYear = today >= `${y}-07-01` ? y : y - 1

  // seasons present in the ledger (a season runs 1 July → 30 June)
  const seasonOf = (d: string) => (d >= `${d.slice(0, 4)}-07-01` ? Number(d.slice(0, 4)) : Number(d.slice(0, 4)) - 1)
  const seasons = [...new Set([...allEntries.map((e) => seasonOf(e.entryDate)), currentSeasonYear])].sort((a, b) => b - a)

  const requested = Number(c.req.query('year'))
  const seasonYear = seasons.includes(requested) ? requested : currentSeasonYear
  const seasonStart = `${seasonYear}-07-01`
  const seasonEnd = `${seasonYear + 1}-07-01` // exclusive
  const entries = allEntries.filter((e) => e.entryDate < seasonEnd)

  const wallets = new Map<string, WalletBalance>()
  const w = (pid: string): WalletBalance => {
    let x = wallets.get(pid)
    if (!x) {
      x = {
        personId: pid,
        personName: names.get(pid) ?? '?',
        balance: 0,
        carriedForward: 0,
        carriedForwardByBook: [],
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
  let collectedSponsorship = 0
  let spentSince = 0
  let carriedForward = 0
  /**
   * Carried-forward money keeps the book it was earned in. Poila Baishakh runs
   * in April, which the 1-July season boundary puts in the PREVIOUS season — so
   * its surplus arrives in the pujo season's opening balance and, unlabelled,
   * reads as pujo money. It is held in the same wallet (one person, one pocket)
   * but it is not the pujo's to spend.
   */
  const byBook = new Map<string, Map<BookId, number>>()
  const share = (key: string, book: BookId, amount: number) => {
    const m = byBook.get(key) ?? new Map<BookId, number>()
    m.set(book, (m.get(book) ?? 0) + amount)
    byBook.set(key, m)
  }
  const shares = (key: string): BookShare[] =>
    [...(byBook.get(key)?.entries() ?? [])]
      .filter(([, amount]) => amount !== 0)
      .map(([bookId, amount]) => ({ bookId, amount }))
  for (const e of entries) {
    const since = e.entryDate >= seasonStart
    if (e.kind === 'contribution') {
      w(e.walletPersonId).balance += e.amount
      if (since) {
        collectedSince += e.amount
        if (e.category === 'sponsorship') collectedSponsorship += e.amount
        w(e.walletPersonId).collectedSince += e.amount
      } else {
        carriedForward += e.amount
        w(e.walletPersonId).carriedForward += e.amount
        share('*', e.bookId as BookId, e.amount)
        share(e.walletPersonId, e.bookId as BookId, e.amount)
      }
    } else if (e.kind === 'expense') {
      w(e.walletPersonId).balance -= e.amount
      if (since) {
        spentSince += e.amount
        w(e.walletPersonId).spentSince += e.amount
      } else {
        carriedForward -= e.amount
        w(e.walletPersonId).carriedForward -= e.amount
        share('*', e.bookId as BookId, -e.amount)
        share(e.walletPersonId, e.bookId as BookId, -e.amount)
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
    seasonEnd,
    seasonYear,
    currentSeasonYear,
    seasons,
    totalBalance: carriedForward + collectedSince - spentSince,
    carriedForward,
    carriedForwardByBook: shares('*'),
    collectedSince,
    collectedSponsorship,
    spentSince,
    outstandingClaims,
    wallets: [...wallets.values()]
      .map((x) => ({ ...x, carriedForwardByBook: shares(x.personId) }))
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
        tagline: i.tagline,
        taglineBn: i.taglineBn,
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

/**
 * Sponsorship boards for past years are archival: writes (offers, pledges,
 * payments, cancellations) are accepted only for the active Durga Pujo year.
 */
/** Create/update a master catalog item (admin). */
ledgerRoutes.post('/sponsorship/items', async (c) => {
  if (!canFinance(c)) return c.json({ ok: false, error: 'finance admins only' }, 403)
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
  // Finance sets this year's amount; the webmaster decides whether the slot is
  // offered at all. Both write the same row.
  if (!canFinance(c) && !isWebmaster(c.get('me').personId))
    return c.json({ ok: false, error: 'finance admins or the webmaster only' }, 403)
  const itemId = c.req.param('id')
  const body = await c.req.json<{ year: number; amount: number | null; offered: boolean; notes: string | null }>()
  if (!body.year) return c.json({ ok: false, error: 'year required' }, 400)
  const db = drizzle(c.env.DB, { schema })
  if (body.year !== (await activePujoYear(db)))
    return c.json({ ok: false, error: 'past boards are archival — offerings only for the active pujo year' }, 400)
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
  if (body.year !== (await activePujoYear(db)))
    return c.json({ ok: false, error: 'past boards are archival — pledges only for the active pujo year' }, 400)
  // Everyone pledges for their own household. Only admin/fin_admin may record
  // one on someone else's behalf — the person who took the money at the counter.
  const pledger = c.get('me')
  if (!isProxyRole(pledger.role) && body.personId !== pledger.personId)
    return c.json({ ok: false, error: 'you can only pledge for yourself' }, 403)
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
  // This writes a contribution entry and credits a wallet — the same act as
  // adding to the ledger, so it belongs to whoever actually holds the money.
  if (!canFinance(c)) return c.json({ ok: false, error: 'finance admins only' }, 403)
  const pledgeId = c.req.param('id')
  const body = await c.req.json<{ walletPersonId: string; entryDate?: string; amount?: number }>()
  if (!body.walletPersonId) return c.json({ ok: false, error: 'wallet person required' }, 400)
  const entryDate = body.entryDate ?? todayIST()
  if (!DATE_RE.test(entryDate)) return c.json({ ok: false, error: 'entry_date must be YYYY-MM-DD' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const [pl] = await db.select().from(schema.sponsorshipPledge).where(eq(schema.sponsorshipPledge.id, pledgeId)).limit(1)
  if (!pl) return c.json({ ok: false, error: 'unknown pledge' }, 404)
  if (pl.status !== 'pledged') return c.json({ ok: false, error: `pledge is ${pl.status}` }, 409)
  // A slot pledged at "whatever it costs" stores 0 — the amount received is
  // named here, and never guessed.
  const amount = pl.amount > 0 ? pl.amount : Number(body.amount)
  if (!Number.isInteger(amount) || amount <= 0)
    return c.json({ ok: false, error: 'this pledge has no amount yet — enter what was received' }, 400)
  if (pl.year !== (await activePujoYear(db)))
    return c.json({ ok: false, error: 'past boards are archival — payments only for the active pujo year' }, 400)
  const [item] = await db.select().from(schema.sponsorshipItem).where(eq(schema.sponsorshipItem.id, pl.itemId)).limit(1)
  const entryId = crypto.randomUUID()
  await db.insert(schema.ledgerEntry).values({
    id: entryId,
    bookId: 'pujo-ledger',
    entryDate,
    kind: 'contribution',
    category: 'sponsorship',
    subCategory: item?.category ?? null,
    amount,
    personId: pl.personId,
    walletPersonId: body.walletPersonId,
    notes: item ? `Sponsorship: ${item.title} ${pl.year}` : null,
    createdBy: c.get('me').personId!,
    createdAt: new Date(),
  })
  const res = await db
    .update(schema.sponsorshipPledge)
    .set({ status: 'paid', ledgerEntryId: entryId, amount })
    .where(and(eq(schema.sponsorshipPledge.id, pledgeId), eq(schema.sponsorshipPledge.status, 'pledged')))
  if (((res as unknown as { meta?: { changes?: number } }).meta?.changes ?? 1) === 0) {
    // lost the race — remove the just-created entry
    await db.delete(schema.ledgerEntry).where(eq(schema.ledgerEntry.id, entryId))
    return c.json({ ok: false, error: 'pledge was settled concurrently' }, 409)
  }
  const rollUpdated = await applyParticipationRule(db, pl.personId, {
    amount: pl.amount,
    category: 'sponsorship',
  })
  return c.json(ok({ id: entryId, rollUpdated }))
})

ledgerRoutes.post('/sponsorship/pledges/:id/cancel', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  const [pl] = await db.select().from(schema.sponsorshipPledge).where(eq(schema.sponsorshipPledge.id, c.req.param('id'))).limit(1)
  if (!pl) return c.json({ ok: false, error: 'unknown pledge' }, 404)
  // A pledge is a commitment to the samiti, not a basket item: only an admin
  // releases one, and only after deciding the money is not coming.
  if (!isProxyRole(c.get('me').role))
    return c.json({ ok: false, error: 'only an admin can release a pledge' }, 403)
  if (pl.year !== (await activePujoYear(db)))
    return c.json({ ok: false, error: 'past boards are archival — cancellations only for the active pujo year' }, 400)
  const res = await db
    .update(schema.sponsorshipPledge)
    .set({ status: 'cancelled' })
    .where(and(eq(schema.sponsorshipPledge.id, c.req.param('id')), eq(schema.sponsorshipPledge.status, 'pledged')))
  if (((res as unknown as { meta?: { changes?: number } }).meta?.changes ?? 1) === 0)
    return c.json({ ok: false, error: 'only un-paid pledges can be cancelled' }, 409)
  return c.json(ok({}))
})

// ── Budget ──────────────────────────────────────────────────────────────────
// One line per (year, category, sub); NULL sub = whole-category "General"
// line. Budgets exist from season 2026 onward; writes only for the active year.

const budgetSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const budgetLineId = (year: number, category: string, sub: string | null) =>
  `bl-${year}-${budgetSlug(category)}-${sub ? budgetSlug(sub) : 'general'}`

/** Season (1 July → 30 June) an IST date belongs to — mirrors the web's rule. */
const seasonOf = (d: string) => (d >= `${d.slice(0, 4)}-07-01` ? Number(d.slice(0, 4)) : Number(d.slice(0, 4)) - 1)

/**
 * Expense totals per season/category/sub-category. This is what the Budget vs
 * Spend table runs on, and it is open to every member — the samiti's spending
 * shape is theirs to see, while the individual entries behind it stay core.
 */
ledgerRoutes.get('/spend', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  const rows = await db
    .select({
      entryDate: schema.ledgerEntry.entryDate,
      category: schema.ledgerEntry.category,
      subCategory: schema.ledgerEntry.subCategory,
      amount: schema.ledgerEntry.amount,
      kind: schema.ledgerEntry.kind,
      isActive: schema.ledgerEntry.isActive,
    })
    .from(schema.ledgerEntry)

  const acc = new Map<string, SpendRow>()
  for (const e of rows) {
    if (!e.isActive || e.kind !== 'expense') continue
    const season = seasonOf(e.entryDate)
    const category = e.category ?? 'Misc'
    const subCategory = e.subCategory ?? 'Misc'
    const key = `${season}|${category}|${subCategory}`
    const cur = acc.get(key) ?? { season, category, subCategory, total: 0, n: 0 }
    cur.total += e.amount
    cur.n += 1
    acc.set(key, cur)
  }
  return c.json(ok([...acc.values()]))
})

ledgerRoutes.get('/budget', async (c) => {
  const year = Number(c.req.query('year'))
  if (!year) return c.json({ ok: false, error: 'year required' }, 400)
  const db = drizzle(c.env.DB, { schema })
  const rows = await db.select().from(schema.budgetLine).where(eq(schema.budgetLine.year, year))
  const out: BudgetLine[] = rows.map((r) => ({
    id: r.id,
    year: r.year,
    category: r.category,
    subCategory: r.subCategory,
    amount: r.amount,
    notes: r.notes,
  }))
  return c.json(ok(out))
})

function validateBudgetLine(l: BudgetLineInput): string | null {
  if (!l.category?.trim()) return 'category required'
  if (!Number.isInteger(l.amount) || l.amount < 0) return 'amount must be a non-negative whole number'
  return null
}

async function upsertBudgetLine(db: ReturnType<typeof drizzle<typeof schema>>, l: BudgetLineInput) {
  const id = budgetLineId(l.year, l.category.trim(), l.subCategory?.trim() || null)
  const values = {
    year: l.year,
    category: l.category.trim(),
    subCategory: l.subCategory?.trim() || null,
    amount: l.amount,
    notes: l.notes?.trim() || null,
  }
  const [existing] = await db.select().from(schema.budgetLine).where(eq(schema.budgetLine.id, id)).limit(1)
  if (existing) await db.update(schema.budgetLine).set(values).where(eq(schema.budgetLine.id, id))
  else await db.insert(schema.budgetLine).values({ id, ...values, createdAt: new Date() })
  return id
}

ledgerRoutes.post('/budget', async (c) => {
  if (!canFinance(c)) return c.json({ ok: false, error: 'finance admins only' }, 403)
  const body = await c.req.json<BudgetLineInput>()
  const err = validateBudgetLine(body)
  if (err) return c.json({ ok: false, error: err }, 400)
  const db = drizzle(c.env.DB, { schema })
  if (body.year !== (await activePujoYear(db)))
    return c.json({ ok: false, error: 'budgets can only be edited for the active pujo year' }, 400)
  const id = await upsertBudgetLine(db, body)
  return c.json(ok({ id }))
})

/** Bulk upsert — used by the "seed from last season's actuals" shortcut. */
ledgerRoutes.post('/budget/bulk', async (c) => {
  if (!canFinance(c)) return c.json({ ok: false, error: 'finance admins only' }, 403)
  const body = await c.req.json<{ year: number; lines: BudgetLineInput[] }>()
  if (!Array.isArray(body.lines) || !body.lines.length) return c.json({ ok: false, error: 'lines required' }, 400)
  const db = drizzle(c.env.DB, { schema })
  if (body.year !== (await activePujoYear(db)))
    return c.json({ ok: false, error: 'budgets can only be edited for the active pujo year' }, 400)
  for (const l of body.lines) {
    const err = validateBudgetLine(l)
    if (err) return c.json({ ok: false, error: `${l.category}/${l.subCategory ?? ''}: ${err}` }, 400)
  }
  for (const l of body.lines) await upsertBudgetLine(db, { ...l, year: body.year })
  return c.json(ok({ count: body.lines.length }))
})

ledgerRoutes.post('/budget/:id/delete', async (c) => {
  if (!canFinance(c)) return c.json({ ok: false, error: 'finance admins only' }, 403)
  const db = drizzle(c.env.DB, { schema })
  const [line] = await db.select().from(schema.budgetLine).where(eq(schema.budgetLine.id, c.req.param('id'))).limit(1)
  if (!line) return c.json({ ok: false, error: 'unknown budget line' }, 404)
  if (line.year !== (await activePujoYear(db)))
    return c.json({ ok: false, error: 'budgets can only be edited for the active pujo year' }, 400)
  await db.delete(schema.budgetLine).where(eq(schema.budgetLine.id, line.id))
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
  // Settling writes an expense entry against a wallet — finance work.
  if (!canFinance(c)) return c.json({ ok: false, error: 'finance admins only' }, 403)
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
  if (!canFinance(c)) return c.json({ ok: false, error: 'finance admins only' }, 403)
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
  if (claim.personId !== me.personId && !canFinance(c))
    return c.json({ ok: false, error: 'only the claimant (or an admin) can cancel' }, 403)
  const res = await db
    .update(schema.expenseReimbursement)
    .set({ status: 'cancelled' })
    .where(and(eq(schema.expenseReimbursement.id, claim.id), eq(schema.expenseReimbursement.status, 'requested')))
  if (((res as unknown as { meta?: { changes?: number } }).meta?.changes ?? 1) === 0)
    return c.json({ ok: false, error: 'only requested claims can be cancelled' }, 409)
  return c.json(ok({}))
})
