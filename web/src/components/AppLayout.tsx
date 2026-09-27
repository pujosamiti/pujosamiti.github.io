import { useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'

import logo from '@/assets/logo-sm.png'
import { KuriBorder } from '@/components/Alpona'
import { AlponaBand } from '@/components/AlponaBand'
import { BottomNav } from '@/components/BottomNav'
import { SiteFooter } from '@/components/SiteFooter'
import { isPujoDay, istToday } from '@/lib/pujoCalendar'
import { cn } from '@/lib/utils'

const desktopNav = [
  { to: '/', label: 'Home', end: true },
  { to: '/schedule/', label: 'Schedule', end: false },
  { to: '/uma/', label: 'উমা', end: false },
  { to: '/durga-puja/', label: 'Durga Puja', end: false },
  { to: '/membersonly/', label: 'Members Only', end: false },
]

export function AppLayout() {
  // on the pujo days (Panchami → Dashami) the header's scallops become a kuri
  // mala of lotus buds — Sandhi puja's 108 lotuses; `?festive` previews it any day
  const { pathname, search, hash } = useLocation()
  const navigate = useNavigate()
  // Every page is served at its slashed address (/schedule/ — GitHub Pages
  // redirects /schedule there), and every link in the app uses it. An address
  // that arrives without the slash (a typed URL, the dev server, an old link)
  // is settled onto it in place, so the nav highlight and the canonical agree.
  useEffect(() => {
    if (pathname !== '/' && !pathname.endsWith('/')) navigate(`${pathname}/${search}${hash}`, { replace: true })
  }, [pathname, search, hash, navigate])
  const festive = isPujoDay(istToday()) || new URLSearchParams(search).has('festive')
  return (
    <div className="flex min-h-svh flex-col">
      <header className="bg-band text-band-foreground">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 pt-3 md:pt-4">
          <NavLink to="/" className="flex items-center gap-2.5">
            <img
              src={logo}
              alt="Pujo Samiti logo — Durga's face in a golden ring"
              width={44}
              height={44}
              className="size-10 rounded-full border border-band-foreground/40 bg-white shadow-sm md:size-11"
            />
            <span>
              <span className="block font-serif text-xl font-bold leading-tight md:text-2xl">পুজো সমিতি</span>
              <span className="block text-xs opacity-85">Magarpatta City · Pune</span>
            </span>
          </NavLink>
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
        {festive ? <KuriBorder className="mt-2 text-band-foreground" /> : <AlponaBand className="mt-2" />}
      </header>

      {/* the footer below clears the fixed bottom nav on phones */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-10 pt-4 md:pb-12">
        <Outlet />
      </main>

      <SiteFooter />
      <BottomNav />
    </div>
  )
}
