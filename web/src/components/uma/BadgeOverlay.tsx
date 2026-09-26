import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { BadgeCard } from '@/components/uma/BadgeCard'
import type { UmaBadge } from '@/content/uma-badges'
import { cn } from '@/lib/utils'

const SHOW_MS = 10_000
const FADE_MS = 400

/**
 * The moment of the win: the badge card floats over the game for ten
 * seconds — a thin bar drains to show the time left, and the ✕ or a tap
 * closes it early — then fades, and `onClose` lets the game bring the same
 * card, settled beneath the game, into view. Re-opens whenever `open`
 * changes to a new truthy value.
 */
export function BadgeOverlay({
  open,
  onClose,
  ...card
}: {
  /** A changing token — a timestamp — so each win opens it afresh. */
  open: number
  onClose: () => void
  badges: UmaBadge[]
  earned: UmaBadge | null
  secs: number
  verb: 'answered' | 'solved'
}) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setLeaving(false)
    const fade = setTimeout(() => setLeaving(true), SHOW_MS - FADE_MS)
    const done = setTimeout(onClose, SHOW_MS)
    return () => {
      clearTimeout(fade)
      clearTimeout(done)
    }
    // the timer belongs to `open` alone
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  const close = () => {
    setLeaving(true)
    setTimeout(onClose, FADE_MS)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Badge earned"
      onClick={close}
      className={cn(
        'fixed inset-0 z-40 flex cursor-pointer items-center justify-center bg-foreground/35 p-4 backdrop-blur-[2px] transition-opacity duration-[400ms]',
        leaving ? 'opacity-0' : 'animate-in fade-in duration-500',
      )}
    >
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-card shadow-xl animate-in zoom-in-95 duration-500">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            close()
          }}
          aria-label="Close"
          className="absolute right-2 top-2 z-10 grid size-8 place-items-center rounded-full bg-background/80 text-muted-foreground shadow-sm hover:text-foreground"
        >
          <X className="size-4" />
        </button>
        <BadgeCard {...card} className="border-0" />
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1 origin-left bg-genda"
          style={{ animation: `uma-drain ${SHOW_MS}ms linear forwards` }}
        />
        <style>{'@keyframes uma-drain { from { transform: scaleX(1) } to { transform: scaleX(0) } }'}</style>
      </div>
    </div>
  )
}
