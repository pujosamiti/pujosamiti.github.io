import { Eye, Hash, RotateCcw, Shuffle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { BadgeCard } from '@/components/uma/BadgeCard'
import { BadgeOverlay } from '@/components/uma/BadgeOverlay'
import { Confetti } from '@/components/uma/Confetti'
import { PUZZLE_BADGES, badgeFor } from '@/content/uma-badges'
import type { UmaPuzzleImage } from '@/content/uma-puzzles'
import { formatCountdown, msToNextDay, readLocal, seededRandom, writeLocal } from '@/lib/umaDaily'
import { cn } from '@/lib/utils'

/**
 * The daily face puzzle: a 3 × 3 sliding puzzle (the 15-puzzle's small
 * cousin). Eight tiles carry pieces of Maa's photograph; the ninth square,
 * bottom-right, is the gap. Drag a tile in the gap's row or column toward the
 * gap — it follows the finger or mouse, carrying any tiles between, and
 * settles in when let go past a third of the way (or flicked); a short drag
 * springs back. A tap slides it straight in, and arrow keys work too.
 *
 * Dragging uses Pointer Events, one code path for mouse, pen and touch —
 * Chrome and Safari on desktop, iPhone Safari and Android Chrome alike. The
 * tiles set touch-action: none so a finger drag moves the tile rather than
 * scrolling the page.
 *
 * Solving sets off confetti and earns one of five badges by time — within 1,
 * 1¼, 1½, 1¾ or 2 minutes — each a face of Maa and a prayer from the
 * Pushpanjali (Bengali script, English meaning). Practice rounds earn them too.
 *
 * The day's shuffle is seeded by the date, so every phone gets the same
 * puzzle, and it is made by random legal moves from the finished picture —
 * so it is always solvable (half of all random arrangements are not).
 */
const N = 3
const CELLS = N * N
const GAP = CELLS - 1 // tile id of the gap; its home is the bottom-right corner
const SOLVED = Array.from({ length: CELLS }, (_, i) => i)

const rowOf = (i: number) => Math.floor(i / N)
const colOf = (i: number) => i % N
const isSolved = (b: number[]) => b.every((t, i) => t === i)
const misplaced = (b: number[]) => b.filter((t, i) => t !== GAP && t !== i).length

function neighbours(i: number): number[] {
  const out: number[] = []
  if (rowOf(i) > 0) out.push(i - N)
  if (rowOf(i) < N - 1) out.push(i + N)
  if (colOf(i) > 0) out.push(i - 1)
  if (colOf(i) < N - 1) out.push(i + 1)
  return out
}

/** A well-mixed, always-solvable board: random legal moves, never undoing the last one. */
function shuffleBoard(random: () => number): number[] {
  const b = [...SOLVED]
  let gap = GAP
  let came = -1
  for (let step = 0; step < 400 && (step < 60 || misplaced(b) < 6); step++) {
    const options = neighbours(gap).filter((n) => n !== came)
    const next = options[Math.floor(random() * options.length)]!
    b[gap] = b[next]!
    b[next] = GAP
    came = gap
    gap = next
  }
  return b
}

/**
 * Slide the tile at `pos` toward the gap, carrying any tiles between.
 * Returns the new board and how many tiles moved (0 = not in line with the gap).
 */
function slide(board: number[], pos: number): [number[], number] {
  const gap = board.indexOf(GAP)
  const sameRow = rowOf(pos) === rowOf(gap)
  const sameCol = colOf(pos) === colOf(gap)
  if (pos === gap || (!sameRow && !sameCol)) return [board, 0]
  const step = sameRow ? (pos < gap ? -1 : 1) : pos < gap ? -N : N
  const b = [...board]
  let moved = 0
  for (let at = gap; at !== pos; at += step) {
    b[at] = b[at + step]!
    moved++
  }
  b[pos] = GAP
  return [b, moved]
}

/**
 * The tiles a drag carries: from the grabbed position up to the one beside
 * the gap, plus the axis and direction toward the gap. Null when the tile is
 * not in line with the gap.
 */
function lineToGap(board: number[], pos: number): { group: number[]; axis: 'x' | 'y'; sign: 1 | -1 } | null {
  const gap = board.indexOf(GAP)
  if (pos === gap) return null
  if (rowOf(pos) === rowOf(gap)) {
    const sign = gap > pos ? 1 : -1
    const group: number[] = []
    for (let at = pos; at !== gap; at += sign) group.push(at)
    return { group, axis: 'x', sign }
  }
  if (colOf(pos) === colOf(gap)) {
    const sign = gap > pos ? 1 : -1
    const group: number[] = []
    for (let at = pos; at !== gap; at += sign * N) group.push(at)
    return { group, axis: 'y', sign }
  }
  return null
}

interface Drag {
  pointerId: number
  pos: number
  group: number[]
  axis: 'x' | 'y'
  sign: 1 | -1
  startX: number
  startY: number
  /** One cell's size in CSS pixels, measured at grab time. */
  cell: number
  /** How far the carried tiles have travelled toward the gap, 0…cell. */
  offset: number
  /** Past the tap threshold — a real drag, not a tap. */
  moved: boolean
  lastT: number
  lastOffset: number
  velocity: number
}

const TAP_SLOP = 6 // px a tap may wobble before it counts as a drag
const COMMIT_SHARE = 0.35 // let go past this share of a cell and the tiles settle in
const FLICK_SPEED = 0.45 // px/ms toward the gap — a quick flick commits a shorter drag

const clock = (secs: number) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`

interface Progress {
  board: number[]
  moves: number
  startedAt: number | null
}
interface Result {
  moves: number
  secs: number
}

export function SlidingPuzzle({
  date,
  image,
  live = true,
  persist = true,
}: {
  date: string
  image: UmaPuzzleImage
  /** Today's puzzle — shows the countdown to the next one. */
  live?: boolean
  /** Remember progress and the result on this phone (off for an admin's preview of a future day). */
  persist?: boolean
}) {
  const progressKey = `uma-puzzle-${date}`
  const resultKey = `uma-puzzle-result-${date}`
  const start = () => shuffleBoard(seededRandom(`uma-puzzle-${date}`))

  const [progress, setProgress] = useState<Progress>(() => {
    const saved = persist ? readLocal<Progress>(progressKey) : null
    return saved && saved.board?.length === CELLS ? saved : { board: start(), moves: 0, startedAt: null }
  })
  // Today's first solve is the one that counts; later rounds are practice.
  const [result, setResult] = useState<Result | null>(() => (persist ? readLocal<Result>(resultKey) : null))
  const [practice, setPractice] = useState(false)
  const [practiceResult, setPracticeResult] = useState<Result | null>(null)
  // Numbers help most people; on unless this phone switched them off.
  const [numbers, setNumbers] = useState(() => readLocal<boolean>('uma-puzzle-numbers') ?? true)
  const [drag, setDrag] = useState<Drag | null>(null)
  // A drag ends with a pointerup that browsers may follow with a click; that
  // click must not slide the tile a second time.
  const swallowClick = useRef(false)
  // the win: confetti and the badge floating over the game for ten seconds,
  // then the same card, settled beneath the picture, brought into view
  const [burst, setBurst] = useState(0)
  const [overlayOpen, setOverlayOpen] = useState(0)
  const badgeRef = useRef<HTMLDivElement>(null)
  const settle = () => {
    setOverlayOpen(0)
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    requestAnimationFrame(() => badgeRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }))
  }
  const [peeking, setPeeking] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const gridRef = useRef<HTMLDivElement>(null)

  const solved = isSolved(progress.board)
  const running = !!progress.startedAt && !solved

  // tick the clock while a round is running, and the countdown once it's done
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), running ? 1000 : 30_000)
    return () => clearInterval(t)
  }, [running])

  useEffect(() => {
    if (!practice && persist) writeLocal(progressKey, progress)
  }, [progress, practice, persist, progressKey])

  const move = (pos: number) => {
    if (solved) return
    const [board, moved] = slide(progress.board, pos)
    if (!moved) return
    const startedAt = progress.startedAt ?? Date.now()
    const next = { board, moves: progress.moves + moved, startedAt }
    setProgress(next)
    if (isSolved(board)) {
      setBurst(Date.now())
      setOverlayOpen(Date.now())
      const done = { moves: next.moves, secs: Math.max(1, Math.round((Date.now() - startedAt) / 1000)) }
      if (practice) setPracticeResult(done)
      else if (!result) {
        setResult(done)
        if (persist) writeLocal(resultKey, done)
      }
    }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>, pos: number) => {
    swallowClick.current = false
    if (solved || (e.pointerType === 'mouse' && e.button !== 0)) return
    const line = lineToGap(progress.board, pos)
    if (!line || !gridRef.current) return
    e.preventDefault() // no text selection or native image drag on desktop
    try {
      // keep receiving moves even when the finger strays off the tile
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* capture is a nicety; the drag still works within the tile */
    }
    setDrag({
      pointerId: e.pointerId,
      pos,
      ...line,
      startX: e.clientX,
      startY: e.clientY,
      cell: gridRef.current.clientWidth / N,
      offset: 0,
      moved: false,
      lastT: e.timeStamp,
      lastOffset: 0,
      velocity: 0,
    })
  }

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag || e.pointerId !== drag.pointerId) return
    const along = (drag.axis === 'x' ? e.clientX - drag.startX : e.clientY - drag.startY) * drag.sign
    const offset = Math.min(drag.cell, Math.max(0, along))
    const dt = Math.max(1, e.timeStamp - drag.lastT)
    setDrag({
      ...drag,
      offset,
      moved: drag.moved || Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > TAP_SLOP,
      velocity: (offset - drag.lastOffset) / dt,
      lastT: e.timeStamp,
      lastOffset: offset,
    })
  }

  const onPointerEnd = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag || e.pointerId !== drag.pointerId) return
    setDrag(null)
    if (e.type === 'pointercancel') return
    if (!drag.moved) {
      // a tap: slide straight in, and ignore the click that follows
      swallowClick.current = true
      move(drag.pos)
      return
    }
    swallowClick.current = true
    const committed = drag.offset > drag.cell * COMMIT_SHARE || (drag.velocity > FLICK_SPEED && drag.offset > TAP_SLOP)
    if (committed) move(drag.pos)
  }

  const onKey = (e: React.KeyboardEvent) => {
    const gap = progress.board.indexOf(GAP)
    // the arrow names the direction a tile travels into the gap
    const from: Record<string, number | null> = {
      ArrowLeft: colOf(gap) < N - 1 ? gap + 1 : null,
      ArrowRight: colOf(gap) > 0 ? gap - 1 : null,
      ArrowUp: rowOf(gap) < N - 1 ? gap + N : null,
      ArrowDown: rowOf(gap) > 0 ? gap - N : null,
    }
    if (!(e.key in from)) return
    e.preventDefault()
    const pos = from[e.key]
    if (pos != null) move(pos)
  }

  const restartToday = () => {
    setPractice(false)
    setPracticeResult(null)
    setProgress({ board: start(), moves: 0, startedAt: null })
  }
  const playAgain = () => {
    setPractice(true)
    setPracticeResult(null)
    setProgress({ board: shuffleBoard(Math.random), moves: 0, startedAt: null })
    gridRef.current?.focus()
  }

  const elapsed = progress.startedAt ? Math.round((now - progress.startedAt) / 1000) : 0
  const shown = practice ? practiceResult : result

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full max-w-sm items-center justify-between text-sm text-muted-foreground">
        <span>
          <span className="font-medium text-foreground">{progress.moves}</span> move{progress.moves === 1 ? '' : 's'}
        </span>
        {practice && <span className="text-xs">Practice round</span>}
        <span className="tabular-nums">{solved && shown ? clock(shown.secs) : clock(elapsed)}</span>
      </div>

      <div
        ref={gridRef}
        tabIndex={0}
        onKeyDown={onKey}
        role="group"
        aria-label="Sliding puzzle. Drag or tap a tile in line with the gap, or use the arrow keys."
        className="relative aspect-square w-full max-w-sm touch-manipulation select-none overflow-hidden rounded-xl border bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {SOLVED.map((tile) => {
          const pos = progress.board.indexOf(tile)
          const isGap = tile === GAP
          if (isGap && !solved) return null
          const carried = drag?.group.includes(pos) ? drag : null
          const shift = carried ? carried.offset * carried.sign : 0
          const dx = carried?.axis === 'x' ? shift : 0
          const dy = carried?.axis === 'y' ? shift : 0
          return (
            <button
              key={tile}
              type="button"
              tabIndex={-1}
              disabled={solved}
              onPointerDown={(e) => onPointerDown(e, pos)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerEnd}
              onPointerCancel={onPointerEnd}
              onClick={() => {
                // clicks with no pointer behind them (screen readers, switch access)
                if (swallowClick.current) swallowClick.current = false
                else move(pos)
              }}
              onDragStart={(e) => e.preventDefault()}
              aria-label={isGap ? 'The last piece' : `Tile ${tile + 1}`}
              className={cn(
                'absolute left-0 top-0 h-1/3 w-1/3 cursor-grab touch-none active:cursor-grabbing',
                // follow the pointer exactly while carried; glide everywhere else
                !carried && 'transition-transform duration-150 ease-out motion-reduce:transition-none',
                solved && 'cursor-default',
              )}
              style={{
                transform: `translate(calc(${colOf(pos) * 100}% + ${dx}px), calc(${rowOf(pos) * 100}% + ${dy}px))`,
              }}
            >
              <span
                className={cn(
                  'absolute bg-no-repeat transition-[inset,border-radius] duration-300',
                  solved ? 'inset-0 rounded-none' : 'inset-[2px] rounded-md shadow-sm',
                  isGap && 'animate-in fade-in duration-500',
                )}
                style={{
                  backgroundImage: `url(${image.src})`,
                  backgroundSize: `${N * 100}% ${N * 100}%`,
                  backgroundPosition: `${colOf(tile) * 50}% ${rowOf(tile) * 50}%`,
                }}
              />
              {numbers && !solved && (
                <span className="absolute left-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-background/85 text-xs font-semibold text-foreground">
                  {tile + 1}
                </span>
              )}
            </button>
          )
        })}
        {peeking && !solved && (
          <img src={image.src} alt="" className="absolute inset-0 size-full object-cover" draggable={false} />
        )}
      </div>
      <Confetti burst={burst} />
      {solved && shown && (
        <BadgeOverlay
          open={overlayOpen}
          onClose={settle}
          badges={PUZZLE_BADGES}
          earned={badgeFor(PUZZLE_BADGES, shown.secs)}
          secs={shown.secs}
          verb="solved"
        />
      )}

      {solved && shown ? (
        <div className="flex w-full max-w-sm flex-col items-center gap-2 text-center">
          <p className="font-serif text-lg">{image.caption}</p>
          {image.credit && <p className="-mt-2 text-[11px] text-muted-foreground">{image.credit}</p>}
          <p className="text-sm">
            {practice ? 'Solved again' : 'Solved'} in <span className="font-medium">{shown.moves} moves</span> ·{' '}
            {clock(shown.secs)}
          </p>
          <BadgeCard ref={badgeRef} badges={PUZZLE_BADGES} earned={badgeFor(PUZZLE_BADGES, shown.secs)} secs={shown.secs} verb="solved" />
          {!practice && result && live && (
            <p className="text-sm text-muted-foreground">A new puzzle in {formatCountdown(msToNextDay(now))}.</p>
          )}
          <Button size="sm" variant="outline" onClick={playAgain}>
            <Shuffle /> Play again
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onPointerDown={() => setPeeking(true)}
            onPointerUp={() => setPeeking(false)}
            onPointerLeave={() => setPeeking(false)}
            onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && setPeeking(true)}
            onKeyUp={() => setPeeking(false)}
            aria-label="Hold to see the whole picture"
          >
            <Eye /> Hold to peek
          </Button>
          <Button
            size="sm"
            variant={numbers ? 'secondary' : 'outline'}
            onClick={() => {
              setNumbers(!numbers)
              writeLocal('uma-puzzle-numbers', !numbers)
            }}
            aria-pressed={numbers}
          >
            <Hash /> Numbers
          </Button>
          <Button size="sm" variant="outline" onClick={practice ? playAgain : restartToday} disabled={!progress.moves}>
            <RotateCcw /> Start over
          </Button>
        </div>
      )}
    </div>
  )
}
