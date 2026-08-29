import type { BhogMenuView } from '@pujosamiti/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarCog, Loader2, Pencil, Plus, Trash2, UtensilsCrossed } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { BackLink } from '@/components/BackLink'
import { Field, inputCls } from '@/components/form'
import { SearchSelect } from '@/components/SearchSelect'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Seo } from '@/components/Seo'
import {
  createBhogDay,
  deleteBhogDay,
  publishBhogDay,
  saveBhogItems,
  seedBhogDays,
  updateBhogDay,
  useBhog,
} from '@/lib/bhog'
import { useMemberState } from '@/lib/member'
import { usePujaDays } from '@/lib/pujaDays'
import { useEvents } from '@/lib/tasks'

const fmtDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

export function Bhog() {
  const { memberState, memberPending, sessionPending } = useMemberState()
  const me = memberState?.status === 'member' ? memberState.me : null
  const { data: events } = useEvents()
  const [year, setYear] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)

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

  const { data: days, isPending, error } = useBhog(me ? year : null)

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
          <CardDescription>The bhog menu is visible to samiti members after sign in.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const canEdit = me.role !== 'member' && !archival

  return (
    <div className="flex flex-col gap-4">
      <Seo title="Bhog Menu" description="Daily bhog menu and per-plate cost for samiti members." path="/bhog" noindex />
      <BackLink />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">
          Bhog Menu{year && <span className="text-muted-foreground"> · {year}</span>}
        </h1>
        <SearchSelect
          options={years.map((y) => ({
            value: String(y),
            label: `Durga Pujo ${y}`,
            hint: (events ?? []).some((e) => e.kind === 'durga-pujo' && e.year === y && e.isActive)
              ? 'Active'
              : undefined,
          }))}
          value={year ? String(year) : null}
          onChange={(v) => setYear(Number(v))}
          ariaLabel="Durga Pujo year"
        />
      </div>

      {archival && (
        <p className="rounded-md bg-accent px-3 py-2 text-sm text-muted-foreground">
          Durga Pujo {year} is closed — this menu is the record of what was served, kept read-only.
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error.message}</p>}
      {isPending && year && (
        <div className="flex justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading" />
        </div>
      )}

      {days && year && (
        <>
          {canEdit && (
            <EditorBar year={year} days={days} isAdmin={me.role === 'admin'} adding={adding} setAdding={setAdding} />
          )}
          {adding && canEdit && <DayForm year={year} onClose={() => setAdding(false)} />}
          {days.length === 0 && !canEdit && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              The {year} bhog menu isn't published yet — check back closer to the pujo.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {days.map((d) => (
              <DayCard key={d.id} year={year} day={d} canEdit={canEdit} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/** Seed (admin) / add-day controls above the cards. */
function EditorBar({
  year,
  days,
  isAdmin,
  adding,
  setAdding,
}: {
  year: number
  days: BhogMenuView[]
  isAdmin: boolean
  adding: boolean
  setAdding: (v: boolean) => void
}) {
  const queryClient = useQueryClient()
  const { data: pujaDays } = usePujaDays(year)
  const seed = useMutation({
    mutationFn: () => seedBhogDays(year),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['bhog', year] }),
  })
  return (
    <div className="flex flex-wrap items-center gap-2">
      {days.length === 0 &&
        isAdmin &&
        ((pujaDays?.days.length ?? 0) > 0 ? (
          <Button size="sm" onClick={() => seed.mutate()} disabled={seed.isPending}>
            {seed.isPending ? <Loader2 className="animate-spin" /> : <CalendarCog />} Seed bhog days (Saptami → Dashami)
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            No Puja Days for {year} yet — finalise the nirghanto and seed them first (Nirghanto page).
          </p>
        ))}
      <Button size="sm" variant="outline" onClick={() => setAdding(!adding)}>
        <Plus /> Add a day
      </Button>
      {seed.error && <p className="text-sm text-destructive">{seed.error.message}</p>}
    </div>
  )
}

function DayCard({ year, day, canEdit }: { year: number; day: BhogMenuView; canEdit: boolean }) {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['bhog', year] })
  const [editing, setEditing] = useState(false)
  const publish = useMutation({
    mutationFn: () => publishBhogDay(day.id, !day.isPublished),
    onSettled: invalidate,
  })
  const remove = useMutation({ mutationFn: () => deleteBhogDay(day.id), onSettled: invalidate })

  if (editing) return <DayForm year={year} initial={day} onClose={() => setEditing(false)} />

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <UtensilsCrossed className="size-4 shrink-0 text-durba" aria-hidden="true" />
            {day.label}
            {day.labelBn && <span className="font-normal text-muted-foreground">{day.labelBn}</span>}
          </CardTitle>
          {!day.isPublished && <Badge variant="genda">Draft</Badge>}
        </div>
        <CardDescription>{fmtDate(day.date)}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-lg font-semibold">
          {day.perPlateCost != null ? (
            <>₹{day.perPlateCost} <span className="text-sm font-normal text-muted-foreground">per plate</span></>
          ) : (
            <span className="text-sm font-normal text-muted-foreground">Per-plate cost to be announced</span>
          )}
        </p>
        {day.items.length > 0 ? (
          <ul className="flex flex-col gap-1 text-sm">
            {day.items.map((i) => (
              <li key={i.id} className="flex items-baseline gap-2">
                <span>{i.title}</span>
                {i.titleBn && <span className="text-muted-foreground">{i.titleBn}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Menu to be announced.</p>
        )}
        {day.notes && <p className="text-sm text-shiuli">{day.notes}</p>}
        {canEdit && (
          <div className="flex flex-wrap gap-2 border-t pt-3">
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil /> Edit
            </Button>
            <Button size="sm" variant={day.isPublished ? 'outline' : 'default'} onClick={() => publish.mutate()} disabled={publish.isPending}>
              {publish.isPending ? <Loader2 className="animate-spin" /> : null}
              {day.isPublished ? 'Unpublish' : 'Publish to members'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => remove.mutate()} disabled={remove.isPending} aria-label={`Remove ${day.label}`}>
              <Trash2 />
            </Button>
            {(publish.error || remove.error) && (
              <p className="text-sm text-destructive">{(publish.error ?? remove.error)!.message}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/** Create/edit one bhog day: labels, date, cost, notes, dishes (one per line). */
function DayForm({ year, initial, onClose }: { year: number; initial?: BhogMenuView; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [label, setLabel] = useState(initial?.label ?? '')
  const [labelBn, setLabelBn] = useState(initial?.labelBn ?? '')
  const [date, setDate] = useState(initial?.date ?? '')
  const [cost, setCost] = useState(initial?.perPlateCost != null ? String(initial.perPlateCost) : '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [dishes, setDishes] = useState(
    (initial?.items ?? []).map((i) => (i.titleBn ? `${i.title} | ${i.titleBn}` : i.title)).join('\n'),
  )

  const save = useMutation({
    mutationFn: async () => {
      const input = {
        year,
        label: label.trim(),
        labelBn: labelBn.trim() || null,
        date,
        perPlateCost: cost.trim() ? Number(cost) : null,
        notes: notes.trim() || null,
        sortOrder: initial?.sortOrder ?? 1000,
      }
      const id = initial ? (await updateBhogDay(initial.id, input), initial.id) : (await createBhogDay(input)).id
      const items = dishes
        .split('\n')
        .map((line) => {
          const [en, bn] = line.split('|').map((s) => s.trim())
          return { title: en ?? '', titleBn: bn || null }
        })
        .filter((i) => i.title)
      await saveBhogItems(id, { items })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['bhog', year] }),
    onSuccess: onClose,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initial ? `Edit ${initial.label}` : 'New bhog day'}</CardTitle>
        <CardDescription>
          One dish per line — add the Bengali name after a "|" (e.g. "Khichuri | খিচুড়ি").
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Day">
            <input className={inputCls} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Saptami Bhog" />
          </Field>
          <Field label="বাংলা">
            <input className={inputCls} value={labelBn} onChange={(e) => setLabelBn(e.target.value)} placeholder="সপ্তমীর ভোগ" />
          </Field>
          <Field label="Date">
            <input className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Per plate ₹">
            <input className={inputCls} type="number" min="0" inputMode="numeric" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="180" />
          </Field>
        </div>
        <Field label="Menu (one dish per line)">
          <textarea
            className={inputCls}
            rows={6}
            value={dishes}
            onChange={(e) => setDishes(e.target.value)}
            placeholder={'Khichuri | খিচুড়ি\nLabra | লাবড়া\nBeguni | বেগুনি'}
          />
        </Field>
        <Field label="Notes">
          <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Mishti Doi +₹20" />
        </Field>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending || !label.trim() || !date}>
            {save.isPending ? <Loader2 className="animate-spin" /> : null} Save
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
        {save.error && <p className="text-sm text-destructive">{save.error.message}</p>}
      </CardContent>
    </Card>
  )
}
