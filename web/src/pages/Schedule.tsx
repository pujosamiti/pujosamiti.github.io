import type { PujoEvent, TimeTableEntry } from '@pujosamiti/shared'
import { useQuery } from '@tanstack/react-query'
import { Phone } from 'lucide-react'
import { useSearchParams } from 'react-router'

import { SearchSelect } from '@/components/SearchSelect'
import { Alpona, type AlponaName } from '@/components/Alpona'
import { PaarEdge } from '@/components/PaarEdge'
import { Seo } from '@/components/Seo'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { useMemberState } from '@/lib/member'

/**
 * The public feed withholds the purohit's number; members get it from their
 * own route. Full names show to everyone, the phone only once signed in.
 */
function usePurohitPhone(eventId: string | undefined) {
  const { memberState } = useMemberState()
  const isMember = memberState?.status === 'member'
  const { data } = useQuery({
    queryKey: ['member-events'],
    queryFn: () => api<PujoEvent[]>('/api/members/events'),
    enabled: isMember,
  })
  return data?.find((e) => e.id === eventId)?.purohitPhone ?? null
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
 * The Durga Pujo nirghanto, by year (2022 onward — the nirghanto era). Other
 * events are one-day gatherings and publish no timetable. The chosen year
 * lives in the URL (?event=…) so schedules can be shared as links.
 */
/**
 * Each day of the pujo by the alpona that belongs to it: the conch that opens
 * Devi Paksha, the welcome pot, the betel leaf of the bel boron, the paddy of
 * the nabapatrika, Sandhi puja's hundred-and-eight lotuses, the lamp, the fish
 * pair of the farewell, and Lakshmi's footsteps.
 */
function dayMotif(labelEn: string): AlponaName | null {
  const l = labelEn.toLowerCase()
  if (l.includes('mahalaya')) return 'shankha'
  if (l.includes('panchami')) return 'mangalGhot'
  if (l.includes('shashthi')) return 'panPata'
  if (l.includes('saptami')) return 'dhanerShish'
  if (l.includes('ashtami')) return 'shatadal'
  if (l.includes('nabami')) return 'prodip'
  if (l.includes('dashami')) return 'joraMaach'
  if (l.includes('lakshmi')) return 'lakshmirPa'
  if (l.includes('saraswati')) return 'rajhansh'
  return null
}

/**
 * The year's note: its first paragraph in view, the rest (how the timings were
 * worked out) folded — on a phone it would otherwise push the first timing
 * below the fold.
 */
function EventNotes({ notes }: { notes: string }) {
  const [lead, ...rest] = notes.trim().split(/\n\s*\n/)
  return (
    <div className="mt-2 text-sm leading-relaxed">
      <p className="whitespace-pre-line">{lead}</p>
      {rest.length > 0 && (
        <details className="group mt-1">
          <summary className="w-fit text-sm font-medium text-sharat underline-offset-4 hover:underline">
            How these timings were worked out
          </summary>
          <div className="mt-2 flex flex-col gap-2">
            {rest.map((para) => (
              <p key={para.slice(0, 40)} className="whitespace-pre-line">
                {para}
              </p>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

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

  const purohitPhone = usePurohitPhone(selected?.id)

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
      <Seo
        title="Durga Puja Timetable and Schedule"
        description={
          selected
            ? `Nirghanto/Timetable/Schedule for Durga Pujo ${selected.year} at Magarpatta City, Pune — tithi-wise puja timings from Shashthi to Dashami, as confirmed by the purohit.`
            : 'Nirghanto/Timetable/Schedule for Durga Pujo at Magarpatta City, Pune — tithi-wise puja timings from Shashthi to Dashami.'
        }
        path="/schedule"
      />
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
          {/* a kash card edged like the sari itself — a red paar, a white line, a
              thin red line — so the paragraphs below read as ink, not white on red */}
          <Card className="overflow-hidden">
            <PaarEdge />
            <CardHeader>
              <CardTitle className="text-lg text-primary">দূর্গা পুজোর নির্ঘণ্ট · {selected.year}</CardTitle>
              {selected.purohitName && (
                <p className="text-sm text-muted-foreground">
                  পুরোহিত: {selected.purohitName}
                  {purohitPhone && (
                    <>
                      {' '}
                      · <Phone className="inline size-3.5" aria-hidden="true" /> {purohitPhone}
                    </>
                  )}
                </p>
              )}
              {selected.notes && <EventNotes notes={selected.notes} />}
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
                <div className="flex items-center gap-3">
                  {dayMotif(day.labelEn) && (
                    <Alpona name={dayMotif(day.labelEn)!} className="h-10 w-10 text-primary/80" />
                  )}
                  <div>
                    <CardTitle className="text-base">
                      <span className="text-shiuli">{day.labelBn}</span>{' '}
                      <span className="font-sans text-sm font-normal">· {day.labelEn}</span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{formatDay(day.date)}</p>
                  </div>
                </div>
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
                      {/* comments are the nirghanto's working notes (the purohit's
                          version, the panjika reasoning) and stay in the workspace;
                          what the public must know goes in the alert note */}
                      {t.alertNote && <p className="font-medium text-jaba">{t.alertNote}</p>}
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
