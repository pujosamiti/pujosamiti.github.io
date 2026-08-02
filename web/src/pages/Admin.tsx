import type {
  AdminEventInput,
  AdminFamily,
  AdminFamilyInput,
  AdminPerson,
  AdminPersonInput,
  EventKind,
  FamilyTier,
  PujoEvent,
} from '@pujosamiti/shared'
import { EVENT_KINDS, LOCATION_OTHER, MAGARPATTA_SOCIETIES, MAGARPATTA_WORKPLACE_GROUPS } from '@pujosamiti/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Hourglass, Loader2, Pencil, Plus, Search, ShieldCheck, Trash2, Users } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Field, inputCls } from '@/components/form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { useMemberState } from '@/lib/member'

const TIERS: FamilyTier[] = ['non_member', 'member', 'core']
const TIER_LABEL: Record<FamilyTier, string> = {
  non_member: 'Non-member',
  member: 'Member',
  core: 'Core',
}

const post = (path: string, body: unknown) =>
  api(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })

/** Search across name, email, society/tower, detail, family — and digits against phone. */
function personMatches(p: AdminPerson, q: string): boolean {
  if (!q) return true
  const needle = q.toLowerCase()
  const haystacks = [
    p.displayName,
    p.email,
    p.society,
    p.workplace,
    p.residenceDetail,
    p.workplaceDetail,
    p.familyName,
    p.portfolio,
  ]
  if (haystacks.some((h) => h?.toLowerCase().includes(needle))) return true
  const digits = q.replace(/\D/g, '')
  return digits.length >= 3 && !!p.phone?.replace(/\D/g, '').includes(digits)
}

type View = 'members' | 'pending' | 'families' | 'events'

export function Admin() {
  const { memberState, memberPending, sessionPending } = useMemberState()
  const me = memberState?.status === 'member' ? memberState.me : null
  const [view, setView] = useState<View>('members')
  const [q, setQ] = useState('')

  const { data: people, isPending: peoplePending, error } = useQuery({
    queryKey: ['admin-people'],
    queryFn: () => api<AdminPerson[]>('/api/admin/people'),
    enabled: me?.role === 'admin',
  })
  const { data: families } = useQuery({
    queryKey: ['admin-families'],
    queryFn: () => api<AdminFamily[]>('/api/admin/families'),
    enabled: me?.role === 'admin',
  })
  const { data: events } = useQuery({
    queryKey: ['admin-events'],
    queryFn: () => api<PujoEvent[]>('/api/admin/events'),
    enabled: me?.role === 'admin',
  })

  const members = useMemo(() => people?.filter((p) => p.tier !== 'non_member') ?? [], [people])
  const pending = useMemo(() => people?.filter((p) => p.tier === 'non_member') ?? [], [people])

  if (sessionPending || memberPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    )
  }
  if (me?.role !== 'admin') {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Admins only</CardTitle>
          <CardDescription>This area is for samiti admins.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const tabs: { key: View; label: string; icon: typeof Users; count: number }[] = [
    { key: 'members', label: 'Members', icon: ShieldCheck, count: members.length },
    { key: 'pending', label: 'Pending activation', icon: Hourglass, count: pending.length },
    { key: 'families', label: 'Families', icon: Users, count: families?.length ?? 0 },
    { key: 'events', label: 'Events', icon: CalendarDays, count: events?.length ?? 0 },
  ]

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Membership admin</h1>

      <div className="flex flex-wrap gap-2">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <Button
            key={key}
            size="sm"
            variant={view === key ? 'default' : 'outline'}
            onClick={() => { setView(key); setQ('') }}
          >
            <Icon /> {label} ({count})
          </Button>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden="true" />
        <input
          className={`${inputCls} pl-8`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={
            view === 'families'
              ? 'Search families by name or notes…'
              : view === 'events'
                ? 'Search events by name, kind or year…'
                : 'Search by name, society, email or WhatsApp number…'
          }
        />
      </div>

      {error && <p className="text-sm text-destructive">Failed to load: {error.message}</p>}

      {view === 'events' ? (
        <EventsView events={events} q={q} />
      ) : view === 'families' ? (
        <FamiliesView families={families} q={q} />
      ) : (
        <PeopleView
          people={view === 'members' ? members : pending}
          q={q}
          families={families ?? []}
          loading={peoplePending}
          emptyText={view === 'members' ? 'No members yet.' : 'Nobody is waiting for activation.'}
          allowAdd={view === 'members'}
        />
      )}
    </div>
  )
}

function PeopleView({
  people,
  q,
  families,
  loading,
  emptyText,
  allowAdd,
}: {
  people: AdminPerson[]
  q: string
  families: AdminFamily[]
  loading: boolean
  emptyText: string
  allowAdd: boolean
}) {
  const [adding, setAdding] = useState(false)
  const shown = people.filter((p) => personMatches(p, q.trim()))

  if (loading) return <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading" />

  return (
    <section className="flex flex-col gap-3">
      {allowAdd &&
        (adding ? (
          <PersonForm families={families} onClose={() => setAdding(false)} />
        ) : (
          <Button size="sm" className="self-start" onClick={() => setAdding(true)}>
            <Plus /> Add person
          </Button>
        ))}
      {shown.map((p) => (
        <PersonCard key={p.id} person={p} families={families} />
      ))}
      {!shown.length && (
        <p className="text-sm text-muted-foreground">{q ? 'No matches.' : emptyText}</p>
      )}
    </section>
  )
}

function PersonCard({ person: p, families }: { person: AdminPerson; families: AdminFamily[] }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const setTier = useMutation({
    mutationFn: (tier: FamilyTier) => post(`/api/admin/people/${p.id}/tier`, { tier }),
    onSuccess: () => queryClient.invalidateQueries(),
  })
  const remove = useMutation({
    mutationFn: () => api(`/api/admin/people/${p.id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries(),
  })

  if (editing) return <PersonForm person={p} families={families} onClose={() => setEditing(false)} />

  const where =
    p.eligibility === 'by_invitation'
      ? ['by invitation']
      : p.eligibility === 'resident'
        ? [p.society, p.residenceDetail]
        : [p.workplace, p.workplaceDetail]

  return (
    <Card className={p.isActive ? undefined : 'opacity-60'}>
      <CardContent className="flex flex-col gap-2 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium">
              {p.displayName}
              {p.isAdmin && (
                <Badge variant="outline" className="ml-1 align-middle">
                  admin
                </Badge>
              )}
              {p.portfolio && (
                <Badge variant="genda" className="ml-1 align-middle">
                  {p.portfolio}
                </Badge>
              )}
              {!p.isActive && (
                <Badge variant="outline" className="ml-1 align-middle">
                  inactive
                </Badge>
              )}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {[p.email ?? 'no login', where.filter(Boolean).join(' '), p.phone, p.familyName && `family: ${p.familyName}`]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {TIERS.map((t) => (
              <Button
                key={t}
                size="sm"
                variant={p.tier === t ? (t === 'core' ? 'default' : 'secondary') : 'outline'}
                onClick={() => p.tier !== t && setTier.mutate(t)}
                disabled={setTier.isPending}
              >
                {TIER_LABEL[t]}
              </Button>
            ))}
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)} aria-label={`Edit ${p.displayName}`}>
              <Pencil />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (confirm(`Remove ${p.displayName}?`)) remove.mutate()
              }}
              disabled={remove.isPending}
              aria-label={`Remove ${p.displayName}`}
            >
              <Trash2 className="text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PersonForm({
  person,
  families,
  onClose,
}: {
  person?: AdminPerson
  families: AdminFamily[]
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<AdminPersonInput>({
    familyId: person?.familyId ?? null,
    displayName: person?.displayName ?? '',
    email: person?.email ?? null,
    society: person?.society ?? null,
    residenceDetail: person?.residenceDetail ?? null,
    workplace: person?.workplace ?? null,
    workplaceDetail: person?.workplaceDetail ?? null,
    eligibility: person?.eligibility ?? 'resident',
    phone: person?.phone ?? null,
    gender: person?.gender ?? null,
    isAdmin: person?.isAdmin ?? false,
    isActive: person?.isActive ?? true,
    portfolio: person?.portfolio ?? null,
    notes: person?.notes ?? null,
  })
  const [error, setError] = useState<string | null>(null)
  const save = useMutation({
    mutationFn: () => (person ? post(`/api/admin/people/${person.id}`, form) : post('/api/admin/people', form)),
    onSuccess: async () => {
      await queryClient.invalidateQueries()
      onClose()
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'failed'),
  })
  const set = (patch: Partial<AdminPersonInput>) => setForm((prev) => ({ ...prev, ...patch }))

  const resident = form.eligibility === 'resident'
  const invited = form.eligibility === 'by_invitation'
  const location = resident ? form.society : form.workplace
  const knownLocation =
    !location ||
    (resident
      ? (MAGARPATTA_SOCIETIES as readonly string[]).includes(location)
      : MAGARPATTA_WORKPLACE_GROUPS.some((g) => (g.options as readonly string[]).includes(location)))

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
            <Field label="Name *">
              <input className={inputCls} value={form.displayName} onChange={(e) => set({ displayName: e.target.value })} required />
            </Field>
            <Field label="Email (empty = no site login)">
              <input className={inputCls} type="email" value={form.email ?? ''} onChange={(e) => set({ email: e.target.value || null })} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Eligibility">
              <select
                className={inputCls}
                value={form.eligibility}
                onChange={(e) => set({ eligibility: e.target.value as AdminPersonInput['eligibility'] })}
              >
                <option value="resident">Resident</option>
                <option value="works_in_mgp">Works in Magarpatta</option>
                <option value="by_invitation">By invitation</option>
              </select>
            </Field>
            <Field label="Family (optional group)">
              <select className={inputCls} value={form.familyId ?? ''} onChange={(e) => set({ familyId: e.target.value || null })}>
                <option value="">—</option>
                {families.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          {!invited && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={resident ? 'Society' : 'Tower / building'}>
                  <select
                    className={inputCls}
                    value={knownLocation ? (location ?? '') : LOCATION_OTHER}
                    onChange={(e) => {
                      const v = e.target.value === LOCATION_OTHER ? '' : e.target.value || null
                      set(resident ? { society: v } : { workplace: v })
                    }}
                  >
                    <option value="">—</option>
                    {resident
                      ? MAGARPATTA_SOCIETIES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))
                      : MAGARPATTA_WORKPLACE_GROUPS.map((g) => (
                          <optgroup key={g.group} label={g.group}>
                            {g.options.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                    <option value={LOCATION_OTHER}>{LOCATION_OTHER}</option>
                  </select>
                </Field>
                <Field label={resident ? 'Flat number' : 'Office / company'}>
                  <input
                    className={inputCls}
                    value={(resident ? form.residenceDetail : form.workplaceDetail) ?? ''}
                    onChange={(e) =>
                      set(resident ? { residenceDetail: e.target.value || null } : { workplaceDetail: e.target.value || null })
                    }
                    placeholder={resident ? 'e.g. A-302' : undefined}
                  />
                </Field>
              </div>
              {!knownLocation && (
                <Field label={resident ? 'Society name' : 'Building name'}>
                  <input
                    className={inputCls}
                    value={location ?? ''}
                    onChange={(e) => set(resident ? { society: e.target.value || null } : { workplace: e.target.value || null })}
                  />
                </Field>
              )}
            </>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="WhatsApp number">
              <input className={inputCls} value={form.phone ?? ''} onChange={(e) => set({ phone: e.target.value || null })} inputMode="tel" />
            </Field>
            <Field label="Gender">
              <select className={inputCls} value={form.gender ?? ''} onChange={(e) => set({ gender: e.target.value || null })}>
                <option value="">—</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Portfolio (e.g. Treasurer)">
              <input className={inputCls} value={form.portfolio ?? ''} onChange={(e) => set({ portfolio: e.target.value || null })} />
            </Field>
            <Field label="Notes">
              <input className={inputCls} value={form.notes ?? ''} onChange={(e) => set({ notes: e.target.value || null })} />
            </Field>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isAdmin} onChange={(e) => set({ isAdmin: e.target.checked })} />
              Admin (can manage membership)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={(e) => set({ isActive: e.target.checked })} />
              Active
            </label>
          </div>
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

function FamiliesView({ families, q }: { families: AdminFamily[] | undefined; q: string }) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const needle = q.trim().toLowerCase()
  const shown = (families ?? []).filter(
    (f) => !needle || f.name.toLowerCase().includes(needle) || f.notes?.toLowerCase().includes(needle),
  )

  return (
    <section className="flex flex-col gap-3">
      {adding ? (
        <FamilyForm onClose={() => setAdding(false)} />
      ) : (
        <Button size="sm" variant="outline" className="self-start" onClick={() => setAdding(true)}>
          <Plus /> Add family
        </Button>
      )}
      {shown.map((f) =>
        editingId === f.id ? (
          <FamilyForm key={f.id} family={f} onClose={() => setEditingId(null)} />
        ) : (
          <Card key={f.id} className={f.isActive ? undefined : 'opacity-60'}>
            <CardContent className="flex items-center justify-between gap-2 pt-4">
              <p className="text-sm">
                <span className="font-medium">{f.name}</span>
                {f.notes && <span className="text-muted-foreground"> · {f.notes}</span>}
              </p>
              <Button size="sm" variant="ghost" onClick={() => setEditingId(f.id)} aria-label={`Edit ${f.name}`}>
                <Pencil />
              </Button>
            </CardContent>
          </Card>
        ),
      )}
      {!shown.length && <p className="text-sm text-muted-foreground">{q ? 'No matches.' : 'No families yet.'}</p>}
    </section>
  )
}

function FamilyForm({ family, onClose }: { family?: AdminFamily; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<AdminFamilyInput>({
    name: family?.name ?? '',
    notes: family?.notes ?? null,
    isActive: family?.isActive ?? true,
  })
  const [error, setError] = useState<string | null>(null)
  const save = useMutation({
    mutationFn: () => (family ? post(`/api/admin/families/${family.id}`, form) : post('/api/admin/families', form)),
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
            <Field label="Family name *">
              <input
                className={inputCls}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </Field>
            <Field label="Notes">
              <input
                className={inputCls}
                value={form.notes ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value || null }))}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
            />
            Active
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


const KIND_NAMES: Record<EventKind, { bn: string; en: string }> = {
  'durga-pujo': { bn: 'দুর্গাপূজা', en: 'Durga Pujo' },
  'kojagari-lakshmi-pujo': { bn: 'কোজাগরী লক্ষ্মীপূজা', en: 'Kojagari Lakshmi Puja' },
  'bijoya-sammelani': { bn: 'বিজয়া সম্মিলনী', en: 'Bijoya Sammelani' },
  'saraswati-pujo': { bn: 'সরস্বতী পূজা', en: 'Saraswati Puja' },
  'poila-baishakh': { bn: 'পয়লা বৈশাখ', en: 'Poila Baishakh' },
}

function EventsView({ events, q }: { events: PujoEvent[] | undefined; q: string }) {
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
      {adding ? (
        <EventForm onClose={() => setAdding(false)} />
      ) : (
        <Button size="sm" className="self-start" onClick={() => setAdding(true)}>
          <Plus /> Add event
        </Button>
      )}
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
                  {e.isActive && (
                    <Badge className="ml-2 align-middle">active</Badge>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {e.startsOn === e.endsOn ? e.startsOn : `${e.startsOn} → ${e.endsOn}`} · {e.id}
                </p>
              </div>
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
