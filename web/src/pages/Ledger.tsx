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
  ReimbursementClaimInput,
  SponsorshipItemView,
  SpendRow,
} from '@pujosamiti/shared'
import { BOOKS, CONTRIBUTION_CATEGORIES, CONTRIBUTION_SUBCATS, EXPENSE_TAXONOMY, isCoreRole, isProxyRole, isWebmaster } from '@pujosamiti/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ban, HandCoins, Loader2, Pencil, Plus, Undo2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'

import { BackLink } from '@/components/BackLink'
import { LogoSpinner } from '@/components/LogoSpinner'
import { Field, inputCls } from '@/components/form'
import { PersonPicker } from '@/components/PersonPicker'
import { SearchSelect } from '@/components/SearchSelect'
import { Seo } from '@/components/Seo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogActions, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { api } from '@/lib/api'
import { useMemberState } from '@/lib/member'
import { useEvents, useMembersLite } from '@/lib/tasks'

const post = <T,>(path: string, body?: unknown) =>
  api<T>(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) })

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`
/** Money powers: the books, budgets, sponsorship pricing, claim rejection. */
const canFinance = (me: Me) => me.role === 'admin' || me.role === 'fin_admin'
/** Entries harden 48 h after creation — edit/void disappear, admin included. */
const entryLocked = (e: LedgerEntry) => Date.now() - e.createdAt > 48 * 60 * 60 * 1000
const todayIST = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10)
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
  members = false,
  newSignIn = false,
  children,
}: {
  title: string
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
      <h1 className="text-2xl font-bold">{title}</h1>
      {children(me)}
    </div>
  )
}

export const LedgerPage = () => <CorePage title="Ledger">{(me) => <EntriesTab isFinAdmin={canFinance(me)} />}</CorePage>
export const WalletsPage = () => (
  <CorePage title="Wallets" members>
    {(me) => <OverviewTab isFinAdmin={canFinance(me)} />}
  </CorePage>
)
export const SponsorshipPage = () => (
  <CorePage title="Sponsorship" members newSignIn>
    {(me) => (
      <SponsorshipTab
        isFinAdmin={canFinance(me)}
        canSettle={canFinance(me)}
        isWebmaster={isWebmaster(me.personId)}
        pledgeForOthers={isProxyRole(me.role)}
        myPersonId={me.personId!}
      />
    )}
  </CorePage>
)
export const ReimbursementsPage = () => (
  <CorePage title="Reimbursements">{(me) => <ClaimsTab myPersonId={me.personId!} isFinAdmin={canFinance(me)} />}</CorePage>
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
        ? budgetCats.map(({ category, lines: ls, budget, actual }) => (
            <Card key={category}>
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
                      <input
                        className={`${inputCls} h-9 w-44`}
                        list={`budget-subs-${category}`}
                        placeholder="Sub-category (blank = General)"
                        value={newSub}
                        onChange={(e) => setNewSub(e.target.value)}
                      />
                      <datalist id={`budget-subs-${category}`}>
                        {[...new Set([...(EXPENSE_TAXONOMY[category] ?? []), 'Misc'])].map((s) => (
                          <option key={s} value={s} />
                        ))}
                      </datalist>
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
        : reportCats.map(([category, catTotal]) => (
            <Card key={category}>
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
  const stats: [string, string, string, string?][] = [
    [isCurrent ? 'Total in hand' : `Closing balance (30 Jun ${s.seasonYear + 1})`, rupees(s.totalBalance), 'genda'],
    [`Carried forward (before 1 Jul ${s.seasonYear})`, rupees(s.carriedForward), 'sharat'],
    ['Collected this season', rupees(s.collectedSince), 'durba', `incl. ${rupees(s.collectedSponsorship)} sponsorship`],
    ['Spent this season', rupees(s.spentSince), 'destructive'],
    ...(isCurrent
      ? ([
          ['Owed to members (pending claims)', rupees(s.outstandingClaims), 'palash'],
          ['Disposable (in hand − owed)', rupees(s.totalBalance - s.outstandingClaims), 'matir'],
        ] as [string, string, string][])
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
        {stats.map(([label, value, tone, sub]) => (
          <Card key={label} style={{ background: `color-mix(in srgb, var(--${tone}) 9%, var(--card))` }}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-lg font-bold">{value}</p>
              {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
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
                {s.wallets.map((w) => (
                  <tr key={w.personId} className="border-b last:border-0">
                    <td className="py-1.5 pr-2">{w.personName}</td>
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
        <select className={`${inputCls} w-auto`} value={book} onChange={(e) => setBook(e.target.value)} aria-label="Book">
          <option value="all">All books</option>
          {BOOKS.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          className={`${inputCls} w-auto`}
          value={season === null ? 'all' : String(season)}
          onChange={(e) => setSeason(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          aria-label="Season"
        >
          <option value="all">All seasons</option>
          {seasons.map((y) => (
            <option key={y} value={y}>
              {seasonRange(y)}
            </option>
          ))}
        </select>
        <select className={`${inputCls} w-auto`} value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Kind">
          <option value="all">All kinds</option>
          <option value="contribution">Contributions</option>
          <option value="expense">Expenses</option>
          <option value="transfer">Transfers</option>
        </select>
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
            <Card key={e.id} className={e.isActive ? '' : 'opacity-50'}>
              <CardContent className="flex flex-wrap items-center gap-x-3 gap-y-1 p-3 text-sm">
                <span className="w-24 shrink-0 text-xs text-muted-foreground">{e.entryDate}</span>
                <Badge variant={e.kind === 'contribution' ? 'durba' : e.kind === 'expense' ? 'default' : 'outline'}>
                  {e.kind}
                </Badge>
                <span className="min-w-0 flex-1">
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
                <span className="font-semibold">{rupees(e.amount)}</span>
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
            {entry.entryDate} · {entry.kind} · {rupees(entry.amount)} — the entry will be voided (struck off, kept
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
  const options = (people ?? [])
    .filter((p) => (!coreOnly || p.tier === 'core') && !exclude.includes(p.id))
    .map((p) => ({ value: p.id, label: p.name }))
  return <SearchSelect align="left" fullWidth options={options} value={value} onChange={onChange} ariaLabel={ariaLabel} />
}

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
  if (kind === 'transfer') return null
  const cats = kind === 'contribution' ? CONTRIBUTION_CATEGORIES : [...Object.keys(EXPENSE_TAXONOMY)]
  const subs =
    kind === 'contribution'
      ? (CONTRIBUTION_SUBCATS[category as keyof typeof CONTRIBUTION_SUBCATS] ?? [])
      : [...new Set([...(EXPENSE_TAXONOMY[category] ?? []), 'Misc'])]
  return (
    <>
      <Field label="Category">
        {kind === 'contribution' ? (
          <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
            {cats.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        ) : (
          <>
            <input className={inputCls} list="expense-cats" value={category} onChange={(e) => setCategory(e.target.value)} />
            <datalist id="expense-cats">
              {cats.map((x) => (
                <option key={x} value={x} />
              ))}
            </datalist>
          </>
        )}
      </Field>
      <Field label="Sub-category">
        <input className={inputCls} list="sub-cats" value={subCategory} onChange={(e) => setSubCategory(e.target.value)} />
        <datalist id="sub-cats">
          {subs.map((x) => (
            <option key={x} value={x} />
          ))}
        </datalist>
      </Field>
    </>
  )
}

function EntryForm({ initial, onClose }: { initial?: LedgerEntry; onClose: () => void }) {
  const invalidate = useLedgerInvalidate()
  const editing = !!initial
  const [kind, setKind] = useState<LedgerKind>(initial?.kind ?? 'contribution')
  const [bookId, setBookId] = useState<BookId>((initial?.bookId as BookId) ?? 'pujo-ledger')
  const [entryDate, setEntryDate] = useState(initial?.entryDate ?? todayIST())
  const [category, setCategory] = useState(initial?.category ?? 'subscription')
  const [subCategory, setSubCategory] = useState(initial?.subCategory ?? '')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [personId, setPersonId] = useState<string | null>(initial?.personId ?? null)
  const [counterparty, setCounterparty] = useState(initial?.counterparty ?? '')
  const [walletId, setWalletId] = useState<string | null>(initial?.walletPersonId ?? null)
  const [toWalletId, setToWalletId] = useState<string | null>(initial?.toWalletPersonId ?? null)
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [confirming, setConfirming] = useState(false)
  const [savedFor, setSavedFor] = useState<{ personId: string; rollUpdated: 'core' | 'member' | 'reactivated' | null } | null>(null)
  const queryClient = useQueryClient()

  const save = useMutation({
    mutationFn: (body: LedgerEntryInput) =>
      post(editing ? `/api/members/ledger/entries/${initial.id}/update` : '/api/members/ledger/entries', body) as Promise<{
        id: string
        rollUpdated?: 'core' | 'member' | 'reactivated' | null
      }>,
    onSuccess: (r) => {
      invalidate()
      // Counter flow: a fresh contribution keeps the panel open with the
      // roll-update message and a one-tap jump to their headcount.
      if (!editing && kind === 'contribution' && personId) {
        void queryClient.invalidateQueries({ queryKey: ['people-full'] })
        void queryClient.invalidateQueries({ queryKey: ['admin-people'] })
        setSavedFor({ personId, rollUpdated: r.rollUpdated ?? null })
      } else onClose()
    },
  })

  const buildBody = (): LedgerEntryInput => ({
    bookId,
    eventId: null,
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

  const switchKind = (k: LedgerKind) => {
    setKind(k)
    setCategory(k === 'contribution' ? 'subscription' : k === 'expense' ? Object.keys(EXPENSE_TAXONOMY)[0] : '')
    setSubCategory('')
    // Nothing carries over between kinds — a stale contributor must not
    // become an accidental "reimbursed to" on an expense.
    setPersonId(null)
    setCounterparty('')
    if (k !== 'transfer') setToWalletId(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{editing ? `Edit ledger entry · ${initial.entryDate}` : 'New ledger entry'}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Kind">
            <select
              className={inputCls}
              value={kind}
              disabled={editing}
              onChange={(e) => switchKind(e.target.value as LedgerKind)}
            >
              <option value="contribution">Contribution (money in)</option>
              <option value="expense">Expense (money out)</option>
              <option value="transfer">Transfer between wallets</option>
            </select>
          </Field>
          <Field label="Book">
            <select className={inputCls} value={bookId} onChange={(e) => setBookId(e.target.value as BookId)}>
              {BOOKS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
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
          <CategoryFields {...{ kind, category, setCategory, subCategory, setSubCategory }} />
          {kind === 'contribution' && (
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
          <Field label="Notes">
            <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </div>
        {save.isError && <p className="text-sm text-destructive">{(save.error as Error).message}</p>}
        {savedFor && (
          <div className="flex flex-wrap items-center gap-2 rounded-md bg-accent px-3 py-2 text-sm">
            <span className="font-medium">
              Entry saved.
              {savedFor.rollUpdated === 'core' && ' They are now a CORE member.'}
              {savedFor.rollUpdated === 'member' && ' They are now a member.'}
              {savedFor.rollUpdated === 'reactivated' && ' They are back on the active roll.'}
            </span>
            <Button size="sm" variant="outline" asChild>
              <Link to={`/bhog?count=${savedFor.personId}`}>Take their headcount →</Link>
            </Button>
          </div>
        )}
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={save.isPending || !amount || !walletId}
            onClick={() => (editing ? setConfirming(true) : save.mutate(buildBody()))}
          >
            {save.isPending && <Loader2 className="animate-spin" />} {editing ? 'Save changes' : 'Save entry'}
          </Button>
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
                {initial.entryDate} · {initial.kind} · {rupees(initial.amount)} — the entry will be rewritten in
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
        <span className="ml-auto text-sm text-muted-foreground">
          {readOnly ? `Received ${rupees(paidTotal)}` : `Pledged ${rupees(pledgedTotal)} · Received ${rupees(paidTotal)}`}
        </span>
      </div>
      {isPending ? (
        <LogoSpinner small />
      ) : (
        categories.map((cat) => {
          const rows = shown.filter((i) =>
            i.category === cat && (readOnly ? i.pledge?.status === 'paid' : isWebmaster || i.offered),
          )
          if (!rows.length) return null
          return (
            <Card key={cat}>
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
      {adding && <ClaimForm onClose={() => setAdding(false)} />}
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
            <Card key={cl.id}>
              <CardContent className="flex flex-wrap items-center gap-x-3 gap-y-1 p-3 text-sm">
                <span className="w-24 shrink-0 text-xs text-muted-foreground">{cl.expenseDate}</span>
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
                <Badge variant={cl.status === 'settled' ? 'durba' : cl.status === 'requested' ? 'default' : 'outline'}>
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

function ClaimForm({ onClose }: { onClose: () => void }) {
  const invalidate = useLedgerInvalidate()
  const [bookId, setBookId] = useState<BookId>('pujo-ledger')
  const [expenseDate, setExpenseDate] = useState(todayIST())
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [subCategory, setSubCategory] = useState('')
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
        <CardDescription>You paid a vendor from your own pocket; a wallet holder will pay you back.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Book">
            <select className={inputCls} value={bookId} onChange={(e) => setBookId(e.target.value as BookId)}>
              {BOOKS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Expense date (IST)">
            <input type="date" className={inputCls} value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
          </Field>
          <Field label="Amount (₹)">
            <input type="number" min="1" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <CategoryFields kind="expense" {...{ category, setCategory, subCategory, setSubCategory }} />
          <Field label="Vendor (who you paid)">
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
