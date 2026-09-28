import { FileDown, Loader2 } from 'lucide-react'

import { FORMAT_LABEL, type ReportFormat } from '@/lib/report-format'
import { cn } from '@/lib/utils'

/**
 * The download controls every report shares — the ledger's season lists, the
 * sponsorship board, the bhog count sheet: an Excel | PDF switch and one pill
 * per report. Look: docs/012-design-system §Reports.
 */

/**
 * Which file the pills beside it download: a two-way switch, as small as the
 * pills. The chosen format is filled in sharat blue — the choice — so it reads
 * apart from the crimson download pills, the action.
 */
export function FormatSwitch({ value, onChange, disabled }: { value: ReportFormat; onChange: (f: ReportFormat) => void; disabled: boolean }) {
  return (
    <span role="radiogroup" aria-label="Download format" className="inline-flex rounded-full border p-0.5">
      {(['xlsx', 'pdf'] as const).map((f) => (
        <button
          key={f}
          type="button"
          role="radio"
          aria-checked={value === f}
          disabled={disabled}
          onClick={() => onChange(f)}
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors disabled:opacity-60',
            value === f ? 'bg-sharat text-sharat-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {FORMAT_LABEL[f]}
        </button>
      ))}
    </span>
  )
}

/**
 * A pill with the download mark: one tap, one file. Drawn in crimson outline,
 * not filled — several sit in a row, and the page's one filled red belongs to
 * its main action (Add entry, Pledge).
 */
export function DownloadPill({
  label,
  format = 'PDF',
  busy,
  disabled,
  onClick,
}: {
  label: string
  /** What the tap downloads, for screen readers: "Excel" or "PDF". */
  format?: string
  busy: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full border border-primary/60 bg-card px-3 py-1 text-xs font-medium text-primary transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
      aria-label={`Download ${label} ${format}`}
    >
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <FileDown className="size-3.5" />}
      {label}
    </button>
  )
}
