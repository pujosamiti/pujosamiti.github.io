import {
  LOCATION_OTHER,
  MAGARPATTA_SOCIETIES,
  MAGARPATTA_WORKPLACE_GROUPS,
  type FamilyEligibility,
  type ProfileInput,
} from '@pujosamiti/shared'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

import { Field, inputCls } from '@/components/form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { saveProfile } from '@/lib/onboarding'

/**
 * First sign-in: complete your profile. Creates the person at tier
 * non_member; a committee admin promotes to member/core after the
 * subscription. Membership is per person — families are grouped by admins.
 */
export function ProfileForm({ email }: { email: string }) {
  const queryClient = useQueryClient()
  const [eligibility, setEligibility] = useState<FamilyEligibility>('resident')
  const [displayName, setDisplayName] = useState('')
  const [location, setLocation] = useState('')
  const [locationOther, setLocationOther] = useState('')
  const [detail, setDetail] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resident = eligibility === 'resident'
  const invited = eligibility === 'by_invitation'
  const resolvedLocation = location === LOCATION_OTHER ? locationOther : location

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const input: ProfileInput = {
      displayName,
      eligibility,
      society: resident && !invited ? resolvedLocation || null : null,
      residenceDetail: resident && !invited ? detail || null : null,
      workplace: !resident && !invited ? resolvedLocation || null : null,
      workplaceDetail: !resident && !invited ? detail || null : null,
      phone: phone || null,
      gender: gender || null,
    }
    try {
      await saveProfile(input)
      await queryClient.invalidateQueries()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'something went wrong')
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome! Complete your profile</CardTitle>
        <CardDescription>
          You're signed in as <span className="font-medium">{email}</span>. Tell the samiti who
          you are — membership is open to people living in Magarpatta City or working in its
          towers. A committee admin activates membership after this.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <Field label="Your name *">
            <input
              className={inputCls}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Sudeshna Guha Neogi"
              required
            />
          </Field>
          <Field label="I am…">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={resident ? 'default' : 'outline'}
                onClick={() => { setEligibility('resident'); setLocation('') }}
              >
                A resident
              </Button>
              <Button
                type="button"
                size="sm"
                variant={eligibility === 'works_in_mgp' ? 'default' : 'outline'}
                onClick={() => { setEligibility('works_in_mgp'); setLocation('') }}
              >
                Working in Magarpatta
              </Button>
              <Button
                type="button"
                size="sm"
                variant={invited ? 'default' : 'outline'}
                onClick={() => { setEligibility('by_invitation'); setLocation('') }}
              >
                Invited by the samiti
              </Button>
            </div>
          </Field>
          {!invited && (
            <>
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
            </>
          )}
          <Field label="Phone">
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
          <Button type="submit" disabled={busy} className="self-start">
            {busy && <Loader2 className="animate-spin" />} Save profile
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
