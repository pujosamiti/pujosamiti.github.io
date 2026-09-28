import { cn } from '@/lib/utils'

/**
 * An on/off switch with its label — a whole-row button, so the tap target is
 * the full width. Durba green when on. Used for guest bhog on the headcount
 * form and the ledger's "Guest bhog payment".
 */
export function Switch({
  checked,
  onChange,
  label,
  hint,
  disabled = false,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  hint?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left disabled:opacity-60"
    >
      <span
        aria-hidden="true"
        className={cn('relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-durba' : 'bg-input')}
      >
        <span
          className={cn(
            'absolute top-0.5 size-5 rounded-full bg-card shadow transition-transform',
            checked ? 'translate-x-5.5' : 'translate-x-0.5',
          )}
        />
      </span>
      <span className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </span>
    </button>
  )
}
