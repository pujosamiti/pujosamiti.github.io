import { useQuery } from '@tanstack/react-query'
import type { Notice } from '@pujosamiti/shared'
import { Link } from 'react-router'

import heroImage from '@/assets/pujo-samiti.webp'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'

/**
 * The landing page is fully static: everything above the fold renders from the
 * bundle with zero API calls, so it works even when the backend is down.
 * Only the notice board talks to the API, and it degrades to a quiet line.
 */
export function Home() {
  const notices = useQuery({
    queryKey: ['notices', 'pinned'],
    queryFn: () => api<Notice[]>('/api/public/notices?pinned=true'),
  })

  return (
    <div className="flex flex-col gap-6">
      <section className="pt-2 md:pt-6">
        <img
          src={heroImage}
          alt="Dhunuchi naach before the protima during Durga Pujo"
          width={1600}
          height={1067}
          fetchPriority="high"
          className="w-full rounded-xl border object-cover shadow-sm"
        />
        <div className="mt-5 text-center">
          <h1 className="text-3xl font-bold text-primary md:text-4xl">দুর্গাপূজা</h1>
          <p className="mx-auto mt-2 max-w-[60ch] text-muted-foreground">
            The probasi bengali community of Magarpatta City celebrates the pujo the para way —
            from Mahalaya to Bijoya, and through the year with Lakshmi Puja, Saraswati Puja and
            Poila Baishakh.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/schedule">Schedule</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/gallery">Gallery</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Notice board</h2>
          <Link to="/notices" className="text-sm font-medium text-primary">
            See all
          </Link>
        </div>

        {notices.isError && (
          <p className="text-sm text-muted-foreground">
            Notices could not be loaded right now — the rest of the site works as usual.
          </p>
        )}
        {notices.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">No notices yet — check back soon.</p>
        )}
        {notices.data?.map((n) => (
          <Card key={n.id} className={n.pinned ? 'border-l-4 border-l-genda' : undefined}>
            <CardHeader>
              <div className="flex items-center gap-2">
                {n.pinned && <Badge variant="genda">Pinned</Badge>}
                {n.eventId && <Badge variant="outline">{n.eventId}</Badge>}
              </div>
              <CardTitle>{n.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {n.body.slice(0, 160)}
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  )
}
