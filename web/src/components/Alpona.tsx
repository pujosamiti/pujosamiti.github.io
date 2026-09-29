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

/** A point on a circle round the origin, angle in degrees (0° along +x, turning towards +y). */
const polar = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180
  return [+(r * Math.cos(a)).toFixed(2), +(r * Math.sin(a)).toFixed(2)] as const
}
/** A quarter circle round the corner at the origin. */
const quarter = (r: number) => `M${r} 0 A ${r} ${r} 0 0 1 0 ${r}`
/** Scallops standing on a quarter circle: `n` little arches between r and r + h. */
const scallops = (r: number, h: number, n: number) =>
  Array.from({ length: n }, (_, i) => {
    const a0 = (90 / n) * i
    const a1 = (90 / n) * (i + 1)
    const [x0, y0] = polar(r, a0)
    const [cx, cy] = polar(r + h, (a0 + a1) / 2)
    const [x1, y1] = polar(r, a1)
    return `M${x0} ${y0} Q ${cx} ${cy} ${x1} ${y1}`
  }).join(' ')

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
  /**
   * An alpona chevron, pointing down — two curved leaf-strokes meeting in a
   * point, a second pair inside, bindu dots at the tips: the "open me" mark
   * of a folded section (turned over when it is open).
   */
  chevron: {
    vb: '-14 -10 28 22',
    body: (
      <>
        <path d="M-11 -5 Q -5 -1 0 7 Q 5 -1 11 -5" />
        <path d="M-6 -6 Q -2.5 -3 0 1.5 Q 2.5 -3 6 -6" opacity={0.75} />
        {[dot(-12, -6.5, 1.3), dot(12, -6.5, 1.3), dot(0, 10.5, 1.3)]}
      </>
    ),
  },
  /**
   * dhak — the pujo's barrel drum, played across the body, its feather plume
   * rising from the rim; laced end to end. Faces right; mirror it for a pair.
   */
  dhak: {
    vb: '-40 -54 90 82',
    body: (
      <>
        <ellipse cx="-30" rx="6" ry="17" />
        <ellipse cx="30" rx="6" ry="17" />
        <ellipse cx="30" rx="3.2" ry="11" opacity={0.8} />
        <path d="M-30 -17 C -12 -21.5 12 -21.5 30 -17" />
        <path d="M-30 17 C -12 21.5 12 21.5 30 17" />
        <path d="M-25 -18.2 L-18 19.4 L-10 -20.2 L-2 20.3 L6 -20.3 L14 19.9 L22 -19.3 L27 18.2" opacity={0.85} />
        <path d="M-4 -20.3 C -10 -30 -18 -38 -28 -44" />
        <path d="M-2 -20.4 C -4 -32 -8 -42 -12 -50" />
        <path d="M0 -20.4 C 0 -34 2 -43 5 -51" />
        <path d="M2 -20.4 C 6 -31 12 -40 20 -47" />
        <path d="M4 -20.3 C 12 -28 22 -34 32 -38" />
        <path d="M-28 -44 q -5 -6 -1 -9 q 3 4 1 9 Z" />
        <path d="M-12 -50 q -3 -6 1 -8 q 2 4 -1 8 Z" />
        <path d="M5 -51 q -1 -6 3 -7 q 1 5 -3 7 Z" />
        <path d="M20 -47 q 1 -6 5 -6 q -1 5 -5 6 Z" />
        <path d="M32 -38 q 3 -5 7 -4 q -2 4 -7 4 Z" />
        <path d="M36 9 L48 -6" />
        {[dot(48.5, -6.6, 1.6), dot(-30, 0, 1.3)]}
      </>
    ),
  },
  /**
   * chakra — a mandala ring for a medallion: a double circle, twenty-four
   * petals, bindus between, a scalloped rim. The centre is left open, for a
   * face or a mark set in it.
   */
  chakra: {
    vb: '-100 -100 200 200',
    body: (
      <>
        <circle r="58" />
        <circle r="62" opacity={0.7} />
        {turn(24, 15, (d) => (
          <path key={d} d="M0 -63 Q 7 -73 0 -85 Q -7 -73 0 -63 Z" transform={`rotate(${d})`} fill="currentColor" />
        ))}
        {turn(24, 15, (d) => (
          <circle key={`b${d}`} cy="-80" r="2.3" transform={`rotate(${d + 7.5})`} fill="currentColor" stroke="none" />
        ))}
        <circle r="89" />
        {turn(48, 7.5, (d) => (
          <path key={`s${d}`} d="M-5.8 -89 Q 0 -96.5 5.8 -89" transform={`rotate(${d})`} />
        ))}
        {turn(48, 7.5, (d) => (
          <circle key={`o${d}`} cy="-97.5" r="1.6" transform={`rotate(${d + 3.75})`} fill="currentColor" stroke="none" />
        ))}
      </>
    ),
  },
  /**
   * kona — a corner of the frame: a double line turning the corner, a kalka
   * curl and two leaves in its crook. Drawn for the top left; rotate or mirror
   * it for the other three.
   */
  kona: {
    vb: '0 0 64 64',
    body: (
      <>
        <path d="M4 62 V16 Q 4 4 16 4 H62" />
        <path d="M11 62 V22 Q 11 11 22 11 H62" opacity={0.75} />
        <path d="M20 21 C 30 15 39 22 35 30 C 32 36 24 34 25.5 28.5 C 26.5 25 31 25.5 30.5 28.5" />
        <path d="M16 46 Q 25 42 23 32" />
        <path d="M46 16 Q 42 25 32 23" />
        {[dot(7.5, 7.5, 1.7), dot(19, 54, 1.3), dot(54, 19, 1.3)]}
      </>
    ),
  },
  /**
   * konaMandala — a quarter of a floor alpona, grown out of a corner ring on
   * ring: a lotus in the corner, a ring of petals, a ring of chevrons with
   * bindus between, a ring of kalka, a scalloped rim with a halo of bindus.
   * Drawn for the top-left corner (the corner is the origin); mirror it for
   * the others.
   */
  konaMandala: {
    vb: '0 0 100 100',
    body: (
      <>
        {/* the corner lotus */}
        {[9, 27, 45, 63, 81].map((a) => (
          <path key={`l${a}`} d="M2.5 0 Q 7 -3.6 11.8 0 Q 7 3.6 2.5 0 Z" transform={`rotate(${a})`} fill="currentColor" />
        ))}
        <path d={quarter(13)} />
        <path d={quarter(14.6)} opacity={0.6} />
        {/* the ring of petals, each with its vein */}
        {Array.from({ length: 8 }, (_, i) => 5.625 + i * 11.25).map((a) => (
          <g key={`p${a}`} transform={`rotate(${a})`}>
            <path d="M16.5 0 Q 23.5 -5 30.5 0 Q 23.5 5 16.5 0 Z" fill="currentColor" />
          </g>
        ))}
        <path d={quarter(32.5)} />
        {/* the ring of chevrons — the footer's mark — bindus between */}
        {Array.from({ length: 9 }, (_, i) => 5 + i * 10).map((a) => (
          <g key={`c${a}`} transform={`rotate(${a})`}>
            <path d="M35.5 -4.6 L44.5 0 L35.5 4.6 L38.5 0 Z" fill="currentColor" />
          </g>
        ))}
        {Array.from({ length: 8 }, (_, i) => 10 + i * 10).map((a) => {
          const [x, y] = polar(41, a)
          return <circle key={`cd${a}`} cx={x} cy={y} r="1.9" fill="currentColor" stroke="none" />
        })}
        <path d={quarter(49)} />
        <path d={quarter(50.6)} opacity={0.6} />
        {/* the ring of kalka, curling the same way round */}
        {Array.from({ length: 5 }, (_, i) => 9 + i * 18).map((a) => (
          <path
            key={`k${a}`}
            d="M53 3 C 53.5 -6 62.5 -9.5 66.8 -3.5 C 69.8 1 66 6 61 4.4 C 57.5 3.4 55 5.5 53 3 Z"
            transform={`rotate(${a})`}
            fill="currentColor"
          />
        ))}
        {Array.from({ length: 4 }, (_, i) => 18 + i * 18).map((a) => {
          const [x, y] = polar(60, a)
          return <circle key={`kd${a}`} cx={x} cy={y} r="2.2" fill="currentColor" stroke="none" />
        })}
        <path d={quarter(70)} />
        {/* the scalloped rim and its halo */}
        <path d={scallops(70, 7, 14)} />
        {Array.from({ length: 14 }, (_, i) => (90 / 14) * (i + 0.5)).map((a) => {
          const [x, y] = polar(81.5, a)
          return <circle key={`h${a}`} cx={x} cy={y} r="1.9" fill="currentColor" stroke="none" />
        })}
        {Array.from({ length: 13 }, (_, i) => (90 / 14) * (i + 1)).map((a) => {
          const [x, y] = polar(87, a)
          return <circle key={`h2${a}`} cx={x} cy={y} r="1.2" fill="currentColor" stroke="none" />
        })}
      </>
    ),
  },
  /** taraKona — the temple band's corner block: a ruled square holding a filled tara. */
  taraKona: {
    vb: '0 0 30 30',
    body: (
      <>
        <rect x="1.5" y="1.5" width="27" height="27" strokeWidth="2" />
        {[0, 45, 90, 135].map((a) => (
          <path key={a} d="M15 6.5 V23.5" transform={`rotate(${a} 15 15)`} />
        ))}
        <circle cx="15" cy="15" r="3" fill="currentColor" />
        {[0, 90, 180, 270].map((a) => (
          <circle key={`d${a}`} cx="15" cy="5" r="1.8" fill="currentColor" stroke="none" transform={`rotate(${a} 15 15)`} />
        ))}
      </>
    ),
  },
  /** shiuli — the night jasmine that falls at dawn in Sharat: six petals and its stem. */
  shiuli: {
    vb: '-18 -18 36 44',
    body: (
      <>
        {turn(6, 60, (d) => (
          <path key={d} d="M0 -3.5 Q 6 -9 0 -16 Q -6 -9 0 -3.5 Z" transform={`rotate(${d})`} />
        ))}
        <circle r="2.6" />
        <path d="M0 3 Q 1.5 13 0 24" />
      </>
    ),
  },
} as const

export type AlponaName = keyof typeof MOTIFS

/**
 * A pujo day's alpona, from its name ("Maha Ashtami", "Ashtami · Day 2",
 * "Bijaya Dashami", "Lakshmi Puja"…): the conch that opens Devi Paksha, the
 * welcome pot, the betel leaf of the bel boron, the paddy of the nabapatrika,
 * Sandhi puja's 108 lotuses, the lamp, the fish pair of the farewell,
 * Lakshmi's footsteps, Saraswati's swan. Shared by the Schedule and উমা.
 */
export function motifForDay(label: string): AlponaName | null {
  const l = label.toLowerCase()
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

/** The id HandDrawn's filter answers to; `hand` on a motif or border draws through it. */
const HAND_FILTER_ID = 'alpona-hand'

/**
 * Rice paste, not a pen: a filter that lets a line waver a little along its
 * length and roughens its edge, as a finger-drawn alpona does. Render it once
 * on a page that draws with `hand`; the drawings reference it by id (inside
 * the SVG, which every browser honours — Safari included). Invisible itself.
 */
export function HandDrawn() {
  return (
    <svg aria-hidden="true" width="0" height="0" className="absolute">
      <defs>
        <filter id={HAND_FILTER_ID} x="-10%" y="-10%" width="120%" height="120%">
          {/* the slow waver along a stroke */}
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="waver" />
          <feDisplacementMap in="SourceGraphic" in2="waver" scale="2.4" xChannelSelector="R" yChannelSelector="G" result="wavered" />
          {/* the paste's uneven edge */}
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="3" result="grain" />
          <feDisplacementMap in="wavered" in2="grain" scale="0.9" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  )
}

const handFilter = (hand: boolean) => (hand ? `url(#${HAND_FILTER_ID})` : undefined)

export function Alpona({
  name,
  className,
  title,
  strokeWidth = 1.6,
  hand = false,
  style,
}: {
  name: AlponaName
  className?: string
  /** Say what it is when it carries meaning on its own; otherwise it is decoration. */
  title?: string
  strokeWidth?: number
  /** Draw as rice paste — needs <HandDrawn /> on the page. */
  hand?: boolean
  style?: React.CSSProperties
}) {
  const m = MOTIFS[name]
  return (
    <svg
      viewBox={m.vb}
      className={cn('inline-block shrink-0 [&_*]:[vector-effect:non-scaling-stroke]', className)}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <g filter={handFilter(hand)}>{m.body}</g>
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
 * `vertical` stands it upright, for a frame's sides.
 */
export function LataBorder({
  className,
  vertical = false,
  hand = false,
}: {
  className?: string
  vertical?: boolean
  /** Draw as rice paste — needs <HandDrawn /> on the page. */
  hand?: boolean
}) {
  const id = useId()
  return (
    <svg className={cn(vertical ? 'block h-full w-10' : 'block h-10 w-full', className)} aria-hidden="true">
      <defs>
        {/* upright, the same tile turned a quarter — a creeper down a frame's side */}
        <pattern
          id={id}
          width="120"
          height="40"
          patternUnits="userSpaceOnUse"
          patternTransform={vertical ? 'translate(40 0) rotate(90)' : undefined}
        >
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
      <rect width="100%" height="100%" fill={`url(#${id})`} filter={handFilter(hand)} />
    </svg>
  )
}

/**
 * A repeating border band: one tile, repeated along the edge at a fixed size
 * (so it stays delicate at any width), drawn in currentColor. `vertical`
 * turns the tile a quarter so the band runs down a side, its top edge facing
 * right — mirror it for the right side. `hand` draws it as rice paste.
 */
function PatternBand({
  w,
  h,
  vertical,
  hand,
  className,
  style,
  children,
}: {
  w: number
  h: number
  vertical: boolean
  hand: boolean
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  const id = useId()
  return (
    <svg
      className={cn('block', className)}
      // spans its parent: to run a band part-way, place a wrapper and put the band in it
      style={{ ...(vertical ? { width: h, height: '100%' } : { height: h, width: '100%' }), ...style }}
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={id}
          width={w}
          height={h}
          patternUnits="userSpaceOnUse"
          patternTransform={vertical ? `translate(${h} 0) rotate(90)` : undefined}
        >
          {children}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} filter={handFilter(hand)} />
    </svg>
  )
}

/**
 * The temple band — triangles along the edge, each holding a filled leaf, a
 * fat bindu in every gap, ruled on both sides: the band that runs round a
 * Bengali alpona's field, thick with rice paste.
 */
export function TempleBorder({
  className,
  style,
  vertical = false,
  hand = false,
}: {
  className?: string
  style?: React.CSSProperties
  vertical?: boolean
  hand?: boolean
}) {
  return (
    <PatternBand w={26} h={30} vertical={vertical} hand={hand} className={className} style={style}>
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M0 2 H26 M0 28 H26" strokeWidth="2.2" />
        <path d="M1.5 5.5 L24.5 5.5 L13 24.5 Z" />
      </g>
      <path d="M13 8.5 C 17 11.5 16.6 16.5 13 20 C 9.4 16.5 9 11.5 13 8.5 Z" fill="currentColor" />
      <circle cx="0" cy="21" r="2.1" fill="currentColor" />
      <circle cx="26" cy="21" r="2.1" fill="currentColor" />
      <circle cx="0" cy="13.5" r="1.1" fill="currentColor" />
      <circle cx="26" cy="13.5" r="1.1" fill="currentColor" />
    </PatternBand>
  )
}

/** A row of tara — the star flower, eight spokes tipped with bindus — a small bindu between each (sample: the Pohela Boishakh borders). */
export function TaraBorder({
  className,
  style,
  vertical = false,
  hand = false,
}: {
  className?: string
  style?: React.CSSProperties
  vertical?: boolean
  hand?: boolean
}) {
  return (
    <PatternBand w={30} h={24} vertical={vertical} hand={hand} className={className} style={style}>
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        {[0, 45, 90, 135].map((a) => (
          <path key={a} d="M15 4 V20" transform={`rotate(${a} 15 12)`} />
        ))}
      </g>
      <circle cx="15" cy="12" r="2.6" fill="currentColor" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <circle key={a} cx="15" cy="2.6" r="1.7" fill="currentColor" transform={`rotate(${a} 15 12)`} />
      ))}
      <circle cx="0" cy="12" r="1.3" fill="currentColor" />
      <circle cx="30" cy="12" r="1.3" fill="currentColor" />
    </PatternBand>
  )
}

/**
 * A leaf band — a rule with filled teardrop leaves hanging from it, pointing
 * in, a bindu between each: the lighter border round a panel inside an
 * alpona, as the temple band is round the whole.
 */
export function LeafBorder({
  className,
  style,
  vertical = false,
  hand = false,
}: {
  className?: string
  style?: React.CSSProperties
  vertical?: boolean
  hand?: boolean
}) {
  return (
    <PatternBand w={16} h={15} vertical={vertical} hand={hand} className={className} style={style}>
      <path d="M0 2.2 H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 4.6 C 10.8 6.8 10.5 10.2 8 12.6 C 5.5 10.2 5.2 6.8 8 4.6 Z" fill="currentColor" />
      <circle cx="0" cy="8.5" r="1.3" fill="currentColor" />
      <circle cx="16" cy="8.5" r="1.3" fill="currentColor" />
    </PatternBand>
  )
}

/** A line of rice-paste dots — the inner rule of an alpona frame. */
export function DotBorder({
  className,
  style,
  vertical = false,
  hand = false,
}: {
  className?: string
  style?: React.CSSProperties
  vertical?: boolean
  hand?: boolean
}) {
  return (
    <PatternBand w={9} h={6} vertical={vertical} hand={hand} className={className} style={style}>
      <circle cx="4.5" cy="3" r="1.6" fill="currentColor" />
    </PatternBand>
  )
}

/**
 * A chain of the footer's chevron, a bindu between each — a border for a
 * frame's edge, pointing in (down, along a top edge). Fixed-size tiles, like
 * the other bands; `vertical` runs it down a side (PatternBand's convention).
 */
export function ChevronBorder({
  className,
  style,
  vertical = false,
  hand = false,
}: {
  className?: string
  style?: React.CSSProperties
  vertical?: boolean
  /** Draw as rice paste — needs <HandDrawn /> on the page. */
  hand?: boolean
}) {
  return (
    <PatternBand w={26} h={20} vertical={vertical} hand={hand} className={className} style={style}>
      <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 4 L13 12.5 L19.5 4" />
        <path d="M9.5 4 L13 8.5 L16.5 4" opacity={0.7} />
      </g>
      <circle cx="13" cy="16.5" r="1.3" fill="currentColor" />
      <circle cx="0" cy="8" r="1.5" fill="currentColor" />
      <circle cx="26" cy="8" r="1.5" fill="currentColor" />
    </PatternBand>
  )
}

/**
 * The kuri mala — lotus buds on a line, a bindu between — as a repeating
 * border. `band` sizes it to replace the header's scallops (24 px tall).
 */
export function KuriBorder({ className, hand = false }: { className?: string; hand?: boolean }) {
  const id = useId()
  return (
    <svg className={cn('block h-6 w-full', className)} aria-hidden="true">
      <defs>
        <pattern id={id} width="30" height="24" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 20 Q 10.5 13 15 4.5 Q 19.5 13 15 20 Z" />
            <path d="M15 20 Q 8.5 18.5 6.5 12.5 M15 20 Q 21.5 18.5 23.5 12.5" />
            <path d="M0 22.5 H30" />
          </g>
          <circle cx="0" cy="15" r="1.4" fill="currentColor" />
          <circle cx="30" cy="15" r="1.4" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} filter={handFilter(hand)} />
    </svg>
  )
}
