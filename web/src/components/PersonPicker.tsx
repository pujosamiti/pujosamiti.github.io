import type { FamilyTier } from '@pujosamiti/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

import { Field, inputCls } from '@/components/form'
import { SearchSelect } from '@/components/SearchSelect'
import { Button } from '@/components/ui/button'
import { createCounterPerson, usePickerPeople } from '@/lib/people'

const TIER_HINT: Record<FamilyTier, string> = {
  core: 'Core',
  member: 'Member',
  non_member: 'Non-member',
}

/**
 * The counter person picker (admin/fin_admin): the WHOLE roll — members,
 * ex-members, non-members, inactive — with tier/status hints, plus optional
 * walk-up creation for the person who pays cash at the pandal and has never
 * signed in.
 */
export function PersonPicker({
  value,
  onChange,
  ariaLabel,
  allowCreate = false,
  placeholder,
  invalid = false,
  pinnedId,
}: {
  value: string | null
  onChange: (id: string) => void
  ariaLabel: string
  allowCreate?: boolean
  placeholder?: string
  invalid?: boolean
  /** Sits first in the list, marked "You" — the person most often picked. */
  pinnedId?: string
}) {
  const queryClient = useQueryClient()
  const { data: people } = usePickerPeople()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [society, setSociety] = useState('')

  const create = useMutation({
    mutationFn: () =>
      createCounterPerson({ displayName: name.trim(), phone: phone.trim() || null, society: society.trim() || null }),
    onSuccess: (r) => {
      void queryClient.invalidateQueries({ queryKey: ['people-full'] })
      void queryClient.invalidateQueries({ queryKey: ['members-lite'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-people'] })
      onChange(r.id)
      setCreating(false)
      setName('')
      setPhone('')
      setSociety('')
    },
  })

  // sort is stable, so pinning the viewer to the top leaves everyone else in
  // the roster's own order.
  const roll = pinnedId
    ? [...(people ?? [])].sort((a, b) => (a.id === pinnedId ? -1 : b.id === pinnedId ? 1 : 0))
    : (people ?? [])
  const options = roll.map((p) => ({
    value: p.id,
    label: p.name,
    hint: [p.id === pinnedId ? 'You' : null, p.isActive ? TIER_HINT[p.tier] : 'Inactive', p.society]
      .filter(Boolean)
      .join(' · '),
  }))

  return (
    <div className="flex w-full flex-col gap-2">
      <SearchSelect
        align="left"
        fullWidth
        options={options}
        value={value}
        onChange={onChange}
        ariaLabel={ariaLabel}
        placeholder={placeholder}
        invalid={invalid}
        onCreate={
          allowCreate
            ? (typed) => {
                setName(typed)
                setCreating(true)
              }
            : undefined
        }
        createLabel={(typed) => `New person “${typed}”`}
      />
      {creating && (
        <div className="flex flex-col gap-2 rounded-md border bg-accent/30 p-3">
          <p className="text-xs text-muted-foreground">
            Someone new at the counter — no sign-in needed. They join the roll as a member; add their
            email later on the Membership page to link their Google account.
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <Field label="Name">
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            </Field>
            <Field label="WhatsApp">
              <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="optional" />
            </Field>
            <Field label="Society">
              <input className={inputCls} value={society} onChange={(e) => setSociety(e.target.value)} placeholder="optional" />
            </Field>
            <Button type="button" size="sm" onClick={() => create.mutate()} disabled={create.isPending || !name.trim()}>
              {create.isPending ? <Loader2 className="animate-spin" /> : null} Add person
            </Button>
          </div>
          {create.error && <p className="text-sm text-destructive">{create.error.message}</p>}
        </div>
      )}
    </div>
  )
}
