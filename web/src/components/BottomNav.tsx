import { BookOpen, CalendarDays, Home, Users } from 'lucide-react'
import { NavLink } from 'react-router'

import { cn } from '@/lib/utils'

const items = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/schedule', label: 'Schedule', icon: CalendarDays, end: false },
  { to: '/durga-puja', label: 'Durga Puja', icon: BookOpen, end: false },
  { to: '/membersonly', label: 'Members', icon: Users, end: false },
]

/** Thumb-reachable primary navigation on phones; hidden on md+ where the top bar takes over. */
export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px]',
                isActive ? 'font-semibold text-primary' : 'text-muted-foreground',
              )
            }
          >
            <Icon className="size-5" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
