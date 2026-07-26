import { useId } from 'react'

import { cn } from '@/lib/utils'

/**
 * White alpona line-work on a sindoor ground — the identity's signature edge.
 * Used at the bottom of header bands and event mastheads, never as wallpaper.
 *
 * Drawn as a fixed-size repeating SVG pattern (not a scaled viewBox) so the
 * scallops stay delicate at any screen width instead of stretching.
 */
export function AlponaBand({ className }: { className?: string }) {
  const patternId = useId()
  return (
    <svg className={cn('block h-6 w-full', className)} aria-hidden="true">
      <defs>
        <pattern id={patternId} width="40" height="24" patternUnits="userSpaceOnUse">
          <path
            d="M0 22 Q 20 6 40 22"
            fill="none"
            className="stroke-band-foreground"
            strokeWidth="1.4"
          />
          {/* dots sit on the tile seams; each half joins the neighbouring tile's */}
          <circle cx="0" cy="12" r="1.8" className="fill-band-foreground" />
          <circle cx="40" cy="12" r="1.8" className="fill-band-foreground" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  )
}
