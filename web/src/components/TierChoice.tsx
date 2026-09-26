import type { FamilyTier } from '@pujosamiti/shared'
import { FAMILY_TIERS, TIER_LABEL } from '@pujosamiti/shared'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * The membership type every new person must be given — Core, Member or
 * Non-member, nothing pre-selected. Used wherever someone joins the roll:
 * the Membership page and the walk-up "New person" in the counter picker
 * (ledger contributions, sponsorship pledges, bhog headcounts).
 */
export function TierChoice({
  value,
  onChange,
  invalid = false,
}: {
  value: FamilyTier | null
  onChange: (tier: FamilyTier) => void
  /** Highlight the unchosen control, as other required fields do. */
  invalid?: boolean
}) {
  const missing = invalid && !value
  return (
    <fieldset className="flex flex-col gap-1 text-sm">
      <legend className={cn('mb-1 font-medium', missing && 'text-destructive')}>Membership type *</legend>
      <div role="radiogroup" aria-label="Membership type" aria-invalid={missing} className="flex flex-wrap gap-1">
        {FAMILY_TIERS.map((t) => (
          <Button
            key={t}
            type="button"
            size="sm"
            role="radio"
            aria-checked={value === t}
            variant={value === t ? (t === 'core' ? 'default' : 'secondary') : 'outline'}
            className={cn(missing && 'border-destructive')}
            onClick={() => onChange(t)}
          >
            {TIER_LABEL[t]}
          </Button>
        ))}
      </div>
    </fieldset>
  )
}
