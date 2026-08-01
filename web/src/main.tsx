import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'

import { AppLayout } from '@/components/AppLayout'
import { Admin } from '@/pages/Admin'
import { Gallery } from '@/pages/Gallery'
import { Home } from '@/pages/Home'
import { Login } from '@/pages/Login'
import { More } from '@/pages/More'
import { Notices } from '@/pages/Notices'
import { Schedule } from '@/pages/Schedule'

import './index.css'

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
            <Route path="events" element={<Navigate to="/schedule" replace />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="notices" element={<Notices />} />
            <Route path="more" element={<More />} />
            <Route path="login" element={<Login />} />
            <Route path="admin" element={<Admin />} />
            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
