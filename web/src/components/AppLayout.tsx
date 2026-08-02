import { NavLink, Outlet } from 'react-router'

import { AlponaBand } from '@/components/AlponaBand'
import { BottomNav } from '@/components/BottomNav'
import { cn } from '@/lib/utils'

const desktopNav = [
  { to: '/', label: 'Home', end: true },
  { to: '/schedule', label: 'Schedule', end: false },
  { to: '/gallery', label: 'Gallery', end: false },
  { to: '/notices', label: 'Notices', end: false },
  { to: '/membersonly', label: 'Members Only', end: false },
]

export function AppLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="bg-band text-band-foreground">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 pt-3 md:pt-4">
          <div>
            <p className="font-serif text-xl font-bold leading-tight md:text-2xl">পুজো সমিতি</p>
            <p className="text-xs opacity-85">Magarpatta City · Pune</p>
          </div>
          <nav className="hidden gap-1 md:flex">
            {desktopNav.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-2 text-sm hover:bg-band-foreground/10',
                    isActive && 'bg-band-foreground/15 font-semibold',
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <AlponaBand className="mt-2" />
      </header>

      {/* pb clears the fixed bottom nav on phones */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-4 md:pb-8">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  )
}
