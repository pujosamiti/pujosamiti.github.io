import type { PujoEvent, TimeTableEntry } from '@pujosamiti/shared'
import { useQuery } from '@tanstack/react-query'
import { Phone } from 'lucide-react'
import { useSearchParams } from 'react-router'

import { SearchSelect } from '@/components/SearchSelect'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'

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
 * The Durga Pujo nirghanto, by year (2022 onward — the nirghanto era). Other
 * events are one-day gatherings and publish no timetable. The chosen year
 * lives in the URL (?event=…) so schedules can be shared as links.
 */
export function Schedule() {
  const [params, setParams] = useSearchParams()
  const eventId = params.get('event')

  const events = useQuery({
    queryKey: ['events'],
    queryFn: () => api<PujoEvent[]>('/api/public/events'),
  })

  // 2022 (the first year with a formal nirghanto) up to the active season — future
  // years join the dropdown automatically as they become active.
  const allDp = (events.data ?? []).filter((e) => e.kind === 'durga-pujo')
  const activeYear = allDp.find((e) => e.isActive)?.year ?? new Date().getFullYear()
  const dpEvents = allDp.filter((e) => e.year >= 2022 && e.year <= activeYear).sort((a, b) => a.year - b.year)
  const selected = dpEvents.find((e) => e.id === eventId) ?? dpEvents.find((e) => e.isActive) ?? dpEvents[dpEvents.length - 1] ?? null

  const timetable = useQuery({
    queryKey: ['timetable', selected?.id],
    queryFn: () => api<TimeTableEntry[]>(`/api/public/timetable?event=${selected!.id}`),
    enabled: !!selected,
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

  // Group nirghanto rows by day AND label — a date can host two tithis (e.g.
  // 2024: Sandhi Puja under Ashtami and Nabami both fell on 11 Oct)
  const days: { date: string; labelBn: string; labelEn: string; rows: TimeTableEntry[] }[] = []
  for (const t of timetable.data ?? []) {
    const last = days[days.length - 1]
    if (last && last.date === t.dayDate && last.labelEn === t.dayLabelEn) last.rows.push(t)
    else days.push({ date: t.dayDate, labelBn: t.dayLabelBn, labelEn: t.dayLabelEn, rows: [t] })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Schedule</h1>
        {dpEvents.length > 0 && selected && (
          <SearchSelect
            options={dpEvents.map((e) => ({
              value: e.id,
              label: `Durga Pujo ${e.year}`,
              hint: e.isActive ? 'Active' : undefined,
            }))}
            value={selected.id}
            onChange={(v) => setParams({ event: v })}
            ariaLabel="Durga Pujo year"
          />
        )}
      </div>

      {events.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {selected && (
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
            <Card key={`${day.date}|${day.labelEn}`}>
              <CardHeader>
                <CardTitle className="text-base">
                  <span className="text-shiuli">{day.labelBn}</span>{' '}
                  <span className="font-sans text-sm font-normal">· {day.labelEn}</span>
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
                        <span className="whitespace-nowrap font-medium text-sharat">
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
