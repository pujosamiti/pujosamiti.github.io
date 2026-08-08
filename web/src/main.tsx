import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'

import { AppLayout } from '@/components/AppLayout'
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
            <Route path="tasks" element={<Tasks />} />
            <Route path="membership" element={<Membership />} />
            <Route path="events" element={<Events />} />
            <Route path="nirghanto" element={<Nirghanto />} />
            <Route path="ledger" element={<LedgerPage />} />
            <Route path="wallets" element={<WalletsPage />} />
            <Route path="sponsorship" element={<SponsorshipPage />} />
            <Route path="reimbursements" element={<ReimbursementsPage />} />
            <Route path="brandcolours" element={<BrandColours />} />
            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
