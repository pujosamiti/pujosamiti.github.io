import { forwardRef } from 'react'

import type { UmaBadge } from '@/content/uma-badges'
import { limitLabel } from '@/content/uma-badges'
import { cn } from '@/lib/utils'

/** Maa's face inside a ring in the badge's colour. */
export function DurgaBadge({
  badge,
  size = 'lg',
  dim = false,
  className,
}: {
  badge: UmaBadge
  size?: 'lg' | 'sm'
  /** Not earned — shown faded in the row. */
  dim?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'shrink-0 rounded-full shadow-sm',
        badge.ring,
        size === 'lg' ? 'size-32 p-1.5' : 'size-11 p-0.5',
        dim && 'opacity-40',
        className,
      )}
    >
      <img
        src={badge.face}
        alt=""
        draggable={false}
        className={cn(
          'size-full rounded-full object-cover',
          size === 'lg' ? 'border-4 border-background' : 'border-2 border-background',
        )}
      />
    </div>
  )
}

const secsLabel = (s: number) => (s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`)

/**
 * The win card shown under a game: the earned badge large — Maa's face in its
 * ring — with its prayer (Sanskrit in Bengali script, the guide's English
 * beneath) and the time, then all five badges in a row with the earned one
 * marked, so players know what to aim for. `earned` null = solved, but too
 * slowly for a badge.
 */
export const BadgeCard = forwardRef<
  HTMLDivElement,
  { badges: UmaBadge[]; earned: UmaBadge | null; secs: number; verb: 'answered' | 'solved'; className?: string }
>(function BadgeCard({ badges, earned, secs, verb, className }, ref) {
  const last = badges[badges.length - 1]!
  return (
    <div
      ref={ref}
      className={cn('flex w-full scroll-mt-24 flex-col items-center gap-2 rounded-lg border bg-card px-4 py-5 text-center', className)}
      role="status"
    >
      {earned ? (
        <>
          <DurgaBadge badge={earned} className="animate-in zoom-in-50 spin-in-12 duration-700" />
          <div className="animate-in fade-in slide-in-from-bottom-2 delay-300 duration-500 fill-mode-backwards">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Badge earned</p>
            <div lang="sa-Beng" className="mt-1 font-serif text-lg leading-relaxed sm:text-xl">
              {earned.prayerBn.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <p lang="en" className="mx-auto mt-1 max-w-sm text-sm italic leading-snug text-muted-foreground">
              ({earned.prayerEn})
            </p>
            <p className="mt-2 text-sm font-medium">
              {verb} in {secsLabel(secs)}
            </p>
          </div>
        </>
      ) : (
        <p className="text-sm">
          Solved in <span className="font-medium">{secsLabel(secs)}</span> — finish within {limitLabel(last).replace('≤ ', '')} to
          earn one of Maa's badges.
        </p>
      )}
      <ol className="mt-2 flex items-start justify-center gap-2 sm:gap-3" aria-label="The five badges, fastest first">
        {badges.map((b) => (
          <li key={b.id} className="flex w-14 flex-col items-center gap-1">
            <DurgaBadge
              badge={b}
              size="sm"
              dim={b.id !== earned?.id}
              className={b.id === earned?.id ? 'ring-2 ring-foreground/70 ring-offset-2 ring-offset-card' : undefined}
            />
            <span className={cn('text-[11px] leading-tight', b.id === earned?.id ? 'font-semibold' : 'text-muted-foreground')}>
              {limitLabel(b)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
})
