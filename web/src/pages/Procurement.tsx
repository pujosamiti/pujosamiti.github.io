import type {
  ProcurementCell,
  ProcurementDay,
  ProcurementItemView,
  ProcurementSlot,
  ProcurementStatus,
} from '@pujosamiti/shared'
import { DURGA_PUJO_DEFAULT_DAYS, PROCUREMENT_SLOTS } from '@pujosamiti/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarCog, Check, Loader2, Pencil, Plus, Printer, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { BackLink } from '@/components/BackLink'
import { Field, inputCls } from '@/components/form'
import { SearchSelect } from '@/components/SearchSelect'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Seo } from '@/components/Seo'
import { useMemberState } from '@/lib/member'
import {
  createDay,
  createProcurementItem,
  deleteDay,
  saveCell,
  saveItemYear,
  setCellPurchased,
  updateDay,
  updateProcurementItem,
  useProcurement,
} from '@/lib/procurement'
import { useEvents } from '@/lib/tasks'

const SLOT_LABEL: Record<ProcurementSlot, string> = { morning: 'Morning', evening: 'Evening' }
const STATUS_LABEL: Record<ProcurementStatus, string> = {
  pending: 'Pending',
  partial: 'Partial',
  done: 'Done',
}

export function Procurement() {
  const { memberState, memberPending, sessionPending } = useMemberState()
  const me = memberState?.status === 'member' ? memberState.me : null
  const { data: events } = useEvents()
  const [year, setYear] = useState<number | null>(null)
  const [dayId, setDayId] = useState<string>('all')
  const [adding, setAdding] = useState(false)
  const [managingDays, setManagingDays] = useState(false)

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
  if (!me) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Members only</CardTitle>
          <CardDescription>Procurement lists are visible to samiti members after sign in.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const canEdit = me.role !== 'member' && !archival
  const days = data?.days ?? []
  const all = data?.items ?? []
  const selectedDay = days.find((d) => d.id === dayId) ?? null
  // Day view: only that day's cells, only items that have any (the order sheet)
  const visible = all
    .map((i) => ({ ...i, cells: selectedDay ? i.cells.filter((c) => c.dayId === selectedDay.id) : i.cells }))
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
          <Button size="sm" variant="outline" onClick={() => window.print()}>
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
      {selectedDay?.notes && <p className="text-sm text-muted-foreground">{selectedDay.notes}</p>}

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

      {managingDays && canEdit && year && <DayManager year={year} days={days} />}

      {canEdit &&
        year &&
        (adding ? (
          <ItemForm year={year} categories={categories} onClose={() => setAdding(false)} />
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
        categories.map((cat) => (
          <section key={cat} className="flex flex-col gap-3">
            <h2 className="font-serif text-lg font-bold">{cat}</h2>
            {visible
              .filter((i) => i.category === cat)
              .map((i) => (
                <ItemCard key={i.id} item={i} year={year} days={days} canEdit={canEdit} categories={categories} />
              ))}
          </section>
        ))
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

/** The year's day columns: add (with ritual-order suggestions), edit, remove. */
function DayManager({ year, days }: { year: number; days: ProcurementDay[] }) {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['procurement', year] })
  const [label, setLabel] = useState('')
  const [date, setDate] = useState('')
  const [editing, setEditing] = useState<string | null>(null)

  const add = useMutation({
    mutationFn: () =>
      createDay({ year, label, date: date || null, sortOrder: (days.length + 1) * 10, notes: null }),
    onSuccess: async () => {
      await invalidate()
      setLabel('')
      setDate('')
    },
  })
  const remove = useMutation({ mutationFn: deleteDay, onSettled: invalidate })

  return (
    <Card className="print:hidden">
      <CardHeader>
        <CardTitle>Days of the {year} sheet</CardTitle>
        <CardDescription>
          A tithi that spans two calendar days gets two entries ("Saptami · Day 2"); add Sandhi Puja
          when the timings call for it. Removing a day removes its quantities.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {days.map((d) =>
          editing === d.id ? (
            <DayEditRow key={d.id} year={year} day={d} onClose={() => setEditing(null)} />
          ) : (
            <div key={d.id} className="flex items-center gap-2 text-sm">
              <Badge variant="outline">{d.label}</Badge>
              {d.date && <span className="text-muted-foreground">{d.date}</span>}
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
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Day">
            <input className={inputCls} list="procurement-day-suggestions" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Saptami · Day 2" />
            <datalist id="procurement-day-suggestions">
              {DURGA_PUJO_DEFAULT_DAYS.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </Field>
          <Field label="Date (optional)">
            <input className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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
  const [sortOrder, setSortOrder] = useState(String(day.sortOrder))
  const [notes, setNotes] = useState(day.notes ?? '')
  const save = useMutation({
    mutationFn: () =>
      updateDay(day.id, { year, label, date: date || null, sortOrder: Number(sortOrder) || 1000, notes: notes.trim() || null }),
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

function ItemCard({
  item,
  year,
  days,
  canEdit,
  categories,
}: {
  item: ProcurementItemView
  year: number
  days: ProcurementDay[]
  canEdit: boolean
  categories: string[]
}) {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['procurement', year] })
  const [editing, setEditing] = useState(false)
  const [addingCell, setAddingCell] = useState(false)
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

  if (editing)
    return <ItemForm year={year} categories={categories} initial={item} onClose={() => setEditing(false)} />

  const dayById = new Map(days.map((d) => [d.id, d]))
  const ordered = [...item.cells].sort((a, b) => {
    const da = dayById.get(a.dayId)
    const db = dayById.get(b.dayId)
    return (
      (da?.sortOrder ?? 0) - (db?.sortOrder ?? 0) ||
      PROCUREMENT_SLOTS.indexOf(a.slot) - PROCUREMENT_SLOTS.indexOf(b.slot)
    )
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex flex-wrap items-center gap-2">
              {item.title}
              <Badge variant={item.status === 'done' ? 'durba' : item.status === 'partial' ? 'genda' : 'outline'}>
                {STATUS_LABEL[item.status]}
              </Badge>
            </CardTitle>
            {(item.totalQuantity || item.details) && (
              <CardDescription>
                {item.totalQuantity && <span className="font-medium">Total: {item.totalQuantity}</span>}
                {item.totalQuantity && item.details && ' · '}
                {item.details}
              </CardDescription>
            )}
          </div>
          {canEdit && (
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)} aria-label={`Edit ${item.title}`}>
              <Pencil />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {item.yearNotes && <p className="text-sm text-shiuli">{item.yearNotes}</p>}
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
        {canEdit &&
          (addingCell ? (
            <CellForm itemId={item.id} year={year} days={days} onClose={() => setAddingCell(false)} />
          ) : days.length > 0 ? (
            <div className="print:hidden">
              <Button size="sm" variant="outline" onClick={() => setAddingCell(true)}>
                <Plus /> Add day quantity
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground print:hidden">Add the year's days first (Edit days).</p>
          ))}
      </CardContent>
    </Card>
  )
}

/** Master fields + the year's Total/status/remarks in one form. */
function ItemForm({
  year,
  categories,
  initial,
  onClose,
}: {
  year: number
  categories: string[]
  initial?: ProcurementItemView
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [category, setCategory] = useState(initial?.category ?? '')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [details, setDetails] = useState(initial?.details ?? '')
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 1000))
  const [totalQuantity, setTotalQuantity] = useState(initial?.totalQuantity ?? '')
  const [status, setStatus] = useState<ProcurementStatus>(initial?.status ?? 'pending')
  const [yearNotes, setYearNotes] = useState(initial?.yearNotes ?? '')

  const save = useMutation({
    mutationFn: async () => {
      const master = {
        category,
        title,
        details: details.trim() || null,
        sortOrder: Number(sortOrder) || 1000,
        isActive: true,
      }
      const id = initial ? (await updateProcurementItem(initial.id, master), initial.id) : (await createProcurementItem(master)).id
      await saveItemYear(id, { year, totalQuantity: totalQuantity.trim() || null, status, notes: yearNotes.trim() || null })
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
        details: initial!.details,
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
        <Field label={`Remarks ${year} (optional)`}>
          <input className={inputCls} value={yearNotes} onChange={(e) => setYearNotes(e.target.value)} placeholder="Purohit will bring" />
        </Field>
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
