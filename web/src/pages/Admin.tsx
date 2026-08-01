import type {
  AdminFamily,
  AdminFamilyUpdate,
  AdminPerson,
  AdminPersonInput,
  FamilyTier,
  JoinRequestView,
} from '@pujosamiti/shared'
import { LOCATION_OTHER, MAGARPATTA_SOCIETIES, MAGARPATTA_WORKPLACE_GROUPS } from '@pujosamiti/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Loader2, Pencil, Plus, ShieldCheck, Trash2, X } from 'lucide-react'
import { useState } from 'react'

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

export function Admin() {
  const { memberState, memberPending, sessionPending } = useMemberState()
  const me = memberState?.status === 'member' ? memberState.me : null

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
          <CardDescription>This area is for committee admins.</CardDescription>
        </CardHeader>
      </Card>
    )
  }
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-6 text-primary" aria-hidden="true" />
        <h1 className="text-2xl font-bold">Membership admin</h1>
      </div>
      <JoinRequests />
      <Families />
    </div>
  )
}

function JoinRequests() {
  const queryClient = useQueryClient()
  const { data: requests, isPending } = useQuery({
    queryKey: ['admin-join-requests'],
    queryFn: () => api<JoinRequestView[]>('/api/admin/join-requests'),
  })
  const decide = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      post(`/api/admin/join-requests/${id}/decide`, { action }),
    onSuccess: () => queryClient.invalidateQueries(),
  })

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Join requests</h2>
      {isPending ? (
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading" />
      ) : !requests?.length ? (
        <p className="text-sm text-muted-foreground">No pending requests.</p>
      ) : (
        requests.map((r) => (
          <Card key={r.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {r.displayName} <span className="text-muted-foreground">({r.email})</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  wants to join <span className="font-medium text-foreground">{r.familyName}</span>
                  {r.note && <> — “{r.note}”</>}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => decide.mutate({ id: r.id, action: 'approve' })} disabled={decide.isPending}>
                  <Check /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => decide.mutate({ id: r.id, action: 'reject' })}
                  disabled={decide.isPending}
                >
                  <X /> Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </section>
  )
}

function Families() {
  const { data: families, isPending } = useQuery({
    queryKey: ['admin-families'],
    queryFn: () => api<AdminFamily[]>('/api/admin/families'),
  })

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Families</h2>
      {isPending ? (
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading" />
      ) : (
        families?.map((f) => <FamilyCard key={f.id} family={f} />)
      )}
    </section>
  )
}

function FamilyCard({ family: f }: { family: AdminFamily }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [addingPerson, setAddingPerson] = useState(false)
  const setTier = useMutation({
    mutationFn: (tier: FamilyTier) => post(`/api/admin/families/${f.id}/tier`, { tier }),
    onSuccess: () => queryClient.invalidateQueries(),
  })

  return (
    <Card className={f.isActive ? undefined : 'opacity-60'}>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">
            {f.name}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {[f.society ?? f.workplace, f.residenceDetail ?? f.workplaceDetail].filter(Boolean).join(' · ')}
            </span>
            {!f.isActive && (
              <Badge variant="outline" className="ml-2 align-middle">
                inactive
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-1">
            {TIERS.map((t) => (
              <Button
                key={t}
                size="sm"
                variant={f.tier === t ? (t === 'core' ? 'default' : 'secondary') : 'outline'}
                onClick={() => f.tier !== t && setTier.mutate(t)}
                disabled={setTier.isPending}
              >
                {TIER_LABEL[t]}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {editing ? (
          <FamilyForm family={f} onClose={() => setEditing(false)} />
        ) : (
          <>
            {(f.phone || f.notes) && (
              <p className="text-sm text-muted-foreground">
                {[f.phone, f.notes].filter(Boolean).join(' · ')}
              </p>
            )}
            <ul className="flex flex-col gap-1">
              {f.people.map((p) => (
                <PersonRow key={p.id} person={p} />
              ))}
              {!f.people.length && <li className="text-sm text-muted-foreground">No people yet.</li>}
            </ul>
            {addingPerson ? (
              <PersonForm familyId={f.id} onClose={() => setAddingPerson(false)} />
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                  <Pencil /> Edit family
                </Button>
                <Button size="sm" variant="outline" onClick={() => setAddingPerson(true)}>
                  <Plus /> Add person
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function FamilyForm({ family: f, onClose }: { family: AdminFamily; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<AdminFamilyUpdate>({
    name: f.name,
    society: f.society,
    residenceDetail: f.residenceDetail,
    workplace: f.workplace,
    workplaceDetail: f.workplaceDetail,
    eligibility: f.eligibility,
    phone: f.phone,
    notes: f.notes,
    isActive: f.isActive,
  })
  const [error, setError] = useState<string | null>(null)
  const save = useMutation({
    mutationFn: () => post(`/api/admin/families/${f.id}`, form),
    onSuccess: async () => {
      await queryClient.invalidateQueries()
      onClose()
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'failed'),
  })
  const set = (patch: Partial<AdminFamilyUpdate>) => setForm((prev) => ({ ...prev, ...patch }))
  const resident = form.eligibility === 'resident'
  const location = resident ? form.society : form.workplace
  const knownLocation =
    !location ||
    (resident
      ? (MAGARPATTA_SOCIETIES as readonly string[]).includes(location)
      : MAGARPATTA_WORKPLACE_GROUPS.some((g) => (g.options as readonly string[]).includes(location)))

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        save.mutate()
      }}
    >
      <Field label="Family name *">
        <input className={inputCls} value={form.name} onChange={(e) => set({ name: e.target.value })} required />
      </Field>
      <Field label="Eligibility">
        <select
          className={inputCls}
          value={form.eligibility}
          onChange={(e) => set({ eligibility: e.target.value as AdminFamilyUpdate['eligibility'] })}
        >
          <option value="resident">Resident</option>
          <option value="works_in_mgp">Works in Magarpatta</option>
        </select>
      </Field>
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
      {!knownLocation && (
        <Field label={resident ? 'Society name' : 'Building name'}>
          <input
            className={inputCls}
            value={location ?? ''}
            onChange={(e) => set(resident ? { society: e.target.value || null } : { workplace: e.target.value || null })}
          />
        </Field>
      )}
      <Field label={resident ? 'Flat number' : 'Office / company'}>
        <input
          className={inputCls}
          value={(resident ? form.residenceDetail : form.workplaceDetail) ?? ''}
          onChange={(e) =>
            set(resident ? { residenceDetail: e.target.value || null } : { workplaceDetail: e.target.value || null })
          }
        />
      </Field>
      <Field label="Phone">
        <input className={inputCls} value={form.phone ?? ''} onChange={(e) => set({ phone: e.target.value || null })} inputMode="tel" />
      </Field>
      <Field label="Notes">
        <input className={inputCls} value={form.notes ?? ''} onChange={(e) => set({ notes: e.target.value || null })} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.isActive} onChange={(e) => set({ isActive: e.target.checked })} />
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
  )
}

function PersonRow({ person: p }: { person: AdminPerson }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const remove = useMutation({
    mutationFn: () => api(`/api/admin/people/${p.id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries(),
  })

  if (editing) return <PersonForm person={p} onClose={() => setEditing(false)} />

  return (
    <li className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
      <span className="min-w-0 truncate">
        <span className="font-medium">{p.displayName}</span>
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
        <span className="ml-2 text-muted-foreground">{p.email ?? 'no login'}</span>
      </span>
      <span className="flex shrink-0 gap-1">
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)} aria-label={`Edit ${p.displayName}`}>
          <Pencil />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            if (confirm(`Remove ${p.displayName} from this family?`)) remove.mutate()
          }}
          disabled={remove.isPending}
          aria-label={`Remove ${p.displayName}`}
        >
          <Trash2 className="text-destructive" />
        </Button>
      </span>
    </li>
  )
}

function PersonForm({
  person,
  familyId,
  onClose,
}: {
  person?: AdminPerson
  familyId?: string
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<AdminPersonInput>({
    displayName: person?.displayName ?? '',
    email: person?.email ?? null,
    phone: person?.phone ?? null,
    gender: person?.gender ?? null,
    isAdmin: person?.isAdmin ?? false,
    portfolio: person?.portfolio ?? null,
    notes: person?.notes ?? null,
  })
  const [error, setError] = useState<string | null>(null)
  const save = useMutation({
    mutationFn: () =>
      person ? post(`/api/admin/people/${person.id}`, form) : post(`/api/admin/families/${familyId}/people`, form),
    onSuccess: async () => {
      await queryClient.invalidateQueries()
      onClose()
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'failed'),
  })
  const set = (patch: Partial<AdminPersonInput>) => setForm((prev) => ({ ...prev, ...patch }))

  return (
    <form
      className="flex flex-col gap-3 rounded-md border p-3"
      onSubmit={(e) => {
        e.preventDefault()
        save.mutate()
      }}
    >
      <Field label="Name *">
        <input className={inputCls} value={form.displayName} onChange={(e) => set({ displayName: e.target.value })} required />
      </Field>
      <Field label="Email (empty = member without site login)">
        <input
          className={inputCls}
          type="email"
          value={form.email ?? ''}
          onChange={(e) => set({ email: e.target.value || null })}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Phone">
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
      <Field label="Portfolio (e.g. Treasurer)">
        <input className={inputCls} value={form.portfolio ?? ''} onChange={(e) => set({ portfolio: e.target.value || null })} />
      </Field>
      <Field label="Notes">
        <input className={inputCls} value={form.notes ?? ''} onChange={(e) => set({ notes: e.target.value || null })} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.isAdmin} onChange={(e) => set({ isAdmin: e.target.checked })} />
        Committee admin (can manage membership)
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
  )
}
