import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'

import { AppLayout } from '@/components/AppLayout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { RequireMember } from '@/components/RequireMember'
import { Events } from '@/pages/Events'
import { DurgaPujaChapter, DurgaPujaIndex } from '@/pages/DurgaPuja'
import { Home } from '@/pages/Home'
import { Login } from '@/pages/Login'
import { MembersOnly } from '@/pages/MembersOnly'
import { Membership } from '@/pages/Membership'
import { BrandColours } from '@/pages/BrandColours'
import { LedgerPage, ReimbursementsPage, SponsorshipPage, WalletsPage } from '@/pages/Ledger'
import { Nirghanto } from '@/pages/Nirghanto'
import { Profile } from '@/pages/Profile'
import { Schedule } from '@/pages/Schedule'
import { Tasks } from '@/pages/Tasks'

import { captureTokenFromUrl } from '@/lib/auth'

import './index.css'

// The API bridges the session back in the URL fragment after Google sign-in
captureTokenFromUrl()

// Second half of the GitHub Pages SPA fallback (see public/404.html)
const redirect = sessionStorage.getItem('spa-redirect')
if (redirect) {
  sessionStorage.removeItem('spa-redirect')
  history.replaceState(null, '', redirect)
}

/**
 * Every deploy publishes a fresh set of hashed assets and deletes the old set,
 * while Pages lets browsers hold the HTML for ten minutes. A phone that kept a
 * tab open across a deploy therefore reaches for a chunk that is no longer
 * there — the book chapters are lazy-loaded, so this is a real path — and the
 * import rejects with nothing rendered. Reload once to pick up the new HTML,
 * rate-limited so a genuinely missing file can't put us in a refresh loop.
 */
const STALE_RELOAD = 'pujosamiti.stale-reload'
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  const last = Number(sessionStorage.getItem(STALE_RELOAD) ?? 0)
  if (Date.now() - last < 10_000) return
  sessionStorage.setItem(STALE_RELOAD, String(Date.now()))
  window.location.reload()
})

// Worker responses change rarely and the audience is on phones with spotty
// pandal-area networks — cache aggressively, refetch quietly.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Home />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="durga-puja" element={<DurgaPujaIndex />} />
              <Route path="durga-puja/:slug" element={<DurgaPujaChapter />} />
              <Route path="membersonly" element={<MembersOnly />} />
              <Route path="login" element={<Login />} />
              <Route path="profile" element={<Profile />} />
              {/* Everything below requires a signed-in, activated member: a
                  shared deep link shows the sign-in card and returns to the
                  same URL after Google. New member-only URLs go inside. */}
              <Route element={<RequireMember />}>
                <Route path="tasks" element={<Tasks />} />
                <Route path="membership" element={<Membership />} />
                <Route path="events" element={<Events />} />
                <Route path="nirghanto" element={<Nirghanto />} />
                <Route path="ledger" element={<LedgerPage />} />
                <Route path="wallets" element={<WalletsPage />} />
                <Route path="sponsorship" element={<SponsorshipPage />} />
                <Route path="reimbursements" element={<ReimbursementsPage />} />
                <Route path="brandcolours" element={<BrandColours />} />
              </Route>
              <Route path="*" element={<Home />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
