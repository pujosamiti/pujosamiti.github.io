import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { dateOfDay } from '@/lib/umaDaily'
import { cn } from '@/lib/utils'

const dd = (n: number) => Number(dateOfDay(n).slice(8, 10))
const full = (n: number) =>
  new Date(`${dateOfDay(n)}T00:00:00Z`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })

/**
 * The season's days as a strip of dates — 26 · 27 · … · 21 — with ‹ › either
 * side. Days up to today open for everyone (earlier puzzles and questions to
 * look back at or play); later ones are locked, except for a previewer, who
 * sees them dashed. Today wears a ring; the chosen day is filled.
 */
export function DayPager({
  count,
  selected,
  today,
  lastOpen,
  onSelect,
}: {
  count: number
  /** The day on screen, or null when none is (the season's farewell). */
  selected: number | null
  /** Today's day number (may be past the season). */
  today: number
  /** The last day this viewer may open. */
  lastOpen: number
  onSelect: (day: number) => void
}) {
  const strip = useRef<HTMLDivElement>(null)

  // keep the chosen day in view along the strip, without scrolling the page
  useEffect(() => {
    const el = strip.current
    const chip = el?.querySelector<HTMLElement>('[aria-current="date"]')
    if (!el || !chip) return
    // measured against the strip itself, wherever the strip sits on the page
    const box = el.getBoundingClientRect()
    const at = chip.getBoundingClientRect()
    el.scrollLeft += at.left - box.left - (box.width - at.width) / 2
  }, [selected])

  const days = Array.from({ length: count }, (_, i) => i)
  const prev = selected === null ? Math.min(today, count - 1, lastOpen) : selected - 1
  const next = selected === null ? null : selected + 1

  return (
    <nav aria-label="Days of the season" className="flex items-center gap-1">
      <Button
        size="icon"
        variant="ghost"
        className="size-8 shrink-0"
        aria-label="Previous day"
        disabled={prev < 0}
        onClick={() => onSelect(prev)}
      >
        <ChevronLeft />
      </Button>
      <div ref={strip} className="flex min-w-0 flex-1 gap-1 overflow-x-auto scroll-smooth py-1 [scrollbar-width:none]">
        {days.map((d) => {
          const open = d <= lastOpen
          const future = d > today
          const isSel = d === selected
          const firstOfMonth = d === 0 || dd(d) === 1
          return (
            <div key={d} className="flex shrink-0 flex-col items-center">
              <span className="h-3 text-[9px] uppercase leading-3 text-muted-foreground">
                {firstOfMonth ? new Date(`${dateOfDay(d)}T00:00:00Z`).toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' }) : ''}
              </span>
              <button
                type="button"
                disabled={!open}
                onClick={() => onSelect(d)}
                aria-current={isSel ? 'date' : undefined}
                aria-label={`${full(d)}${d === today ? ', today' : ''}${!open ? ', not yet' : future ? ', preview' : ''}`}
                title={full(d)}
                className={cn(
                  'grid size-8 place-items-center rounded-full text-xs tabular-nums transition-colors',
                  isSel
                    ? 'bg-primary font-semibold text-primary-foreground'
                    : open
                      ? 'hover:bg-accent'
                      : 'cursor-not-allowed text-muted-foreground/40',
                  d === today && !isSel && 'ring-2 ring-primary/60',
                  open && future && !isSel && 'border border-dashed border-muted-foreground/60',
                )}
              >
                {dd(d)}
              </button>
            </div>
          )
        })}
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="size-8 shrink-0"
        aria-label="Next day"
        disabled={next === null || next > lastOpen}
        onClick={() => next !== null && onSelect(next)}
      >
        <ChevronRight />
      </Button>
    </nav>
  )
}
