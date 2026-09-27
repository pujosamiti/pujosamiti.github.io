import { useId } from 'react'
import type * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Alpona motifs as line-work: one line in currentColor, bindu dots the only
 * fill, the stroke kept even at any size (non-scaling). White on the red
 * bands, as rice paste on a red floor; crimson on the tant, like kantha
 * stitching. The same set is drawn on /brandcolours. Placed, not sprinkled:
 * mastheads, dividers, a day's mark — never wallpaper behind reading.
 */
const dot = (cx: number, cy: number, r = 1.4) => <circle key={`${cx},${cy}`} cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" />

const fish = (
  <>
    <path d="M-40 0 Q -10 -22 20 0 Q -10 22 -40 0 Z" />
    <path d="M20 0 L38 -12 L38 12 Z" />
    <path d="M-8 -8 Q -4 0 -8 8" opacity={0.85} />
    <path d="M2 -7 Q 6 0 2 7" opacity={0.85} />
  </>
)

const foot = (
  <>
    <path d="M0 -14 C8 -14 11 -6 9.5 3 C8 11 9 20 3 24 C-3 27 -8 22 -7 14 C-6 7 -9 0 -8.5 -6 C-8 -11 -4.5 -14 0 -14 Z" />
    <circle cx="-6.5" cy="-19.5" r="2.4" />
    <circle cx="-1.6" cy="-21.6" r="2.2" />
    <circle cx="3" cy="-21.2" r="2" />
    <circle cx="6.9" cy="-19" r="1.8" />
    <circle cx="9.8" cy="-15.6" r="1.6" />
    <circle cx="0.5" cy="4" r="3.4" />
    {dot(0.5, 4, 0.9)}
  </>
)

const turn = (n: number, step: number, el: (deg: number) => React.ReactNode) =>
  Array.from({ length: n }, (_, i) => el(i * step))

const MOTIFS = {
  /** podmo — the lotus */
  podmo: {
    vb: '-42 -40 84 50',
    body: (
      <>
        <circle r="7" />
        <path d="M0 -12 Q 8 -26 0 -38 Q -8 -26 0 -12" />
        <path d="M11 -6 Q 26 -13 34 -24 Q 20 -24 8 -14" transform="rotate(10)" />
        <path d="M-11 -6 Q -26 -13 -34 -24 Q -20 -24 -8 -14" transform="rotate(-10)" />
        <path d="M13 2 Q 30 2 40 -6 Q 26 -12 10 -6" />
        <path d="M-13 2 Q -30 2 -40 -6 Q -26 -12 -10 -6" />
      </>
    ),
  },
  /** kalka — the paisley */
  kalka: {
    vb: '-26 -40 50 64',
    body: (
      <>
        <path d="M0 20 Q -24 12 -22 -10 Q -20 -30 0 -32 Q 18 -33 16 -14 Q 22 -26 14 -36" />
        <circle cx="-4" cy="-8" r="4" />
        <circle cx="-4" cy="-8" r="9" opacity={0.7} />
      </>
    ),
  },
  /** maach — the fish, shubho */
  maach: {
    vb: '-42 -22 84 44',
    body: (
      <>
        {fish}
        {dot(-24, -3, 2.4)}
      </>
    ),
  },
  /** dhaner shish — the ear of paddy (one of the nabapatrika's nine) */
  dhanerShish: {
    vb: '-16 -44 38 70',
    body: (
      <path d="M0 24 Q -2 -8 6 -34 M4 -28 Q 14 -30 20 -38 M2 -18 Q 12 -20 18 -28 M0 -8 Q 10 -10 16 -18 M5 -30 Q -4 -34 -10 -42 M3 -20 Q -6 -24 -12 -32 M1 -10 Q -8 -14 -14 -22" />
    ),
  },
  /** Lakshmir pa — Lakshmi's footsteps, walking in */
  lakshmirPa: {
    vb: '-25 -29 50 60',
    body: (
      <>
        <g transform="translate(12,-4)">{foot}</g>
        <g transform="translate(-12,5) scale(-1,1)">{foot}</g>
      </>
    ),
  },
  /** shatadal — the hundred-petal lotus, the heart of a floor alpona */
  shatadal: {
    vb: '-32 -32 64 64',
    body: (
      <>
        <circle r="4" />
        {turn(8, 45, (d) => (
          <path key={d} d="M0 -7 Q 5.5 -13.5 0 -20 Q -5.5 -13.5 0 -7 Z" transform={`rotate(${d})`} />
        ))}
        <circle r="24" />
        {turn(8, 45, (d) => (
          <path key={`o${d}`} d="M0 -24 Q 4 -27 0 -31 Q -4 -27 0 -24" transform={`rotate(${d + 22.5})`} />
        ))}
        {dot(0, 0, 1.3)}
        {turn(8, 45, (d) => (
          <circle key={`d${d}`} cy="-29" r="1.4" transform={`rotate(${d})`} fill="currentColor" stroke="none" />
        ))}
      </>
    ),
  },
  /** mangal ghot — the auspicious pot, mango leaves and a green coconut */
  mangalGhot: {
    vb: '-26 -34 52 66',
    body: (
      <>
        {[-52, -26, 26, 52].map((d) => (
          <path key={d} d="M0 -12 Q 4.5 -20 0 -29 Q -4.5 -20 0 -12 Z" transform={`rotate(${d} 0 -12)`} />
        ))}
        <circle cy="-19" r="6.5" />
        <path d="M-8 -7 L-9 -12 L9 -12 L8 -7" />
        <path d="M-9 -7 C-24 -1 -22 20 -8 24 L8 24 C22 20 24 -1 9 -7 Z" />
        <path d="M-17 3 Q 0 10 17 3" />
        <path d="M-7 24 L-9 30 L9 30 L7 24" />
        {[dot(-10, 13, 1.3), dot(-5, 15, 1.3), dot(0, 15.6, 1.3), dot(5, 15, 1.3), dot(10, 13, 1.3)]}
      </>
    ),
  },
  /** prodip — the earthen lamp */
  prodip: {
    vb: '-25 -34 55 58',
    body: (
      <>
        <path d="M-22 -2 C-20 12 4 16 15 7 L27 -5 L13 -3 C3 -3 -10 -4 -22 -2 Z" />
        <path d="M22 -10 C16 -16 19 -24 24 -32 C29 -24 31 -16 22 -10 Z" />
        <path d="M23 -14 Q 21 -19 24 -24" />
        <path d="M-6 13 L-8 21 M8 12 L10 21 M-12 21 L14 21" />
        {[dot(-14, 4, 1.3), dot(-8, 6.5, 1.3), dot(-2, 7.5, 1.3), dot(4, 7, 1.3)]}
      </>
    ),
  },
  /** pan pata — the betel leaf of the boron */
  panPata: {
    vb: '-27 -34 54 66',
    body: (
      <>
        <path d="M0 -20 C-10 -30 -30 -18 -24 -2 C-18 12 -6 20 0 30 C6 20 18 12 24 -2 C30 -18 10 -30 0 -20 Z" />
        <path d="M0 -20 L0 25" />
        <path d="M0 -8 Q -10 -10 -18 -4 M0 -8 Q 10 -10 18 -4 M0 4 Q -9 4 -15 10 M0 4 Q 9 4 15 10 M0 14 Q -5 15 -8 19 M0 14 Q 5 15 8 19" />
        <path d="M0 -20 Q 2 -27 7 -32" />
      </>
    ),
  },
  /** shankha — the conch */
  shankha: {
    vb: '-24 -34 44 68',
    body: (
      <>
        <path d="M1 -31 C7 -23 17 -13 17 0 C17 12 9 22 3 31 C-3 23 -13 15 -14 2 C-15 -12 -6 -23 1 -31 Z" />
        <path d="M-5 -23 Q 1 -20 7 -23 M-9 -15 Q 1 -11 12 -15 M-13 -6 Q 1 -1 16 -6" />
        <path d="M-14 2 C-23 9 -19 22 -3 27" />
        <path d="M-7 3 C-9 11 -5 19 1 24" />
        {[dot(7, 4, 1.3), dot(9, 10, 1.3), dot(6, 16, 1.3)]}
      </>
    ),
  },
  /** pencha — Lakshmi's owl */
  pencha: {
    vb: '-22 -30 44 64',
    body: (
      <>
        <path d="M0 -20 C16 -20 20 -4 18 10 C16 22 8 28 0 28 C-8 28 -16 22 -18 10 C-20 -4 -16 -20 0 -20 Z" />
        <path d="M-14 -15 L-16 -27 L-7 -19 M14 -15 L16 -27 L7 -19" />
        <circle cx="-7" cy="-8" r="6" />
        <circle cx="7" cy="-8" r="6" />
        <path d="M-2.5 -1.5 L0 3.5 L2.5 -1.5" />
        <path d="M-8 10 L0 15 L8 10 M-6 17 L0 21 L6 17" />
        <path d="M-6 28 V32 M6 28 V32" />
        {[dot(-7, -8, 2.1), dot(7, -8, 2.1)]}
      </>
    ),
  },
  /** jora maach — the fish pair, drawn for weddings and Bijoya */
  joraMaach: {
    vb: '-26 -28 52 56',
    body: (
      <>
        <g transform="translate(2,-13) scale(.55)">{fish}</g>
        <g transform="translate(-2,14) scale(-.55,.55)">{fish}</g>
        {[dot(-11.2, -14.6, 1.3), dot(11.2, 12.4, 1.3)]}
      </>
    ),
  },
  /** rajhansh — Saraswati's swan */
  rajhansh: {
    vb: '-30 -30 58 58',
    body: (
      <>
        <path d="M-22 6 Q -20 18 0 18 Q 20 18 24 4 Q 12 10 4 4" />
        <path d="M-22 6 L-28 -3 L-17 2" />
        <path d="M4 4 C6 -6 -6 -10 -4 -20 C-3 -27 6 -28 8 -22" />
        <path d="M8 -22 L14 -20 L8 -18" />
        <path d="M-16 8 Q -4 -2 10 8 M-12 12 Q -2 6 8 12" />
        <path d="M-26 25 Q -20 22 -14 25 T -2 25 T 10 25 T 22 25" />
        {dot(3.6, -22.3, 1.2)}
      </>
    ),
  },
} as const

export type AlponaName = keyof typeof MOTIFS

export function Alpona({
  name,
  className,
  title,
  strokeWidth = 1.6,
}: {
  name: AlponaName
  className?: string
  /** Say what it is when it carries meaning on its own; otherwise it is decoration. */
  title?: string
  strokeWidth?: number
}) {
  const m = MOTIFS[name]
  return (
    <svg
      viewBox={m.vb}
      className={cn('inline-block shrink-0 [&_*]:[vector-effect:non-scaling-stroke]', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {m.body}
    </svg>
  )
}

/**
 * A section divider: a thin line, a bindu, the motif, a bindu, a line —
 * crimson on the tant. For chapter mastheads and a page's turn.
 */
export function AlponaDivider({ name, className }: { name: AlponaName; className?: string }) {
  return (
    <div aria-hidden="true" className={cn('flex items-center gap-2 text-primary/75', className)}>
      <span className="h-px flex-1 bg-current opacity-50" />
      <span className="size-1.5 rounded-full bg-current" />
      <Alpona name={name} className="h-9 w-auto max-w-16" />
      <span className="size-1.5 rounded-full bg-current" />
      <span className="h-px flex-1 bg-current opacity-50" />
    </div>
  )
}

/**
 * The lata — the creeper that runs round a floor alpona — as a repeating
 * border, fixed-size tiles so it stays delicate at any width (like AlponaBand).
 */
export function LataBorder({ className }: { className?: string }) {
  const id = useId()
  return (
    <svg className={cn('block h-10 w-full', className)} aria-hidden="true">
      <defs>
        <pattern id={id} width="120" height="40" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M0 20 C20 6 40 6 60 20 C80 34 100 34 120 20" />
            <path d="M34 9.5 C40 1 49 3 47 10 C46 13.5 41.5 12.5 42.5 9.5" />
            <path d="M94 30.5 C100 39 109 37 107 30 C106 26.5 101.5 27.5 102.5 30.5" />
            <path d="M17 11.5 C13 4 6 2 1 4 C5 10 11 13 17 11.5 Z" />
            <path d="M77 28.5 C73 36 66 38 61 36 C65 30 71 27 77 28.5 Z" />
          </g>
          <circle cx="30" cy="25" r="1.6" fill="currentColor" />
          <circle cx="90" cy="15" r="1.6" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}
