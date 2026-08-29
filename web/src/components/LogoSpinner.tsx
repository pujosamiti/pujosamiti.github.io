import logoSm from '@/assets/logo-sm.png'
import { cn } from '@/lib/utils'

/**
 * The samiti logo revolving horizontally like a coin — the branded loading
 * state for page and section loads (buttons keep their tiny arc spinner).
 */
export function LogoSpinner({ className, small = false }: { className?: string; small?: boolean }) {
  return (
    <span
      className={cn('inline-block [perspective:200px]', className)}
      role="status"
      aria-label="Loading"
    >
      <img
        src={logoSm}
        alt=""
        width={small ? 32 : 44}
        height={small ? 32 : 44}
        className={cn('animate-coin', small ? 'size-8' : 'size-11')}
      />
    </span>
  )
}
