import { Check, ChevronRight, ExternalLink, Flame, RotateCcw, Timer, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { Confetti } from '@/components/uma/Confetti'
import type { BadgeCta } from '@/components/uma/BadgeCard'
import { BadgeCard } from '@/components/uma/BadgeCard'
import { BadgeOverlay } from '@/components/uma/BadgeOverlay'
import { QUIZ_BADGES, badgeFor } from '@/content/uma-badges'
import type { UmaQuizQuestion } from '@/content/uma-quiz'
import { titleFromSlug } from '@/lib/markdown'
import { formatCountdown, msToNextDay, readLocal, umaToday, writeLocal } from '@/lib/umaDaily'
import { playWinChime } from '@/lib/umaSound'
import { cn } from '@/lib/utils'

/** Bengali question papers letter their options ক খ গ ঘ. */
const LETTERS = ['ক', 'খ', 'গ', 'ঘ']
const LETTERS_EN = ['A', 'B', 'C', 'D']
const LOG_KEY = 'uma-quiz-log'

/** Today's answer on this phone: the option picked, how long it took, and which question it answered. */
interface Answer {
  picked: number
  secs: number | null
  /** The question's English text — if the day's question is ever corrected, an old answer no longer applies. */
  q?: string
}

const loadAnswer = (key: string, q: string): Answer | null => {
  const raw = readLocal<Answer | number>(key)
  return raw !== null && typeof raw === 'object' && raw.q === q ? raw : null
}

/** Days in a row answered correctly, ending today (or yesterday, if today is still open). */
function streakFrom(log: Record<string, boolean>, today: string): number {
  let day = Date.parse(today)
  if (log[today] === undefined) day -= 86_400_000
  let n = 0
  while (log[new Date(day).toISOString().slice(0, 10)] === true) {
    n++
    day -= 86_400_000
  }
  return n
}

const secsLabel = (s: number) => (s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`)

/**
 * The question of the day: one multiple-choice question from the samiti's
 * own Durga Puja guide, in Bengali with the English beneath in small type. One tap answers it — no second chances — then the
 * right answer, a line of explanation and a link to the chapter it came from.
 *
 * A clock runs from the moment the question is on screen. A right answer
 * sets off confetti and earns one of five badges by speed — a face of Maa and
 * a prayer from the Pushpanjali, in Bengali script with its English meaning. The
 * answer, its time and the streak live on this phone only.
 *
 * "Play again" clears the answer and restarts the clock — a phone is often
 * shared round the family. Replays celebrate like the first go, but the
 * streak counts only the day's first attempt.
 */
export function DailyQuiz({
  date,
  question,
  live = true,
  persist = true,
  cta,
}: {
  date: string
  question: UmaQuizQuestion
  /** A next step under the settled badge — the day's puzzle, while it is unsolved. */
  cta?: BadgeCta
  /** Today's question — counts toward the streak and shows the countdown. */
  live?: boolean
  /** Remember the answer on this phone (off for an admin's preview of a future day). */
  persist?: boolean
}) {
  const key = `uma-quiz-${date}`
  const [answer, setAnswer] = useState<Answer | null>(() => (persist ? loadAnswer(key, question.q) : null))
  const [log, setLog] = useState<Record<string, boolean>>(() => readLocal(LOG_KEY) ?? {})
  const [now, setNow] = useState(() => Date.now())
  const [burst, setBurst] = useState(0)
  const badgeRef = useRef<HTMLDivElement>(null)
  const [overlayOpen, setOverlayOpen] = useState(0)
  const shownAt = useRef(performance.now())
  const topRef = useRef<HTMLDivElement>(null)


  const answered = answer !== null
  const correct = answered && answer.picked === question.answer

  // a live clock while the question is open; the countdown afterwards
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), answered ? 30_000 : 500)
    return () => clearInterval(t)
  }, [answered])

  const choose = (i: number) => {
    if (answered) return
    const secs = Math.max(1, Math.round((performance.now() - shownAt.current) / 1000))
    const next = { picked: i, secs, q: question.q }
    setAnswer(next)
    if (persist) writeLocal(key, next)
    // the streak remembers the day's first attempt only, and only on the day itself
    if (live && log[date] === undefined) {
      const nextLog = { ...log, [date]: i === question.answer }
      setLog(nextLog)
      writeLocal(LOG_KEY, nextLog)
    }
    if (i === question.answer) {
      setBurst(Date.now())
      setOverlayOpen(Date.now())
      playWinChime() // inside the tap, so the browser allows the sound
    }
  }

  const playAgain = () => {
    setAnswer(null)
    if (persist) writeLocal(key, null)
    setBurst(0)
    setOverlayOpen(0)
    shownAt.current = performance.now()
    setNow(Date.now())
    topRef.current?.scrollIntoView({ block: 'start' })
  }

  const earned = correct && answer.secs !== null ? badgeFor(QUIZ_BADGES, answer.secs) : null

  // the overlay has had its ten seconds: bring the same card, settled below, into view
  const settle = () => {
    setOverlayOpen(0)
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    requestAnimationFrame(() => badgeRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }))
  }

  const streak = streakFrom(log, umaToday(now))
  const openSecs = Math.floor((performance.now() - shownAt.current) / 1000)
  const chapter = question.source ? `/durga-puja/${question.source}` : '/durga-puja'
  const chapterTitle = question.source ? titleFromSlug(question.source) : 'Durga Puja'
  const external = question.source === null ? question.readMore : undefined

  return (
    <div ref={topRef} className="flex scroll-mt-24 flex-col gap-4">
      <Confetti burst={burst} />
      {earned && answer?.secs != null && (
        <BadgeOverlay open={overlayOpen} onClose={settle} badges={QUIZ_BADGES} earned={earned} secs={answer.secs} verb="answered" />
      )}

      {!answered && (
        <p className="-mb-2 inline-flex items-center gap-1 self-end text-xs tabular-nums text-muted-foreground" aria-hidden="true">
          <Timer className="size-3.5" /> {secsLabel(openSecs)}
        </p>
      )}
      <div>
        <p lang="bn" className="font-serif text-xl leading-snug">{question.qBn}</p>
        <p lang="en" className="mt-1 text-xs text-muted-foreground">({question.q})</p>
      </div>

      <div className="flex flex-col gap-2" role="radiogroup" aria-label="Answers">
        {question.options.map((opt, i) => {
          const isAnswer = i === question.answer
          const isPicked = i === answer?.picked
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={isPicked}
              disabled={answered}
              onClick={() => choose(i)}
              className={cn(
                'flex items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm transition-colors',
                !answered && 'hover:border-primary/50 hover:bg-accent active:bg-accent',
                answered && isAnswer && 'border-durba bg-durba text-durba-foreground',
                answered && isPicked && !isAnswer && 'border-destructive bg-destructive/10 text-destructive',
                answered && !isAnswer && !isPicked && 'opacity-60',
              )}
            >
              <span
                className={cn(
                  'grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold',
                  answered && isAnswer && 'border-transparent bg-background/25',
                )}
              >
                {answered && isAnswer ? <Check className="size-4" /> : answered && isPicked ? <X className="size-4" /> : LETTERS[i]}
              </span>
              <span className="flex flex-col">
                <span lang="bn" className="text-[15px] leading-snug">{question.optionsBn[i]}</span>
                <span lang="en" className={cn('text-xs', answered && isAnswer ? 'opacity-85' : 'text-muted-foreground')}>
                  ({opt})
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {earned && answer?.secs != null && (
        <BadgeCard ref={badgeRef} badges={QUIZ_BADGES} earned={earned} secs={answer.secs} verb="answered" cta={cta} />
      )}

      {answered && (
        <div className="flex flex-col gap-2 rounded-lg bg-accent px-4 py-3 text-sm">
          <p className="font-medium">
            {correct ? 'ঠিক উত্তর!' : `সঠিক উত্তর: ${LETTERS[question.answer]}`}{' '}
            <span className="text-xs font-normal text-muted-foreground">
              ({correct ? 'Right!' : `The answer is ${LETTERS_EN[question.answer]}.`})
            </span>
          </p>
          <div>
            <p lang="bn">{question.explainBn}</p>
            <p lang="en" className="mt-1 text-xs text-muted-foreground">({question.explain})</p>
          </div>
          {external ? (
            <a
              href={external.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 self-start font-medium text-primary hover:underline"
            >
              Read more: {external.label} <ExternalLink className="size-3.5" />
            </a>
          ) : question.source !== null ? (
            <Link to={chapter} className="inline-flex items-center gap-1 self-start font-medium text-primary hover:underline">
              Read more: {chapterTitle} <ChevronRight className="size-4" />
            </Link>
          ) : null}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          {live && streak > 0 && (
            <>
              <Flame className="size-4 text-palash" /> {streak} day{streak === 1 ? '' : 's'} in a row
            </>
          )}
        </span>
        {answered && live && <span>Next question in {formatCountdown(msToNextDay(now))}</span>}
      </div>

      {answered && (
        <div className="flex flex-wrap justify-center gap-2">
          <Button size="sm" variant="outline" onClick={playAgain}>
            <RotateCcw /> Play again
          </Button>
        </div>
      )}
    </div>
  )
}
