import { useId } from 'react'
import type * as React from 'react'

import { ALPONA_MOTIFS, type AlponaName, BAND_TILES, HAND_FILTER_ID, HandFilter } from '@/components/Alpona'
import { DURGA_FACE } from '@/components/durgaFace'

/**
 * Alpona for a printed piece: motifs and bands placed in the piece's own
 * pixels on one SVG, white (or crimson) in currentColor, every line through
 * the rice-paste filter. The invitation card's pages and its share image are
 * drawn from these, so the two always match.
 */

const handFilter = (hand: boolean) => (hand ? `url(#${HAND_FILTER_ID})` : undefined)

/** A piece's SVG at its own size, the rice-paste filter in its own defs (an SVG painted as an image can't reach the page's). */
export function ArtSvg({
  w,
  h,
  svgRef,
  children,
}: {
  w: number
  h: number
  svgRef?: (el: SVGSVGElement | null) => void
  children: React.ReactNode
}) {
  return (
    <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
      <defs>
        <HandFilter />
      </defs>
      {children}
    </svg>
  )
}

/** A motif in a box: `stroke` in the piece's pixels, `mirror` flips it in place. */
export function Motif({
  name,
  x,
  y,
  w,
  h,
  stroke = 2,
  hand = true,
  mirror,
  opacity,
}: {
  name: AlponaName
  x: number
  y: number
  w: number
  h?: number
  stroke?: number
  hand?: boolean
  mirror?: 'x' | 'y' | 'xy'
  opacity?: number
}) {
  const m = ALPONA_MOTIFS[name]
  const [, , vw, vh] = m.vb.split(' ').map(Number)
  const height = h ?? (w * vh) / vw
  const svg = (
    <svg
      x={x}
      y={y}
      width={w}
      height={height}
      viewBox={m.vb}
      overflow="visible"
      fill="none"
      stroke="currentColor"
      strokeWidth={(stroke * vw) / w}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
    >
      <g filter={handFilter(hand)}>{m.body}</g>
    </svg>
  )
  if (!mirror) return svg
  const cx = x + w / 2
  const cy = y + height / 2
  const sx = mirror === 'y' ? 1 : -1
  const sy = mirror === 'x' ? 1 : -1
  return <g transform={`translate(${cx} ${cy}) scale(${sx} ${sy}) translate(${-cx} ${-cy})`}>{svg}</g>
}

/**
 * A border band along one side, its box's top-left at (x, y), `len` long,
 * the tile scaled by `k`; the tile's top edge faces out on every side.
 */
export function Band({
  tile,
  x,
  y,
  len,
  k = 1,
  side,
  hand = true,
  opacity,
}: {
  tile: keyof typeof BAND_TILES
  x: number
  y: number
  len: number
  k?: number
  side: 'top' | 'bottom' | 'left' | 'right'
  hand?: boolean
  opacity?: number
}) {
  const id = `band${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const t = BAND_TILES[tile]
  const thick = t.h * k
  const transform = {
    top: `translate(${x} ${y})`,
    bottom: `translate(${x} ${y + thick}) scale(1 -1)`,
    left: `translate(${x} ${y + len}) rotate(-90)`,
    right: `translate(${x + thick} ${y}) rotate(90)`,
  }[side]
  return (
    <g transform={transform} opacity={opacity}>
      <defs>
        <pattern id={id} width={t.w} height={t.h} patternUnits="userSpaceOnUse" patternTransform={`scale(${k})`}>
          {t.tile}
        </pattern>
      </defs>
      <rect width={len} height={thick} fill={`url(#${id})`} filter={handFilter(hand)} />
    </g>
  )
}

/**
 * The red frame's measure: where the temple band starts (`edge`) and its
 * scale (`k`, so 30·k px thick), the dot line's scale, the corner mandalas'
 * size and their gap from the band.
 */
export type FrameSpec = { w: number; h: number; edge: number; k: number; dotK: number; mandala: number; mandalaGap: number }

export function frameGeometry(f: FrameSpec) {
  const thick = BAND_TILES.temple.h * f.k
  const inner = f.edge + thick
  return { thick, inner, mandalaAt: inner + f.mandalaGap }
}

/**
 * The red frame, the flyer's own in layers: an outer rule, the temple band
 * with a tara block at each corner, a line of rice-paste dots, and a quarter
 * mandala grown out of each inner corner.
 */
export function AlponaFrame(f: FrameSpec) {
  const { w, h, edge, k, dotK, mandala } = f
  const { thick, inner, mandalaAt } = frameGeometry(f)
  const rule = Math.round(edge * 0.4)
  const dotAt = inner + 5
  const dotThick = BAND_TILES.dot.h * dotK
  const corners: [number, number, 'x' | 'y' | 'xy' | undefined][] = [
    [mandalaAt, mandalaAt, undefined],
    [w - mandalaAt - mandala, mandalaAt, 'x'],
    [mandalaAt, h - mandalaAt - mandala, 'y'],
    [w - mandalaAt - mandala, h - mandalaAt - mandala, 'xy'],
  ]
  return (
    <g>
      <rect x={rule} y={rule} width={w - 2 * rule} height={h - 2 * rule} rx={12} fill="none" stroke="currentColor" strokeWidth={2 * k} opacity={0.9} />
      <Band tile="temple" k={k} side="top" x={inner} y={edge} len={w - 2 * inner} />
      <Band tile="temple" k={k} side="bottom" x={inner} y={h - inner} len={w - 2 * inner} />
      <Band tile="temple" k={k} side="left" x={edge} y={inner} len={h - 2 * inner} />
      <Band tile="temple" k={k} side="right" x={w - inner} y={inner} len={h - 2 * inner} />
      {[
        [edge, edge],
        [w - inner, edge],
        [edge, h - inner],
        [w - inner, h - inner],
      ].map(([x, y]) => (
        <Motif key={`${x},${y}`} name="taraKona" x={x} y={y} w={thick} stroke={1.75 * k} />
      ))}
      <g opacity={0.9}>
        <Band tile="dot" k={dotK} side="top" x={dotAt} y={dotAt} len={w - 2 * dotAt} />
        <Band tile="dot" k={dotK} side="bottom" x={dotAt} y={h - dotAt - dotThick} len={w - 2 * dotAt} />
        <Band tile="dot" k={dotK} side="left" x={dotAt} y={dotAt} len={h - 2 * dotAt} />
        <Band tile="dot" k={dotK} side="right" x={w - dotAt - dotThick} y={dotAt} len={h - 2 * dotAt} />
      </g>
      {corners.map(([x, y, mirror]) => (
        <Motif key={`m${x},${y}`} name="konaMandala" x={x} y={y} w={mandala} stroke={(2 * mandala) / 280} mirror={mirror} />
      ))}
    </g>
  )
}

/** A line, a bindu, the shatadal, a bindu, a line — centred on (cx, y). */
export function Divider({ cx, y, half = 230, size = 54 }: { cx: number; y: number; half?: number; size?: number }) {
  const r = size / 2
  return (
    <g>
      <path d={`M${cx - half} ${y} H${cx - r - 21} M${cx + r + 21} ${y} H${cx + half}`} stroke="currentColor" strokeWidth={2} opacity={0.65} />
      <circle cx={cx - r - 11} cy={y} r={size / 13.5} fill="currentColor" />
      <circle cx={cx + r + 11} cy={y} r={size / 13.5} fill="currentColor" />
      <Motif name="shatadal" x={cx - r} y={y - r} w={size} stroke={(1.8 * size) / 54} />
    </g>
  )
}

/** Maa's face from the samiti's mark, vector, `w` wide, top-centred at (cx, y). */
export function Face({ cx, y, w }: { cx: number; y: number; w: number }) {
  const [, , vw, vh] = DURGA_FACE.viewBox.split(' ').map(Number)
  const h = (w * vh) / vw
  return (
    <svg x={cx - w / 2} y={y} width={w} height={h} viewBox={DURGA_FACE.viewBox}>
      <path d={DURGA_FACE.d} fill="currentColor" fillRule="evenodd" />
    </svg>
  )
}
