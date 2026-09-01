import type { AdminFamily, AdminFamilyInput, AdminPerson, AdminPersonInput, FamilyTier } from '@pujosamiti/shared'
import { isCoreRole, openMembershipActive } from '@pujosamiti/shared'
import { LOCATION_OTHER, MAGARPATTA_SOCIETIES, MAGARPATTA_WORKPLACE_GROUPS } from '@pujosamiti/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { GitMerge, Hourglass, Loader2, Pencil, Plus, Search, ShieldCheck, Trash2, UserMinus, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Field, inputCls } from '@/components/form'
import { LogoSpinner } from '@/components/LogoSpinner'
import { BackLink } from '@/components/BackLink'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { useMemberState } from '@/lib/member'
import { Seo } from '@/components/Seo'

const TIERS: FamilyTier[] = ['non_member', 'member', 'core']
const TIER_LABEL: Record<FamilyTier, string> = {
  non_member: 'Non-member',
  member: 'Member',
  core: 'Core',
}

const post = (path: string, body: unknown) =>
  api(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })

type View = 'members' | 'pending' | 'exmembers' | 'families'

/** Membership roll. Core members view; admins manage. */
export function Membership() {
  const { memberState, memberPending, sessionPending } = useMemberState()
  const me = memberState?.status === 'member' ? memberState.me : null
  const [view, setView] = useState<View>('members')
  const [q, setQ] = useState('')
  const [dq, setDq] = useState('') // debounced — search runs server-side

  useEffect(() => {
    const t = setTimeout(() => setDq(q.trim()), 300)
    return () => clearTimeout(t)
  }, [q])

  const allowed = me && isCoreRole(me.role)
  const canEdit = me?.role === 'admin'

  const { data: people, isPending: peoplePending, error } = useQuery({
    queryKey: ['admin-people', view === 'families' ? '' : dq],
    queryFn: () => api<AdminPerson[]>(`/api/admin/people?q=${encodeURIComponent(view === 'families' ? '' : dq)}`),
    enabled: !!allowed,
  })
  const { data: families } = useQuery({
    queryKey: ['admin-families'],
    queryFn: () => api<AdminFamily[]>('/api/admin/families'),
    enabled: !!allowed,
  })

  const members = useMemo(() => people?.filter((p) => p.tier !== 'non_member') ?? [], [people])
  // Someone who registered themselves and is waiting for an admin — as opposed
  // to the long tail of non-member names carried on the samiti's own rolls.
  const pending = useMemo(
    () => people?.filter((p) => p.tier === 'non_member' && p.origin === 'self') ?? [],
    [people],
  )
  const exMembers = useMemo(
    () => people?.filter((p) => p.tier === 'non_member' && p.origin !== 'self') ?? [],
    [people],
  )

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
          <CardDescription>The membership roll is visible to core members.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const tabs: { key: View; label: string; icon: typeof Users; count: number }[] = [
    { key: 'members', label: 'Members', icon: ShieldCheck, count: members.length },
    { key: 'pending', label: 'Pending activation', icon: Hourglass, count: pending.length },
    { key: 'exmembers', label: 'Ex-members', icon: UserMinus, count: exMembers.length },
    { key: 'families', label: 'Families', icon: Users, count: families?.length ?? 0 },
  ]

  return (
    <div className="flex flex-col gap-4">
      <Seo title="Membership" description="Samiti membership register." path="/membership" noindex />
      <BackLink />
      <h1 className="text-2xl font-bold">Membership</h1>

      {openMembershipActive() && (
        <p className="rounded-md bg-accent px-3 py-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Open membership until 30 Oct 2026</span> — everyone
          who signs in and completes their profile gets in as a <span className="font-medium text-foreground">new
          sign-in</span>: view access plus their headcount, nothing else. They land under Pending
          activation; setting a tier here upgrades them instantly, and the un-activated lose access when
          the window closes.
        </p>
      )}

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
              : 'Search by name, society, email or WhatsApp number…'
          }
        />
      </div>

      {error && <p className="text-sm text-destructive">Failed to load: {error.message}</p>}

      {view === 'families' ? (
        <FamiliesView families={families} q={q} canEdit={canEdit} />
      ) : (
        <PeopleView
          people={view === 'members' ? members : view === 'exmembers' ? exMembers : pending}
          q={q}
          families={families ?? []}
          loading={peoplePending}
          emptyText={
            view === 'members'
              ? 'No members yet.'
              : view === 'exmembers'
                ? 'Nobody on the rolls outside the membership.'
                : 'Nobody is waiting for activation.'
          }
          allowAdd={canEdit && view === 'members'}
          canEdit={canEdit}
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
  canEdit,
}: {
  people: AdminPerson[]
  q: string
  families: AdminFamily[]
  loading: boolean
  emptyText: string
  allowAdd: boolean
  canEdit: boolean
}) {
  const [adding, setAdding] = useState(false)
  const shown = people // search happens server-side

  if (loading) return <LogoSpinner small />

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
        <PersonCard key={p.id} person={p} families={families} canEdit={canEdit} />
      ))}
      {!shown.length && (
        <p className="text-sm text-muted-foreground">{q ? 'No matches.' : emptyText}</p>
      )}
    </section>
  )
}

function PersonCard({ person: p, families, canEdit }: { person: AdminPerson; families: AdminFamily[]; canEdit: boolean }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [merging, setMerging] = useState(false)
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
              {!p.isAdmin && p.isFinAdmin && (
                <Badge variant="outline" className="ml-1 align-middle">
                  finance
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
            {canEdit && (
              <p className="truncate text-sm text-muted-foreground">
                {[p.email ?? 'no login', p.altEmail, where.filter(Boolean).join(' '), p.phone, p.familyName && `family: ${p.familyName}`]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {canEdit ? (
              <>
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
                  onClick={() => setMerging((v) => !v)}
                  aria-label={`Merge into ${p.displayName}`}
                  title="Merge a duplicate into this record"
                >
                  <GitMerge />
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
              </>
            ) : (
              <Badge variant={p.tier === 'core' ? 'default' : p.tier === 'member' ? 'aparajita' : 'outline'}>
                {TIER_LABEL[p.tier]}
              </Badge>
            )}
          </div>
        </div>
        {merging && <MergePanel survivor={p} onClose={() => setMerging(false)} />}
      </CardContent>
    </Card>
  )
}

/**
 * Merge a duplicate INTO this record: this record's id survives (existing
 * task assignments etc. keep working); the absorbed record's newer profile
 * data overrides, and the duplicate is deleted.
 */
function MergePanel({ survivor, onClose }: { survivor: AdminPerson; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [q, setQ] = useState('')
  const [dq, setDq] = useState('')
  const [source, setSource] = useState<AdminPerson | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDq(q.trim()), 300)
    return () => clearTimeout(t)
  }, [q])

  const { data: results } = useQuery({
    queryKey: ['admin-people', dq],
    queryFn: () => api<AdminPerson[]>(`/api/admin/people?q=${encodeURIComponent(dq)}`),
    enabled: !source && dq.length >= 2,
  })
  const options = (results ?? []).filter((x) => x.id !== survivor.id).slice(0, 8)

  const merge = useMutation({
    mutationFn: () => post(`/api/admin/people/${survivor.id}/merge`, { sourceId: source!.id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries()
      onClose()
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'failed'),
  })

  return (
    <div className="flex flex-col gap-2 rounded-md border border-genda bg-accent/50 p-3">
      <p className="text-sm">
        Merge a duplicate into <span className="font-medium">{survivor.displayName}</span> — this
        record (and its history) survives; the absorbed record's newer details override, and the
        duplicate is deleted.
      </p>
      {source ? (
        <p className="text-sm">
          Absorbing: <span className="font-medium">{source.displayName}</span>
          {source.email && <span className="text-muted-foreground"> · {source.email}</span>}{' '}
          <span className="text-muted-foreground">· {TIER_LABEL[source.tier]}</span>{' '}
          <button type="button" className="underline" onClick={() => setSource(null)}>
            change
          </button>
        </p>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden="true" />
            <input
              className={`${inputCls} pl-8`}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search the duplicate by name, email, society or number…"
            />
          </div>
          {options.length > 0 && (
            <ul className="flex flex-col gap-1">
              {options.map((x) => (
                <li key={x.id}>
                  <button
                    type="button"
                    onClick={() => setSource(x)}
                    className="w-full rounded-md border bg-card px-3 py-2 text-left text-sm hover:bg-accent"
                  >
                    <span className="font-medium">{x.displayName}</span>
                    {x.email && <span className="text-muted-foreground"> · {x.email}</span>}
                    <span className="text-muted-foreground"> · {TIER_LABEL[x.tier]}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {dq.length >= 2 && results && !options.length && (
            <p className="text-sm text-muted-foreground">No matches.</p>
          )}
        </>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={!source || merge.isPending}
          onClick={() => {
            if (source && confirm(`Merge "${source.displayName}" into "${survivor.displayName}"? The duplicate will be deleted.`))
              merge.mutate()
          }}
        >
          {merge.isPending && <Loader2 className="animate-spin" />} <GitMerge /> Merge
        </Button>
        <Button size="sm" variant="outline" onClick={onClose} disabled={merge.isPending}>
          Cancel
        </Button>
      </div>
    </div>
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
    altEmail: person?.altEmail ?? null,
    society: person?.society ?? null,
    residenceDetail: person?.residenceDetail ?? null,
    workplace: person?.workplace ?? null,
    workplaceDetail: person?.workplaceDetail ?? null,
    eligibility: person?.eligibility ?? 'resident',
    phone: person?.phone ?? null,
    gender: person?.gender ?? null,
    isAdmin: person?.isAdmin ?? false,
    isFinAdmin: person?.isFinAdmin ?? false,
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
              <input className={inputCls} type="email" value={form.email ?? ''} onChange={(e) => set({ email: e.target.value || null })} placeholder="masked for privacy — type a full address to change" />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Second email (if they sign in with either)">
              <input className={inputCls} type="email" value={form.altEmail ?? ''} onChange={(e) => set({ altEmail: e.target.value || null })} />
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
              <input
                type="checkbox"
                checked={form.isFinAdmin}
                onChange={(e) => set({ isFinAdmin: e.target.checked })}
                disabled={form.isAdmin}
              />
              Finance admin (ledger, budget, sponsorship pricing)
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

function FamiliesView({ families, q, canEdit }: { families: AdminFamily[] | undefined; q: string; canEdit: boolean }) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const needle = q.trim().toLowerCase()
  const shown = (families ?? []).filter(
    (f) => !needle || f.name.toLowerCase().includes(needle) || f.notes?.toLowerCase().includes(needle),
  )

  return (
    <section className="flex flex-col gap-3">
      {canEdit &&
        (adding ? (
          <FamilyForm onClose={() => setAdding(false)} />
        ) : (
          <Button size="sm" variant="outline" className="self-start" onClick={() => setAdding(true)}>
            <Plus /> Add family
          </Button>
        ))}
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
              {canEdit && (
                <Button size="sm" variant="ghost" onClick={() => setEditingId(f.id)} aria-label={`Edit ${f.name}`}>
                  <Pencil />
                </Button>
              )}
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
