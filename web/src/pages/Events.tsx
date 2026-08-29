import type { AdminEventInput, EventKind, PujoEvent } from '@pujosamiti/shared'
import { isCoreRole, EVENT_KINDS } from '@pujosamiti/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Field, inputCls } from '@/components/form'
import { LogoSpinner } from '@/components/LogoSpinner'
import { BackLink } from '@/components/BackLink'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { useMemberState } from '@/lib/member'
import { Seo } from '@/components/Seo'

const KIND_NAMES: Record<EventKind, { bn: string; en: string }> = {
  'durga-pujo': { bn: 'দুর্গাপূজা', en: 'Durga Pujo' },
  'kojagari-lakshmi-pujo': { bn: 'কোজাগরী লক্ষ্মীপূজা', en: 'Kojagari Lakshmi Puja' },
  'bijoya-sammelani': { bn: 'বিজয়া সম্মিলনী', en: 'Bijoya Sammelani' },
  'saraswati-pujo': { bn: 'সরস্বতী পূজা', en: 'Saraswati Puja' },
  'poila-baishakh': { bn: 'পয়লা বৈশাখ', en: 'Poila Baishakh' },
}

/** Events calendar. Core members view; admins manage. */
export function Events() {
  const { memberState, memberPending, sessionPending } = useMemberState()
  const me = memberState?.status === 'member' ? memberState.me : null
  const [q, setQ] = useState('')

  const allowed = me && isCoreRole(me.role)
  const canEdit = me?.role === 'admin'

  const { data: events, error } = useQuery({
    queryKey: ['admin-events'],
    queryFn: () => api<PujoEvent[]>('/api/admin/events'),
    enabled: !!allowed,
  })

  if (sessionPending || memberPending) {
    return (
      <div className="flex justify-center py-16">
        <LogoSpinner />
      </div>
    )
  }
  if (!allowed) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Core members only</CardTitle>
          <CardDescription>The events calendar is visible to core members.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Seo title="Events" description="The samiti events calendar." path="/events" noindex />
      <BackLink />
      <h1 className="text-2xl font-bold">Events</h1>
      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden="true" />
        <input
          className={`${inputCls} pl-8`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search events by name, kind or year…"
        />
      </div>
      {error && <p className="text-sm text-destructive">Failed to load: {error.message}</p>}
      <EventsView events={events} q={q} canEdit={canEdit} />
    </div>
  )
}

function EventsView({ events, q, canEdit }: { events: PujoEvent[] | undefined; q: string; canEdit: boolean }) {
  const queryClient = useQueryClient()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const remove = useMutation({
    mutationFn: (id: string) => api(`/api/admin/events/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries(),
  })
  const [removeError, setRemoveError] = useState<string | null>(null)
  const needle = q.trim().toLowerCase()
  const shown = (events ?? []).filter(
    (e) => !needle || e.nameEn.toLowerCase().includes(needle) || e.kind.includes(needle) || String(e.year).includes(needle),
  )

  return (
    <section className="flex flex-col gap-3">
      {canEdit &&
        (adding ? (
          <EventForm onClose={() => setAdding(false)} />
        ) : (
          <Button size="sm" className="self-start" onClick={() => setAdding(true)}>
            <Plus /> Add event
          </Button>
        ))}
      {removeError && <p className="text-sm text-destructive">{removeError}</p>}
      {shown.map((e) =>
        editingId === e.id ? (
          <EventForm key={e.id} event={e} onClose={() => setEditingId(null)} />
        ) : (
          <Card key={e.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-2 pt-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {e.nameBn} · {e.nameEn} {e.year}
                  {e.isActive && <Badge variant="palash" className="ml-2 align-middle">active</Badge>}
                </p>
                <p className="text-sm text-muted-foreground">
                  {e.startsOn === e.endsOn ? e.startsOn : `${e.startsOn} → ${e.endsOn}`} · {e.id}
                </p>
              </div>
              {canEdit && (
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(e.id)} aria-label={`Edit ${e.id}`}>
                    <Pencil />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Delete ${e.nameEn} ${e.year}?`)) {
                        setRemoveError(null)
                        remove.mutate(e.id, { onError: (err) => setRemoveError(err instanceof Error ? err.message : 'failed') })
                      }
                    }}
                    disabled={remove.isPending}
                    aria-label={`Delete ${e.id}`}
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ),
      )}
      {!shown.length && <p className="text-sm text-muted-foreground">{q ? 'No matches.' : 'No events.'}</p>}
    </section>
  )
}

function EventForm({ event, onClose }: { event?: PujoEvent; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<AdminEventInput>({
    kind: event?.kind ?? 'durga-pujo',
    year: event?.year ?? new Date().getFullYear() + 1,
    nameBn: event?.nameBn ?? KIND_NAMES['durga-pujo'].bn,
    nameEn: event?.nameEn ?? KIND_NAMES['durga-pujo'].en,
    startsOn: event?.startsOn ?? '',
    endsOn: event?.endsOn ?? '',
    isActive: event?.isActive ?? false,
    purohitName: event?.purohitName ?? null,
    purohitPhone: event?.purohitPhone ?? null,
    notes: event?.notes ?? null,
  })
  const [error, setError] = useState<string | null>(null)
  const set = (patch: Partial<AdminEventInput>) => setForm((prev) => ({ ...prev, ...patch }))
  const save = useMutation({
    mutationFn: () =>
      api(event ? `/api/admin/events/${event.id}` : '/api/admin/events', {
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
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={event ? 'Kind (fixed)' : 'Kind'}>
              <select
                className={inputCls}
                value={form.kind}
                disabled={!!event}
                onChange={(e) => {
                  const kind = e.target.value as EventKind
                  set({ kind, nameBn: KIND_NAMES[kind].bn, nameEn: KIND_NAMES[kind].en })
                }}
              >
                {EVENT_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {KIND_NAMES[k].en}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={event ? 'Year (fixed)' : 'Year'}>
              <input
                type="number"
                className={inputCls}
                value={form.year}
                disabled={!!event}
                onChange={(e) => set({ year: Number(e.target.value) })}
                required
              />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name (Bengali) *">
              <input className={inputCls} value={form.nameBn} onChange={(e) => set({ nameBn: e.target.value })} required />
            </Field>
            <Field label="Name (English) *">
              <input className={inputCls} value={form.nameEn} onChange={(e) => set({ nameEn: e.target.value })} required />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Starts on *">
              <input type="date" className={inputCls} value={form.startsOn} onChange={(e) => set({ startsOn: e.target.value })} required />
            </Field>
            <Field label="Ends on (empty = same day)">
              <input type="date" className={inputCls} value={form.endsOn} onChange={(e) => set({ endsOn: e.target.value })} />
            </Field>
          </div>
          {form.kind === 'durga-pujo' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Purohit name (nirghanto header)">
                <input className={inputCls} value={form.purohitName ?? ''} onChange={(e) => set({ purohitName: e.target.value || null })} />
              </Field>
              <Field label="Purohit phone">
                <input className={inputCls} value={form.purohitPhone ?? ''} onChange={(e) => set({ purohitPhone: e.target.value || null })} inputMode="tel" />
              </Field>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => set({ isActive: e.target.checked })} />
            Active (the current season's event)
          </label>
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
