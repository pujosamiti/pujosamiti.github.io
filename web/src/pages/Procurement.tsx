import type {
  ProcurementCell,
  ProcurementDay,
  ProcurementItemView,
  ProcurementSlot,
  ProcurementStatus,
} from '@pujosamiti/shared'
import { isCoreRole, PROCUREMENT_SLOTS, PUJA_TITHIS } from '@pujosamiti/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarCog, Check, ChevronDown, ListChecks, Loader2, Minus, Pencil, Plus, Printer, Trash2, X } from 'lucide-react'
import { Link } from 'react-router'
import { useEffect, useMemo, useState } from 'react'

import { BackLink } from '@/components/BackLink'
import { Field, inputCls } from '@/components/form'
import { SearchSelect } from '@/components/SearchSelect'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Seo } from '@/components/Seo'
import { cn } from '@/lib/utils'
import { useMemberState } from '@/lib/member'
import {
  createDay,
  createProcurementItem,
  deleteDay,
  prefillFromMaster,
  saveCell,
  saveItemYear,
  seedDeliveryColumns,
  setCellPurchased,
  updateDay,
  updateProcurementItem,
  useProcurement,
} from '@/lib/procurement'
import { usePujaDays } from '@/lib/pujaDays'
import { useEvents } from '@/lib/tasks'

const SLOT_LABEL: Record<ProcurementSlot, string> = { morning: 'Morning', evening: 'Evening' }
const STATUS_LABEL: Record<ProcurementStatus, string> = {
  pending: 'Pending',
  partial: 'Partial',
  done: 'Done',
}
const STATUS_CYCLE: Record<ProcurementStatus, ProcurementStatus> = {
  pending: 'partial',
  partial: 'done',
  done: 'pending',
}

export function Procurement() {
  const { memberState, memberPending, sessionPending } = useMemberState()
  const me = memberState?.status === 'member' ? memberState.me : null
  const { data: events } = useEvents()
  const [year, setYear] = useState<number | null>(null)
  const [dayId, setDayId] = useState<string>('all')
  const [adding, setAdding] = useState(false)
  const [managingDays, setManagingDays] = useState(false)
  // Print wants every accordion open; flip, print, flip back.
  const [printAll, setPrintAll] = useState(false)
  const onPrint = () => {
    setPrintAll(true)
    setTimeout(() => {
      window.print()
      setPrintAll(false)
    }, 60)
  }

  const years = useMemo(() => {
    const ys = new Set<number>((events ?? []).filter((e) => e.kind === 'durga-pujo').map((e) => e.year))
    return [...ys].sort()
  }, [events])

  useEffect(() => {
    if (year || !events?.length) return
    const active = events.find((e) => e.isActive && e.kind === 'durga-pujo')
    setYear(active?.year ?? years[years.length - 1] ?? new Date().getFullYear())
  }, [events, year, years])

  const activeYear = (events ?? []).find((e) => e.isActive && e.kind === 'durga-pujo')?.year ?? null
  const archival = year != null && activeYear != null && year !== activeYear

  const { data, isPending, error } = useProcurement(me ? year : null)

  if (sessionPending || memberPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    )
  }
  if (!me || !isCoreRole(me.role)) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Core members only</CardTitle>
          <CardDescription>Procurement lists are the committee's workspace.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const canEdit = isCoreRole(me.role) && !archival
  const days = data?.days ?? []
  const all = data?.items ?? []
  const selectedDay = days.find((d) => d.id === dayId) ?? null
  // Day view: only that day's cells, only items that have any (the order sheet).
  // Blank cells are deliberate clears kept for prefill's sake — never shown.
  const visible = all
    .map((i) => ({
      ...i,
      cells: i.cells.filter((c) => c.quantity !== '' && (!selectedDay || c.dayId === selectedDay.id)),
    }))
    .filter((i) => !selectedDay || i.cells.length > 0)
  const categories = [...new Set(visible.map((i) => i.category))]

  return (
    <div className="flex flex-col gap-4">
      <Seo title="Procurement" description="Durga Pujo shopping lists for samiti members." path="/procurement" noindex />
      <div className="print:hidden">
        <BackLink />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">
          Procurement{selectedDay && <span className="text-muted-foreground"> · {selectedDay.label}</span>}
          {year && <span className="text-muted-foreground"> · {year}</span>}
        </h1>
        <div className="flex gap-2 print:hidden">
          <Button size="sm" variant="outline" asChild>
            <Link to="/procurement/master">
              <ListChecks /> Master list
            </Link>
          </Button>
          <Button size="sm" variant="outline" onClick={onPrint}>
            <Printer /> Print
          </Button>
          <SearchSelect
            options={years.map((y) => ({
              value: String(y),
              label: `Durga Pujo ${y}`,
              hint: (events ?? []).some((e) => e.kind === 'durga-pujo' && e.year === y && e.isActive)
                ? 'Active'
                : undefined,
            }))}
            value={year ? String(year) : null}
            onChange={(v) => {
              setYear(Number(v))
              setDayId('all')
            }}
            ariaLabel="Durga Pujo year"
          />
        </div>
      </div>
      {selectedDay && (selectedDay.date || selectedDay.time || selectedDay.notes) && (
        <p className="text-sm text-muted-foreground">
          {[selectedDay.date, selectedDay.time, selectedDay.notes].filter(Boolean).join(' · ')}
        </p>
      )}

      {archival && (
        <p className="rounded-md bg-accent px-3 py-2 text-sm text-muted-foreground print:hidden">
          Durga Pujo {year} is closed — this list is the record of what was ordered, kept read-only.
          Shopping happens on {activeYear}.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-1.5 print:hidden">
        <DayChip label="All days" active={dayId === 'all'} onClick={() => setDayId('all')} />
        {days.map((d) => (
          <DayChip key={d.id} label={d.label} active={dayId === d.id} onClick={() => setDayId(d.id)} />
        ))}
        {canEdit && year && (
          <Button size="sm" variant="ghost" onClick={() => setManagingDays(!managingDays)}>
            <CalendarCog /> {managingDays ? 'Close days' : 'Edit days'}
          </Button>
        )}
      </div>

      {managingDays && canEdit && year && <DayManager year={year} days={days} isAdmin={me.role === 'admin'} />}

      {canEdit &&
        year &&
        (adding ? (
          <ItemForm year={year} days={days} categories={categories} onClose={() => setAdding(false)} />
        ) : (
          <div className="print:hidden">
            <Button size="sm" onClick={() => setAdding(true)}>
              <Plus /> Add item
            </Button>
          </div>
        ))}

      {error && <p className="text-sm text-destructive">Failed to load: {error.message}</p>}
      {isPending || !year ? (
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading" />
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {selectedDay
            ? `Nothing listed for ${selectedDay.label}.`
            : 'Nothing on the list yet — core members can add days and items.'}
        </p>
      ) : (
        categories.map((cat) => {
          const catItems = visible.filter((i) => i.category === cat)
          return (
            <CategorySection key={cat} title={cat} count={catItems.length} forceOpen={printAll || !!selectedDay}>
              {catItems.map((i) => (
                <ItemRow
                  key={i.id}
                  item={i}
                  year={year}
                  days={days}
                  canEdit={canEdit}
                  categories={categories}
                  forceOpen={printAll}
                  dayFiltered={!!selectedDay}
                />
              ))}
            </CategorySection>
          )
        })
      )}
    </div>
  )
}

function DayChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? 'rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground'
          : 'rounded-full border px-3 py-1 text-xs text-muted-foreground hover:bg-accent'
      }
    >
      {label}
    </button>
  )
}

/** The year's delivery columns: seed from Puja Days (admin), prefill, add, edit, remove. */
function DayManager({ year, days, isAdmin }: { year: number; days: ProcurementDay[]; isAdmin: boolean }) {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['procurement', year] })
  const { data: pujaDays } = usePujaDays(year)
  const [label, setLabel] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [editing, setEditing] = useState<string | null>(null)

  const add = useMutation({
    mutationFn: () =>
      createDay({ year, label, date: date || null, time: time || null, sortOrder: (days.length + 1) * 10, notes: null }),
    onSuccess: async () => {
      await invalidate()
      setLabel('')
      setDate('')
      setTime('')
    },
  })
  const remove = useMutation({ mutationFn: deleteDay, onSettled: invalidate })
  const seed = useMutation({ mutationFn: () => seedDeliveryColumns(year), onSettled: invalidate })
  const prefill = useMutation({ mutationFn: () => prefillFromMaster(year), onSettled: invalidate })

  return (
    <Card className="print:hidden">
      <CardHeader>
        <CardTitle>Delivery columns of the {year} sheet</CardTitle>
        <CardDescription>
          Seeded from the Puja Days: <span className="font-medium text-foreground">delivery date = the
          evening before the tithi, at 19:00 by default</span> (Sandhi Puja: same morning, 10:00) —
          adjust any day after seeding. A tithi spanning two calendar days gets two columns
          ("Ashtami · Day 2"). Removing a day removes its quantities.
        </CardDescription>
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {days.length === 0 ? (
              (pujaDays?.days.length ?? 0) > 0 ? (
                <Button size="sm" onClick={() => seed.mutate()} disabled={seed.isPending}>
                  {seed.isPending ? <Loader2 className="animate-spin" /> : <CalendarCog />} Seed from Puja Days
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No Puja Days for {year} yet — finalise the nirghanto and seed them first (Nirghanto page).
                </p>
              )
            ) : (
              <Button size="sm" onClick={() => prefill.mutate()} disabled={prefill.isPending}>
                {prefill.isPending ? <Loader2 className="animate-spin" /> : <Plus />} Prefill quantities from master list
              </Button>
            )}
            {(seed.error || prefill.error) && (
              <p className="text-sm text-destructive">{(seed.error ?? prefill.error)!.message}</p>
            )}
            {prefill.data && (
              <p className="text-sm text-muted-foreground">
                {prefill.data.totals || prefill.data.cells
                  ? `Prefilled ${prefill.data.totals} total${prefill.data.totals === 1 ? '' : 's'} and ${prefill.data.cells} ${prefill.data.cells === 1 ? 'quantity' : 'quantities'} from the master list.`
                  : 'Nothing to add — the sheet already reflects the master list.'}
              </p>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {days.map((d) =>
          editing === d.id ? (
            <DayEditRow key={d.id} year={year} day={d} onClose={() => setEditing(null)} />
          ) : (
            <div key={d.id} className="flex items-center gap-2 text-sm">
              <Badge variant="outline">{d.label}</Badge>
              {d.date && <span className="text-muted-foreground">{d.date}</span>}
              {d.time && <span className="text-muted-foreground">{d.time}</span>}
              {d.notes && <span className="truncate text-muted-foreground">— {d.notes}</span>}
              <span className="ml-auto flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setEditing(d.id)} aria-label={`Edit ${d.label}`}>
                  <Pencil />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove.mutate(d.id)} aria-label={`Remove ${d.label}`}>
                  <Trash2 />
                </Button>
              </span>
            </div>
          ),
        )}
        <div className="flex flex-wrap items-end gap-2 border-t pt-3">
          <Field label="Day">
            <input className={inputCls} list="procurement-day-suggestions" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Saptami · Day 2" />
            <datalist id="procurement-day-suggestions">
              {PUJA_TITHIS.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </Field>
          <Field label="Date (optional)">
            <input className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Delivery time (optional)">
            <input className={inputCls} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
          <Button size="sm" onClick={() => add.mutate()} disabled={add.isPending || !label.trim()}>
            {add.isPending ? <Loader2 className="animate-spin" /> : <Plus />} Add day
          </Button>
        </div>
        {add.error && <p className="text-sm text-destructive">{add.error.message}</p>}
      </CardContent>
    </Card>
  )
}

function DayEditRow({ year, day, onClose }: { year: number; day: ProcurementDay; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [label, setLabel] = useState(day.label)
  const [date, setDate] = useState(day.date ?? '')
  const [time, setTime] = useState(day.time ?? '')
  const [sortOrder, setSortOrder] = useState(String(day.sortOrder))
  const [notes, setNotes] = useState(day.notes ?? '')
  const save = useMutation({
    mutationFn: () =>
      updateDay(day.id, { year, label, date: date || null, time: time || null, sortOrder: Number(sortOrder) || 1000, notes: notes.trim() || null }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['procurement', year] })
      onClose()
    },
  })
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-md border p-2">
      <Field label="Day">
        <input className={inputCls} value={label} onChange={(e) => setLabel(e.target.value)} />
      </Field>
      <Field label="Date">
        <input className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <Field label="Time">
        <input className={inputCls} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </Field>
      <Field label="Order">
        <input className={inputCls} inputMode="numeric" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
      </Field>
      <Field label="Notes">
        <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Sandhi Puja 16:54–17:42" />
      </Field>
      <div className="flex gap-1">
        <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending || !label.trim()}>
          <Check /> Save
        </Button>
        <Button size="sm" variant="outline" onClick={onClose}>
          <X /> Cancel
        </Button>
      </div>
    </div>
  )
}

/** Collapsible category band ("Pottery", "Grocery", …) holding item lines. */
function CategorySection({
  title,
  count,
  forceOpen,
  children,
}: {
  title: string
  count: number
  forceOpen: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  const shown = open || forceOpen
  return (
    <section className="overflow-hidden rounded-md border">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 bg-accent/40 px-3 py-2 text-left"
        aria-expanded={shown}
      >
        <h2 className="font-serif text-lg font-bold">{title}</h2>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          {count}
          <ChevronDown className={cn('size-4 transition-transform', shown && 'rotate-180')} aria-hidden="true" />
        </span>
      </button>
      {shown && <div className="divide-y border-t">{children}</div>}
    </section>
  )
}

/** One item as a compact line; expands to details, cells and edit controls. */
function ItemRow({
  item,
  year,
  days,
  canEdit,
  categories,
  forceOpen,
  dayFiltered,
}: {
  item: ProcurementItemView
  year: number
  days: ProcurementDay[]
  canEdit: boolean
  categories: string[]
  forceOpen: boolean
  dayFiltered: boolean
}) {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['procurement', year] })
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editingCell, setEditingCell] = useState<string | null>(null)

  const purchasedMut = useMutation({
    mutationFn: ({ id, purchased }: { id: string; purchased: boolean }) => setCellPurchased(id, purchased),
    onSettled: invalidate,
  })
  const clearCell = useMutation({
    mutationFn: (cell: ProcurementCell) =>
      saveCell({ itemId: item.id, dayId: cell.dayId, slot: cell.slot, quantity: '', notes: null }),
    onSettled: invalidate,
  })
  const dayById = new Map(days.map((d) => [d.id, d]))
  const ordered = [...item.cells].sort((a, b) => {
    const da = dayById.get(a.dayId)
    const db = dayById.get(b.dayId)
    return (
      (da?.sortOrder ?? 0) - (db?.sortOrder ?? 0) ||
      PROCUREMENT_SLOTS.indexOf(a.slot) - PROCUREMENT_SLOTS.indexOf(b.slot)
    )
  })
  const allBought = ordered.length > 0 && ordered.every((c) => c.purchased)
  // One tap on the row's round control: day view buys the whole day,
  // all-days view cycles the item's status.
  const buyDay = useMutation({
    mutationFn: async () => {
      const target = !allBought
      await Promise.all(ordered.filter((c) => c.purchased !== target).map((c) => setCellPurchased(c.id, target)))
    },
    onSettled: invalidate,
  })
  const cycleStatus = useMutation({
    mutationFn: () =>
      saveItemYear(item.id, {
        year,
        totalQuantity: item.totalQuantity,
        status: STATUS_CYCLE[item.status],
        dueDate: item.dueDate,
        dueTime: item.dueTime,
        notes: item.yearNotes,
      }),
    onSettled: invalidate,
  })
  // Line summary: the day view reads like the order sheet; all-days shows the total
  const summary = dayFiltered
    ? ordered.map((c) => `${SLOT_LABEL[c.slot]} ${c.quantity}`).join(' · ')
    : [item.totalQuantity, ordered.length > 0 ? `${ordered.length} ${ordered.length === 1 ? 'delivery' : 'deliveries'}` : null]
        .filter(Boolean)
        .join(' · ')
  const shown = open || forceOpen

  return (
    <div className="px-3">
      <div className="flex w-full items-center gap-2 py-2">
        {canEdit && dayFiltered && ordered.length > 0 && (
          <button
            type="button"
            onClick={() => buyDay.mutate()}
            disabled={buyDay.isPending}
            aria-label={allBought ? `Mark ${item.title} not purchased` : `Mark ${item.title} purchased`}
            className={
              allBought
                ? 'flex size-5 shrink-0 items-center justify-center rounded border border-durba bg-durba text-white'
                : 'flex size-5 shrink-0 items-center justify-center rounded border border-input'
            }
          >
            {allBought && <Check className="size-3.5" />}
          </button>
        )}
        {canEdit && !dayFiltered && (
          <button
            type="button"
            onClick={() => cycleStatus.mutate()}
            disabled={cycleStatus.isPending}
            aria-label={`${item.title}: ${STATUS_LABEL[item.status]} — tap to change`}
            title={`${STATUS_LABEL[item.status]} — tap to change`}
            className={cn(
              'flex size-5 shrink-0 items-center justify-center rounded border',
              item.status === 'done' && 'border-durba bg-durba text-white',
              item.status === 'partial' && 'border-genda bg-genda text-secondary-foreground',
              item.status === 'pending' && 'border-input',
            )}
          >
            {item.status === 'done' && <Check className="size-3.5" />}
            {item.status === 'partial' && <Minus className="size-3.5" />}
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-expanded={shown}
        >
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.title}</span>
        {item.status !== 'pending' && (
          <Badge variant={item.status === 'done' ? 'durba' : 'genda'}>{STATUS_LABEL[item.status]}</Badge>
        )}
        {item.status !== 'done' && item.dueDate && (
          <Badge variant={item.dueDate < new Date().toISOString().slice(0, 10) ? 'palash' : 'outline'}>
            due {item.dueDate.slice(5)}
            {item.dueTime ? ` ${item.dueTime}` : ''}
          </Badge>
        )}
        {summary && (
          <span
            className={cn(
              'max-w-[45%] truncate text-xs text-muted-foreground',
              allBought && dayFiltered && 'line-through opacity-60',
            )}
          >
            {summary}
          </span>
        )}
        <ChevronDown
          className={cn('size-4 shrink-0 text-muted-foreground transition-transform', shown && 'rotate-180')}
          aria-hidden="true"
        />
        </button>
      </div>
      {shown && (
        <div className="flex flex-col gap-2 pb-3">
          {editing ? (
            <ItemForm year={year} days={days} categories={categories} initial={item} onClose={() => setEditing(false)} />
          ) : (
            <>
              {(item.nameHi || item.nameBn) && (
                <p className="text-sm text-muted-foreground">{[item.nameBn, item.nameHi].filter(Boolean).join(' · ')}</p>
              )}
              {(item.totalQuantity || item.details) && (
                <p className="text-sm text-muted-foreground">
                  {item.totalQuantity && <span className="font-medium text-foreground">Total: {item.totalQuantity}</span>}
                  {item.totalQuantity && item.details && ' · '}
                  {item.details}
                </p>
              )}
              {item.yearNotes && <p className="text-sm text-shiuli">{item.yearNotes}</p>}
              {ordered.length === 0 && <p className="text-sm text-muted-foreground">No day-wise quantities yet.</p>}
              {ordered.map((cell) =>
                editingCell === cell.id ? (
                  <CellForm
                    key={cell.id}
                    itemId={item.id}
                    year={year}
                    days={days}
                    initial={cell}
                    onClose={() => setEditingCell(null)}
                  />
                ) : (
                  <div key={cell.id} className="flex items-center gap-2 text-sm">
                    {canEdit && (
                      <button
                        onClick={() => purchasedMut.mutate({ id: cell.id, purchased: !cell.purchased })}
                        aria-label={cell.purchased ? 'Mark not purchased' : 'Mark purchased'}
                        className={
                          cell.purchased
                            ? 'flex size-5 shrink-0 items-center justify-center rounded border border-durba bg-durba text-white'
                            : 'flex size-5 shrink-0 items-center justify-center rounded border border-input'
                        }
                      >
                        {cell.purchased && <Check className="size-3.5" />}
                      </button>
                    )}
                    <Badge variant={cell.purchased ? 'durba' : 'outline'}>
                      {dayById.get(cell.dayId)?.label ?? '?'}
                    </Badge>
                    <span className="text-muted-foreground">{SLOT_LABEL[cell.slot]}</span>
                    <span className={cell.purchased ? 'font-medium line-through opacity-60' : 'font-medium'}>
                      {cell.quantity}
                    </span>
                    {cell.notes && <span className="truncate text-muted-foreground">— {cell.notes}</span>}
                    {canEdit && (
                      <span className="ml-auto flex shrink-0 gap-1 print:hidden">
                        <Button size="sm" variant="ghost" onClick={() => setEditingCell(cell.id)} aria-label="Edit quantity">
                          <Pencil />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => clearCell.mutate(cell)} aria-label="Delete quantity">
                          <Trash2 />
                        </Button>
                      </span>
                    )}
                  </div>
                ),
              )}
              {canEdit && (
                <div className="print:hidden">
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                    <Pencil /> Edit item & quantities
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * The whole association in one form: master fields, the year's total/status/
 * remarks, an order-by due date+time, and a day × Morning/Evening quantity
 * grid over the year's day columns — saving upserts every changed cell.
 */
function ItemForm({
  year,
  days,
  categories,
  initial,
  onClose,
}: {
  year: number
  days: ProcurementDay[]
  categories: string[]
  initial?: ProcurementItemView
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [category, setCategory] = useState(initial?.category ?? '')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [nameHi, setNameHi] = useState(initial?.nameHi ?? '')
  const [nameBn, setNameBn] = useState(initial?.nameBn ?? '')
  const [details, setDetails] = useState(initial?.details ?? '')
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 1000))
  const [totalQuantity, setTotalQuantity] = useState(initial?.totalQuantity ?? '')
  const [status, setStatus] = useState<ProcurementStatus>(initial?.status ?? 'pending')
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '')
  const [dueTime, setDueTime] = useState(initial?.dueTime ?? '')
  const [yearNotes, setYearNotes] = useState(initial?.yearNotes ?? '')
  // day-slot grid, keyed "dayId:slot" — seeded from the item's current cells
  const cellKey = (dayId: string, slot: ProcurementSlot) => `${dayId}:${slot}`
  const initialGrid = useMemo(() => {
    const g: Record<string, string> = {}
    for (const c of initial?.cells ?? []) g[cellKey(c.dayId, c.slot)] = c.quantity
    return g
  }, [initial])
  const [grid, setGrid] = useState<Record<string, string>>(initialGrid)

  const save = useMutation({
    mutationFn: async () => {
      const master = {
        category,
        title,
        nameHi: nameHi.trim() || null,
        nameBn: nameBn.trim() || null,
        details: details.trim() || null,
        suggestedTotal: initial?.suggestedTotal ?? null,
        sortOrder: Number(sortOrder) || 1000,
        isActive: true,
      }
      const id = initial ? (await updateProcurementItem(initial.id, master), initial.id) : (await createProcurementItem(master)).id
      await saveItemYear(id, {
        year,
        totalQuantity: totalQuantity.trim() || null,
        status,
        dueDate: dueDate || null,
        dueTime: dueTime || null,
        notes: yearNotes.trim() || null,
      })
      // upsert only the cells that changed; blank clears. Notes on a cell survive.
      const byKey = new Map((initial?.cells ?? []).map((c) => [cellKey(c.dayId, c.slot), c]))
      for (const d of days) {
        for (const slot of PROCUREMENT_SLOTS) {
          const key = cellKey(d.id, slot)
          const next = (grid[key] ?? '').trim()
          const prev = initialGrid[key] ?? ''
          if (next === prev) continue
          await saveCell({ itemId: id, dayId: d.id, slot, quantity: next, notes: byKey.get(key)?.notes ?? null })
        }
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['procurement', year] })
      onClose()
    },
  })
  const remove = useMutation({
    mutationFn: () =>
      updateProcurementItem(initial!.id, {
        category: initial!.category,
        title: initial!.title,
        nameHi: initial!.nameHi,
        nameBn: initial!.nameBn,
        details: initial!.details,
        suggestedTotal: initial!.suggestedTotal,
        sortOrder: initial!.sortOrder,
        isActive: false,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['procurement', year] })
      onClose()
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initial ? `Edit — ${initial.title}` : 'Add item'}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Category">
            <input
              className={inputCls}
              list="procurement-categories"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Pottery, Grocery, Flowers / Garlands…"
            />
            <datalist id="procurement-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Item">
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Jaba Phool (Red Hibiscus)" />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Vendor name — Hindi (optional)">
            <input className={inputCls} value={nameHi} onChange={(e) => setNameHi(e.target.value)} placeholder="लाल जास्वंद गुड़हल फूल" />
          </Field>
          <Field label="Vendor name — Bengali (optional)">
            <input className={inputCls} value={nameBn} onChange={(e) => setNameBn(e.target.value)} placeholder="লাল জবা ফুল" />
          </Field>
        </div>
        <Field label="Details (optional)">
          <input
            className={inputCls}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Spec, packaging notes — 'try to get packets of 1 kg each'"
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={`Total quantity ${year} (optional)`}>
            <input className={inputCls} value={totalQuantity} onChange={(e) => setTotalQuantity(e.target.value)} placeholder="10 kg / 1 + 7" />
          </Field>
          <Field label="Status">
            <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as ProcurementStatus)}>
              {(['pending', 'partial', 'done'] as const).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Sort order">
            <input className={inputCls} inputMode="numeric" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Order by — due date (optional)">
            <input className={inputCls} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          <Field label="Due time (optional)">
            <input className={inputCls} type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
          </Field>
        </div>
        <Field label={`Remarks ${year} (optional)`}>
          <input className={inputCls} value={yearNotes} onChange={(e) => setYearNotes(e.target.value)} placeholder="Purohit will bring" />
        </Field>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Day-wise quantities</p>
          {days.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add the year's days first (Edit days) to assign quantities.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[28rem] text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="py-1 pr-2 font-medium">Day</th>
                    <th className="py-1 pr-2 font-medium">Morning</th>
                    <th className="py-1 font-medium">Evening</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((d) => (
                    <tr key={d.id} className="border-t">
                      <td className="py-1.5 pr-2">
                        <span className="font-medium">{d.label}</span>
                        {(d.date || d.time) && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            {[d.date, d.time].filter(Boolean).join(' ')}
                          </span>
                        )}
                      </td>
                      {PROCUREMENT_SLOTS.map((slot) => (
                        <td key={slot} className="py-1.5 pr-2">
                          <input
                            className={inputCls}
                            value={grid[cellKey(d.id, slot)] ?? ''}
                            onChange={(e) => setGrid({ ...grid, [cellKey(d.id, slot)]: e.target.value })}
                            placeholder="—"
                            aria-label={`${d.label} ${slot} quantity`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {save.error && <p className="text-sm text-destructive">{save.error.message}</p>}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending || !category.trim() || !title.trim()}>
            {save.isPending ? <Loader2 className="animate-spin" /> : <Check />} Save
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>
            <X /> Cancel
          </Button>
          {initial && (
            <Button size="sm" variant="destructive" className="ml-auto" onClick={() => remove.mutate()} disabled={remove.isPending}>
              <Trash2 /> Remove from catalog
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function CellForm({
  itemId,
  year,
  days,
  initial,
  onClose,
}: {
  itemId: string
  year: number
  days: ProcurementDay[]
  initial?: ProcurementCell
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [dayId, setDayId] = useState(initial?.dayId ?? days[0]?.id ?? '')
  const [slot, setSlot] = useState<ProcurementSlot>(initial?.slot ?? 'morning')
  const [quantity, setQuantity] = useState(initial?.quantity ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const save = useMutation({
    mutationFn: () => saveCell({ itemId, dayId, slot, quantity, notes: notes.trim() || null }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['procurement', year] })
      onClose()
    },
  })

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      <div className="grid gap-2 sm:grid-cols-4">
        <Field label="Day">
          <select className={inputCls} value={dayId} onChange={(e) => setDayId(e.target.value)}>
            {days.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Slot">
          <select className={inputCls} value={slot} onChange={(e) => setSlot(e.target.value as ProcurementSlot)}>
            {PROCUREMENT_SLOTS.map((s) => (
              <option key={s} value={s}>
                {SLOT_LABEL[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Quantity">
          <input className={inputCls} value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="250/500 gm" />
        </Field>
        <Field label="Notes (optional)">
          <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>
      <p className="text-xs text-muted-foreground">
        One quantity per item · day · slot — saving over an existing one replaces it.
      </p>
      {save.error && <p className="text-sm text-destructive">{save.error.message}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending || !dayId || !quantity.trim()}>
          {save.isPending ? <Loader2 className="animate-spin" /> : <Check />} Save
        </Button>
        <Button size="sm" variant="outline" onClick={onClose}>
          <X /> Cancel
        </Button>
      </div>
    </div>
  )
}
