import type * as React from 'react'

import type { Tint } from '@/lib/tint'
import { cn } from '@/lib/utils'

/**
 * A members-area page title with a short underline in the page's own pastel
 * (the colour of its tile on Members Only; woven pages get all four).
 */
export function PageTitle({ tint, className, children }: { tint: Tint; className?: string; children: React.ReactNode }) {
  return (
    <h1
      className={cn('tint-title text-2xl font-bold', tint === 'woven' && 'tint-title-woven', className)}
      style={tint === 'woven' ? undefined : ({ '--tint': `var(--${tint})` } as React.CSSProperties)}
    >
      {children}
    </h1>
  )
}
