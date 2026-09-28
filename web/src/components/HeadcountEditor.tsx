import type { BhogHeadcountView } from '@pujosamiti/shared'
import { BHOG_GUEST_CAP, bhogAllowanceText, bhogFits } from '@pujosamiti/shared'
import { useMutation } from '@tanstack/react-query'
import { Check, Loader2, Minus, Plus } from 'lucide-react'
import { useState } from 'react'

import { Switch } from '@/components/Switch'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const dayDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`

type Day = BhogHeadcountView['days'][number]

/**
 * One household's headcount for an event's days — the same form behind the
 * ?c= link, a member's own "Give headcount" and an admin's counter entry.
 * The server decides (lib/headcount); this shows the allowance, keeps the
 * steppers inside it, and greys out days that have closed.
 *
 * Blank means "not answered yet", 0 means "not coming". Only days that
 * changed are sent. Key it by household so a new pick starts fresh.
 *
 * Guest bhog (core households, when the event has a guest rate): a switch
 * for office colleagues and friends opens a second stepper on each day, up to
 * BHOG_GUEST_CAP, and a payment line — heads × rate, to be paid to the Food &
 * Bhog in-charge, less what the ledger shows received.
 */
export function HeadcountEditor({
  view,
  save,
  atCounter = false,
  onSaved,
  onCancel,
  children,
}: {
  view: BhogHeadcountView
  save: (counts: { menuId: string; count: number; guests?: number }[]) => Promise<unknown>
  /** admin / fin_admin recording for someone: closed days stay editable. */
  atCounter?: boolean
  onSaved?: () => void
  onCancel?: () => void
  /** Extra fields above the buttons (the counter's note). */
  children?: React.ReactNode
}) {
  const gb = view.guestBhog
  const [counts, setCounts] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(view.days.map((d) => [d.menuId, d.count])),
  )
  const [guests, setGuests] = useState<Record<string, number>>(() =>
    Object.fromEntries(view.days.map((d) => [d.menuId, d.guests])),
  )
  const [bringing, setBringing] = useState(() => view.days.some((d) => d.guests > 0))
  const [saved, setSaved] = useState(false)
  const editable = (d: Day) => d.open || atCounter

  const values = view.days.map((d) => counts[d.menuId] ?? 0)
  const used = values.reduce((s, n) => s + n, 0)
  const a = view.allowance
  const fits = !a || bhogFits(a, values)
  const rises = view.days.some((d) => (counts[d.menuId] ?? 0) > (d.count ?? 0))
  const blocked = !fits && rises
  const countChanged = (d: Day) => counts[d.menuId] != null && counts[d.menuId] !== d.count
  const guestsChanged = (d: Day) => (guests[d.menuId] ?? 0) !== d.guests
  const changed = view.days.filter((d) => editable(d) && (countChanged(d) || guestsChanged(d)))

  const heads = view.days.reduce((s, d) => s + (guests[d.menuId] ?? 0), 0)
  const due = gb ? heads * gb.rate : 0

  /** The most this day may hold without breaking the allowance. */
  const maxFor = (menuId: string) => {
    if (!a) return 99
    if (a.kind === 'per_day') return a.perDay
    const others = view.days.filter((d) => d.menuId !== menuId).reduce((s, d) => s + (counts[d.menuId] ?? 0), 0)
    return Math.max(0, a.coupons - others)
  }
  /** Guests: up to the cap for a core household; otherwise only down from what is on record. */
  const guestMaxFor = (d: Day) => (gb?.canAdd ? BHOG_GUEST_CAP : d.guests)
  const set = (menuId: string, n: number | null) => {
    setSaved(false)
    setCounts({ ...counts, [menuId]: n == null ? null : Math.max(0, Math.min(99, n)) })
  }
  const setGuest = (d: Day, n: number) => {
    setSaved(false)
    setGuests({ ...guests, [d.menuId]: Math.max(0, Math.min(guestMaxFor(d), n)) })
  }
  /** Switching off clears the guests on every day still open; closed days keep theirs. */
  const toggleBringing = () => {
    setSaved(false)
    if (bringing)
      setGuests(Object.fromEntries(view.days.map((d) => [d.menuId, editable(d) ? 0 : d.guests])))
    setBringing(!bringing)
  }

  const submit = useMutation({
    mutationFn: () =>
      save(
        changed.map((d) => ({
          menuId: d.menuId,
          // a guest-only change still needs the family's count; blank reads as 0
          count: counts[d.menuId] ?? d.count ?? 0,
          ...(gb ? { guests: guests[d.menuId] ?? 0 } : {}),
        })),
      ),
    onSuccess: () => {
      setSaved(true)
      onSaved?.()
    },
  })

  return (
    <div className="flex flex-col gap-3">
      {/* Coupon households need the tally; the 10-a-day ones (₹10,000 and up —
          the core members) don't need telling, and the steppers stop at 10 anyway. */}
      {a?.kind === 'coupons' && (
        <div
          className={cn(
            'flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-md px-3 py-2 text-sm',
            blocked || view.overAllowance ? 'bg-destructive/10' : 'bg-accent',
          )}
        >
          <span className="font-medium">{bhogAllowanceText(a, view.days.length)}</span>
          <span className={cn('tabular-nums', used > a.coupons ? 'text-destructive' : 'text-muted-foreground')}>
            {used} of {a.coupons} used
          </span>
        </div>
      )}
      {view.overAllowance && (
        <p className="text-sm text-destructive">
          These counts are more than this household’s allowance now. They stand, and can be lowered — but not raised.
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        Count everyone aged 5 and above. 0 means not coming; leave a day blank to answer later.
      </p>

      {gb && (gb.canAdd || gb.heads > 0) && (
        <Switch
          checked={bringing}
          onChange={toggleBringing}
          label="Bringing office colleagues / friends"
          hint={`${inr(gb.rate)} a head, up to ${BHOG_GUEST_CAP} a day — on top of your family’s count`}
        />
      )}

      <ul className="flex flex-col divide-y rounded-md border">
        {view.days.map((d) => {
          const n = counts[d.menuId]
          const can = editable(d)
          const g = guests[d.menuId] ?? 0
          return (
            <li key={d.menuId} className={cn('flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5', !can && 'opacity-60')}>
              <div className="min-w-0 flex-1 basis-40">
                <p className="font-medium">
                  {d.label}
                  {d.labelBn && <span className="ml-2 font-normal text-muted-foreground">{d.labelBn}</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dayDate(d.date)} ·{' '}
                  {d.open ? `changes till ${dayDate(d.lastChange)}` : `closed on ${dayDate(d.lastChange)}`}
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Stepper
                  label={bringing ? 'Family' : null}
                  value={n}
                  blank
                  disabled={!can}
                  max={maxFor(d.menuId)}
                  onChange={(v) => set(d.menuId, v)}
                  name={`Headcount for ${d.label}`}
                />
                {bringing && (
                  <Stepper
                    label="Guests"
                    value={g}
                    disabled={!can}
                    max={guestMaxFor(d)}
                    onChange={(v) => setGuest(d, v ?? 0)}
                    name={`Guests for ${d.label}`}
                  />
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {gb && (bringing || gb.heads > 0 || gb.received > 0) && (
        <div className="flex flex-col gap-1 rounded-md bg-accent px-3 py-2 text-sm">
          <p>
            <span className="font-medium">
              Guests: {heads} × {inr(gb.rate)} = {inr(due)}
            </span>
            {heads > 0 && (
              <>
                {' '}
                — please pay this to the Food &amp; Bhog In-charge
                {gb.inchargeName ? ` (${gb.inchargeName} & Team)` : ''}.
              </>
            )}
          </p>
          {gb.received > 0 && (
            <p className="text-muted-foreground">
              {inr(gb.received)} received
              {due - gb.received > 0
                ? ` · ${inr(due - gb.received)} to pay`
                : due - gb.received < 0
                  ? ' — more than the guests now come to; no refunds'
                  : ' · paid in full'}
            </p>
          )}
        </div>
      )}

      {children}

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => submit.mutate()} disabled={submit.isPending || changed.length === 0 || blocked}>
          {submit.isPending ? <Loader2 className="animate-spin" /> : null} Save headcount
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        {saved && !submit.isPending && (
          <span className="inline-flex items-center gap-1 text-sm text-durba">
            <Check className="size-4" /> Saved
          </span>
        )}
      </div>
      {blocked && a && (
        <p className="text-sm text-destructive">
          {a.kind === 'per_day'
            ? `No more than ${a.perDay} on any day.`
            : `${used} coupons asked for — ${a.coupons} available.`}
        </p>
      )}
      {submit.error && <p className="text-sm text-destructive">{submit.error.message}</p>}
    </div>
  )
}

/** − [n] + with 44px targets; `blank` lets the value be empty ("not answered yet"). */
function Stepper({
  label,
  value,
  blank = false,
  disabled,
  max,
  onChange,
  name,
}: {
  label: string | null
  value: number | null
  blank?: boolean
  disabled: boolean
  max: number
  onChange: (v: number | null) => void
  /** what the screen reader hears: "Guests for Saptami Bhog" */
  name: string
}) {
  const n = value ?? 0
  return (
    <div className="flex items-center gap-1.5">
      {label && <span className="w-14 text-right text-xs text-muted-foreground">{label}</span>}
      <Button
        type="button"
        size="icon"
        variant="outline"
        disabled={disabled || n <= 0}
        onClick={() => onChange(value == null ? 0 : n - 1)}
        aria-label={`One fewer — ${name}`}
      >
        <Minus />
      </Button>
      <input
        className="h-11 w-14 rounded-md border border-input bg-background text-center text-base tabular-nums outline-none focus:ring-2 focus:ring-ring/50 disabled:cursor-not-allowed"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="—"
        disabled={disabled}
        value={value ?? ''}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '')
          onChange(v === '' ? (blank ? null : 0) : Number(v))
        }}
        aria-label={name}
      />
      <Button
        type="button"
        size="icon"
        variant="outline"
        disabled={disabled || n >= max}
        onClick={() => onChange(n + 1)}
        aria-label={`One more — ${name}`}
      >
        <Plus />
      </Button>
    </div>
  )
}
