import type { PujoEvent, TimeTableEntry } from '@pujosamiti/shared'
import { useQuery } from '@tanstack/react-query'
import { Phone } from 'lucide-react'
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

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

/** "08:30" → "8:30 AM" */
function formatTime(t: string | null) {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

/**
 * Choose an event first, then see its schedule. Only Durga Pujo publishes a
 * nirghanto — other events are one-day gatherings. The chosen event lives in
 * the URL (?event=…) so schedules can be shared as links.
 */
export function Schedule() {
  const [params, setParams] = useSearchParams()
  const eventId = params.get('event')

  const events = useQuery({
    queryKey: ['events'],
    queryFn: () => api<PujoEvent[]>('/api/public/events'),
  })

  const selected = events.data?.find((e) => e.id === eventId) ?? null

  const timetable = useQuery({
    queryKey: ['timetable', eventId],
    queryFn: () => api<TimeTableEntry[]>(`/api/public/timetable?event=${eventId}`),
    enabled: !!eventId && selected?.kind === 'durga-pujo',
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

  // Step 1: choose an event (this season's events lead; older ones follow)
  if (!eventId || !selected) {
    const upcoming = (events.data ?? []).filter((e) => e.isActive || new Date(e.endsOn) >= new Date())
    const shown = upcoming.length ? upcoming.slice(0, 8) : (events.data ?? []).slice(-8)
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Schedule</h1>
        <p className="text-sm text-muted-foreground">Choose an event to see its schedule.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {shown.map((e) => (
            <button key={e.id} type="button" onClick={() => setParams({ event: e.id })} className="text-left">
              <Card className="h-full transition-colors hover:border-primary">
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

  const seasonEvents = (events.data ?? []).filter(
    (e) => e.year === selected.year || e.id === eventId || e.isActive,
  )

  // Group nirghanto rows by day (rows arrive day-ordered from the API)
  const days: { date: string; labelBn: string; labelEn: string; rows: TimeTableEntry[] }[] = []
  for (const t of timetable.data ?? []) {
    const last = days[days.length - 1]
    if (last && last.date === t.dayDate) last.rows.push(t)
    else days.push({ date: t.dayDate, labelBn: t.dayLabelBn, labelEn: t.dayLabelEn, rows: [t] })
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Schedule</h1>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {seasonEvents.map((e) => (
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

      {selected.kind !== 'durga-pujo' ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {selected.nameBn} · {selected.nameEn}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            One-day gathering on <span className="font-medium text-foreground">{formatDay(selected.startsOn)}</span>.
            Timings are shared in the notices closer to the day.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="bg-band text-band-foreground">
            <CardHeader>
              <CardTitle className="font-serif">দূর্গা পুজোর নির্ঘণ্ট · {selected.year}</CardTitle>
              {(selected.purohitName || selected.purohitPhone) && (
                <p className="text-sm opacity-90">
                  পুরোহিত: {selected.purohitName}
                  {selected.purohitPhone && (
                    <>
                      {' '}
                      · <Phone className="inline size-3.5" aria-hidden="true" /> {selected.purohitPhone}
                    </>
                  )}
                </p>
              )}
            </CardHeader>
          </Card>

          {timetable.isLoading && <p className="text-sm text-muted-foreground">Loading nirghanto…</p>}
          {timetable.isError && (
            <p className="text-sm text-muted-foreground">
              The nirghanto could not be loaded right now. Please try again in a little while.
            </p>
          )}

          {days.map((day) => (
            <Card key={day.date}>
              <CardHeader>
                <CardTitle className="text-base">
                  {day.labelBn} <span className="font-sans text-sm font-normal">· {day.labelEn}</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">{formatDay(day.date)}</p>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {day.rows.map((t) => {
                  const from = formatTime(t.timeFrom)
                  const to = formatTime(t.timeTo)
                  return (
                    <div key={t.id} className="border-b pb-2 text-sm last:border-b-0 last:pb-0">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <span>
                          <span className="font-medium">{t.titleBn}</span>{' '}
                          <span className="text-muted-foreground">{t.titleEn}</span>
                        </span>
                        <span className="whitespace-nowrap text-matir">
                          {from ? (to ? `${from} – ${to}` : from) : '—'}
                        </span>
                      </div>
                      {t.comments && <p className="text-muted-foreground">{t.comments}</p>}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ))}
          {timetable.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">The nirghanto for this year is coming soon.</p>
          )}
        </>
      )}
    </div>
  )
}
