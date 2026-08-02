import type {
  BookId,
  ClaimStatus,
  LedgerEntry,
  LedgerEntryInput,
  LedgerKind,
  LedgerSummary,
  Me,
  ReimbursementClaim,
  ReimbursementClaimInput,
  SponsorshipItemView,
} from '@pujosamiti/shared'
import { BOOKS, CONTRIBUTION_CATEGORIES, CONTRIBUTION_SUBCATS, EXPENSE_TAXONOMY } from '@pujosamiti/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ban, HandCoins, Loader2, Plus, Undo2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import { BackLink } from '@/components/BackLink'
import { Field, inputCls } from '@/components/form'
import { SearchSelect } from '@/components/SearchSelect'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { useMemberState } from '@/lib/member'
import { useEvents, useMembersLite } from '@/lib/tasks'

const post = <T,>(path: string, body?: unknown) =>
  api<T>(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) })

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`
const todayIST = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10)
const yearOf = (d: string) => d.slice(0, 4)

const useSummary = () => useQuery({ queryKey: ['ledger-summary'], queryFn: () => api<LedgerSummary>('/api/members/ledger/summary') })
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
    void qc.invalidateQueries({ queryKey: ['ledger-claims'] })
    void qc.invalidateQueries({ queryKey: ['sponsorship'] })
  }
}

/** Shared core-members-only gate for the four money pages. */
function CorePage({ title, children }: { title: string; children: (me: Me) => React.ReactNode }) {
  const { memberState, memberPending, sessionPending } = useMemberState()
  const me = memberState?.status === 'member' ? memberState.me : null

  if (sessionPending || memberPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    )
  }
  if (!me || me.role === 'member') {
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
      <BackLink />
      <h1 className="text-2xl font-bold">{title}</h1>
      {children(me)}
    </div>
  )
}

export const LedgerPage = () => <CorePage title="Ledger">{(me) => <EntriesTab isAdmin={me.role === 'admin'} />}</CorePage>
export const WalletsPage = () => <CorePage title="Wallets">{() => <OverviewTab />}</CorePage>
export const SponsorshipPage = () => (
  <CorePage title="Sponsorship">{(me) => <SponsorshipTab isAdmin={me.role === 'admin'} />}</CorePage>
)
export const ReimbursementsPage = () => (
  <CorePage title="Reimbursements">{(me) => <ClaimsTab myPersonId={me.personId!} isAdmin={me.role === 'admin'} />}</CorePage>
)

// ── Overview ────────────────────────────────────────────────────────────────

function OverviewTab() {
  const { data: s, isPending } = useSummary()
  if (isPending || !s) return <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading" />
  const stats: [string, string, string][] = [
    ['Total in hand', rupees(s.totalBalance), 'genda'],
    [`Carried forward (before ${s.seasonStart})`, rupees(s.carriedForward), 'sharat'],
    ['Collected this season', rupees(s.collectedSince), 'durba'],
    ['Spent this season', rupees(s.spentSince), 'destructive'],
    ['Owed to members (pending claims)', rupees(s.outstandingClaims), 'palash'],
    ['Disposable (in hand − owed)', rupees(s.totalBalance - s.outstandingClaims), 'matir'],
  ]
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map(([label, value, tone]) => (
          <Card key={label} style={{ background: `color-mix(in srgb, var(--${tone}) 9%, var(--card))` }}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-lg font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Wallets</CardTitle>
          <CardDescription>Whoever holds samiti money right now — nobody is designated.</CardDescription>
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
    </div>
  )
}

// ── Entries ─────────────────────────────────────────────────────────────────

function EntriesTab({ isAdmin }: { isAdmin: boolean }) {
  const { data: entries, isPending } = useEntries()
  const invalidate = useLedgerInvalidate()
  const [adding, setAdding] = useState(false)
  const [book, setBook] = useState<string>('all')
  const [year, setYear] = useState<string>('all')
  const [kind, setKind] = useState<string>('all')

  const voidEntry = useMutation({
    mutationFn: (id: string) => post(`/api/members/ledger/entries/${id}/void`),
    onSuccess: invalidate,
  })

  const years = useMemo(() => [...new Set((entries ?? []).map((e) => yearOf(e.entryDate)))].sort().reverse(), [entries])
  const shown = (entries ?? []).filter(
    (e) =>
      (book === 'all' || e.bookId === book) &&
      (year === 'all' || yearOf(e.entryDate) === year) &&
      (kind === 'all' || e.kind === kind),
  )
  const total = shown.filter((e) => e.isActive).reduce(
    (s, e) => s + (e.kind === 'contribution' ? e.amount : e.kind === 'expense' ? -e.amount : 0),
    0,
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {!adding && (
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
        <select className={`${inputCls} w-auto`} value={year} onChange={(e) => setYear(e.target.value)} aria-label="Year">
          <option value="all">All years</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
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
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading" />
      ) : shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">No entries yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {shown.map((e) => (
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
                {isAdmin && e.isActive && (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Void entry"
                    onClick={() => {
                      if (confirm('Void this entry? Linked pledge/claim will reopen.')) voidEntry.mutate(e.id)
                    }}
                  >
                    <Ban className="size-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function PersonSelect({
  value,
  onChange,
  ariaLabel,
  coreOnly = false,
  exclude = [],
}: {
  value: string | null
  onChange: (v: string) => void
  ariaLabel: string
  coreOnly?: boolean
  exclude?: string[]
}) {
  const { data: people } = useMembersLite()
  const options = (people ?? [])
    .filter((p) => (!coreOnly || p.tier === 'core') && !exclude.includes(p.id))
    .map((p) => ({ value: p.id, label: p.name }))
  return <SearchSelect align="left" options={options} value={value} onChange={onChange} ariaLabel={ariaLabel} />
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

function EntryForm({ onClose }: { onClose: () => void }) {
  const invalidate = useLedgerInvalidate()
  const [kind, setKind] = useState<LedgerKind>('contribution')
  const [bookId, setBookId] = useState<BookId>('pujo-ledger')
  const [entryDate, setEntryDate] = useState(todayIST())
  const [category, setCategory] = useState('subscription')
  const [subCategory, setSubCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [personId, setPersonId] = useState<string | null>(null)
  const [counterparty, setCounterparty] = useState('')
  const [walletId, setWalletId] = useState<string | null>(null)
  const [toWalletId, setToWalletId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')

  const save = useMutation({
    mutationFn: (body: LedgerEntryInput) => post('/api/members/ledger/entries', body),
    onSuccess: () => {
      invalidate()
      onClose()
    },
  })

  const switchKind = (k: LedgerKind) => {
    setKind(k)
    setCategory(k === 'contribution' ? 'subscription' : '')
    setSubCategory('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New ledger entry</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Kind">
            <select className={inputCls} value={kind} onChange={(e) => switchKind(e.target.value as LedgerKind)}>
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
          {kind !== 'transfer' && (
            <>
              <Field label={kind === 'contribution' ? 'Contributor (member)' : 'Member (if applicable)'}>
                <PersonSelect value={personId} onChange={setPersonId} ariaLabel="Contributor" />
              </Field>
              <Field label={kind === 'contribution' ? 'Or from (e.g. Hundi)' : 'Vendor / paid to'}>
                <input
                  className={inputCls}
                  value={counterparty}
                  onChange={(e) => setCounterparty(e.target.value)}
                  placeholder={kind === 'contribution' ? 'Hundi' : 'Calcutta Sweets'}
                />
              </Field>
            </>
          )}
          <Field label={kind === 'transfer' ? 'From wallet' : 'Wallet (who holds/paid the cash)'}>
            <PersonSelect value={walletId} onChange={setWalletId} ariaLabel="Wallet" />
          </Field>
          {kind === 'transfer' && (
            <Field label="To wallet">
              <PersonSelect value={toWalletId} onChange={setToWalletId} ariaLabel="To wallet" exclude={walletId ? [walletId] : []} />
            </Field>
          )}
          <Field label="Notes">
            <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </div>
        {save.isError && <p className="text-sm text-destructive">{(save.error as Error).message}</p>}
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={save.isPending || !amount || !walletId}
            onClick={() =>
              save.mutate({
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
            }
          >
            {save.isPending && <Loader2 className="animate-spin" />} Save entry
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Sponsorship ─────────────────────────────────────────────────────────────

function SponsorshipTab({ isAdmin }: { isAdmin: boolean }) {
  const { data: events } = useEvents()
  const dp = (events ?? []).filter((e) => e.kind === 'durga-pujo')
  const activeYear = dp.find((e) => e.isActive)?.year ?? new Date().getFullYear()
  const [year, setYear] = useState<number | null>(null)
  const y = year ?? activeYear
  const { data: items, isPending } = useSponsorship(dp.length ? y : null)
  const invalidate = useLedgerInvalidate()
  const [pledgingId, setPledgingId] = useState<string | null>(null)
  const [payingId, setPayingId] = useState<string | null>(null)

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
  const cancelPledge = useMutation({
    mutationFn: (pledgeId: string) => post(`/api/members/ledger/sponsorship/pledges/${pledgeId}/cancel`),
    onSuccess: invalidate,
  })

  const shown = (items ?? []).filter((i) => !i.retired)
  const categories = [...new Set(shown.map((i) => i.category))]
  const offered = shown.filter((i) => i.offered)
  const pledgedTotal = offered.reduce((s, i) => s + (i.pledge && i.pledge.status !== 'cancelled' ? i.pledge.amount : 0), 0)
  const paidTotal = offered.reduce((s, i) => s + (i.pledge?.status === 'paid' ? i.pledge.amount : 0), 0)

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
          Pledged {rupees(pledgedTotal)} · Received {rupees(paidTotal)}
        </span>
      </div>
      {isPending ? (
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading" />
      ) : (
        categories.map((cat) => {
          const rows = shown.filter((i) => i.category === cat && (isAdmin || i.offered))
          if (!rows.length) return null
          return (
            <Card key={cat}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-shiuli">{cat}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {rows.map((i) => {
                  const amount = i.yearAmount ?? i.defaultAmount
                  const pl = i.pledge
                  return (
                    <div key={i.id} className={`flex flex-wrap items-center gap-2 border-b pb-2 text-sm last:border-0 last:pb-0 ${i.offered ? '' : 'opacity-50'}`}>
                      <span className="min-w-0 flex-1">
                        {i.title}
                        {!i.offered && <Badge variant="outline">not offered</Badge>}
                        {pl && (
                          <span className="block text-xs text-muted-foreground">
                            {pl.status === 'paid' ? 'Sponsored by' : 'Pledged by'} {pl.personName} · {rupees(pl.amount)}
                          </span>
                        )}
                      </span>
                      <span className="text-muted-foreground">{amount != null ? rupees(amount) : '—'}</span>
                      {pl ? (
                        pl.status === 'paid' ? (
                          <Badge variant="durba">Paid</Badge>
                        ) : payingId === i.id ? (
                          <PayPledgeInline pledgeId={pl.id} onDone={() => setPayingId(null)} />
                        ) : (
                          <>
                            <Button size="sm" variant="outline" onClick={() => setPayingId(i.id)}>
                              <HandCoins /> Record payment
                            </Button>
                            <Button size="icon" variant="ghost" aria-label="Cancel pledge" onClick={() => cancelPledge.mutate(pl.id)}>
                              <Undo2 className="size-4" />
                            </Button>
                          </>
                        )
                      ) : i.offered ? (
                        pledgingId === i.id ? (
                          <PledgeInline itemId={i.id} year={y} defaultAmount={amount} onDone={() => setPledgingId(null)} />
                        ) : (
                          <Button size="sm" onClick={() => setPledgingId(i.id)}>
                            Pledge
                          </Button>
                        )
                      ) : null}
                      {isAdmin && (
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
      {isAdmin && <NewItemForm />}
    </div>
  )
}

function PledgeInline({ itemId, year, defaultAmount, onDone }: { itemId: string; year: number; defaultAmount: number | null; onDone: () => void }) {
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
      <PersonSelect value={personId} onChange={setPersonId} ariaLabel="Pledger" />
      <input type="number" min="1" className={`${inputCls} w-24`} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="₹" />
      <Button size="sm" disabled={!personId || !amount || save.isPending} onClick={() => save.mutate()}>
        Save
      </Button>
      <Button size="sm" variant="ghost" onClick={onDone}>
        ✕
      </Button>
      {save.isError && <span className="text-xs text-destructive">{(save.error as Error).message}</span>}
    </span>
  )
}

function PayPledgeInline({ pledgeId, onDone }: { pledgeId: string; onDone: () => void }) {
  const invalidate = useLedgerInvalidate()
  const [walletId, setWalletId] = useState<string | null>(null)
  const save = useMutation({
    mutationFn: () => post(`/api/members/ledger/sponsorship/pledges/${pledgeId}/pay`, { walletPersonId: walletId }),
    onSuccess: () => {
      invalidate()
      onDone()
    },
  })
  return (
    <span className="flex flex-wrap items-center gap-2">
      <PersonSelect value={walletId} onChange={setWalletId} ariaLabel="Received by (wallet)" />
      <Button size="sm" disabled={!walletId || save.isPending} onClick={() => save.mutate()}>
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

function ClaimsTab({ myPersonId, isAdmin }: { myPersonId: string; isAdmin: boolean }) {
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

  const shown = (claims ?? []).filter((cl) => filter === 'all' || cl.status === filter)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus /> New claim
          </Button>
        )}
        <div className="flex flex-wrap gap-1">
          {CLAIM_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      {act.isError && <p className="text-sm text-destructive">{(act.error as Error).message}</p>}
      {adding && <ClaimForm onClose={() => setAdding(false)} />}
      {isPending ? (
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading" />
      ) : shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">No claims here.</p>
      ) : (
        shown.map((cl) => {
          const mine = cl.personId === myPersonId
          const canSettle = cl.status === 'requested' && !mine && (!cl.assignedTo || cl.assignedTo === myPersonId)
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
                    {isAdmin &&
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
