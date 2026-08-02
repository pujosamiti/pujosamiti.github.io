import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router'

/** "← Members Only" — hierarchy link on every card page. Always navigates to
 * /membersonly (not history.back) so deep-link arrivals go UP, not out. */
export function BackLink() {
  return (
    <Link
      to="/membersonly"
      className="flex items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="size-4" aria-hidden="true" />
      Members Only
    </Link>
  )
}
