import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { inputCls } from '@/components/form'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type SearchSelectOption = {
  value: string
  label: string
  /** small badge shown next to the label, e.g. "Active" for the current season */
  hint?: string
}

/**
 * A searchable dropdown (combobox): tap to open, type to filter, pick to
 * select. Keyboard: arrows to move, Enter to pick, Escape to close.
 */
export function SearchSelect({
  options,
  value,
  onChange,
  ariaLabel,
  align = 'right',
  className,
}: {
  options: SearchSelectOption[]
  value: string | null
  onChange: (value: string) => void
  ariaLabel: string
  align?: 'left' | 'right'
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [hi, setHi] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = options.find((o) => o.value === value) ?? null
  const needle = q.trim().toLowerCase()
  const shown = needle ? options.filter((o) => o.label.toLowerCase().includes(needle)) : options

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

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHi((h) => Math.min(h + 1, shown.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHi((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (shown[hi]) pick(shown[hi].value)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const highlighted = Math.min(hi, Math.max(0, shown.length - 1))

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        className={`${inputCls} flex w-auto items-center justify-between gap-2 text-left`}
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span>{selected?.label ?? 'Select…'}</span>
        <ChevronsUpDown className="size-4 shrink-0 text-shiuli" aria-hidden="true" />
      </button>
      {open && (
        <div
          className={cn(
            'absolute z-30 mt-1 w-56 rounded-md border bg-popover text-popover-foreground shadow-md',
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
            {shown.length === 0 && <li className="px-2 py-1.5 text-sm text-muted-foreground">No match</li>}
            {shown.map((o, i) => (
              <li key={o.value} role="option" aria-selected={o.value === value}>
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
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
