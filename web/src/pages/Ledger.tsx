import type {
  BookId,
  BudgetLine,
  BudgetLineInput,
  ClaimStatus,
  LedgerEntry,
  LedgerEntryInput,
  LedgerKind,
  LedgerSummary,
  Me,
  ReimbursementClaim,
  BookShare,
  ReimbursementClaimInput,
  SponsorshipItemView,
  SpendRow,
} from '@pujosamiti/shared'
import { BOOKS, CONTRIBUTION_CATEGORIES, CONTRIBUTION_SUBCATS, EXPENSE_TAXONOMY, expenseSubcats, GUEST_BHOG_SUBCATEGORY, LEDGER_PDF_FROM_SEASON, SUBSCRIPTION_SUBCATS, isCoreRole, isProxyRole, isWebmaster, sponsorshipOpen, SPONSORSHIP_OPENS_ON } from '@pujosamiti/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Ban,
  HandCoins,
  History,
  Loader2,
  Pencil,
  PiggyBank,
  Plus,
  Undo2,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { LedgerReportId } from '@/lib/ledger-reports'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'

import { BackLink } from '@/components/BackLink'
import { LogoSpinner } from '@/components/LogoSpinner'
import { Field, inputCls } from '@/components/form'
import { PersonPicker } from '@/components/PersonPicker'
import { PAGE_TINT, pastelAt, tint, type Tint } from '@/lib/tint'
import { cn } from '@/lib/utils'
import { PageTitle } from '@/components/PageTitle'
import { SearchSelect, TextPicker } from '@/components/SearchSelect'
import { DownloadPill, FormatSwitch } from '@/components/ReportDownload'
import { Switch } from '@/components/Switch'
import { receiveGuestBhog, useGuestBoard } from '@/lib/bhog'
import { FORMAT_LABEL, type ReportFormat } from '@/lib/report-format'
import { Seo } from '@/components/Seo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogActions, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { api } from '@/lib/api'
import { useMemberState } from '@/lib/member'
import { PUJO_YEAR } from '@/lib/pujoCalendar'
import { useEvents, useMembersLite } from '@/lib/tasks'

const post = <T,>(path: string, body?: unknown) =>
  api<T>(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) })

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`
/** Money powers: the books, budgets, sponsorship pricing, claim rejection. */
const canFinance = (me: Me) => me.role === 'admin' || me.role === 'fin_admin'
/** Entries harden 48 h after creation — edit/void disappear, admin included. */
const entryLocked = (e: LedgerEntry) => Date.now() - e.createdAt > 48 * 60 * 60 * 1000
/** "Pradyumna Das Roy" → "PR": first and last initials. */
const initials = (name: string) => {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '')).toUpperCase()
}
const todayIST = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10)
/** An entry's date as people say it — "26 Sep", with the year only when it is not this one. */
const entryDay = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    ...(iso.slice(0, 4) === todayIST().slice(0, 4) ? {} : { year: 'numeric' }),
    timeZone: 'UTC',
  })
/** "25 September 2026" — the day the sponsorship board opens to the samiti. */
const fmtOpensOn = () =>
  new Date(`${SPONSORSHIP_OPENS_ON}T00:00:00Z`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
/**
 * The samiti's books run 1 July → 30 June, so the ledger is filtered by season
 * rather than calendar year — a March expense belongs to the pujo that began
 * the previous July. Mirrors the API's rule.
 */
const seasonOf = (d: string) => (d >= `${d.slice(0, 4)}-07-01` ? Number(d.slice(0, 4)) : Number(d.slice(0, 4)) - 1)
const seasonRange = (y: number) => `${y}–${String(y + 1).slice(2)} (Jul ${y} – Jun ${y + 1})`

const useSummary = (seasonYear?: number | null) =>
  useQuery({
    queryKey: ['ledger-summary', seasonYear ?? 'current'],
    queryFn: () =>
      api<LedgerSummary>(`/api/members/ledger/summary${seasonYear ? `?year=${seasonYear}` : ''}`),
  })
const useEntries = () => useQuery({ queryKey: ['ledger-entries'], queryFn: () => api<LedgerEntry[]>('/api/members/ledger/entries') })
const useClaims = () => useQuery({ queryKey: ['ledger-claims'], queryFn: () => api<ReimbursementClaim[]>('/api/members/ledger/claims') })
const useSponsorship = (year: number | null) =>
  useQuery({
    queryKey: ['sponsorship', year],
    queryFn: () => api<SponsorshipItemView[]>(`/api/members/ledger/sponsorship?year=${year}`),
    enabled: !!year,
  })

function useLedgerInvalidate() {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: ['ledger-summary'] })
    void qc.invalidateQueries({ queryKey: ['ledger-entries'] })
    void qc.invalidateQueries({ queryKey: ['ledger-spend'] })
    void qc.invalidateQueries({ queryKey: ['ledger-claims'] })
    void qc.invalidateQueries({ queryKey: ['sponsorship'] })
  }
}

/** Shared core-members-only gate for the four money pages. */
function CorePage({
  title,
  tint: pageTint,
  members = false,
  newSignIn = false,
  children,
}: {
  title: string
  /** The page's own pastel — the colour of its tile on Members Only. */
  tint: Tint
  /** Open to every member, not just core — the page itself hides what they can't do. */
  members?: boolean
  /** Also visible to not-yet-activated new sign-ins (open membership). */
  newSignIn?: boolean
  children: (me: Me) => React.ReactNode
}) {
  const { memberState, memberPending, sessionPending } = useMemberState()
  const me = memberState?.status === 'member' ? memberState.me : null

  if (sessionPending || memberPending) {
    return (
      <div className="flex justify-center py-16">
        <LogoSpinner />
      </div>
    )
  }
  const allowed = me && (isCoreRole(me.role) || (me.role === 'newsignin' ? newSignIn : members))
  if (!me || !allowed) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Core members only</CardTitle>
          <CardDescription>{title} is visible to core members.</CardDescription>
        </CardHeader>
      </Card>
    )
  }
  return (
    <div className="flex flex-col gap-4">
      <Seo
        title={title}
        description={`${title} — samiti accounts, for core members.`}
        path={`/${title.toLowerCase().replace(/\s+/g, '')}`}
        noindex
      />
      <BackLink />
      <PageTitle tint={pageTint}>{title}</PageTitle>
      {children(me)}
    </div>
  )
}

export const LedgerPage = () => <CorePage title="Ledger" tint={PAGE_TINT.ledger}>{(me) => <EntriesTab isFinAdmin={canFinance(me)} />}</CorePage>
export const WalletsPage = () => (
  <CorePage title="Wallets" tint={PAGE_TINT.wallets} members>
    {(me) => <OverviewTab isFinAdmin={canFinance(me)} />}
  </CorePage>
)
export const SponsorshipPage = () => (
  <CorePage title="Sponsorship" tint={PAGE_TINT.sponsorship} members newSignIn>
    {(me) =>
      !sponsorshipOpen() && me.role !== 'admin' ? (
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>The board opens on {fmtOpensOn()}</CardTitle>
            <CardDescription>
              The slots for this year are still being settled and priced. From that morning every
              member can see what is on offer and take one on.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
      <SponsorshipTab
        isFinAdmin={canFinance(me)}
        canSettle={canFinance(me)}
        isWebmaster={isWebmaster(me.personId)}
        pledgeForOthers={isProxyRole(me.role)}
        myPersonId={me.personId!}
      />
      )
    }
  </CorePage>
)
export const ReimbursementsPage = () => (
  <CorePage title="Reimbursements" tint={PAGE_TINT.reimbursements}>{(me) => <ClaimsTab myPersonId={me.personId!} isFinAdmin={canFinance(me)} />}</CorePage>
)
// ── Season spending (budget vs actuals, shown on the Wallets page) ──────────

const useBudget = (year: number | null) =>
  useQuery({
    queryKey: ['budget', year],
    queryFn: () => api<BudgetLine[]>(`/api/members/ledger/budget?year=${year}`),
    enabled: !!year,
  })

/**
 * Spend totals per season/category/sub, aggregated by the API. Members can
 * read this even though the entries behind it are core-only, which is what
 * lets the Budget vs Spend table render for everyone.
 */
const useSpend = () =>
  useQuery({ queryKey: ['ledger-spend'], queryFn: () => api<SpendRow[]>('/api/members/ledger/spend') })

/**
 * Category/sub-category spending for a season, merged with the budget where
 * one exists. Budgets start from season 2026: past seasons render as a plain
 * expense report (no budget columns), current seasons as budget-vs-actual.
 */
/** A ledger entry's edge: money in (river water), out (sandalwood), moved (blue lotus). */
const entryTint = (e: LedgerEntry) =>
  tint(e.kind === 'contribution' ? 'ganga' : e.kind === 'expense' ? 'chandan' : 'nilkamal', '6%')
/** A spending card's pastel, in turn — a gentler wash than the tiles, since these hold tables. */
const catTint = (i: number) => tint(pastelAt(i), '12%')

function SeasonSpending({ year: y, isFinAdmin }: { year: number; isFinAdmin: boolean }) {
  const { data: events } = useEvents()
  const activeYear =
    (events ?? []).filter((e) => e.kind === 'durga-pujo').find((e) => e.isActive)?.year ?? new Date().getFullYear()
  const readOnly = y !== activeYear
  const { data: lines, isPending } = useBudget(y)
  const { data: spend } = useSpend()
  const qc = useQueryClient()
  const invalidate = () => void qc.invalidateQueries({ queryKey: ['budget'] })

  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [addingCat, setAddingCat] = useState<string | null>(null)
  const [newSub, setNewSub] = useState('')
  const [newAmount, setNewAmount] = useState('')

  const upsert = useMutation({
    mutationFn: (body: BudgetLineInput) => post('/api/members/ledger/budget', body),
    onSuccess: () => {
      invalidate()
      setEditingId(null)
      setAddingCat(null)
      setNewSub('')
      setNewAmount('')
    },
  })
  const remove = useMutation({
    mutationFn: (id: string) => post(`/api/members/ledger/budget/${id}/delete`),
    onSuccess: invalidate,
  })
  const seed = useMutation({
    mutationFn: (body: { year: number; lines: BudgetLineInput[] }) => post('/api/members/ledger/budget/bulk', body),
    onSuccess: invalidate,
  })

  if (isPending || !lines || !spend)
    return <LogoSpinner small />

  // actuals (totals + entry counts) for the selected and previous seasons
  const actualsFor = (season: number) => {
    const cat = new Map<string, number>()
    const sub = new Map<string, { total: number; n: number }>()
    for (const r of spend) {
      if (r.season !== season) continue
      cat.set(r.category, (cat.get(r.category) ?? 0) + r.total)
      sub.set(`${r.category}|${r.subCategory}`, { total: r.total, n: r.n })
    }
    return { cat, sub }
  }
  const now = actualsFor(y)
  const prev = actualsFor(y - 1)
  const totalSpent = [...now.cat.values()].reduce((s, v) => s + v, 0)
  const hasBudget = lines.length > 0

  const byCat = new Map<string, BudgetLine[]>()
  for (const l of lines) {
    if (!byCat.has(l.category)) byCat.set(l.category, [])
    byCat.get(l.category)!.push(l)
  }
  const totalBudget = lines.reduce((s, l) => s + l.amount, 0)
  const pct = totalBudget ? Math.round((totalSpent / totalBudget) * 100) : 0

  const lineActual = (l: BudgetLine) => {
    if (l.subCategory) return now.sub.get(`${l.category}|${l.subCategory}`)?.total ?? 0
    // General line: category spend not claimed by budgeted sub lines
    const claimed = byCat
      .get(l.category)!
      .filter((x) => x.subCategory)
      .reduce((s, x) => s + (now.sub.get(`${l.category}|${x.subCategory}`)?.total ?? 0), 0)
    return Math.max(0, (now.cat.get(l.category) ?? 0) - claimed)
  }
  const linePrev = (l: BudgetLine) =>
    l.subCategory ? (prev.sub.get(`${l.category}|${l.subCategory}`)?.total ?? 0) : (prev.cat.get(l.category) ?? 0)

  const seedFromLastSeason = () => {
    const seedLines: BudgetLineInput[] = []
    for (const [k, v] of prev.sub.entries()) {
      const [category, sub] = k.split('|')
      seedLines.push({ year: y, category, subCategory: sub === 'Misc' ? null : sub, amount: v.total })
    }
    if (seedLines.length) seed.mutate({ year: y, lines: seedLines })
  }

  const budgetCats = [...byCat.entries()]
    .map(([c, ls]) => ({ category: c, lines: ls, budget: ls.reduce((s, l) => s + l.amount, 0), actual: now.cat.get(c) ?? 0 }))
    .sort((a, b) => b.budget - a.budget)
  const unbudgeted = [...now.cat.entries()].filter(([c]) => !byCat.has(c)).sort((a, b) => b[1] - a[1])
  const reportCats = [...now.cat.entries()].sort((a, b) => b[1] - a[1])

  if (totalSpent === 0 && !hasBudget && (readOnly || !isFinAdmin))
    return null

  return (
    <div className="mt-2 flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold">{hasBudget ? 'Budget vs spend' : 'Spend by category'}</h2>
        <span className="text-sm text-muted-foreground">
          {hasBudget
            ? `Budget ${rupees(totalBudget)} · spent ${rupees(totalSpent)} · ${pct}% used`
            : `Total spent: ${rupees(totalSpent)}`}
        </span>
      </div>

      {!hasBudget && isFinAdmin && !readOnly && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No budget yet for {y}–{String(y + 1).slice(2)}</CardTitle>
            <CardDescription>
              Add lines per category below once spending starts, or seed one line per category/sub-category from last
              season's actual spend and adjust.
            </CardDescription>
            <Button size="sm" className="mt-2 self-start" disabled={seed.isPending} onClick={seedFromLastSeason}>
              {seed.isPending && <Loader2 className="animate-spin" />} Seed from last season's actuals
            </Button>
          </CardHeader>
        </Card>
      )}

      {hasBudget
        ? budgetCats.map(({ category, lines: ls, budget, actual }, i) => (
            <Card key={category} {...catTint(i)}>
              <CardHeader className="pb-2">
                <div className="flex items-baseline justify-between gap-3">
                  <CardTitle className="text-base text-shiuli">{category}</CardTitle>
                  <span className="text-sm">
                    <span className={actual > budget ? 'font-bold text-destructive' : 'font-bold'}>{rupees(actual)}</span>
                    <span className="text-muted-foreground"> of {rupees(budget)}</span>
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={actual > budget ? 'h-full bg-destructive' : 'h-full bg-durba'}
                    style={{ width: `${Math.min(100, budget ? (actual / budget) * 100 : 100)}%` }}
                  />
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="py-1 pr-2 font-medium">Sub-category</th>
                      <th className="py-1 pr-2 text-right font-medium">Last season</th>
                      <th className="py-1 pr-2 text-right font-medium">Budget</th>
                      <th className="py-1 pr-2 text-right font-medium">Actual</th>
                      <th className="py-1 text-right font-medium">Left</th>
                      {isFinAdmin && !readOnly && <th />}
                    </tr>
                  </thead>
                  <tbody>
                    {ls
                      .sort((a, b) => b.amount - a.amount)
                      .map((l) => {
                        const a = lineActual(l)
                        const left = l.amount - a
                        return (
                          <tr key={l.id} className="border-b last:border-0">
                            <td className="py-1.5 pr-2">
                              {l.subCategory ?? <span className="text-muted-foreground">General</span>}
                            </td>
                            <td className="py-1.5 pr-2 text-right text-muted-foreground">{rupees(linePrev(l))}</td>
                            <td className="py-1.5 pr-2 text-right">
                              {isFinAdmin && !readOnly && editingId === l.id ? (
                                <span className="flex items-center justify-end gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    className={`${inputCls} h-8 w-24`}
                                    value={draft}
                                    onChange={(e) => setDraft(e.target.value)}
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    disabled={upsert.isPending || draft === ''}
                                    onClick={() =>
                                      upsert.mutate({
                                        year: y,
                                        category: l.category,
                                        subCategory: l.subCategory,
                                        amount: Number(draft),
                                        notes: l.notes,
                                      })
                                    }
                                  >
                                    Set
                                  </Button>
                                </span>
                              ) : isFinAdmin && !readOnly ? (
                                <button
                                  type="button"
                                  className="cursor-pointer font-medium underline decoration-dotted underline-offset-4 hover:text-foreground"
                                  onClick={() => {
                                    setEditingId(l.id)
                                    setDraft(String(l.amount))
                                  }}
                                >
                                  {rupees(l.amount)}
                                </button>
                              ) : (
                                <span className="font-medium">{rupees(l.amount)}</span>
                              )}
                            </td>
                            <td className="py-1.5 pr-2 text-right">{rupees(a)}</td>
                            <td className={`py-1.5 text-right font-medium ${left < 0 ? 'text-destructive' : ''}`}>
                              {rupees(left)}
                            </td>
                            {isFinAdmin && !readOnly && (
                              <td className="py-1.5 pl-2 text-right">
                                <Button size="icon" variant="ghost" aria-label="Remove line" onClick={() => remove.mutate(l.id)}>
                                  <Undo2 className="size-4" />
                                </Button>
                              </td>
                            )}
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
                {isFinAdmin && !readOnly &&
                  (addingCat === category ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <TextPicker
                        ariaLabel="Sub-category"
                        fullWidth={false}
                        value={newSub}
                        onChange={setNewSub}
                        empty="General"
                        suggestions={[...(EXPENSE_TAXONOMY[category] ?? []), 'Misc']}
                        placeholder="Sub-category (blank = General)"
                      />
                      <input
                        type="number"
                        min="0"
                        className={`${inputCls} h-9 w-28`}
                        placeholder="Amount"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                      />
                      <Button
                        size="sm"
                        disabled={upsert.isPending || newAmount === ''}
                        onClick={() => upsert.mutate({ year: y, category, subCategory: newSub || null, amount: Number(newAmount) })}
                      >
                        Add
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setAddingCat(null)}>
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" className="mt-1" onClick={() => setAddingCat(category)}>
                      <Plus /> Add line
                    </Button>
                  ))}
              </CardContent>
            </Card>
          ))
        : reportCats.map(([category, catTotal], i) => (
            <Card key={category} {...catTint(i)}>
              <CardHeader className="pb-2">
                <div className="flex items-baseline justify-between gap-3">
                  <CardTitle className="text-base text-shiuli">{category}</CardTitle>
                  <span className="text-sm font-bold">{rupees(catTotal)}</span>
                </div>
                <CardDescription>{totalSpent ? Math.round((catTotal / totalSpent) * 100) : 0}% of the season's spend</CardDescription>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <tbody>
                    {[...now.sub.entries()]
                      .filter(([k]) => k.startsWith(`${category}|`))
                      .sort((a, b) => b[1].total - a[1].total)
                      .map(([k, s]) => (
                        <tr key={k} className="border-b last:border-0">
                          <td className="py-1.5 pr-2">{k.split('|')[1]}</td>
                          <td className="py-1.5 pr-2 text-right text-xs text-muted-foreground">
                            {s.n} {s.n === 1 ? 'entry' : 'entries'}
                          </td>
                          <td className="py-1.5 text-right font-medium">{rupees(s.total)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ))}

      {hasBudget && unbudgeted.length > 0 && (
        <Card style={{ background: 'color-mix(in srgb, var(--palash) 9%, var(--card))' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Unbudgeted spend</CardTitle>
            <CardDescription>Categories with expenses this season but no budget line.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            {unbudgeted.map(([c, v]) => (
              <div key={c} className="flex items-center justify-between gap-2">
                <span>{c}</span>
                <span className="flex items-center gap-2">
                  <span className="font-medium">{rupees(v)}</span>
                  {isFinAdmin && !readOnly && (
                    <Button size="sm" variant="ghost" onClick={() => upsert.mutate({ year: y, category: c, subCategory: null, amount: 0 })}>
                      Budget it
                    </Button>
                  )}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {hasBudget && isFinAdmin && !readOnly && (
        <div className="flex flex-wrap gap-2">
          {[...new Set([...Object.keys(EXPENSE_TAXONOMY)])]
            .filter((c) => !byCat.has(c))
            .map((c) => (
              <Button key={c} size="sm" variant="outline" onClick={() => upsert.mutate({ year: y, category: c, subCategory: null, amount: 0 })}>
                <Plus /> {c}
              </Button>
            ))}
        </div>
      )}
      {(upsert.isError || seed.isError) && (
        <p className="text-sm text-destructive">{((upsert.error ?? seed.error) as Error).message}</p>
      )}
    </div>
  )
}

// ── Overview ────────────────────────────────────────────────────────────────

function OverviewTab({ isFinAdmin }: { isFinAdmin: boolean }) {
  const [seasonYear, setSeasonYear] = useState<number | null>(null)
  const { data: s, isPending } = useSummary(seasonYear)
  if (isPending || !s) return <LogoSpinner small />
  const isCurrent = s.seasonYear === s.currentSeasonYear
  const seasonLabel = (y: number) => `${y}–${String(y + 1).slice(2)}`
  /** "Poila Baishakh carry forward ₹11,780" — the share of an opening balance
      that belongs to another book, held in the same wallet but not the pujo's. */
  const otherBooks = (shares: BookShare[]) =>
    shares
      .filter((b) => b.bookId !== 'pujo-ledger' && b.amount !== 0)
      .map((b) => `${BOOKS.find((x) => x.id === b.bookId)?.name ?? b.bookId} carry forward ${rupees(b.amount)}`)
  // each figure gets a pastel of its own (golap, chandan, ganga, nilkamal, or the
  // woven shankha) — a wash, a thin edge strip and an icon disc (.tint-tile)
  const stats: { label: string; value: string; tint: Tint; icon: LucideIcon; sub?: string }[] = [
    {
      label: isCurrent ? 'Total in hand' : `Closing balance (30 Jun ${s.seasonYear + 1})`,
      value: rupees(s.totalBalance),
      tint: 'nilkamal',
      icon: Wallet,
    },
    {
      label: `Carried forward (before 1 Jul ${s.seasonYear})`,
      value: rupees(s.carriedForward),
      tint: 'woven',
      icon: History,
      // information, not a warning: it says what the figure includes
      sub: otherBooks(s.carriedForwardByBook).map((t) => `incl. ${t}`).join(' · ') || undefined,
    },
    {
      label: 'Collected this season',
      value: rupees(s.collectedSince),
      tint: 'ganga',
      icon: ArrowDownLeft,
      sub: `incl. ${rupees(s.collectedSponsorship)} sponsorship`,
    },
    // spending is ordinary — sandalwood earth, not the destructive red
    { label: 'Spent this season', value: rupees(s.spentSince), tint: 'chandan', icon: ArrowUpRight },
    ...(isCurrent
      ? [
          { label: 'Owed to members (pending claims)', value: rupees(s.outstandingClaims), tint: 'golap' as const, icon: HandCoins },
          // blue lotus, like Total in hand — the two "in hand" figures share a colour;
          // and it keeps clear of Collected (river water) above it on desktop and
          // of Spent and Owed beside it on phones
          {
            label: 'Disposable (in hand − owed)',
            value: rupees(s.totalBalance - s.outstandingClaims),
            tint: 'nilkamal' as const,
            icon: PiggyBank,
          },
        ]
      : []),
  ]
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 self-start">
        <span className="text-sm text-muted-foreground">Season</span>
        <SearchSelect
          ariaLabel="Season"
          align="left"
          value={String(s.seasonYear)}
          options={s.seasons.map((y) => ({
            value: String(y),
            label: `${seasonLabel(y)} (Jul ${y} – Jun ${y + 1})`,
            hint: y === s.currentSeasonYear ? 'Current' : undefined,
          }))}
          onChange={(v) => setSeasonYear(Number(v) === s.currentSeasonYear ? null : Number(v))}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map(({ label, value, tint: t, icon: Icon, sub }) => (
          <Card key={label} {...tint(t)}>
            <CardContent className="flex items-start gap-3 p-4">
              <span aria-hidden="true" className="tint-disc grid size-9 shrink-0 place-items-center rounded-full">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-bold">{value}</p>
                {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Wallets</CardTitle>
          <CardDescription>
            {isCurrent
              ? 'Whoever holds samiti money right now — nobody is designated.'
              : `Wallet activity and closing balances for the ${seasonLabel(s.seasonYear)} season.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {s.wallets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No money movements yet.</p>
          ) : (
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-1.5 pr-2 font-medium">Wallet</th>
                  <th className="py-1.5 pr-2 text-right font-medium">Carried fwd</th>
                  <th className="py-1.5 pr-2 text-right font-medium">Collected</th>
                  <th className="py-1.5 pr-2 text-right font-medium">Spent</th>
                  <th className="py-1.5 pr-2 text-right font-medium">Transfers</th>
                  <th className="py-1.5 text-right font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {s.wallets.map((w, i) => (
                  <tr key={w.personId} className="border-b last:border-0">
                    <td className="py-1.5 pr-2">
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="tint-disc grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold"
                          style={{ '--tint': `var(--${pastelAt(i)})` } as React.CSSProperties}
                        >
                          {initials(w.personName)}
                        </span>
                        <span>{w.personName}</span>
                      </span>
                      {otherBooks(w.carriedForwardByBook).map((t) => (
                        <span key={t} className="block pl-9 text-xs text-muted-foreground">
                          incl. {t}
                        </span>
                      ))}
                    </td>
                    <td className="py-1.5 pr-2 text-right">{rupees(w.carriedForward)}</td>
                    <td className="py-1.5 pr-2 text-right">{rupees(w.collectedSince)}</td>
                    <td className="py-1.5 pr-2 text-right">{rupees(w.spentSince)}</td>
                    <td className="py-1.5 pr-2 text-right">{rupees(w.transfersInSince - w.transfersOutSince)}</td>
                    <td className="py-1.5 text-right font-semibold">{rupees(w.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <SeasonSpending year={s.seasonYear} isFinAdmin={isFinAdmin} />
    </div>
  )
}

// ── Entries ─────────────────────────────────────────────────────────────────

function EntriesTab({ isFinAdmin }: { isFinAdmin: boolean }) {
  const { data: entries, isPending } = useEntries()
  const invalidate = useLedgerInvalidate()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  // The pujo book and the newest season are what anyone actually opens this
  // page for; the other books and older seasons are a deliberate step away.
  const [book, setBook] = useState<string>('pujo-ledger')
  const [season, setSeason] = useState<number | 'all' | null>(null)
  const [kind, setKind] = useState<string>('all')

  const voidEntry = useMutation({
    mutationFn: (id: string) => post(`/api/members/ledger/entries/${id}/void`),
    onSuccess: invalidate,
  })

  const seasons = useMemo(
    () => [...new Set((entries ?? []).map((e) => seasonOf(e.entryDate)))].sort((a, b) => b - a),
    [entries],
  )
  // Land on the newest season once the entries arrive.
  useEffect(() => {
    if (season === null && seasons.length) setSeason(seasons[0])
  }, [season, seasons])

  const shown = (entries ?? []).filter(
    (e) =>
      (book === 'all' || e.bookId === book) &&
      (season === 'all' || season === null || seasonOf(e.entryDate) === season) &&
      (kind === 'all' || e.kind === kind),
  )
  const total = shown.filter((e) => e.isActive).reduce(
    (s, e) => s + (e.kind === 'contribution' ? e.amount : e.kind === 'expense' ? -e.amount : 0),
    0,
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {isFinAdmin && !adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus /> Add entry
          </Button>
        )}
        {/* the app's own select, as everywhere else — not three bare native ones */}
        <SearchSelect
          ariaLabel="Book"
          align="left"
          value={book}
          options={[{ value: 'all', label: 'All books' }, ...BOOKS.map((b) => ({ value: b.id, label: b.name }))]}
          onChange={setBook}
        />
        <SearchSelect
          ariaLabel="Season"
          align="left"
          value={season === null ? 'all' : String(season)}
          options={[{ value: 'all', label: 'All seasons' }, ...seasons.map((y) => ({ value: String(y), label: seasonRange(y) }))]}
          onChange={(v) => setSeason(v === 'all' ? 'all' : Number(v))}
        />
        <SearchSelect
          ariaLabel="Kind"
          align="left"
          value={kind}
          options={[
            { value: 'all', label: 'All kinds' },
            { value: 'contribution', label: 'Contributions' },
            { value: 'expense', label: 'Expenses' },
            { value: 'transfer', label: 'Transfers' },
          ]}
          onChange={setKind}
        />
        {book !== 'all' && typeof season === 'number' && season >= LEDGER_PDF_FROM_SEASON && (
          <ReportDownload bookId={book as BookId} season={season} entries={entries ?? []} />
        )}
        <span className="ml-auto text-sm text-muted-foreground">Net: {rupees(total)}</span>
      </div>

      {adding && <EntryForm onClose={() => setAdding(false)} />}
      {isPending ? (
        <LogoSpinner small />
      ) : shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">No entries yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {shown.map((e) =>
            editingId === e.id ? (
              <EntryForm key={e.id} initial={e} onClose={() => setEditingId(null)} />
            ) : (
            // the edge says what the money did: in (river water), out (sandalwood), moved (blue lotus)
            <Card
              key={e.id}
              style={entryTint(e).style}
              className={cn(entryTint(e).className, !e.isActive && 'opacity-50')}
            >
              <CardContent className="flex flex-wrap items-center gap-x-3 gap-y-1 p-3 text-sm">
                {/* phones: date · kind · amount · actions on one line, the description
                    full width beneath; from sm up, one row as before */}
                <time dateTime={e.entryDate} className="shrink-0 text-xs text-muted-foreground sm:w-20">
                  {entryDay(e.entryDate)}
                </time>
                <Badge variant={e.kind === 'contribution' ? 'durba' : e.kind === 'expense' ? 'matir' : 'outline'}>
                  {e.kind}
                </Badge>
                <span className="order-last min-w-0 basis-full sm:order-none sm:basis-0 sm:flex-1">
                  {e.kind === 'transfer' ? (
                    <>
                      {e.walletName} → {e.toWalletName}
                    </>
                  ) : (
                    <>
                      {e.category}
                      {e.subCategory ? ` · ${e.subCategory}` : ''} — {e.personName ?? e.counterparty ?? '?'}
                      <span className="text-muted-foreground"> · wallet {e.walletName}</span>
                    </>
                  )}
                  {e.notes && <span className="block text-xs text-muted-foreground">{e.notes}</span>}
                  {!e.isActive && <Badge variant="outline">voided</Badge>}
                </span>
                <span className="ml-auto font-semibold sm:ml-0">{rupees(e.amount)}</span>
                {isFinAdmin && e.isActive && !entryLocked(e) && (
                  <span className="flex shrink-0">
                    <Button size="icon" variant="ghost" aria-label="Edit entry" onClick={() => setEditingId(e.id)}>
                      <Pencil className="size-4" />
                    </Button>
                    <VoidEntryButton entry={e} onVoid={() => voidEntry.mutate(e.id)} />
                  </span>
                )}
              </CardContent>
            </Card>
            ),
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Two-step confirmation for the admin-only book rewrites (edit and void):
 * a plain confirm first, then a type-the-phrase gate.
 */
/**
 * One book, one season, three reports — core subscriptions, non-core
 * subscriptions, sponsorships — as a spreadsheet or a PDF. Each builder and
 * its library load on first use so the ledger page stays light.
 */
function ReportDownload({ bookId, season, entries }: { bookId: BookId; season: number; entries: LedgerEntry[] }) {
  // A spreadsheet unless asked otherwise: the treasurer's lists get sorted and added up more than printed.
  const [format, setFormat] = useState<ReportFormat>('xlsx')
  const [busy, setBusy] = useState<LedgerReportId | null>(null)
  const [error, setError] = useState<string | null>(null)
  const download = async (report: LedgerReportId) => {
    setBusy(report)
    setError(null)
    const input = {
      report,
      bookId,
      season,
      entries: entries.filter((e) => e.bookId === bookId && seasonOf(e.entryDate) === season),
    }
    try {
      if (format === 'xlsx') {
        const { downloadLedgerXlsx } = await import('@/lib/reports-xlsx')
        await downloadLedgerXlsx(input)
      } else {
        const { downloadLedgerPdf } = await import('@/lib/reports-pdf')
        await downloadLedgerPdf(input)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `could not build the ${FORMAT_LABEL[format]}`)
    } finally {
      setBusy(null)
    }
  }
  const pills: { id: LedgerReportId; label: string }[] = [
    { id: 'core', label: 'Core' },
    { id: 'non-core', label: 'Non Core' },
    { id: 'sponsorship', label: 'Sponsorship' },
  ]
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <FormatSwitch value={format} onChange={setFormat} disabled={busy !== null} />
      {pills.map((pill) => (
        <DownloadPill
          key={pill.id}
          label={pill.label}
          format={FORMAT_LABEL[format]}
          busy={busy === pill.id}
          disabled={busy !== null}
          onClick={() => void download(pill.id)}
        />
      ))}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </span>
  )
}

/** The sponsorship board of one year as a spreadsheet or a PDF — the rows exactly as drawn on screen. */
function SponsorshipDownload({ year, items }: { year: number; items: SponsorshipItemView[] }) {
  // Excel first, as on the ledger's season lists.
  const [format, setFormat] = useState<ReportFormat>('xlsx')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const download = async () => {
    setBusy(true)
    setError(null)
    try {
      if (format === 'xlsx') {
        const { downloadSponsorshipXlsx } = await import('@/lib/reports-xlsx')
        await downloadSponsorshipXlsx({ year, items })
      } else {
        const { downloadSponsorshipPdf } = await import('@/lib/reports-pdf')
        await downloadSponsorshipPdf({ year, items })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `could not build the ${FORMAT_LABEL[format]}`)
    } finally {
      setBusy(false)
    }
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <FormatSwitch value={format} onChange={setFormat} disabled={busy} />
      <DownloadPill label="Sponsorship" format={FORMAT_LABEL[format]} busy={busy} disabled={busy} onClick={() => void download()} />
      {error && <span className="text-xs text-destructive">{error}</span>}
    </span>
  )
}

function ConfirmTwice({
  open,
  title,
  description,
  phrase,
  actionLabel,
  actionIcon,
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  description: React.ReactNode
  phrase: string
  actionLabel: string
  actionIcon?: React.ReactNode
  onCancel: () => void
  onConfirm: () => void
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const [typed, setTyped] = useState('')
  useEffect(() => {
    if (open) {
      setStep(1)
      setTyped('')
    }
  }, [open])
  return (
    <>
      <Dialog open={open && step === 1} onClose={onCancel}>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        <DialogActions>
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setStep(2)}>
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={open && step === 2} onClose={onCancel}>
        <DialogTitle>Type to confirm</DialogTitle>
        <DialogDescription>
          To continue, type <span className="font-semibold text-destructive">{phrase}</span> below.
        </DialogDescription>
        <input
          className={inputCls}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={phrase}
          autoFocus
        />
        <DialogActions>
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" disabled={typed.trim() !== phrase} onClick={onConfirm}>
            {actionIcon} {actionLabel}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

function VoidEntryButton({ entry, onVoid }: { entry: LedgerEntry; onVoid: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button size="icon" variant="ghost" aria-label="Void entry" onClick={() => setOpen(true)}>
        <Ban className="size-4" />
      </Button>
      <ConfirmTwice
        open={open}
        title="Are you sure to delete?"
        description={
          <>
            {entryDay(entry.entryDate)} · {entry.kind} · {rupees(entry.amount)} — the entry will be voided (struck off, kept
            in the book), and any linked pledge or claim will reopen.
          </>
        }
        phrase="Please soft delete this record"
        actionLabel="Void entry"
        actionIcon={<Ban />}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          onVoid()
          setOpen(false)
        }}
      />
    </>
  )
}

function PersonSelect({
  value,
  onChange,
  ariaLabel,
  coreOnly = false,
  exclude = [],
  everyone = false,
  allowCreate = false,
  placeholder,
  invalid = false,
  pinnedId,
}: {
  value: string | null
  onChange: (v: string) => void
  ariaLabel: string
  coreOnly?: boolean
  exclude?: string[]
  /** Counter mode: the whole roll (ex/non-members, inactive). */
  everyone?: boolean
  /** Offer walk-up creation (contributions only). */
  allowCreate?: boolean
  placeholder?: string
  /** Required and still empty. */
  invalid?: boolean
  /** Pin one person to the top of the roll (the sponsorship form pins the viewer). */
  pinnedId?: string
}) {
  const { data: people } = useMembersLite()
  if (everyone)
    return (
      <PersonPicker
        value={value}
        onChange={onChange}
        ariaLabel={ariaLabel}
        allowCreate={allowCreate}
        placeholder={placeholder}
        invalid={invalid}
        pinnedId={pinnedId}
      />
    )
  // the pinned person (the viewer) stays on the list even outside the core tier
  const roll = (people ?? []).filter((p) => (!coreOnly || p.tier === 'core' || p.id === pinnedId) && !exclude.includes(p.id))
  // sort is stable: the pinned person first, everyone else in the roster's order
  const ordered = pinnedId ? [...roll].sort((a, b) => (a.id === pinnedId ? -1 : b.id === pinnedId ? 1 : 0)) : roll
  const options = ordered.map((p) => ({ value: p.id, label: p.name, hint: p.id === pinnedId ? 'You' : undefined }))
  return <SearchSelect align="left" fullWidth options={options} value={value} onChange={onChange} ariaLabel={ariaLabel} />
}

/**
 * Category and sub-category, picked from the lists only — never typed (since
 * 2 Oct 2026; the Worker holds the same line, see ledgerCategoryError). A
 * remark goes in Notes. An older entry whose value is off the lists keeps it
 * on offer, marked, so it can still be edited — but nothing new can be coined.
 */
function CategoryFields({
  kind,
  category,
  setCategory,
  subCategory,
  setSubCategory,
}: {
  kind: LedgerKind
  category: string
  setCategory: (v: string) => void
  subCategory: string
  setSubCategory: (v: string) => void
}) {
  // a sponsorship's sub-category is one of the catalog's own categories
  const { data: catalog } = useSponsorship(kind === 'contribution' && category === 'sponsorship' ? PUJO_YEAR : null)
  if (kind === 'transfer') return null
  const cats = kind === 'contribution' ? [...CONTRIBUTION_CATEGORIES] : Object.keys(EXPENSE_TAXONOMY)
  const subs =
    kind === 'expense'
      ? expenseSubcats(category)
      : category === 'sponsorship'
        ? [...new Set((catalog ?? []).map((i) => i.category))].sort()
        : CONTRIBUTION_SUBCATS[category as keyof typeof CONTRIBUTION_SUBCATS] ?? []
  /** The list, plus the entry's own value when an older row has one off it. */
  const withCurrent = (list: string[], current: string) =>
    [
      ...list.map((x) => ({ value: x, label: x })),
      ...(current && !list.includes(current) ? [{ value: current, label: current, hint: 'old value · not on the list' }] : []),
    ]
  const fixedSub = kind === 'contribution' && category === 'subscription'
  return (
    <>
      <Field label="Category">
        <SearchSelect ariaLabel="Category" align="left" fullWidth value={category} options={withCurrent(cats, category)} onChange={setCategory} />
      </Field>
      <Field label="Sub-category">
        <SearchSelect
          ariaLabel="Sub-category"
          align="left"
          fullWidth
          value={subCategory}
          // a subscription's is required (core / non-core); any other may be left empty
          options={[...(fixedSub ? [] : [{ value: '', label: '—' }]), ...withCurrent(fixedSub ? [...SUBSCRIPTION_SUBCATS] : subs, subCategory)]}
          onChange={setSubCategory}
        />
      </Field>
    </>
  )
}

/**
 * A subscription's sub-category is always one of the fixed two. Older rows
 * were typed by hand ("Core", "Core Membership Subscription"), so an edit
 * form folds them onto the dropdown rather than showing a blank select.
 */
function subscriptionSub(value: string | null | undefined): string {
  const v = (value ?? '').trim().toLowerCase()
  return SUBSCRIPTION_SUBCATS.find((s) => v === s || v.startsWith(s)) ?? SUBSCRIPTION_SUBCATS[0]
}

function EntryForm({ initial, onClose }: { initial?: LedgerEntry; onClose: () => void }) {
  const invalidate = useLedgerInvalidate()
  const editing = !!initial
  const [kind, setKind] = useState<LedgerKind>(initial?.kind ?? 'contribution')
  const [bookId, setBookId] = useState<BookId>((initial?.bookId as BookId) ?? 'pujo-ledger')
  const [entryDate, setEntryDate] = useState(initial?.entryDate ?? todayIST())
  const [category, setCategoryRaw] = useState(initial?.category ?? 'subscription')
  const [subCategory, setSubCategory] = useState(
    (initial?.category ?? 'subscription') === 'subscription' && (initial?.kind ?? 'contribution') === 'contribution'
      ? subscriptionSub(initial?.subCategory)
      : (initial?.subCategory ?? ''),
  )
  // Entering "subscription" snaps the sub-category onto the dropdown; leaving
  // it clears the core/non-core value so it cannot leak onto a donation.
  const setCategory = (next: string) => {
    if (next === category) return
    setCategoryRaw(next)
    // a sub-category belongs to its category: a new category starts it afresh
    if (kind === 'contribution' && next === 'subscription') setSubCategory(subscriptionSub(subCategory))
    else setSubCategory('')
  }
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [personId, setPersonId] = useState<string | null>(initial?.personId ?? null)
  const [counterparty, setCounterparty] = useState(initial?.counterparty ?? '')
  const [walletId, setWalletId] = useState<string | null>(initial?.walletPersonId ?? null)
  const [toWalletId, setToWalletId] = useState<string | null>(initial?.toWalletPersonId ?? null)
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [confirming, setConfirming] = useState(false)
  const [savedFor, setSavedFor] = useState<{ personId: string; coreQualified: boolean } | null>(null)
  const queryClient = useQueryClient()

  // Core Member Guest Bhog: the same entry the /bhog board's "Mark
  // received" writes — misc_income · Guest Bhog, tagged to this Durga Pujo,
  // paid by the household's contact — for any eligible core household, not
  // only those that gave a headcount: a core member often pays at the
  // counter on the day for a friend (the kitchen keeps 50 extra a day). Such
  // counter guests are added to that day's guests, so the board's due and
  // the money agree.
  const { data: events } = useEvents()
  const durga = (events ?? []).find((e) => e.kind === 'durga-pujo' && e.isActive) ?? null
  const [guestMode, setGuestMode] = useState(false)
  const [guestHousehold, setGuestHousehold] = useState<string | null>(null)
  const [counterGuests, setCounterGuests] = useState('')
  const [counterDay, setCounterDay] = useState<string | null>(null)
  const { data: guestBoard } = useGuestBoard(guestMode && durga ? durga.id : null)
  const canGuest = !editing && kind === 'contribution' && bookId === 'pujo-ledger' && !!durga
  const guestRow = guestBoard?.rows.find((r) => r.householdKey === guestHousehold) ?? null
  const guestRate = guestBoard?.setting.guestRate ?? 0
  /** What the household owes now: its outstanding balance, plus the counter guests at the rate. */
  const guestAmount = (key: string | null, extra: string) => {
    const row = guestBoard?.rows.find((r) => r.householdKey === key)
    const owed = Math.max(0, row?.balance ?? 0) + (Number(extra) || 0) * guestRate
    return owed > 0 ? String(owed) : ''
  }
  const switchGuest = (on: boolean) => {
    setGuestMode(on)
    setGuestHousehold(null)
    setCounterGuests('')
    setCounterDay(null)
    setPersonId(null)
    setCounterparty('')
    setAmount('')
    setNotes('')
    if (on) {
      setCategoryRaw('misc_income')
      setSubCategory(GUEST_BHOG_SUBCATEGORY)
    } else {
      setCategoryRaw('subscription')
      setSubCategory(SUBSCRIPTION_SUBCATS[0])
    }
  }
  const pickGuestHousehold = (key: string) => {
    const e = guestBoard?.eligible.find((x) => x.householdKey === key)
    const row = guestBoard?.rows.find((r) => r.householdKey === key)
    if (!guestBoard || (!e && !row)) return
    setGuestHousehold(key)
    setPersonId(row?.contactPersonId ?? e!.contactPersonId)
    setAmount(guestAmount(key, counterGuests))
    // the bhog day matching the entry's date, when there is one — the counter case
    if (!counterDay) setCounterDay(guestBoard.days.find((d) => d.date === entryDate)?.menuId ?? null)
    if (!walletId && guestBoard.setting.inchargePersonId) setWalletId(guestBoard.setting.inchargePersonId)
  }
  const changeCounterGuests = (v: string) => {
    const clean = v.replace(/\D/g, '')
    setCounterGuests(clean)
    setAmount(guestAmount(guestHousehold, clean))
  }

  const save = useMutation({
    mutationFn: (body: LedgerEntryInput) =>
      guestMode && durga
        ? (receiveGuestBhog({
            eventId: durga.id,
            householdKey: guestHousehold!,
            amount: body.amount,
            entryDate: body.entryDate,
            walletPersonId: body.walletPersonId,
            menuId: Number(counterGuests) > 0 ? counterDay : null,
            guests: Number(counterGuests) || 0,
            note: notes.trim() || null,
          }) as Promise<{ id: string; coreQualified?: boolean }>)
        : (post(editing ? `/api/members/ledger/entries/${initial.id}/update` : '/api/members/ledger/entries', body) as Promise<{
            id: string
            coreQualified?: boolean
          }>),
    onSuccess: (r) => {
      invalidate()
      if (guestMode) void queryClient.invalidateQueries({ queryKey: ['bhog-guests'] })
      // Counter flow: a fresh contribution keeps the panel open with the
      // roll-update message and a one-tap jump to their headcount.
      if (!editing && kind === 'contribution' && personId) {
        // the Membership page's core marker may have changed
        void queryClient.invalidateQueries({ queryKey: ['admin-people'] })
        setSavedFor({ personId, coreQualified: !!r.coreQualified })
      } else onClose()
    },
  })

  const buildBody = (): LedgerEntryInput => ({
    bookId,
    eventId: guestMode && durga ? durga.id : null,
    entryDate,
    kind,
    category: kind === 'transfer' ? null : category,
    subCategory: kind === 'transfer' ? null : subCategory || null,
    amount: Number(amount),
    personId,
    counterparty: counterparty || null,
    walletPersonId: walletId!,
    toWalletPersonId: toWalletId,
    notes: notes || null,
  })

  /**
   * Counter flow: the next payer. Who paid, how much and the note are
   * theirs alone and are cleared; the book, date, category and wallet are
   * the counter's and stay. Until this is tapped a saved form is locked —
   * a filled-in form with a live Save button is how one payment became two.
   */
  const addAnother = () => {
    setSavedFor(null)
    save.reset()
    setAmount('')
    setPersonId(null)
    setCounterparty('')
    setNotes('')
    setGuestHousehold(null)
    setCounterGuests('')
  }

  const switchKind = (k: LedgerKind) => {
    setGuestMode(false)
    setGuestHousehold(null)
    setKind(k)
    setCategoryRaw(k === 'contribution' ? 'subscription' : k === 'expense' ? Object.keys(EXPENSE_TAXONOMY)[0] : '')
    setSubCategory(k === 'contribution' ? SUBSCRIPTION_SUBCATS[0] : '')
    // Nothing carries over between kinds — a stale contributor must not
    // become an accidental "reimbursed to" on an expense.
    setPersonId(null)
    setCounterparty('')
    if (k !== 'transfer') setToWalletId(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{editing ? `Edit ledger entry · ${entryDay(initial.entryDate)}` : 'New ledger entry'}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* Saved means saved: the fields lock, so the filled-in form cannot be sent a second time. */}
        <fieldset disabled={!!savedFor} className="grid min-w-0 gap-3 disabled:opacity-60 sm:grid-cols-2">
          <Field label="Kind">
            <SearchSelect
              ariaLabel="Kind"
              align="left"
              fullWidth
              disabled={editing}
              value={kind}
              options={[
                { value: 'contribution', label: 'Contribution (money in)' },
                { value: 'expense', label: 'Expense (money out)' },
                { value: 'transfer', label: 'Transfer between wallets' },
              ]}
              onChange={(v) => switchKind(v as LedgerKind)}
            />
          </Field>
          <Field label="Book">
            <SearchSelect
              ariaLabel="Book"
              align="left"
              fullWidth
              value={bookId}
              options={BOOKS.map((b) => ({ value: b.id, label: b.name }))}
              onChange={(v) => setBookId(v as BookId)}
            />
          </Field>
          <Field label="Date (IST)">
            <input type="date" className={inputCls} value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
          </Field>
          <Field label="Amount (₹)">
            <input
              type="number"
              min="1"
              className={inputCls}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="5000"
            />
          </Field>
          {canGuest && (
            <div className="sm:col-span-2">
              <Switch
                checked={guestMode}
                onChange={switchGuest}
                label="Core Member Guest Bhog"
                hint={`A core household's office colleagues / friends at ${durga!.nameEn} ${durga!.year} bhog${guestRate ? ` — ₹${guestRate} a head` : ''}`}
              />
            </div>
          )}
          {guestMode ? (
            <>
              <Field label="Category">
                <p className="py-2 text-sm text-muted-foreground">
                  Misc income · {GUEST_BHOG_SUBCATEGORY} · {durga?.nameEn} {durga?.year}
                </p>
              </Field>
              <Field label="Household (core)">
                <SearchSelect
                  ariaLabel="Household"
                  align="left"
                  fullWidth
                  placeholder={guestBoard ? 'Pick the household…' : 'Loading…'}
                  value={guestHousehold}
                  options={[
                    ...(guestBoard?.eligible ?? []).map((e) => ({ value: e.householdKey, name: e.name })),
                    // a household with guest money on record that is no longer core still settles here
                    ...(guestBoard?.rows ?? [])
                      .filter((r) => !guestBoard?.eligible.some((e) => e.householdKey === r.householdKey))
                      .map((r) => ({ value: r.householdKey, name: r.name })),
                  ].map(({ value, name }) => {
                    const row = guestBoard?.rows.find((r) => r.householdKey === value)
                    return {
                      value,
                      label: name,
                      hint: row && row.balance > 0 ? `₹${row.balance.toLocaleString('en-IN')} due` : undefined,
                    }
                  })}
                  onChange={pickGuestHousehold}
                />
              </Field>
              <Field label="Guests at the counter (optional)">
                <input
                  className={inputCls}
                  inputMode="numeric"
                  value={counterGuests}
                  onChange={(e) => changeCounterGuests(e.target.value)}
                  placeholder="0"
                />
              </Field>
              <Field label="Bhog day for them">
                <SearchSelect
                  ariaLabel="Bhog day"
                  align="left"
                  fullWidth
                  placeholder="Pick the day…"
                  invalid={Number(counterGuests) > 0 && !counterDay}
                  value={counterDay}
                  options={(guestBoard?.days ?? []).map((d) => ({
                    value: d.menuId,
                    label: d.label,
                    // "17 Oct", not "10-17"
                    hint: new Date(`${d.date}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }),
                  }))}
                  onChange={setCounterDay}
                />
              </Field>
              {guestRow && (
                <p className="text-sm text-muted-foreground sm:col-span-2">
                  On record: {guestRow.heads} guest{guestRow.heads === 1 ? '' : 's'} · ₹{guestRow.due.toLocaleString('en-IN')} due ·
                  ₹{guestRow.received.toLocaleString('en-IN')} received
                </p>
              )}
            </>
          ) : (
            <CategoryFields {...{ kind, category, setCategory, subCategory, setSubCategory }} />
          )}
          {kind === 'contribution' && !guestMode && (
            <>
              <Field label="Contributor">
                <PersonSelect value={personId} onChange={setPersonId} ariaLabel="Contributor" everyone allowCreate />
              </Field>
              <Field label="Or from (e.g. Hundi)">
                <input
                  className={inputCls}
                  value={counterparty}
                  onChange={(e) => setCounterparty(e.target.value)}
                  placeholder="Hundi"
                />
              </Field>
            </>
          )}
          {kind === 'expense' && (
            <>
              <Field label="Vendor / paid to">
                <input
                  className={inputCls}
                  value={counterparty}
                  onChange={(e) => setCounterparty(e.target.value)}
                  placeholder="Calcutta Sweets"
                />
              </Field>
              <Field label="Reimbursed to (core member) — when paying one back">
                <PersonSelect value={personId} onChange={setPersonId} ariaLabel="Reimbursed to" coreOnly />
              </Field>
            </>
          )}
          <Field
            label={
              kind === 'transfer'
                ? 'From wallet (core member)'
                : kind === 'contribution'
                  ? 'Received by — wallet (core member)'
                  : 'Paid from — wallet (core member)'
            }
          >
            <PersonSelect value={walletId} onChange={setWalletId} ariaLabel="Wallet" coreOnly />
          </Field>
          {kind === 'transfer' && (
            <Field label="To wallet (core member)">
              <PersonSelect value={toWalletId} onChange={setToWalletId} ariaLabel="To wallet" coreOnly exclude={walletId ? [walletId] : []} />
            </Field>
          )}
          <Field label={guestMode ? 'Remark (added to the note)' : 'Notes'}>
            <input
              className={inputCls}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={guestMode ? 'e.g. friend from office' : undefined}
            />
          </Field>
        </fieldset>
        {save.isError && <p className="text-sm text-destructive">{(save.error as Error).message}</p>}
        {savedFor && (
          <div className="flex flex-wrap items-center gap-2 rounded-md bg-accent px-3 py-2 text-sm">
            <span className="font-medium">
              Entry saved.
              {savedFor.coreQualified &&
                ' They now qualify for Core this season — an admin can promote them on the Membership page.'}
            </span>
            <Button size="sm" variant="outline" asChild>
              <Link to={`/bhog/?count=${savedFor.personId}`}>Take their headcount →</Link>
            </Button>
          </div>
        )}
        <div className="flex gap-2">
          {savedFor ? (
            <Button size="sm" onClick={addAnother}>
              <Plus /> Add another
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={
                save.isPending ||
                !amount ||
                !walletId ||
                (guestMode && (!guestHousehold || (Number(counterGuests) > 0 && !counterDay)))
              }
              onClick={() => (editing ? setConfirming(true) : save.mutate(buildBody()))}
            >
              {save.isPending && <Loader2 className="animate-spin" />} {editing ? 'Save changes' : 'Save entry'}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={onClose}>
            {savedFor ? 'Done' : 'Cancel'}
          </Button>
        </div>
        {editing && (
          <ConfirmTwice
            open={confirming}
            title="Are you sure to update?"
            description={
              <>
                {entryDay(initial.entryDate)} · {initial.kind} · {rupees(initial.amount)} — the entry will be rewritten in
                place. The book keeps no trace of the old values.
              </>
            }
            phrase="Please update this record"
            actionLabel="Update entry"
            actionIcon={<Pencil />}
            onCancel={() => setConfirming(false)}
            onConfirm={() => {
              setConfirming(false)
              save.mutate(buildBody())
            }}
          />
        )}
      </CardContent>
    </Card>
  )
}

// ── Sponsorship ─────────────────────────────────────────────────────────────

function SponsorshipTab({
  isFinAdmin,
  canSettle,
  isWebmaster,
  pledgeForOthers,
  myPersonId,
}: {
  isFinAdmin: boolean
  /** Core and above: may record a payment against a pledge, or cancel anyone's. */
  canSettle: boolean
  /** The samiti's own account: the only view that includes slots not on offer. */
  isWebmaster: boolean
  /** Admin/fin_admin only: may record a pledge for another household. */
  pledgeForOthers: boolean
  myPersonId: string
}) {
  const { data: events } = useEvents()
  const dp = (events ?? []).filter((e) => e.kind === 'durga-pujo')
  const activeYear = dp.find((e) => e.isActive)?.year ?? new Date().getFullYear()
  const [year, setYear] = useState<number | null>(null)
  const y = year ?? activeYear
  // Only the active pujo year takes pledges/offers — other years are archival
  // (the API enforces the same rule).
  const readOnly = y !== activeYear
  const { data: items, isPending } = useSponsorship(dp.length ? y : null)
  const invalidate = useLedgerInvalidate()
  const [pledgingId, setPledgingId] = useState<string | null>(null)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [pricingId, setPricingId] = useState<string | null>(null)
  const [priceDraft, setPriceDraft] = useState('')
  /** Pledged but never paid: the slot an admin is about to put back on the board. */
  const [releasing, setReleasing] = useState<SponsorshipItemView | null>(null)
  /** The slot this member is about to take, at its listed price. */
  const [confirming, setConfirming] = useState<{ item: SponsorshipItemView; amount: number } | null>(null)

  const setYearAmount = useMutation({
    mutationFn: (i: SponsorshipItemView) =>
      post(`/api/members/ledger/sponsorship/items/${i.id}/year`, {
        year: y,
        amount: priceDraft ? Number(priceDraft) : null,
        offered: i.offered,
        notes: i.yearNotes,
      }),
    onSuccess: () => {
      invalidate()
      setPricingId(null)
    },
  })

  const toggleOffered = useMutation({
    mutationFn: (i: SponsorshipItemView) =>
      post(`/api/members/ledger/sponsorship/items/${i.id}/year`, {
        year: y,
        amount: i.yearAmount,
        offered: !i.offered,
        notes: i.yearNotes,
      }),
    onSuccess: invalidate,
  })
  const pledgeMine = useMutation({
    mutationFn: ({ itemId, amount }: { itemId: string; amount: number }) =>
      post('/api/members/ledger/sponsorship/pledges', { itemId, year: y, personId: myPersonId, amount }),
    onSuccess: () => {
      invalidate()
      setConfirming(null)
      setPledgingId(null)
    },
  })
  const cancelPledge = useMutation({
    mutationFn: (pledgeId: string) => post(`/api/members/ledger/sponsorship/pledges/${pledgeId}/cancel`),
    onSuccess: invalidate,
  })

  // Retired catalog items were genuine sponsorships in their era: everyone sees
  // them for years where they were offered or pledged; the webmaster sees them
  // always (so a legacy slot can be re-offered in a future year).
  const shown = (items ?? []).filter((i) => !i.retired || i.offered || i.pledge || isWebmaster)
  const categories = [...new Set(shown.map((i) => i.category))]
  const offered = shown.filter((i) => i.offered)
  /** On an archival board only a paid pledge counts — nothing else was ever money. */
  const livePledge = (i: SponsorshipItemView) =>
    i.pledge && (!readOnly || i.pledge.status === 'paid') ? i.pledge : null
  const pledgedTotal = offered.reduce((s, i) => s + (i.pledge && i.pledge.status !== 'cancelled' ? i.pledge.amount : 0), 0)
  // Totalled from the same list the rows are drawn from, so the figure can
  // never disagree with what is on screen.
  const paidTotal = shown.reduce((s, i) => s + (i.pledge?.status === 'paid' ? i.pledge.amount : 0), 0)
  /** A slot is on the board this year: offered (webmaster sees the rest too); archival years keep only what was paid. */
  const onBoard = (i: SponsorshipItemView) => (readOnly ? i.pledge?.status === 'paid' : isWebmaster || i.offered)
  // The download lists the same rows in the same order as the cards below.
  const boardRows = categories.flatMap((cat) => shown.filter((i) => i.category === cat && onBoard(i)))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <SearchSelect
          align="left"
          options={dp.map((e) => ({ value: String(e.year), label: `Durga Pujo ${e.year}`, hint: e.isActive ? 'Active' : undefined }))}
          value={String(y)}
          onChange={(v) => setYear(Number(v))}
          ariaLabel="Sponsorship year"
        />
        {!isPending && boardRows.length > 0 && <SponsorshipDownload year={y} items={boardRows} />}
        <span className="ml-auto text-sm text-muted-foreground">
          {readOnly ? `Received ${rupees(paidTotal)}` : `Pledged ${rupees(pledgedTotal)} · Received ${rupees(paidTotal)}`}
        </span>
      </div>
      {isPending ? (
        <LogoSpinner small />
      ) : (
        categories
          .filter((cat) => shown.some((i) => i.category === cat && onBoard(i)))
          .map((cat, idx) => {
          const rows = shown.filter((i) => i.category === cat && onBoard(i))
          return (
            // each category of the board in its own pastel, in turn
            <Card key={cat} {...tint(pastelAt(idx), '10%')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-shiuli">{cat}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {rows.map((i) => {
                  const amount = i.yearAmount ?? i.defaultAmount
                  const pl = livePledge(i)
                  return (
                    <div key={i.id} className={`flex flex-wrap items-center gap-2 border-b pb-2 text-sm last:border-0 last:pb-0 ${i.offered ? '' : 'opacity-50'}`}>
                      <span className="min-w-0 flex-1">
                        {i.title}
                        {!i.offered && <Badge variant="outline">not offered</Badge>}
                        {i.retired && <Badge variant="outline">legacy</Badge>}
                        {(i.tagline || i.taglineBn) && (
                          <span className="block text-xs text-muted-foreground">
                            {i.tagline}
                            {i.tagline && i.taglineBn && ' · '}
                            {i.taglineBn}
                          </span>
                        )}
                        {pl && (
                          <span className="block text-xs text-muted-foreground">
                            {pl.status === 'paid' ? 'Sponsored by' : 'Pledged by'} {pl.personName} ·{' '}
                            {pl.amount > 0 ? rupees(pl.amount) : 'the cost'}
                          </span>
                        )}
                      </span>
                      {isFinAdmin && !readOnly && pricingId === i.id ? (
                        <span className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            className={`${inputCls} h-9 w-28`}
                            value={priceDraft}
                            onChange={(e) => setPriceDraft(e.target.value)}
                            placeholder="Amount"
                            autoFocus
                          />
                          <Button size="sm" disabled={setYearAmount.isPending} onClick={() => setYearAmount.mutate(i)}>
                            Set
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setPricingId(null)}>
                            ✕
                          </Button>
                        </span>
                      ) : isFinAdmin && !readOnly ? (
                        <button
                          type="button"
                          className="cursor-pointer text-muted-foreground underline decoration-dotted underline-offset-4 hover:text-foreground"
                          title="Set this year's amount"
                          onClick={() => {
                            setPricingId(i.id)
                            setPriceDraft(amount != null ? String(amount) : '')
                          }}
                        >
                          {amount != null ? rupees(amount) : 'set amount'}
                        </button>
                      ) : (
                        <span className="text-muted-foreground">{amount != null ? rupees(amount) : '—'}</span>
                      )}
                      {pl ? (
                        pl.status === 'paid' ? (
                          <Badge variant="durba">Paid</Badge>
                        ) : readOnly ? (
                          <Badge variant="outline">pledged</Badge>
                        ) : !canSettle ? (
                          // A pledge stands until an admin releases it — the
                          // pledger sees it, and cannot take it back.
                          <Badge variant="outline">pledged</Badge>
                        ) : payingId === i.id ? (
                          <PayPledgeInline
                            pledgeId={pl.id}
                            needsAmount={pl.amount <= 0}
                            onDone={() => setPayingId(null)}
                          />
                        ) : (
                          <>
                            <Button size="sm" variant="outline" onClick={() => setPayingId(i.id)}>
                              <HandCoins /> Record payment
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setReleasing(i)}>
                              <Undo2 /> Release
                            </Button>
                          </>
                        )
                      ) : i.offered && !readOnly ? (
                        pledgingId === i.id ? (
                          <PledgeInline
                            itemId={i.id}
                            year={y}
                            defaultAmount={amount}
                            myPersonId={myPersonId}
                            onDone={() => setPledgingId(null)}
                          />
                        ) : (
                          <Button
                            size="sm"
                            variant="soft"
                            onClick={() =>
                              pledgeForOthers
                                ? setPledgingId(i.id)
                                : setConfirming({ item: i, amount: amount ?? 0 })
                            }
                          >
                            Pledge
                          </Button>
                        )
                      ) : null}
                      {/* A pledged slot can't be withdrawn from the year — the pledge would
                          be stranded on an item nobody can see. Take the pledge back first.
                          'Offer' stays available, so a stray pledge on an unoffered item is fixable. */}
                      {isWebmaster && !readOnly && !(i.offered && pl) && (
                        <Button size="sm" variant="ghost" onClick={() => toggleOffered.mutate(i)}>
                          {i.offered ? 'Skip this year' : 'Offer'}
                        </Button>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )
        })
      )}
      <Dialog
        open={!!confirming}
        onClose={() => {
          setConfirming(null)
          pledgeMine.reset()
        }}
      >
        <DialogTitle>Confirm your pledge</DialogTitle>
        <DialogDescription>
          You are about to pledge{' '}
          {confirming && (confirming.item.yearAmount ?? confirming.item.defaultAmount) != null
            ? `${confirming.amount.toLocaleString('en-IN')} INR`
            : 'the cost'}{' '}
          for “{confirming?.item.title}”. Please confirm.
        </DialogDescription>
        {pledgeMine.isError && (
          <p className="text-sm text-destructive">{(pledgeMine.error as Error).message}</p>
        )}
        <DialogActions>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setConfirming(null)
              pledgeMine.reset()
            }}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            disabled={pledgeMine.isPending}
            onClick={() => confirming && pledgeMine.mutate({ itemId: confirming.item.id, amount: confirming.amount })}
          >
            {pledgeMine.isPending ? <Loader2 className="animate-spin" /> : null} OK
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={!!releasing} onClose={() => setReleasing(null)}>
        <DialogTitle>Release this slot?</DialogTitle>
        <DialogDescription>
          {releasing?.title} — pledged by {releasing?.pledge?.personName} for{' '}
          {releasing?.pledge ? rupees(releasing.pledge.amount) : ''}. The pledge is recorded as
          cancelled and the slot goes back on the board for anyone to take. Nothing is deleted, and
          no money is involved — a pledge that was already paid cannot be released this way.
        </DialogDescription>
        <DialogActions>
          <Button variant="outline" size="sm" onClick={() => setReleasing(null)}>
            Keep the pledge
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={cancelPledge.isPending}
            onClick={() => {
              if (releasing?.pledge) cancelPledge.mutate(releasing.pledge.id)
              setReleasing(null)
            }}
          >
            <Undo2 /> Release slot
          </Button>
        </DialogActions>
      </Dialog>
      {isFinAdmin && !readOnly && <NewItemForm />}
    </div>
  )
}

function PledgeInline({
  itemId,
  year,
  defaultAmount,
  myPersonId,
  onDone,
}: {
  itemId: string
  year: number
  defaultAmount: number | null
  /** Pinned to the top of the roll — an admin most often pledges as themselves. */
  myPersonId: string
  onDone: () => void
}) {
  const invalidate = useLedgerInvalidate()
  const [personId, setPersonId] = useState<string | null>(null)
  const [amount, setAmount] = useState(defaultAmount ? String(defaultAmount) : '')
  const save = useMutation({
    mutationFn: () => post('/api/members/ledger/sponsorship/pledges', { itemId, year, personId, amount: Number(amount) }),
    onSuccess: () => {
      invalidate()
      onDone()
    },
  })
  return (
    <span className="flex flex-wrap items-center gap-2">
      <PersonSelect
        value={personId}
        onChange={setPersonId}
        ariaLabel="Pledger"
        everyone
        allowCreate
        placeholder="Select Sponsor"
        invalid={!personId}
        pinnedId={myPersonId}
      />
      <input type="number" min="1" className={`${inputCls} w-24`} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="₹" />
      <Button
        size="sm"
        disabled={!personId || !amount || save.isPending}
        onClick={() => save.mutate()}
      >
        Save
      </Button>
      <Button size="sm" variant="ghost" onClick={onDone}>
        ✕
      </Button>
      {save.isError && <span className="text-xs text-destructive">{(save.error as Error).message}</span>}
    </span>
  )
}

function PayPledgeInline({
  pledgeId,
  needsAmount,
  onDone,
}: {
  pledgeId: string
  /** Pledged at "whatever it costs": the figure is named here, on payment. */
  needsAmount: boolean
  onDone: () => void
}) {
  const invalidate = useLedgerInvalidate()
  const [walletId, setWalletId] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const save = useMutation({
    mutationFn: () =>
      post(`/api/members/ledger/sponsorship/pledges/${pledgeId}/pay`, {
        walletPersonId: walletId,
        ...(needsAmount ? { amount: Number(amount) } : {}),
      }),
    onSuccess: () => {
      invalidate()
      onDone()
    },
  })
  return (
    <span className="flex flex-wrap items-center gap-2">
      <PersonSelect value={walletId} onChange={setWalletId} ariaLabel="Received by (wallet)" coreOnly />
      {needsAmount && (
        <input
          type="number"
          min="1"
          className={`${inputCls} h-9 w-28`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount received"
          aria-label="Amount received"
        />
      )}
      <Button
        size="sm"
        disabled={!walletId || (needsAmount && !amount) || save.isPending}
        onClick={() => save.mutate()}
      >
        Received
      </Button>
      <Button size="sm" variant="ghost" onClick={onDone}>
        ✕
      </Button>
      {save.isError && <span className="text-xs text-destructive">{(save.error as Error).message}</span>}
    </span>
  )
}

function NewItemForm() {
  const invalidate = useLedgerInvalidate()
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const save = useMutation({
    mutationFn: () =>
      post('/api/members/ledger/sponsorship/items', { category, title, defaultAmount: amount ? Number(amount) : null }),
    onSuccess: () => {
      invalidate()
      setOpen(false)
      setCategory('')
      setTitle('')
      setAmount('')
    },
  })
  if (!open)
    return (
      <Button size="sm" variant="outline" className="self-start" onClick={() => setOpen(true)}>
        <Plus /> Add catalog item
      </Button>
    )
  return (
    <Card>
      <CardContent className="flex flex-wrap items-end gap-2 p-3">
        <Field label="Category">
          <input className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Bhog" />
        </Field>
        <Field label="Title">
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nabami Bhog 3" />
        </Field>
        <Field label="Default ₹ (blank = per year)">
          <input type="number" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Button size="sm" disabled={!category || !title || save.isPending} onClick={() => save.mutate()}>
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        {save.isError && <span className="text-xs text-destructive">{(save.error as Error).message}</span>}
      </CardContent>
    </Card>
  )
}

// ── Reimbursements ──────────────────────────────────────────────────────────

const CLAIM_FILTERS: (ClaimStatus | 'all')[] = ['requested', 'settled', 'rejected', 'cancelled', 'all']

function ClaimsTab({ myPersonId, isFinAdmin }: { myPersonId: string; isFinAdmin: boolean }) {
  const { data: claims, isPending } = useClaims()
  const invalidate = useLedgerInvalidate()
  const [filter, setFilter] = useState<ClaimStatus | 'all'>('requested')
  const [adding, setAdding] = useState(false)
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)

  const act = useMutation({
    mutationFn: ({ id, action, body }: { id: string; action: string; body?: unknown }) =>
      post(`/api/members/ledger/claims/${id}/${action}`, body),
    onSuccess: invalidate,
  })

  // Claims assigned to me float to the top — they're my queue to pay.
  const shown = (claims ?? [])
    .filter((cl) => filter === 'all' || cl.status === filter)
    .sort((a, b) => {
      const rank = (cl: ReimbursementClaim) => (cl.status === 'requested' && cl.assignedTo === myPersonId ? 0 : 1)
      return rank(a) - rank(b)
    })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus /> New claim
          </Button>
        )}
        <div className="flex flex-wrap gap-1">
          {CLAIM_FILTERS.map((f) => {
            const n = f === 'all' ? (claims ?? []).length : (claims ?? []).filter((cl) => cl.status === f).length
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              >
                {f} {n > 0 && <span className={filter === f ? 'opacity-80' : 'opacity-60'}>· {n}</span>}
              </button>
            )
          })}
        </div>
      </div>
      {act.isError && <p className="text-sm text-destructive">{(act.error as Error).message}</p>}
      {adding && <ClaimForm myPersonId={myPersonId} canProxy={isFinAdmin} onClose={() => setAdding(false)} />}
      {isPending ? (
        <LogoSpinner small />
      ) : shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">No claims here.</p>
      ) : (
        shown.map((cl) => {
          const mine = cl.personId === myPersonId
          const canSettle =
            isFinAdmin && cl.status === 'requested' && !mine && (!cl.assignedTo || cl.assignedTo === myPersonId)
          return (
            // the edge says where the claim stands: waiting (rose), settled (river water), closed (sandalwood)
            <Card
              key={cl.id}
              {...tint(cl.status === 'requested' ? 'golap' : cl.status === 'settled' ? 'ganga' : 'chandan', '6%')}
            >
              <CardContent className="flex flex-wrap items-center gap-x-3 gap-y-1 p-3 text-sm">
                <time dateTime={cl.expenseDate} className="shrink-0 text-xs text-muted-foreground sm:w-20">
                  {entryDay(cl.expenseDate)}
                </time>
                <span className="min-w-0 flex-1">
                  <strong>{cl.personName}</strong> · {cl.category}
                  {cl.subCategory ? ` · ${cl.subCategory}` : ''} — {cl.counterparty}
                  {cl.details && <span className="block text-xs text-muted-foreground">{cl.details}</span>}
                  <span className="block text-xs text-muted-foreground">
                    {cl.status === 'requested' &&
                      (cl.assignedTo ? `${cl.assignedToName} will pay` : 'Nobody has taken this yet')}
                    {cl.status === 'settled' && `Settled by ${cl.settledByName} on ${cl.settledOn}`}
                    {cl.status === 'rejected' && `Rejected${cl.notes ? ` — ${cl.notes}` : ''}`}
                    {cl.status === 'cancelled' && 'Withdrawn by claimant'}
                  </span>
                </span>
                <span className="font-semibold">{rupees(cl.amount)}</span>
                {cl.status === 'requested' && cl.assignedTo && (
                  <Badge variant={cl.assignedTo === myPersonId ? 'genda' : 'aparajita'}>
                    {cl.assignedTo === myPersonId ? 'you pay' : `${cl.assignedToName} pays`}
                  </Badge>
                )}
                {/* a waiting claim is money owed to a member — palash, not the primary red */}
                <Badge variant={cl.status === 'settled' ? 'durba' : cl.status === 'requested' ? 'palash' : 'outline'}>
                  {cl.status}
                </Badge>
                {cl.status === 'requested' && (
                  <span className="flex flex-wrap items-center gap-1">
                    {!cl.assignedTo && !mine && (
                      <Button size="sm" variant="outline" onClick={() => act.mutate({ id: cl.id, action: 'assign', body: { assignedTo: myPersonId } })}>
                        I'll pay this
                      </Button>
                    )}
                    {assigningId === cl.id ? (
                      <span className="flex items-center gap-1">
                        <PersonSelect
                          value={null}
                          onChange={(v) => {
                            act.mutate({ id: cl.id, action: 'assign', body: { assignedTo: v } })
                            setAssigningId(null)
                          }}
                          ariaLabel="Assign payer"
                          coreOnly
                          exclude={[cl.personId]}
                        />
                        <Button size="sm" variant="ghost" onClick={() => setAssigningId(null)}>
                          ✕
                        </Button>
                      </span>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setAssigningId(cl.id)}>
                        Assign…
                      </Button>
                    )}
                    {canSettle && (
                      <Button size="sm" onClick={() => act.mutate({ id: cl.id, action: 'settle' })}>
                        <HandCoins /> Paid — settle
                      </Button>
                    )}
                    {mine && (
                      <Button size="sm" variant="outline" onClick={() => act.mutate({ id: cl.id, action: 'cancel' })}>
                        Withdraw
                      </Button>
                    )}
                    {isFinAdmin &&
                      (rejectingId === cl.id ? (
                        <RejectInline
                          onConfirm={(notes) => {
                            act.mutate({ id: cl.id, action: 'reject', body: { notes } })
                            setRejectingId(null)
                          }}
                          onClose={() => setRejectingId(null)}
                        />
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => setRejectingId(cl.id)}>
                          Reject…
                        </Button>
                      ))}
                  </span>
                )}
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}

function RejectInline({ onConfirm, onClose }: { onConfirm: (notes: string) => void; onClose: () => void }) {
  const [notes, setNotes] = useState('')
  return (
    <span className="flex items-center gap-1">
      <input className={`${inputCls} w-40`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reason" />
      <Button size="sm" variant="outline" onClick={() => onConfirm(notes)}>
        Reject
      </Button>
      <Button size="sm" variant="ghost" onClick={onClose}>
        ✕
      </Button>
    </span>
  )
}

/**
 * A new claim. It is your own by default; an admin or finance admin may
 * switch "Requested by" to any core member — many never sign in, so an
 * admin raises their claims for them (as with counter entries and proxy
 * headcounts). The Worker holds the same line.
 */
function ClaimForm({ myPersonId, canProxy, onClose }: { myPersonId: string; canProxy: boolean; onClose: () => void }) {
  const invalidate = useLedgerInvalidate()
  const { data: people } = useMembersLite()
  const [personId, setPersonId] = useState(myPersonId)
  const forSelf = personId === myPersonId
  const claimantName = people?.find((p) => p.id === personId)?.name
  const [bookId, setBookId] = useState<BookId>('pujo-ledger')
  const [expenseDate, setExpenseDate] = useState(todayIST())
  const [amount, setAmount] = useState('')
  const [category, setCategoryRaw] = useState('')
  const [subCategory, setSubCategory] = useState('')
  // a sub-category belongs to its category: a new category starts it afresh
  const setCategory = (next: string) => {
    if (next === category) return
    setCategoryRaw(next)
    setSubCategory('')
  }
  const [counterparty, setCounterparty] = useState('')
  const [details, setDetails] = useState('')
  const save = useMutation({
    mutationFn: (body: ReimbursementClaimInput) => post('/api/members/ledger/claims', body),
    onSuccess: () => {
      invalidate()
      onClose()
    },
  })
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New reimbursement claim</CardTitle>
        <CardDescription>
          {forSelf
            ? 'You paid a vendor from your own pocket; a wallet holder will pay you back.'
            : `${claimantName ?? 'They'} paid a vendor from their own pocket; a wallet holder will pay them back.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Requested by">
            {canProxy ? (
              <PersonSelect value={personId} onChange={setPersonId} ariaLabel="Requested by" coreOnly pinnedId={myPersonId} />
            ) : (
              <input className={inputCls} value={claimantName ?? ''} readOnly aria-readonly="true" />
            )}
          </Field>
          <Field label="Book">
            <SearchSelect
              ariaLabel="Book"
              align="left"
              fullWidth
              value={bookId}
              options={BOOKS.map((b) => ({ value: b.id, label: b.name }))}
              onChange={(v) => setBookId(v as BookId)}
            />
          </Field>
          <Field label="Expense date (IST)">
            <input type="date" className={inputCls} value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
          </Field>
          <Field label="Amount (₹)">
            <input type="number" min="1" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <CategoryFields kind="expense" {...{ category, setCategory, subCategory, setSubCategory }} />
          <Field label={forSelf ? 'Vendor (who you paid)' : 'Vendor (who they paid)'}>
            <input className={inputCls} value={counterparty} onChange={(e) => setCounterparty(e.target.value)} placeholder="Hadapsar market" />
          </Field>
          <Field label="Details">
            <input className={inputCls} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="What was bought" />
          </Field>
        </div>
        {save.isError && <p className="text-sm text-destructive">{(save.error as Error).message}</p>}
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={save.isPending || !amount || !category || !counterparty}
            onClick={() =>
              save.mutate({
                personId,
                bookId,
                eventId: null,
                expenseDate,
                amount: Number(amount),
                category,
                subCategory: subCategory || null,
                counterparty,
                details: details || null,
              })
            }
          >
            {save.isPending && <Loader2 className="animate-spin" />} Submit claim
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
