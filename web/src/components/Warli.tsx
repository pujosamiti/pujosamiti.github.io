import { HAND_FILTER_ID } from '@/components/Alpona'

/**
 * Warli figures — Maharashtra's rice-paste painting, white on a red mud wall,
 * the same medium as the alpona on a Bengali floor: a pujo in Pune drawn by
 * both. A figure is two triangles meeting at the waist, a round head, stick
 * limbs; here they play the dhak, dance with the dhunuchi and carry the boron
 * dala. Drawn in currentColor for an SVG page (the invitation card), feet at
 * the origin, a hundred units tall, y down; `hand` wavers it as rice paste
 * (needs the HandFilter in the page's defs).
 */
export type WarliPose = 'dance' | 'hold' | 'dhaki' | 'dhunuchi' | 'boron'

const SHOULDER = -76
const WAIST = -50
const HIP = -26

function Limb({ d }: { d: string }) {
  return <path d={d} fill="none" />
}

/** The body: head, the two triangles (a woman's lower one wider, her hair in a khopa), legs. */
function Body({ woman, stride }: { woman: boolean; stride: 'stand' | 'dance' }) {
  const skirt = woman ? 19 : 15
  return (
    <>
      <circle cy={-89} r={8} fill="currentColor" stroke="none" />
      {woman && <circle cx={-7.5} cy={-94} r={3.6} fill="currentColor" stroke="none" />}
      <path d={`M-15 ${SHOULDER} L15 ${SHOULDER} L0 ${WAIST} Z`} fill="currentColor" />
      <path d={`M0 ${WAIST} L${-skirt} ${HIP + (woman ? 3 : 0)} L${skirt} ${HIP + (woman ? 3 : 0)} Z`} fill="currentColor" />
      {stride === 'stand' ? (
        <Limb d={`M-6 ${HIP} L-11 0 M6 ${HIP} L11 0 M-11 0 h-5 M11 0 h5`} />
      ) : (
        <Limb d={`M-6 ${HIP} L-17 -13 L-13 0 M6 ${HIP} L15 -12 L19 0 M-13 0 h-5 M19 0 h5`} />
      )}
    </>
  )
}

/** The dhak at the hip, laced, its plume of kash flowers up behind the shoulder. */
function Dhak() {
  return (
    <g transform="translate(28 -47) rotate(-12)">
      <path d="M-15 -9 Q 0 -13 15 -9 Q 19 0 15 9 Q 0 13 -15 9 Q -19 0 -15 -9 Z" fill="none" />
      <path d="M-11 -10 L-6 10 L-1 -11 L4 11 L9 -11 L13 9" fill="none" opacity={0.9} />
      <path d="M8 -11 C 10 -24 14 -34 20 -42 M5 -11 C 4 -26 6 -36 8 -46 M11 -10 C 16 -20 22 -27 30 -32" fill="none" />
      <circle cx={20} cy={-43} r={2.6} fill="currentColor" stroke="none" />
      <circle cx={8} cy={-47} r={2.6} fill="currentColor" stroke="none" />
      <circle cx={30} cy={-33} r={2.6} fill="currentColor" stroke="none" />
    </g>
  )
}

/** The dhunuchi held high, three curls of smoke rising from its coals. */
function Dhunuchi({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-7 0 Q 0 9 7 0 Z" fill="currentColor" />
      <path d="M0 6 L0 11 M-4 11 H4" fill="none" />
      <path d="M-3 -3 C -8 -10 2 -14 -3 -22 M2 -3 C 7 -11 -1 -16 5 -25 M0 -3 C 0 -12 -4 -18 0 -30" fill="none" opacity={0.85} />
    </g>
  )
}

/** The boron dala, a plate with its lamp, held before her. */
function Boron() {
  return (
    <g transform="translate(25 -60)">
      <path d="M-11 0 Q 0 6 11 0 Z" fill="currentColor" />
      <path d="M-3 -2 Q 0 -10 3 -2" fill="currentColor" />
      <circle cx={-6} cy={-2.4} r={1.8} fill="currentColor" stroke="none" />
      <circle cx={6} cy={-2.4} r={1.8} fill="currentColor" stroke="none" />
    </g>
  )
}

/** One figure. `flip` mirrors it (faces the other way). */
export function WarliFigure({
  pose,
  woman = false,
  x = 0,
  y = 0,
  scale = 1,
  rotate = 0,
  flip = false,
  strokeWidth = 3.2,
  hand = false,
}: {
  pose: WarliPose
  woman?: boolean
  x?: number
  y?: number
  scale?: number
  rotate?: number
  flip?: boolean
  strokeWidth?: number
  hand?: boolean
}) {
  const arms: Record<WarliPose, string> = {
    // both arms up, elbows out — the dance
    dance: `M-14 ${SHOULDER + 1} L-27 -86 L-23 -102 M14 ${SHOULDER + 1} L27 -86 L23 -102`,
    // hands out and down, to meet the next dancer's in a chain
    hold: `M-14 ${SHOULDER + 1} L-30 -62 M14 ${SHOULDER + 1} L30 -62`,
    // the stick raised in one hand, the other on the drum
    dhaki: `M-14 ${SHOULDER + 1} L-25 -88 L-17 -101 M14 ${SHOULDER + 1} L24 -64 L19 -55`,
    // the dhunuchi high in one hand, the other out for balance
    dhunuchi: `M14 ${SHOULDER + 1} L25 -92 L22 -104 M-14 ${SHOULDER + 1} L-29 -70 L-35 -78`,
    // both hands forward to the plate
    boron: `M-14 ${SHOULDER + 1} L-4 -62 L18 -61 M14 ${SHOULDER + 1} L22 -66 L24 -61`,
  }
  const stride = pose === 'hold' || pose === 'boron' ? 'stand' : 'dance'
  const t = `translate(${x} ${y}) rotate(${rotate}) scale(${flip ? -scale : scale} ${scale})`
  return (
    <g
      transform={t}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      filter={hand ? `url(#${HAND_FILTER_ID})` : undefined}
    >
      <Body woman={woman} stride={stride} />
      <Limb d={arms[pose]} />
      {pose === 'dhaki' && (
        <>
          <Dhak />
          {/* the stick */}
          <path d="M-17 -101 L4 -111" fill="none" />
        </>
      )}
      {pose === 'dhunuchi' && <Dhunuchi x={22} y={-112} />}
      {pose === 'boron' && <Boron />}
    </g>
  )
}

/**
 * The Warli ring dance — dancers hand in hand round a centre, heads out, as
 * the tarpa dance is painted: `count` figures standing on a circle of radius
 * `r` (to their feet), every `womanEvery`th a woman.
 */
export function WarliRing({
  cx,
  cy,
  r,
  count,
  scale = 1,
  hand = false,
  strokeWidth,
}: {
  cx: number
  cy: number
  r: number
  count: number
  scale?: number
  hand?: boolean
  strokeWidth?: number
}) {
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const deg = (360 / count) * i
        const a = ((deg - 90) * Math.PI) / 180
        return (
          <WarliFigure
            key={i}
            pose="hold"
            woman={i % 2 === 0}
            x={+(cx + r * Math.cos(a)).toFixed(2)}
            y={+(cy + r * Math.sin(a)).toFixed(2)}
            rotate={deg}
            scale={scale}
            hand={hand}
            strokeWidth={strokeWidth}
          />
        )
      })}
    </g>
  )
}

/** A Warli tree — a trunk, branches, filled leaves — to close a procession. */
export function WarliTree({ x, y, scale = 1, hand = false }: { x: number; y: number; scale?: number; hand?: boolean }) {
  const leaves: [number, number, number][] = [
    [0, -118, 0],
    [-16, -104, -40],
    [16, -104, 40],
    [-24, -84, -60],
    [24, -84, 60],
    [-14, -70, -35],
    [14, -70, 35],
  ]
  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      fill="none"
      filter={hand ? `url(#${HAND_FILTER_ID})` : undefined}
    >
      <path d="M0 0 L0 -112 M0 -60 L-14 -70 M0 -60 L14 -70 M0 -80 L-24 -84 M0 -80 L24 -84 M0 -96 L-16 -104 M0 -96 L16 -104" />
      {leaves.map(([lx, ly, rot]) => (
        <path
          key={`${lx},${ly}`}
          d="M0 0 C 5 -5 5 -12 0 -16 C -5 -12 -5 -5 0 0 Z"
          transform={`translate(${lx} ${ly}) rotate(${rot})`}
          fill="currentColor"
          stroke="none"
        />
      ))}
      <path d="M-12 0 H12" />
    </g>
  )
}
