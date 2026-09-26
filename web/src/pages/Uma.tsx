import { CircleHelp, Eye, History, Puzzle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'

import { Seo } from '@/components/Seo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DailyQuiz } from '@/components/uma/DailyQuiz'
import { DayPager } from '@/components/uma/DayPager'
import { SlidingPuzzle } from '@/components/uma/SlidingPuzzle'
import { UMA_PUZZLES } from '@/content/uma-puzzles'
import { UMA_QUIZ } from '@/content/uma-quiz'
import { useMemberState } from '@/lib/member'
import { UMA_SEASON_DAYS, canPreviewUma, dateOfDay, dayNumber, msToNextDay, umaToday } from '@/lib/umaDaily'

type Tab = 'quiz' | 'puzzle'

/** "Sun, 28 Sep" */
const dayLabel = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })

/**
 * উমা — a puzzle and a question, every day of the 2026 season: 26 days from
 * 26 Sep to Dashami, 21 Oct. Public, no sign-in: everything is decided by the
 * Uma day (India, turning over at 5 am), and each phone remembers its own
 * answers.
 *
 * A strip of dates pages through the season (`?day=YYYY-MM-DD`; today needs
 * none). Everyone may open today and any earlier day — to see how they did,
 * or to play a day they missed; only today's game feeds the streak and the
 * countdown. A member whose portfolio is "maestro" may also open the days
 * still to come, as a preview that isn't remembered. After Dashami the page
 * bids farewell, and the strip stays for looking back.
 * (Until 26 Sep 2026 /uma was the samiti magazine, now archived.)
 */
export function Uma() {
  const [params, setParams] = useSearchParams()
  // The puzzle is the front door; the quiz is one tap away.
  const tab: Tab = params.get('tab') === 'quiz' ? 'quiz' : 'puzzle'
  const [today, setToday] = useState(() => umaToday())

  // An open tab rolls over to the new day's games at 5 am IST.
  useEffect(() => {
    const t = setTimeout(() => setToday(umaToday()), msToNextDay() + 1000)
    return () => clearTimeout(t)
  }, [today])

  const { memberState } = useMemberState()
  const maestro = canPreviewUma(memberState?.status === 'member' ? memberState.me.portfolio : null)

  const todayN = dayNumber(today)
  const seasonOver = todayN >= UMA_SEASON_DAYS
  const lastOpen = maestro ? UMA_SEASON_DAYS - 1 : Math.min(todayN, UMA_SEASON_DAYS - 1)

  // the day on screen: ?day= when it is a real, open day of the season; otherwise today (or none, after the season)
  const asked = params.get('day')
  const askedN = asked && dateOfDay(dayNumber(asked)) === asked ? dayNumber(asked) : null
  const n: number | null = askedN !== null && askedN <= lastOpen ? askedN : seasonOver ? null : todayN
  const date = n === null ? null : dateOfDay(n)
  const isToday = n === todayN
  const isFuture = n !== null && n > todayN

  const select = (day: number) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (day === todayN) next.delete('day')
        else next.set('day', dateOfDay(day))
        return next
      },
      { replace: true },
    )
  const setTab = (key: Tab) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (key === 'puzzle') next.delete('tab')
        else next.set('tab', key)
        return next
      },
      { replace: true },
    )

  const question = n === null ? undefined : UMA_QUIZ[n]
  const image = n === null ? undefined : UMA_PUZZLES[n]

  const tabs: { key: Tab; label: string; icon: typeof Puzzle }[] = [
    { key: 'puzzle', label: 'Puzzle', icon: Puzzle },
    { key: 'quiz', label: 'Quiz', icon: CircleHelp },
  ]

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <Seo
        title="Uma · উমা — a daily puzzle and quiz"
        description="A sliding puzzle of Maa Durga's face and a question about Durga Puja — new every day from the Magarpatta pujo samiti."
        path="/uma"
      />
      <div>
        <h1 className="font-serif text-3xl font-bold">উমা</h1>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          {date === null ? (
            'A puzzle and a question, every day of the pujo season'
          ) : (
            <>
              <span>
                Day {n! + 1} of {UMA_SEASON_DAYS} · {dayLabel(date)}
              </span>
              {isToday && <Badge variant="genda">Today</Badge>}
              {!isToday && !isFuture && (
                <Badge variant="outline">
                  <History className="size-3" /> An earlier day
                </Badge>
              )}
              {isFuture && (
                <Badge variant="aparajita">
                  <Eye className="size-3" /> Maestro preview
                </Badge>
              )}
            </>
          )}
        </p>
      </div>

      <DayPager count={UMA_SEASON_DAYS} selected={n} today={todayN} lastOpen={lastOpen} onSelect={select} />

      {date === null || n === null ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 pt-5 text-center">
            <img
              src={UMA_PUZZLES[UMA_SEASON_DAYS - 1]!.src}
              alt="Maa Durga on Dashami"
              className="aspect-square w-full max-w-sm rounded-xl border object-cover"
            />
            <p lang="bn" className="font-serif text-2xl">
              আসছে বছর আবার হবে
            </p>
            <p className="text-sm text-muted-foreground">(Next year, it will happen again.)</p>
            <p className="max-w-sm text-sm">
              This year's puzzles and questions ended on Dashami, 21 October 2026. Thank you for playing — pick any
              date above to look back, and উমা will be back with the next pujo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2" role="tablist">
            {tabs.map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                role="tab"
                aria-selected={tab === key}
                size="sm"
                variant={tab === key ? 'default' : 'outline'}
                onClick={() => setTab(key)}
              >
                <Icon /> {label}
              </Button>
            ))}
            {!isToday && !seasonOver && (
              <Button size="sm" variant="ghost" className="ml-auto" onClick={() => select(todayN)}>
                Back to today
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="pt-5">
              {isFuture && (
                <p className="mb-4 rounded-md bg-aparajita/10 px-3 py-2 text-xs text-muted-foreground">
                  A preview of a day still to come — play it freely; nothing is saved, and members see it on{' '}
                  {dayLabel(date)} from 5 am.
                </p>
              )}
              {tab === 'puzzle' && image ? (
                <SlidingPuzzle key={date} date={date} image={image} live={isToday} persist={!isFuture} />
              ) : question ? (
                <DailyQuiz key={date} date={date} question={question} live={isToday} persist={!isFuture} />
              ) : (
                <p className="text-sm text-muted-foreground">This day's game is on its way.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
