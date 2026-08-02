import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        // genda: yellow carries meaning as a fill behind dark ink, never as text
        genda: 'border-transparent bg-genda text-secondary-foreground',
        // durba: success green with ONE meaning — paid, settled, money in
        durba: 'border-transparent bg-durba text-durba-foreground',
        // aparajita: selection & membership blue
        aparajita: 'border-transparent bg-aparajita text-aparajita-foreground',
        // palash: live/now — the vivid festive flash, smallest doses
        palash: 'border-transparent bg-palash text-palash-foreground',
        outline: 'text-matir',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
