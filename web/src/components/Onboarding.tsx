import {
  LOCATION_OTHER,
  MAGARPATTA_SOCIETIES,
  MAGARPATTA_WORKPLACE_GROUPS,
  type CreateFamilyInput,
  type FamilyEligibility,
  type FamilySearchResult,
} from '@pujosamiti/shared'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Search, UserPlus, Users } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createFamily, requestToJoin, searchFamilies } from '@/lib/onboarding'

const inputCls =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  )
}

/** First sign-in funnel: create a new family, or request to join an existing one. */
export function Onboarding({ email }: { email: string }) {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')

  if (mode === 'create') return <CreateFamilyForm onBack={() => setMode('choose')} />
  if (mode === 'join') return <JoinFamilyForm onBack={() => setMode('choose')} />

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome! Let's get you set up</CardTitle>
        <CardDescription>
          You're signed in as <span className="font-medium">{email}</span>, but you're not on the
          samiti rolls yet. Membership is by family — pick what fits:
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Button onClick={() => setMode('create')} className="justify-start">
          <UserPlus /> Register my family (new to the samiti)
        </Button>
        <Button variant="outline" onClick={() => setMode('join')} className="justify-start">
          <Users /> My family is already registered — add me to it
        </Button>
        <p className="text-xs text-muted-foreground">
          Either way, a committee admin confirms membership before member content unlocks.
        </p>
      </CardContent>
    </Card>
  )
}

function CreateFamilyForm({ onBack }: { onBack: () => void }) {
  const queryClient = useQueryClient()
  const [eligibility, setEligibility] = useState<FamilyEligibility>('resident')
  const [familyName, setFamilyName] = useState('')
  const [location, setLocation] = useState('')
  const [locationOther, setLocationOther] = useState('')
  const [detail, setDetail] = useState('')
  const [familyPhone, setFamilyPhone] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resident = eligibility === 'resident'
  const resolvedLocation = location === LOCATION_OTHER ? locationOther : location

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const input: CreateFamilyInput = {
      familyName,
      eligibility,
      society: resident ? resolvedLocation || null : null,
      residenceDetail: resident ? detail || null : null,
      workplace: resident ? null : resolvedLocation || null,
      workplaceDetail: resident ? null : detail || null,
      familyPhone: familyPhone || null,
      displayName,
      phone: phone || null,
      gender: gender || null,
    }
    try {
      await createFamily(input)
      await queryClient.invalidateQueries()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'something went wrong')
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register your family</CardTitle>
        <CardDescription>
          Membership is open to families living in Magarpatta City or working in its towers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <Field label="Family name *">
            <input
              className={inputCls}
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="e.g. Sudeshna & Mousum Dutta"
              required
            />
          </Field>
          <Field label="We are…">
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={resident ? 'default' : 'outline'}
                onClick={() => { setEligibility('resident'); setLocation('') }}
              >
                Residents
              </Button>
              <Button
                type="button"
                size="sm"
                variant={resident ? 'outline' : 'default'}
                onClick={() => { setEligibility('works_in_mgp'); setLocation('') }}
              >
                Working in Magarpatta
              </Button>
            </div>
          </Field>
          <Field label={resident ? 'Society' : 'Tower / building'}>
            <select className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)}>
              <option value="">Select…</option>
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
          {location === LOCATION_OTHER && (
            <Field label={resident ? 'Society name' : 'Building name'}>
              <input className={inputCls} value={locationOther} onChange={(e) => setLocationOther(e.target.value)} />
            </Field>
          )}
          <Field label={resident ? 'Flat number' : 'Office / company name'}>
            <input className={inputCls} value={detail} onChange={(e) => setDetail(e.target.value)} />
          </Field>
          <Field label="Family contact phone">
            <input className={inputCls} value={familyPhone} onChange={(e) => setFamilyPhone(e.target.value)} inputMode="tel" />
          </Field>
          <hr className="border-border" />
          <Field label="Your name *">
            <input className={inputCls} value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          </Field>
          <Field label="Your phone">
            <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
          </Field>
          <Field label="Gender (optional — helps schedule some rituals)">
            <select className={inputCls} value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </Field>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />} Register family
            </Button>
            <Button type="button" variant="outline" onClick={onBack} disabled={busy}>
              Back
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function JoinFamilyForm({ onBack }: { onBack: () => void }) {
  const queryClient = useQueryClient()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<FamilySearchResult[]>([])
  const [selected, setSelected] = useState<FamilySearchResult | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = async (value: string) => {
    setQ(value)
    setSelected(null)
    if (value.trim().length < 2) return setResults([])
    try {
      setResults(await searchFamilies(value.trim()))
    } catch {
      setResults([])
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    setBusy(true)
    setError(null)
    try {
      await requestToJoin({ familyId: selected.id, displayName, note: note || null })
      await queryClient.invalidateQueries()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'something went wrong')
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join your family</CardTitle>
        <CardDescription>
          Find your family as registered with the samiti; an admin will approve your request.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <Field label="Search family name">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden="true" />
              <input className={`${inputCls} pl-8`} value={q} onChange={(e) => search(e.target.value)} placeholder="e.g. Dutta" />
            </div>
          </Field>
          {results.length > 0 && !selected && (
            <ul className="flex flex-col gap-1">
              {results.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(f)}
                    className="w-full rounded-md border px-3 py-2 text-left text-sm hover:bg-accent"
                  >
                    <span className="font-medium">{f.name}</span>
                    {f.society && <span className="text-muted-foreground"> · {f.society}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {selected && (
            <p className="text-sm">
              Joining: <span className="font-medium">{selected.name}</span>
              {selected.society && <span className="text-muted-foreground"> · {selected.society}</span>}{' '}
              <button type="button" className="underline" onClick={() => setSelected(null)}>
                change
              </button>
            </p>
          )}
          <Field label="Your name *">
            <input className={inputCls} value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          </Field>
          <Field label="Note for the admin (optional)">
            <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Mousum's brother" />
          </Field>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={busy || !selected || !displayName.trim()}>
              {busy && <Loader2 className="animate-spin" />} Request to join
            </Button>
            <Button type="button" variant="outline" onClick={onBack} disabled={busy}>
              Back
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
