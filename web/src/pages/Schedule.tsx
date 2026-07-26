import { useQuery } from '@tanstack/react-query'
import type { PujoEvent, TimeTableEntry } from '@pujosamiti/shared'
import { useSearchParams } from 'react-router'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

function formatRange(e: PujoEvent) {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  const start = new Date(e.startsOn).toLocaleDateString('en-IN', opts)
  const end = new Date(e.endsOn).toLocaleDateString('en-IN', opts)
  return start === end ? `${start} ${e.year}` : `${start} – ${end} ${e.year}`
}

/**
 * Choose an event first, then see its schedule. The chosen event lives in the
 * URL (?event=…) so schedules can be shared as links.
 */
export function Schedule() {
  const [params, setParams] = useSearchParams()
  const eventId = params.get('event')

  const events = useQuery({
    queryKey: ['events'],
    queryFn: () => api<PujoEvent[]>('/api/public/events'),
  })

  const timetable = useQuery({
    queryKey: ['timetable', eventId],
    queryFn: () => api<TimeTableEntry[]>(`/api/public/timetable?event=${eventId}`),
    enabled: !!eventId,
  })

  if (events.isError) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Schedule</h1>
        <p className="text-sm text-muted-foreground">
          The schedule could not be loaded right now. Please try again in a little while.
        </p>
      </div>
    )
  }

  // Step 1: choose an event
  if (!eventId) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Schedule</h1>
        <p className="text-sm text-muted-foreground">Choose an event to see its schedule.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {events.data?.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setParams({ event: e.id })}
              className="text-left"
            >
              <Card className="transition-colors hover:border-primary">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg">{e.nameBn}</CardTitle>
                    {e.isActive && <Badge variant="genda">This season</Badge>}
                  </div>
                  <CardContent className="p-0 text-sm text-muted-foreground">
                    {e.nameEn} · {formatRange(e)}
                  </CardContent>
                </CardHeader>
              </Card>
            </button>
          ))}
        </div>
        {events.isLoading && <p className="text-sm text-muted-foreground">Loading events…</p>}
      </div>
    )
  }

  // Step 2: the chosen event's schedule, with chips to switch
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Schedule</h1>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {events.data?.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => setParams({ event: e.id })}
            className={cn(
              'min-h-9 shrink-0 rounded-full border bg-card px-4 text-sm whitespace-nowrap',
              e.id === eventId && 'border-genda bg-genda font-semibold text-secondary-foreground',
            )}
          >
            {e.nameBn} {e.year}
          </button>
        ))}
      </div>

      {timetable.isLoading && <p className="text-sm text-muted-foreground">Loading schedule…</p>}
      {timetable.isError && (
        <p className="text-sm text-muted-foreground">
          This schedule could not be loaded right now. Please try again in a little while.
        </p>
      )}
      {timetable.data?.map((t) => (
        <Card key={t.id}>
          <CardHeader>
            <CardTitle>{t.title}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t.detail}
            <p className="mt-1 text-matir">
              {new Date(t.startsAt).toLocaleString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                hour: 'numeric',
                minute: '2-digit',
              })}
              {t.venue && ` · ${t.venue}`}
            </p>
          </CardContent>
        </Card>
      ))}
      {timetable.data?.length === 0 && (
        <p className="text-sm text-muted-foreground">The schedule for this event is coming soon.</p>
      )}
    </div>
  )
}
