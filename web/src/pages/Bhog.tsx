import type { BhogMenuView, PujoEvent } from '@pujosamiti/shared'
import { menuKindLabel, seasonOf } from '@pujosamiti/shared'
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
const seasonLabel = (s: number) => `${s}–${String(s + 1).slice(2)}`
const todaySeason = seasonOf(new Date().toISOString().slice(0, 10))

export function Bhog() {
  const { memberState, memberPending, sessionPending } = useMemberState()
  const me = memberState?.status === 'member' ? memberState.me : null
  const { data: events } = useEvents()
  const [season, setSeason] = useState<number | null>(null)

  const seasons = useMemo(() => {
    const ss = new Set<number>((events ?? []).map((e) => seasonOf(e.startsOn)))
    return [...ss].sort()
  }, [events])

  useEffect(() => {
    if (season != null || seasons.length === 0) return
    setSeason(seasons.includes(todaySeason) ? todaySeason : seasons[seasons.length - 1])
  }, [season, seasons])

  const archival = season != null && season !== todaySeason
  const { data: days, isPending, error } = useBhog(me ? season : null)

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
          <CardDescription>Bhog and food menus are visible to samiti members after sign in.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const canEdit = me.role !== 'member' && !archival
  // The season's occasions in calendar order; members see only those with
  // something published, editors see every occasion as a workspace.
  const seasonEvents = (events ?? [])
    .filter((e) => seasonOf(e.startsOn) === season)
    .sort((a, b) => a.startsOn.localeCompare(b.startsOn))
  const byEvent = new Map<string, BhogMenuView[]>()
  for (const d of days ?? []) {
    const list = byEvent.get(d.eventId) ?? []
    list.push(d)
    byEvent.set(d.eventId, list)
  }
  const sections = seasonEvents.filter((e) => canEdit || (byEvent.get(e.id)?.length ?? 0) > 0)

  return (
    <div className="flex flex-col gap-4">
      <Seo title="Bhog & Food Menu" description="Menus and per-plate cost for the samiti's occasions." path="/bhog" noindex />
      <BackLink />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">
          Bhog &amp; Food Menu{season != null && <span className="text-muted-foreground"> · {seasonLabel(season)}</span>}
        </h1>
        <SearchSelect
          options={seasons.map((s) => ({
            value: String(s),
            label: `Season ${seasonLabel(s)}`,
            hint: s === todaySeason ? 'Current' : undefined,
          }))}
          value={season != null ? String(season) : null}
          onChange={(v) => setSeason(Number(v))}
          ariaLabel="Season (1 July – 30 June)"
        />
      </div>

      {archival && (
        <p className="rounded-md bg-accent px-3 py-2 text-sm text-muted-foreground">
          Season {season != null && seasonLabel(season)} is closed — these menus are the record of what
          was served, kept read-only.
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error.message}</p>}
      {isPending && season != null && (
        <div className="flex justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading" />
        </div>
      )}

      {days && sections.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No menus published for this season yet — check back closer to the events.
        </p>
      )}
      {days &&
        sections.map((e) => (
          <EventSection key={e.id} event={e} season={season!} days={byEvent.get(e.id) ?? []} canEdit={canEdit} isAdmin={me.role === 'admin'} />
        ))}
    </div>
  )
}

function EventSection({
  event,
  season,
  days,
  canEdit,
  isAdmin,
}: {
  event: PujoEvent
  season: number
  days: BhogMenuView[]
  canEdit: boolean
  isAdmin: boolean
}) {
  const queryClient = useQueryClient()
  const [adding, setAdding] = useState(false)
  const kindLabel = menuKindLabel(event.kind)
  const isDurga = event.kind === 'durga-pujo'
  const { data: pujaDays } = usePujaDays(isDurga && canEdit ? event.year : null)
  const seed = useMutation({
    mutationFn: () => seedBhogDays(event.id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['bhog', season] }),
  })

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-2 border-b pb-1">
        <h2 className="text-lg font-semibold">{event.nameEn}</h2>
        <span className="text-sm text-muted-foreground">{event.nameBn}</span>
        <Badge variant="outline">{kindLabel}</Badge>
        {canEdit && days.length === 0 && !isDurga && (
          <Button size="sm" variant="outline" className="ml-auto" onClick={() => setAdding(!adding)}>
            <Plus /> Add the {kindLabel.toLowerCase()}
          </Button>
        )}
        {canEdit && (days.length > 0 || isDurga) && (
          <span className="ml-auto flex gap-2">
            {isAdmin && isDurga && days.length === 0 && (pujaDays?.days.length ?? 0) > 0 && (
              <Button size="sm" onClick={() => seed.mutate()} disabled={seed.isPending}>
                {seed.isPending ? <Loader2 className="animate-spin" /> : <CalendarCog />} Seed bhog days (Saptami → Dashami)
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setAdding(!adding)}>
              <Plus /> Add a day
            </Button>
          </span>
        )}
      </div>
      {isDurga && canEdit && days.length === 0 && (pujaDays?.days.length ?? 0) === 0 && (
        <p className="text-sm text-muted-foreground">
          No Puja Days for {event.year} yet — finalise the nirghanto and seed them first (Nirghanto page).
        </p>
      )}
      {seed.error && <p className="text-sm text-destructive">{seed.error.message}</p>}
      {adding && canEdit && (
        <DayForm
          season={season}
          eventId={event.id}
          defaults={{ label: kindLabel, date: event.startsOn }}
          onClose={() => setAdding(false)}
        />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {days.map((d) => (
          <DayCard key={d.id} season={season} day={d} canEdit={canEdit} />
        ))}
      </div>
    </section>
  )
}

function DayCard({ season, day, canEdit }: { season: number; day: BhogMenuView; canEdit: boolean }) {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['bhog', season] })
  const [editing, setEditing] = useState(false)
  const publish = useMutation({
    mutationFn: () => publishBhogDay(day.id, !day.isPublished),
    onSettled: invalidate,
  })
  const remove = useMutation({ mutationFn: () => deleteBhogDay(day.id), onSettled: invalidate })

  if (editing) return <DayForm season={season} eventId={day.eventId} initial={day} onClose={() => setEditing(false)} />

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

/** Create/edit one menu day: labels, date, cost, notes, dishes (one per line). */
function DayForm({
  season,
  eventId,
  initial,
  defaults,
  onClose,
}: {
  season: number
  eventId: BhogMenuView['eventId']
  initial?: BhogMenuView
  defaults?: { label: string; date: string }
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [label, setLabel] = useState(initial?.label ?? defaults?.label ?? '')
  const [labelBn, setLabelBn] = useState(initial?.labelBn ?? '')
  const [date, setDate] = useState(initial?.date ?? defaults?.date ?? '')
  const [cost, setCost] = useState(initial?.perPlateCost != null ? String(initial.perPlateCost) : '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [dishes, setDishes] = useState(
    (initial?.items ?? []).map((i) => (i.titleBn ? `${i.title} | ${i.titleBn}` : i.title)).join('\n'),
  )

  const save = useMutation({
    mutationFn: async () => {
      const input = {
        eventId,
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
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['bhog', season] }),
    onSuccess: onClose,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initial ? `Edit ${initial.label}` : 'New menu day'}</CardTitle>
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
