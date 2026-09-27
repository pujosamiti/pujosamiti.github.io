import { Check, ChevronsUpDown, Plus, Search, UserPlus, type LucideIcon } from 'lucide-react'
import { Fragment, useEffect, useRef, useState } from 'react'

import { inputCls } from '@/components/form'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type SearchSelectOption = {
  value: string
  label: string
  /** small badge shown next to the label, e.g. "Active" for the current season */
  hint?: string
  /** A heading the option sits under (like an <optgroup>); searching matches it too. */
  group?: string
}

/**
 * A searchable dropdown (combobox): tap to open, type to filter, pick to
 * select. Keyboard: arrows to move, Enter to pick, Escape to close. The one
 * picker of the app — there are no native <select>s or <datalist>s left.
 * With `onCreate` + `freeText` it also takes a typed-in value (a new category,
 * say) and shows it even though it is not among the options.
 */
export function SearchSelect({
  options,
  value,
  onChange,
  ariaLabel,
  align = 'right',
  className,
  onCreate,
  createLabel = (query) => `New: “${query}”`,
  fullWidth = false,
  placeholder = 'Select…',
  invalid = false,
  disabled = false,
  freeText = false,
  createIcon: CreateIcon = UserPlus,
}: {
  options: SearchSelectOption[]
  value: string | null
  onChange: (value: string) => void
  ariaLabel: string
  align?: 'left' | 'right'
  className?: string
  /**
   * Counter flow: whenever something is typed, the last row offers creating
   * it — so "search, not found, add" is one motion with nothing retyped.
   */
  onCreate?: (query: string) => void
  createLabel?: (query: string) => string
  /** Span the parent like a normal form input (form fields, not toolbars).
   *  Applies to the control itself, so it works inside a flex row too. */
  fullWidth?: boolean
  /** What the trigger reads before anything is picked. */
  placeholder?: string
  /** Required and still empty: the control says so instead of only the disabled Save. */
  invalid?: boolean
  /** Shown but fixed (e.g. an event's kind once created). */
  disabled?: boolean
  /** The value is text, not an id: one typed in through onCreate (a new
   *  category) is shown as itself though no option carries it. */
  freeText?: boolean
  /** The icon on the "New: …" row — a person by default, a plus for things. */
  createIcon?: LucideIcon
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [hi, setHi] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // a typed-in text value is shown as itself, though no option carries it
  const selected = options.find((o) => o.value === value) ?? (freeText && value ? { value, label: value } : null)
  const needle = q.trim().toLowerCase()
  const shown = needle
    ? options.filter((o) => o.label.toLowerCase().includes(needle) || o.group?.toLowerCase().includes(needle))
    : options
  // no "New: …" row when what was typed is already an option
  const creatable = !!onCreate && needle.length > 0 && !options.some((o) => o.label.toLowerCase() === needle)
  const rows = shown.length + (creatable ? 1 : 0)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
    }
  }, [open])

  const openPanel = () => {
    setQ('')
    setHi(Math.max(0, options.findIndex((o) => o.value === value)))
    setOpen(true)
    // focus after the panel mounts
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const pick = (v: string) => {
    onChange(v)
    setOpen(false)
  }

  const createNow = () => {
    onCreate?.(q.trim())
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHi((h) => Math.min(h + 1, rows - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHi((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (shown[hi]) pick(shown[hi].value)
      else if (creatable) createNow()
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const highlighted = Math.min(hi, Math.max(0, rows - 1))

  return (
    <div ref={rootRef} className={cn('relative', fullWidth && 'w-full', className)}>
      <button
        type="button"
        className={cn(
          inputCls,
          'flex items-center justify-between gap-2 text-left',
          fullWidth ? 'w-full' : 'w-auto',
          invalid && !selected && 'border-destructive focus:ring-destructive/50',
          'disabled:cursor-not-allowed disabled:opacity-60',
        )}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-invalid={invalid && !selected}
      >
        <span className={cn(!selected && invalid && 'text-destructive')}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronsUpDown
          className={cn('size-4 shrink-0', invalid && !selected ? 'text-destructive' : 'text-shiuli')}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div
          className={cn(
            'absolute z-30 mt-1 rounded-md border bg-popover text-popover-foreground shadow-md',
            fullWidth ? 'w-full min-w-56' : 'w-56',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          <div className="relative border-b p-1.5">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              ref={inputRef}
              className="w-full rounded-sm bg-transparent py-1 pl-7 pr-2 text-sm outline-none placeholder:text-muted-foreground"
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setHi(0)
              }}
              onKeyDown={onKeyDown}
              placeholder="Search…"
              aria-label={`Search ${ariaLabel}`}
            />
          </div>
          <ul role="listbox" aria-label={ariaLabel} className="max-h-60 overflow-auto p-1">
            {shown.length === 0 && !creatable && (
              <li className="px-2 py-1.5 text-sm text-muted-foreground">No match</li>
            )}
            {shown.map((o, i) => (
              <Fragment key={o.value}>
              {o.group && o.group !== shown[i - 1]?.group && (
                <li role="presentation" className="px-2 pb-0.5 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {o.group}
                </li>
              )}
              <li role="option" aria-selected={o.value === value}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm',
                    i === highlighted && 'bg-accent text-accent-foreground',
                  )}
                  onMouseEnter={() => setHi(i)}
                  onClick={() => pick(o.value)}
                >
                  <span className="flex items-center gap-2">
                    {o.label}
                    {o.hint && <Badge variant="genda">{o.hint}</Badge>}
                  </span>
                  {o.value === value && <Check className="size-4 shrink-0 text-aparajita" aria-hidden="true" />}
                </button>
              </li>
              </Fragment>
            ))}
            {creatable && (
              <li role="option" aria-selected={false}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm font-medium',
                    highlighted === shown.length && 'bg-accent text-accent-foreground',
                    shown.length === 0 && 'text-primary',
                  )}
                  onMouseEnter={() => setHi(shown.length)}
                  onClick={createNow}
                >
                  <CreateIcon className="size-4 shrink-0" aria-hidden="true" />
                  {createLabel(q.trim())}
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

/**
 * A text field with suggestions, as a picker: pick a known value (a category
 * already in use, a tithi) or type a new one and take it with "Use “…”".
 * Replaces the old <input list> + <datalist>, which phones (iOS Safari
 * above all) barely show. `empty` adds a row for no value ('').
 */
export function TextPicker({
  value,
  onChange,
  suggestions,
  ariaLabel,
  placeholder = 'Pick or type…',
  empty,
  fullWidth = true,
  invalid,
}: {
  value: string
  onChange: (value: string) => void
  suggestions: readonly string[]
  ariaLabel: string
  placeholder?: string
  empty?: string
  fullWidth?: boolean
  invalid?: boolean
}) {
  const options: SearchSelectOption[] = [
    ...(empty ? [{ value: '', label: empty }] : []),
    ...[...new Set(suggestions)].filter(Boolean).map((s) => ({ value: s, label: s })),
  ]
  return (
    <SearchSelect
      ariaLabel={ariaLabel}
      align="left"
      fullWidth={fullWidth}
      freeText
      value={value || (empty ? '' : null)}
      options={options}
      onChange={onChange}
      onCreate={(q) => onChange(q)}
      createLabel={(q) => `Use “${q}”`}
      createIcon={Plus}
      placeholder={placeholder}
      invalid={invalid}
    />
  )
}
