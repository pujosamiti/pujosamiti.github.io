import type { AdminTimetableInput, PujoEvent, TimeTableEntry } from '@pujosamiti/shared'
import { isCoreRole } from '@pujosamiti/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Check, Loader2, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { BackLink } from '@/components/BackLink'
import { Field, inputCls } from '@/components/form'
import { SearchSelect } from '@/components/SearchSelect'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { useMemberState } from '@/lib/member'
import { resyncPujaDays, seedPujaDays, setNirghantoFinalized, usePujaDays } from '@/lib/pujaDays'
import { useEvents } from '@/lib/tasks'
import { Seo } from '@/components/Seo'

/** Nirghanto editor (Durga Pujo only). Core members view; admins manage. */
export function Nirghanto() {
  const { memberState, memberPending, sessionPending } = useMemberState()
  const me = memberState?.status === 'member' ? memberState.me : null
  const [q, setQ] = useState('')

  const allowed = me && isCoreRole(me.role)
  const canEdit = me?.role === 'admin'
  const { data: events } = useEvents()

  if (sessionPending || memberPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    )
  }
  if (!allowed) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Core members only</CardTitle>
          <CardDescription>The nirghanto workspace is visible to core members.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Seo title="Nirghanto workspace" description="Durga Pujo nirghanto workspace." path="/nirghanto" noindex />
      <BackLink />
      <h1 className="text-2xl font-bold">Nirghanto</h1>
      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden="true" />
        <input
          className={`${inputCls} pl-8`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search rituals or days…"
        />
      </div>
      <NirghantoView events={events} q={q} canEdit={canEdit} />
    </div>
  )
}

function NirghantoView({ events, q, canEdit }: { events: PujoEvent[] | undefined; q: string; canEdit: boolean }) {
  const dpEvents = (events ?? []).filter((e) => e.kind === 'durga-pujo').sort((a, b) => b.year - a.year)
  const [eventId, setEventId] = useState<string | null>(null)
  const selected = dpEvents.find((e) => e.id === eventId) ?? dpEvents.find((e) => e.isActive) ?? dpEvents[0] ?? null
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const { data: entries, isPending } = useQuery({
    queryKey: ['timetable', selected?.id],
    queryFn: () => api<TimeTableEntry[]>(`/api/public/timetable?event=${selected!.id}`),
    enabled: !!selected,
  })

  if (!selected) return <p className="text-sm text-muted-foreground">No Durga Pujo events yet.</p>

  const needle = q.trim().toLowerCase()
  const shown = (entries ?? []).filter(
    (t) =>
      !needle ||
      t.titleEn.toLowerCase().includes(needle) ||
      t.titleBn.includes(q.trim()) ||
      t.dayLabelEn.toLowerCase().includes(needle) ||
      t.dayLabelBn.includes(q.trim()),
  )
  const groups: { key: string; rows: TimeTableEntry[] }[] = []
  for (const t of shown) {
    const key = `${t.dayDate}|${t.dayLabelEn}`
    const last = groups[groups.length - 1]
    if (last?.key === key) last.rows.push(t)
    else groups.push({ key, rows: [t] })
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <SearchSelect
          align="left"
          options={dpEvents.map((e) => ({
            value: e.id,
            label: `Durga Pujo ${e.year}`,
            hint: e.isActive ? 'Active' : undefined,
          }))}
          value={selected.id}
          onChange={(v) => setEventId(v)}
          ariaLabel="Durga Pujo year"
        />
        {canEdit && !adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus /> Add ritual
          </Button>
        )}
      </div>
      {canEdit && (
        <p className="text-sm text-muted-foreground">
          Purohit for the nirghanto header is set on the event (Events → edit Durga Pujo {selected.year}).
        </p>
      )}
      <PujaDaysPanel event={selected} isAdmin={canEdit} />

      {adding && <TimetableForm event={selected} entries={entries ?? []} onClose={() => setAdding(false)} />}
      {isPending ? (
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading" />
      ) : (
        groups.map(({ key, rows }) => (
          <div key={key} className="flex flex-col gap-2">
            <h2 className="font-serif text-base font-bold">
              {rows[0].dayLabelBn} · {rows[0].dayLabelEn}{' '}
              <span className="font-sans text-sm font-normal text-muted-foreground">{rows[0].dayDate}</span>
            </h2>
            {rows.map((t) =>
              editingId === t.id ? (
                <TimetableForm
                  key={t.id}
                  event={selected}
                  entry={t}
                  entries={entries ?? []}
                  onClose={() => setEditingId(null)}
                />
              ) : (
                <TimetableRow key={t.id} entry={t} canEdit={canEdit} onEdit={() => setEditingId(t.id)} />
              ),
            )}
          </div>
        ))
      )}
      {!isPending && !shown.length && (
        <p className="text-sm text-muted-foreground">{q ? 'No matches.' : 'No rituals yet.'}</p>
      )}
    </section>
  )
}

function TimetableRow({ entry: t, canEdit, onEdit }: { entry: TimeTableEntry; canEdit: boolean; onEdit: () => void }) {
  const queryClient = useQueryClient()
  const remove = useMutation({
    mutationFn: () => api(`/api/admin/timetable/${t.id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries(),
  })
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
      <span className="min-w-0">
        <span className="font-medium">{t.titleBn}</span>{' '}
        <span className="text-muted-foreground">{t.titleEn}</span>
        <span className="ml-2 text-matir">
          {t.timeFrom ? (t.timeTo ? `${t.timeFrom}–${t.timeTo}` : t.timeFrom) : 'time TBD'}
        </span>
        {t.comments && <span className="text-muted-foreground"> · {t.comments}</span>}
        {t.alertNote && <span className="font-medium text-jaba"> · {t.alertNote}</span>}
      </span>
      {canEdit && (
        <span className="flex shrink-0 gap-1">
          <Button size="sm" variant="ghost" onClick={onEdit} aria-label={`Edit ${t.titleEn}`}>
            <Pencil />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (confirm(`Delete "${t.titleEn}"?`)) remove.mutate()
            }}
            disabled={remove.isPending}
            aria-label={`Delete ${t.titleEn}`}
          >
            <Trash2 className="text-destructive" />
          </Button>
        </span>
      )}
    </div>
  )
}

function TimetableForm({
  event,
  entry,
  entries,
  onClose,
}: {
  event: PujoEvent
  entry?: TimeTableEntry
  entries: TimeTableEntry[]
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const lastDay = entries[entries.length - 1]
  const [form, setForm] = useState<AdminTimetableInput>({
    eventId: event.id,
    dayDate: entry?.dayDate ?? lastDay?.dayDate ?? event.startsOn,
    dayLabelBn: entry?.dayLabelBn ?? lastDay?.dayLabelBn ?? '',
    dayLabelEn: entry?.dayLabelEn ?? lastDay?.dayLabelEn ?? '',
    titleBn: entry?.titleBn ?? '',
    titleEn: entry?.titleEn ?? '',
    timeFrom: entry?.timeFrom ?? null,
    timeTo: entry?.timeTo ?? null,
    comments: entry?.comments ?? null,
    alertNote: entry?.alertNote ?? null,
    sortOrder: entry?.sortOrder ?? (lastDay?.sortOrder ?? 0) + 1,
  })
  const [error, setError] = useState<string | null>(null)
  const set = (patch: Partial<AdminTimetableInput>) => setForm((prev) => ({ ...prev, ...patch }))
  const dayOptions = [...new Map(entries.map((t) => [t.dayDate, t])).values()]

  const save = useMutation({
    mutationFn: () =>
      api(entry ? `/api/admin/timetable/${entry.id}` : '/api/admin/timetable', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries()
      onClose()
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'failed'),
  })

  return (
    <Card>
      <CardContent className="pt-4">
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            save.mutate()
          }}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Day date *">
              <input
                type="date"
                className={inputCls}
                value={form.dayDate}
                onChange={(e) => {
                  const known = dayOptions.find((d) => d.dayDate === e.target.value)
                  set({
                    dayDate: e.target.value,
                    ...(known ? { dayLabelBn: known.dayLabelBn, dayLabelEn: known.dayLabelEn } : {}),
                  })
                }}
                required
              />
            </Field>
            <Field label="Day (Bengali) *">
              <input
                className={inputCls}
                value={form.dayLabelBn}
                onChange={(e) => set({ dayLabelBn: e.target.value })}
                placeholder="মহা ষষ্ঠী"
                required
              />
            </Field>
            <Field label="Day (English) *">
              <input
                className={inputCls}
                value={form.dayLabelEn}
                onChange={(e) => set({ dayLabelEn: e.target.value })}
                placeholder="Maha Shashthi"
                required
              />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Ritual (Bengali) *">
              <input
                className={inputCls}
                value={form.titleBn}
                onChange={(e) => set({ titleBn: e.target.value })}
                placeholder="ষষ্ঠী পূজা"
                required
              />
            </Field>
            <Field label="Ritual (English) *">
              <input
                className={inputCls}
                value={form.titleEn}
                onChange={(e) => set({ titleEn: e.target.value })}
                placeholder="Shashthi Puja"
                required
              />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="From">
              <input
                type="time"
                className={inputCls}
                value={form.timeFrom ?? ''}
                onChange={(e) => set({ timeFrom: e.target.value || null })}
              />
            </Field>
            <Field label="To">
              <input
                type="time"
                className={inputCls}
                value={form.timeTo ?? ''}
                onChange={(e) => set({ timeTo: e.target.value || null })}
              />
            </Field>
            <Field label="Sort order">
              <input
                type="number"
                className={inputCls}
                value={form.sortOrder}
                onChange={(e) => set({ sortOrder: Number(e.target.value) })}
              />
            </Field>
          </div>
          <Field label="Comments (panchang notes)">
            <input
              className={inputCls}
              value={form.comments ?? ''}
              onChange={(e) => set({ comments: e.target.value || null })}
              placeholder="e.g. Shashthi ends at 10:43 AM"
            />
          </Field>
          <Field label="Note in red (a departure from the printed nirghanto)">
            <input
              className={inputCls}
              value={form.alertNote ?? ''}
              onChange={(e) => set({ alertNote: e.target.value || null })}
              placeholder="e.g. combined with the morning puja; no separate puja at night"
            />
          </Field>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />} Save
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onClose} disabled={save.isPending}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

/**
 * Days of the Pujo — the admin workflow that turns a finalised nirghanto into
 * the canonical per-year calendar every day-scoped feature uses.
 */
function PujaDaysPanel({ event, isAdmin }: { event: PujoEvent; isAdmin: boolean }) {
  const queryClient = useQueryClient()
  const { data } = usePujaDays(event.year)
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['puja-days', event.year] })
  const finalizeMut = useMutation({
    mutationFn: (finalized: boolean) => setNirghantoFinalized(event.id, finalized),
    onSettled: invalidate,
  })
  const seedMut = useMutation({ mutationFn: () => seedPujaDays(event.id), onSettled: invalidate })
  const resyncMut = useMutation({ mutationFn: () => resyncPujaDays(event.id), onSettled: invalidate })
  if (!data) return null
  const err = finalizeMut.error ?? seedMut.error ?? resyncMut.error

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <CalendarDays className="size-5 text-primary" aria-hidden="true" /> Days of the Pujo
          <Badge variant={data.finalizedOn ? 'durba' : 'outline'}>
            {data.finalizedOn ? `Nirghanto finalised ${data.finalizedOn}` : 'Nirghanto draft'}
          </Badge>
        </CardTitle>
        <CardDescription>
          The canonical calendar (Panchami → Dashami) that procurement, bhog menu, RSVP, coupons and
          ritual volunteers all build on. An admin finalises the nirghanto, then seeds these days from it.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {data.days.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {data.days.map((d) => (
              <Badge key={d.id} variant="outline">
                {d.labelEn} · {d.date}
              </Badge>
            ))}
          </div>
        )}
        {data.days.length === 0 && data.finalizedOn && (
          <p className="text-sm text-muted-foreground">Not seeded yet.</p>
        )}
        {!data.inSync && (
          <p className="text-sm text-shiuli">
            The nirghanto changed after these days were seeded — re-sync to update dates and labels.
          </p>
        )}
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            {!data.finalizedOn ? (
              <>
                <Button
                  size="sm"
                  onClick={() => finalizeMut.mutate(true)}
                  disabled={finalizeMut.isPending || !data.hasNirghanto}
                >
                  {finalizeMut.isPending ? <Loader2 className="animate-spin" /> : <Check />} Finalise nirghanto
                </Button>
                {!data.hasNirghanto && (
                  <p className="text-xs text-muted-foreground">Build the timetable first.</p>
                )}
              </>
            ) : (
              <>
                {data.days.length === 0 && (
                  <Button size="sm" onClick={() => seedMut.mutate()} disabled={seedMut.isPending}>
                    {seedMut.isPending ? <Loader2 className="animate-spin" /> : <Plus />} Seed Puja Days
                  </Button>
                )}
                {!data.inSync && (
                  <Button size="sm" variant="outline" onClick={() => resyncMut.mutate()} disabled={resyncMut.isPending}>
                    <RefreshCw /> Re-sync from nirghanto
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => finalizeMut.mutate(false)} disabled={finalizeMut.isPending}>
                  Reopen nirghanto
                </Button>
              </>
            )}
          </div>
        )}
        {err && <p className="text-sm text-destructive">{err.message}</p>}
      </CardContent>
    </Card>
  )
}
