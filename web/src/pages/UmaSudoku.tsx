import { Eraser, Lightbulb, RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * উমা Mini Sudoku — a small, friendly 6×6: digits 1–6, boxes of 2×3.
 * Deliberately gentle: few blanks, every puzzle solvable one forced step at a
 * time (the generator only removes a cell while simple elimination can still
 * finish the grid — no guessing, ever), wrong digits turn red immediately,
 * and a Hint fills a square.
 */
const N = 6
const BOX_R = 2
const BOX_C = 3
const CELLS = N * N
const BLANKS = 14
/** One tone per digit — the board doubles as a colour swatch. */
const TONES = ['jaba', 'genda', 'durba', 'sharat', 'jarul', 'padma'] as const

const shuffle = <T,>(xs: T[]): T[] => {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/** Peers of a cell: same row, column and 2×3 box. */
const PEERS: number[][] = Array.from({ length: CELLS }, (_, i) => {
  const r = Math.floor(i / N)
  const c = i % N
  const set = new Set<number>()
  for (let k = 0; k < N; k++) {
    set.add(r * N + k)
    set.add(k * N + c)
  }
  const r0 = Math.floor(r / BOX_R) * BOX_R
  const c0 = Math.floor(c / BOX_C) * BOX_C
  for (let dr = 0; dr < BOX_R; dr++) for (let dc = 0; dc < BOX_C; dc++) set.add((r0 + dr) * N + c0 + dc)
  set.delete(i)
  return [...set]
})

const candidates = (g: (number | null)[], i: number): number[] => {
  const used = new Set(PEERS[i]!.map((p) => g[p]).filter((v) => v != null))
  return Array.from({ length: N }, (_, v) => v).filter((v) => !used.has(v))
}

/** Can forced moves alone finish this grid? (⇒ unique solution, zero guessing) */
function solvableBySingles(puzzle: (number | null)[]): boolean {
  const g = [...puzzle]
  let progress = true
  while (progress) {
    progress = false
    for (let i = 0; i < CELLS; i++) {
      if (g[i] != null) continue
      const cand = candidates(g, i)
      if (cand.length === 0) return false
      if (cand.length === 1) {
        g[i] = cand[0]!
        progress = true
      }
    }
  }
  return g.every((v) => v != null)
}

/** A random solved 6×6: relabel + permute a canonical grid. */
function makeSolution(): number[] {
  const symbols = shuffle(Array.from({ length: N }, (_, v) => v))
  const rows = shuffle([0, 1, 2]).flatMap((band) => shuffle([0, 1]).map((i) => band * BOX_R + i))
  const cols = shuffle([0, 1]).flatMap((stack) => shuffle([0, 1, 2]).map((i) => stack * BOX_C + i))
  const out: number[] = []
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++) {
      const rr = rows[r]!
      const cc = cols[c]!
      out.push(symbols[(rr * BOX_C + Math.floor(rr / BOX_R) + cc) % N]!)
    }
  return out
}

interface Game {
  solution: number[]
  given: boolean[]
  cells: (number | null)[]
}

function makeGame(): Game {
  const solution = makeSolution()
  const cells: (number | null)[] = [...solution]
  let blanks = 0
  for (const i of shuffle(Array.from({ length: CELLS }, (_, k) => k))) {
    if (blanks >= BLANKS) break
    const keep = cells[i]!
    cells[i] = null
    if (solvableBySingles(cells)) blanks++
    else cells[i] = keep
  }
  return { solution, given: cells.map((v) => v != null), cells }
}

export function MiniSudoku() {
  const [game, setGame] = useState<Game>(makeGame)
  const [sel, setSel] = useState<number | null>(null)
  const [highlight, setHighlight] = useState<number | null>(null)

  const { solution, given, cells } = game
  const wrong = useMemo(
    () => cells.map((v, i) => v != null && !given[i] && v !== solution[i]),
    [cells, given, solution],
  )
  const solved = cells.every((v, i) => v === solution[i])
  const remaining = useMemo(() => {
    const n = Array(N).fill(N) as number[]
    for (const v of cells) if (v != null) n[v]!--
    return n
  }, [cells])

  const restart = () => {
    setGame(makeGame())
    setSel(null)
    setHighlight(null)
  }
  const setCell = (i: number, v: number | null) =>
    setGame((g) => ({ ...g, cells: g.cells.map((c, k) => (k === i ? v : c)) }))
  const place = (v: number | null) => {
    if (sel == null || given[sel]) return
    setCell(sel, v)
    setHighlight(v)
  }
  const hint = () => {
    const target =
      sel != null && cells[sel] !== solution[sel] ? sel : cells.findIndex((v, i) => v !== solution[i])
    if (target < 0) return
    setCell(target, solution[target]!)
    setSel(null)
    setHighlight(solution[target]!)
  }
  const tapCell = (i: number) => {
    if (given[i]) {
      setHighlight((h) => (h === cells[i] ? null : cells[i]))
      setSel(null)
    } else {
      setSel(i)
      if (cells[i] != null) setHighlight(cells[i])
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif">উমা Mini Sudoku</CardTitle>
        <p className="text-sm text-muted-foreground">
          A little 6×6: every row, every column and every 2×3 box needs the digits 1 to 6 exactly
          once. Tap an empty square, then tap a digit. Wrong digits turn red at once, hints are
          free, and there is always a square with only one possibility — no guessing needed.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {solved && (
          <p className="w-full rounded-md bg-durba/15 px-3 py-2 text-center text-sm font-semibold">
            👏 সিদ্ধি! Solved — well played!
          </p>
        )}
        <div
          className="grid w-full max-w-xs select-none grid-cols-6 overflow-hidden rounded-lg border-2 border-foreground/60"
          role="grid"
          aria-label="Mini sudoku board"
        >
          {cells.map((v, i) => {
            const r = Math.floor(i / N)
            const c = i % N
            return (
              <button
                key={i}
                type="button"
                role="gridcell"
                aria-label={`row ${r + 1} column ${c + 1}${v != null ? `, ${v + 1}` : ', empty'}`}
                onClick={() => tapCell(i)}
                style={v != null ? ({ '--tone': `var(--${TONES[v]})` } as React.CSSProperties) : undefined}
                className={cn(
                  'flex aspect-square items-center justify-center border-border text-lg font-bold sm:text-xl',
                  c > 0 && 'border-l',
                  r > 0 && 'border-t',
                  c % BOX_C === 0 && c > 0 && 'border-l-2 border-l-foreground/60',
                  r % BOX_R === 0 && r > 0 && 'border-t-2 border-t-foreground/60',
                  v != null ? '[background:color-mix(in_srgb,var(--tone)_20%,var(--card))]' : 'bg-card',
                  given[i] ? 'text-foreground' : 'text-foreground/80',
                  sel === i && 'ring-2 ring-inset ring-primary',
                  highlight != null && v === highlight && 'ring-2 ring-inset ring-foreground/50',
                  wrong[i] && 'text-destructive underline decoration-2',
                )}
              >
                {v != null ? v + 1 : ''}
              </button>
            )
          })}
        </div>
        <div className="flex w-full max-w-xs justify-center gap-1.5">
          {TONES.map((tone, v) => (
            <button
              key={v}
              type="button"
              onClick={() => (sel != null && !given[sel] ? place(v) : setHighlight((h) => (h === v ? null : v)))}
              style={{ '--tone': `var(--${tone})` } as React.CSSProperties}
              className={cn(
                'flex aspect-square flex-1 flex-col items-center justify-center rounded-md border text-lg font-bold',
                '[background:color-mix(in_srgb,var(--tone)_16%,var(--card))]',
                'hover:[background:color-mix(in_srgb,var(--tone)_30%,var(--card))]',
                highlight === v && 'border-foreground/60',
                remaining[v] === 0 && 'opacity-40',
              )}
            >
              {v + 1}
              <span className="text-[9px] font-normal text-muted-foreground">{remaining[v]} left</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" size="sm" onClick={hint} disabled={solved}>
            <Lightbulb /> Hint
          </Button>
          <Button variant="outline" size="sm" onClick={() => place(null)} disabled={sel == null || given[sel]}>
            <Eraser /> Erase
          </Button>
          <Button variant="outline" size="sm" onClick={restart}>
            <RotateCcw /> New game
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
