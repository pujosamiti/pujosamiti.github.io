import type { TimeTableEntry } from '@pujosamiti/shared'
import { useQuery } from '@tanstack/react-query'
import { Download, Link2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { BAND_TILES, HAND_FILTER_ID } from '@/components/Alpona'
import { AlponaFrame, ArtSvg, Band, Divider, Face, type FrameSpec, Motif, frameGeometry } from '@/components/CardArt'
import { Seo } from '@/components/Seo'
import { SharePanel } from '@/components/SharePanel'
import { Button } from '@/components/ui/button'
import { WarliFigure, WarliRing, WarliTree } from '@/components/Warli'
import { api } from '@/lib/api'
import {
  type TextStyle,
  canvasToPng,
  download,
  drawText,
  loadCardFonts,
  loadImage,
  svgToImage,
  balancedLines,
  wrapText,
} from '@/lib/cardCanvas'
import { CULTURAL_EVENING } from '@/lib/culturalEvening'
import {
  CARD,
  CARD_DPI,
  CARD_H,
  CARD_W,
  COL,
  type CardDay,
  INK,
  INVITATION,
  type PagePlan,
  cardDays,
  formatDay,
  formatSpan,
  invitationUrl,
  planInside,
  pujoDates,
} from '@/lib/invitationCard'

const W = CARD_W
const H = CARD_H
const CX = W / 2

/**
 * The year's invitation card, /invitation — a folded greetings card in the
 * laal-paar and alpona of the site, with Warli dancers for the pujo in Pune.
 * Outside: the cover (Maa in the chakra between two dhak) and the back (the
 * welcome, a Warli ring round the samiti's mark, Lakshmi Puja, the cultural
 * evenings). Inside: the nirghanto, across two pages. Every page is drawn on
 * a canvas at 1360 × 1800 — the 2024 card's size — and downloads as a PNG
 * marked 300 dpi (600 at 2×), one page at a time or as the two printed
 * spreads. The art is SVG (sharp at any scale); the words are canvas text.
 */

/** The red pages' frame — the flyer's, at the card's size (a 45 px temple band). */
const FRAME: FrameSpec = { w: W, h: H, edge: 18, k: 1.5, dotK: 1.4, mandala: 280, mandalaGap: 16 }
const { inner: INNER, mandalaAt: MANDALA_AT } = frameGeometry(FRAME)
const MANDALA = FRAME.mandala

/** The inside pages' red paar — the sari's own border round the kash. */
const PAAR = 60

/**
 * The inside pages' frame: a laal paar round the page carrying a white temple
 * band, the sari's two red lines inside it, and a kona in each corner of the
 * field.
 */
function PaarFrame() {
  const k = 1.2
  const edge = 12
  const thick = BAND_TILES.temple.h * k
  const inner = edge + thick
  const line = PAAR + 8
  const kona = 74
  const konaAt = PAAR + 22
  return (
    <g>
      <rect width={W} height={H} fill={INK.kash} />
      <path d={`M0 0H${W}V${H}H0Z M${PAAR} ${PAAR}V${H - PAAR}H${W - PAAR}V${PAAR}Z`} fill={INK.jaba} fillRule="evenodd" />
      <g color={INK.white}>
        <Band tile="temple" k={k} side="top" x={inner} y={edge} len={W - 2 * inner} />
        <Band tile="temple" k={k} side="bottom" x={inner} y={H - inner} len={W - 2 * inner} />
        <Band tile="temple" k={k} side="left" x={edge} y={inner} len={H - 2 * inner} />
        <Band tile="temple" k={k} side="right" x={W - inner} y={inner} len={H - 2 * inner} />
        {[
          [edge, edge],
          [W - inner, edge],
          [edge, H - inner],
          [W - inner, H - inner],
        ].map(([x, y]) => (
          <Motif key={`${x},${y}`} name="taraKona" x={x} y={y} w={thick} stroke={2.2} />
        ))}
      </g>
      <g color={INK.jaba} fill="none" stroke="currentColor">
        <rect x={line} y={line} width={W - 2 * line} height={H - 2 * line} strokeWidth={3} />
        <rect x={line + 7} y={line + 7} width={W - 2 * line - 14} height={H - 2 * line - 14} strokeWidth={1.2} opacity={0.8} />
      </g>
      <g color={INK.jaba} opacity={0.85}>
        <Motif name="kona" x={konaAt} y={konaAt} w={kona} stroke={2} />
        <Motif name="kona" x={W - konaAt - kona} y={konaAt} w={kona} stroke={2} mirror="x" />
        <Motif name="kona" x={konaAt} y={H - konaAt - kona} w={kona} stroke={2} mirror="y" />
        <Motif name="kona" x={W - konaAt - kona} y={H - konaAt - kona} w={kona} stroke={2} mirror="xy" />
      </g>
    </g>
  )
}

// ── The cover ───────────────────────────────────────────────────────────────

const COVER = {
  logo: { x: CX - 90, y: 92, size: 180 },
  chakra: { cy: 724, r: 420 },
  /** the photograph's circle, inside the chakra's own (58 of its 100) */
  photoR: 236,
  greetingY: 1250,
  dividerY: 1302,
  titleY: 1388,
  venueY: 1440,
  datesY: 1494,
  warliY: 1704,
  warliScale: 1.12,
} as const

function CoverArt({ svgRef }: { svgRef: (el: SVGSVGElement | null) => void }) {
  const { cy, r } = COVER.chakra
  return (
    <ArtSvg w={W} h={H} svgRef={svgRef}>
      <rect width={W} height={H} fill={INK.jaba} />
      <g color={INK.white}>
        <AlponaFrame {...FRAME} />
        <Motif name="chakra" x={CX - r} y={cy - r} w={2 * r} stroke={2.4} />
        <Motif name="dhak" x={92} y={900} w={180} stroke={2.6} />
        <Motif name="dhak" x={W - 92 - 180} y={900} w={180} stroke={2.6} mirror="x" />
        <Divider cx={CX} y={COVER.dividerY} />
        {/* the procession — dhak, dhunuchi, dance, dhunuchi, dhak */}
        <WarliFigure pose="dhaki" x={432} y={COVER.warliY} scale={COVER.warliScale} hand />
        <WarliFigure pose="dhunuchi" woman x={556} y={COVER.warliY} scale={COVER.warliScale} hand />
        <WarliFigure pose="dance" x={CX} y={COVER.warliY} scale={COVER.warliScale} hand />
        <WarliFigure pose="dhunuchi" x={W - 556} y={COVER.warliY} scale={COVER.warliScale} flip hand />
        <WarliFigure pose="dhaki" x={W - 432} y={COVER.warliY} scale={COVER.warliScale} flip hand />
      </g>
    </ArtSvg>
  )
}

function drawCover(ctx: CanvasRenderingContext2D, { assets }: DrawInput) {
  const { logo, photo } = assets
  ctx.drawImage(logo, COVER.logo.x, COVER.logo.y, COVER.logo.size, COVER.logo.size)
  // Maa, in the chakra's open centre
  ctx.save()
  ctx.beginPath()
  ctx.arc(CX, COVER.chakra.cy, COVER.photoR, 0, Math.PI * 2)
  ctx.clip()
  ctx.drawImage(photo, CX - COVER.photoR, COVER.chakra.cy - COVER.photoR, COVER.photoR * 2, COVER.photoR * 2)
  ctx.restore()

  drawText(ctx, CARD.greetingBn, CX, COVER.greetingY, { size: 96, weight: 600, family: 'serif', color: INK.white, align: 'center' })
  drawText(ctx, CARD.titleEn, CX, COVER.titleY, {
    size: 60,
    weight: 600,
    family: 'serif',
    color: INK.white,
    align: 'center',
    maxWidth: W - 2 * INNER - 80,
  })
  drawText(ctx, `${CARD.venue}, ${CARD.place}`, CX, COVER.venueY, {
    size: 34,
    weight: 500,
    family: 'sans',
    color: INK.white,
    align: 'center',
    maxWidth: W - 2 * INNER - 160,
  })
  drawText(ctx, pujoDates(), CX, COVER.datesY, { size: 36, weight: 600, family: 'sans', color: INK.shankha, align: 'center' })
}

// ── The inside pages ────────────────────────────────────────────────────────

const HEAD = { faceY: 94, faceW: 86, titleY: 230, subY: 264, kuriY: 278 } as const

function InsideArt({ svgRef, plan }: { svgRef: (el: SVGSVGElement | null) => void; plan: PagePlan }) {
  return (
    <ArtSvg w={W} h={H} svgRef={svgRef}>
      <PaarFrame />
      <g color={INK.jaba}>
        <Face cx={CX} y={HEAD.faceY} w={HEAD.faceW} />
        <Band tile="kuri" k={0.75} side="top" x={CX - 300} y={HEAD.kuriY} len={600} opacity={0.6} />
        {plan.days.map(
          (d) =>
            d.motif && (
              <Motif
                key={`${d.y}`}
                name={d.motif}
                x={COL.motifX}
                y={d.labelTop + 2}
                w={44}
                h={50}
                stroke={1.9}
                opacity={0.9}
              />
            ),
        )}
        {plan.rules.map((y) => (
          <Band key={y} tile="dot" k={1.1} side="top" x={COL.motifX} y={y - 3} len={COL.timeRight - COL.motifX} opacity={0.5} hand={false} />
        ))}
        {/* the page's number (canvas text) sits in a bindu of its own */}
        <path d={`M${CX - 120} 1690 H${CX - 40} M${CX + 40} 1690 H${CX + 120}`} stroke="currentColor" strokeWidth={1.5} opacity={0.5} />
        <circle cx={CX} cy={1690} r={24} fill="currentColor" />
      </g>
    </ArtSvg>
  )
}

function drawInside(ctx: CanvasRenderingContext2D, plan: PagePlan, page: number) {
  drawText(ctx, CARD.scheduleTitleBn, CX, HEAD.titleY, { size: 50, weight: 600, family: 'serif', color: INK.jaba, align: 'center' })
  drawText(ctx, CARD.scheduleTitleEn, CX, HEAD.subY, { size: 22, weight: 500, family: 'sans', color: INK.inkSoft, align: 'center', letterSpacing: 0.5 })

  const { type, lh } = plan.scaled
  for (const d of plan.days) {
    let y = d.labelTop
    for (const line of d.labelBn) {
      y += lh.dayBn
      drawText(ctx, line, COL.dayX, y - lh.dayBn * 0.22, { ...type.dayBn, maxWidth: COL.dayW })
    }
    y += lh.dayEn
    drawText(ctx, d.labelEn, COL.dayX, y - lh.dayEn * 0.25, { ...type.dayEn, maxWidth: COL.dayW })
    y += lh.dayDate
    drawText(ctx, d.date, COL.dayX, y - lh.dayDate * 0.23, { ...type.dayDate, maxWidth: COL.dayW, minScale: 0.82 })

    for (const r of d.rows) {
      const content = r.bn.length * lh.rowBn + r.en.length * lh.rowEn
      let ty = r.y + (r.h - content) / 2
      const colour = r.strong ? INK.jaba : undefined
      for (const line of r.bn) {
        ty += lh.rowBn
        drawText(ctx, line, COL.eventX, ty - lh.rowBn * 0.24, {
          ...type.rowBn,
          size: r.bnSize,
          weight: r.strong ? 700 : type.rowBn.weight,
          color: colour ?? type.rowBn.color,
        })
      }
      for (const line of r.en) {
        ty += lh.rowEn
        drawText(ctx, line, COL.eventX, ty - lh.rowEn * 0.23, { ...type.rowEn, size: r.enSize, color: colour ?? type.rowEn.color })
      }
      drawText(ctx, r.time, COL.timeRight, r.y + r.h / 2 + type.time.size / 3, {
        ...type.time,
        weight: r.strong ? 700 : type.time.weight,
        color: colour ?? type.time.color,
        align: 'right',
        maxWidth: COL.timeW,
      })
    }
  }
  drawText(ctx, String(page), CX, 1700, { size: 28, weight: 700, family: 'sans', color: INK.white, align: 'center' })
}

// ── The back ────────────────────────────────────────────────────────────────

const BACK = {
  inviteY: 172,
  inviteEnY: 222,
  ring: { cy: 590, logo: 124, feet: 152, outer: 268 },
  panel: { y: 878, h: 528, w: 560, gap: 32 },
  venueY: 1458,
  addressY: 1496,
  siteY: 1582,
  samitiY: 1626,
  creditY: 1706,
} as const

const panelX = (i: 0 | 1) => CX + (i === 0 ? -BACK.panel.gap / 2 - BACK.panel.w : BACK.panel.gap / 2)

/** A panel inside the field, as the flyer's evening cards: a leaf band round it, a tara block at each corner. */
function PanelFrame({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const k = 1.3
  const c = 24
  const thick = BAND_TILES.leaf.h * k
  return (
    <g opacity={0.92}>
      <Band tile="leaf" k={k} side="top" x={x + c} y={y} len={w - 2 * c} />
      <Band tile="leaf" k={k} side="bottom" x={x + c} y={y + h - thick} len={w - 2 * c} />
      <Band tile="leaf" k={k} side="left" x={x} y={y + c} len={h - 2 * c} />
      <Band tile="leaf" k={k} side="right" x={x + w - thick} y={y + c} len={h - 2 * c} />
      {[
        [x, y],
        [x + w - c, y],
        [x, y + h - c],
        [x + w - c, y + h - c],
      ].map(([cx, cy]) => (
        <Motif key={`${cx},${cy}`} name="taraKona" x={cx} y={cy} w={c} stroke={1.8} />
      ))}
    </g>
  )
}

function BackArt({ svgRef }: { svgRef: (el: SVGSVGElement | null) => void }) {
  const { cy, feet, outer } = BACK.ring
  const { y, h, w } = BACK.panel
  return (
    <ArtSvg w={W} h={H} svgRef={svgRef}>
      <rect width={W} height={H} fill={INK.jaba} />
      <g color={INK.white}>
        <AlponaFrame {...FRAME} />
        {/* the ring dance round the samiti's mark, a ring of dots inside and out */}
        <g fill="none" stroke="currentColor" strokeLinecap="round" filter={`url(#${HAND_FILTER_ID})`}>
          <circle cx={CX} cy={cy} r={feet - 12} strokeWidth={4} strokeDasharray="0 10" />
          <circle cx={CX} cy={cy} r={outer} strokeWidth={4.4} strokeDasharray="0 12" />
          <circle cx={CX} cy={cy} r={outer + 12} strokeWidth={1.6} opacity={0.7} />
        </g>
        <WarliRing cx={CX} cy={cy} r={feet} count={24} scale={0.9} strokeWidth={3} hand />
        <PanelFrame x={panelX(0)} y={y} w={w} h={h} />
        <PanelFrame x={panelX(1)} y={y} w={w} h={h} />
        <Motif name="lakshmirPa" x={panelX(0) + w / 2 - 34} y={y + 52} w={68} stroke={2.2} />
        <Motif name="pencha" x={panelX(0) + 44} y={y + h - 118} w={52} stroke={2} />
        <Motif name="pencha" x={panelX(0) + w - 96} y={y + h - 118} w={52} stroke={2} mirror="x" />
        <Motif name="podmo" x={panelX(1) + w / 2 - 42} y={y + 40} w={84} stroke={2.2} />
        <WarliTree x={418} y={1700} scale={0.95} hand />
        <WarliTree x={W - 418} y={1700} scale={0.95} hand />
      </g>
    </ArtSvg>
  )
}

function drawBack(ctx: CanvasRenderingContext2D, { assets, after }: DrawInput) {
  const white: TextStyle = { size: 26, weight: 500, family: 'sans', color: INK.white, align: 'center' }
  const cream: TextStyle = { ...white, color: INK.shankha }

  drawText(ctx, CARD.inviteBn, CX, BACK.inviteY, { size: 58, weight: 600, family: 'serif', color: INK.white, align: 'center' })
  let y = BACK.inviteEnY
  for (const line of balancedLines(ctx, CARD.inviteEn, { ...cream, size: 28 }, 620)) {
    drawText(ctx, line, CX, y, { ...cream, size: 28 })
    y += 36
  }

  const { cy, logo } = BACK.ring
  ctx.drawImage(assets.logo, CX - logo, cy - logo, logo * 2, logo * 2)

  // the panels' words
  const { y: py, w: pw, h: ph } = BACK.panel
  const inner = pw - 90
  const lakshmi = after[0]
  const lx = panelX(0) + pw / 2
  if (lakshmi) {
    const row = lakshmi.rows[0]
    let ly = py + 210
    for (const line of wrapText(ctx, row.titleBn, { size: 40, weight: 600, family: 'serif', color: INK.white }, inner)) {
      drawText(ctx, line, lx, ly, { size: 40, weight: 600, family: 'serif', color: INK.white, align: 'center' })
      ly += 50
    }
    for (const line of wrapText(ctx, row.titleEn, { ...cream, size: 24 }, inner)) {
      drawText(ctx, line, lx, ly - 6, { ...cream, size: 24 })
      ly += 32
    }
    ly += 22
    drawText(ctx, formatDay(lakshmi.date, 'long'), lx, ly, { ...white, size: 28, weight: 600 })
    ly += 50
    drawText(ctx, formatSpan(row.timeFrom, row.timeTo), lx, ly, { ...white, size: 38, weight: 700 })
  }

  const ev = CULTURAL_EVENING
  const rx = panelX(1) + pw / 2
  let ry = py + 130
  drawText(ctx, 'Cultural Evenings', rx, ry, { size: 38, weight: 600, family: 'serif', color: INK.white, align: 'center' })
  ry += 34
  drawText(ctx, `${ev.time.replace(/^./, (c) => c.toUpperCase())}`, rx, ry, { ...cream, size: 22 })
  ry += 8
  for (const e of ev.evenings) {
    ry += 38
    drawText(ctx, `${e.day} · ${e.date}`, rx, ry, { ...white, size: 23, weight: 600, maxWidth: inner })
    for (const line of balancedLines(ctx, e.items.join(' · '), { ...cream, size: 21 }, inner)) {
      ry += 27
      drawText(ctx, line, rx, ry, { ...cream, size: 21 })
    }
  }
  if (ry > py + ph - 30) console.warn('[invitation] the cultural evenings overrun their panel')

  drawText(ctx, `Venue: ${CARD.venue}`, CX, BACK.venueY, { ...white, size: 34, weight: 600 })
  drawText(ctx, CARD.address, CX, BACK.addressY, { ...cream, size: 26, maxWidth: W - 2 * MANDALA_AT - 2 * MANDALA + 120 })
  drawText(ctx, CARD.site, CX, BACK.siteY, { size: 34, weight: 600, family: 'serif', color: INK.white, align: 'center' })
  drawText(ctx, CARD.samitiBn, CX, BACK.samitiY, { size: 26, weight: 500, family: 'serif', color: INK.shankha, align: 'center' })
  drawText(ctx, CARD.photoCredit, CX, BACK.creditY, { ...cream, size: 17, weight: 400 })
}

// ── Rendering and the page ──────────────────────────────────────────────────

type Assets = { logo: HTMLImageElement; photo: HTMLImageElement }
type Plan = { inside: [PagePlan, PagePlan]; after: CardDay[] }
type DrawInput = { assets: Assets } & Plan
type PageKey = 'cover' | 'inside1' | 'inside2' | 'back'

const PAGES: { key: PageKey; label: string; file: string }[] = [
  { key: 'cover', label: 'Cover', file: '1-cover' },
  { key: 'inside1', label: 'Inside left · Nirghanto', file: '2-nirghanto-1' },
  { key: 'inside2', label: 'Inside right · Nirghanto', file: '3-nirghanto-2' },
  { key: 'back', label: 'Back', file: '4-back' },
]

const DRAW: Record<PageKey, (ctx: CanvasRenderingContext2D, input: DrawInput) => void> = {
  cover: drawCover,
  inside1: (ctx, input) => drawInside(ctx, input.inside[0], 1),
  inside2: (ctx, input) => drawInside(ctx, input.inside[1], 2),
  back: drawBack,
}

/** The printed sheets: the outside (back | cover) and the inside spread. */
const SPREADS: { label: string; file: string; pages: [PageKey, PageKey] }[] = [
  { label: 'Outside sheet (back · cover)', file: '5-outside', pages: ['back', 'cover'] },
  { label: 'Inside sheet (nirghanto)', file: '6-inside', pages: ['inside1', 'inside2'] },
]

/**
 * "01-durga-puja-2026-1-cover-2x.png": every file leads with its place — the
 * four pages 01–04, then the two printed sheets 05–06 — so a folder of them
 * sorts in reading order.
 */
const fileName = (part: string, scale: number, order?: number) =>
  `${order ? `${String(order).padStart(2, '0')}-` : ''}durga-puja-${CARD.year}-${part}${scale > 1 ? `-${scale}x` : ''}.png`

export default function InvitationCard() {
  const timetable = useQuery({
    queryKey: ['timetable', CARD.eventId],
    queryFn: () => api<TimeTableEntry[]>(`/api/public/timetable?event=${CARD.eventId}`),
  })
  const [assets, setAssets] = useState<Assets | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    Promise.all([loadCardFonts(), loadImage(CARD.logo), loadImage(CARD.photo)])
      .then(([, logo, photo]) => live && setAssets({ logo, photo }))
      .catch((e: Error) => live && setError(e.message))
    return () => {
      live = false
    }
  }, [])

  // the inside pages are laid out by measuring their words, so only once the fonts are in
  const plan = useMemo<Plan | null>(() => {
    if (!assets || !timetable.data) return null
    const { inside, after } = cardDays(timetable.data)
    const ctx = document.createElement('canvas').getContext('2d')!
    return { inside: planInside(ctx, inside), after }
  }, [assets, timetable.data])

  const svgs = useRef<Partial<Record<PageKey, SVGSVGElement | null>>>({})
  const refFor = (key: PageKey) => (el: SVGSVGElement | null) => {
    svgs.current[key] = el
  }

  const render = useCallback(
    async (key: PageKey, scale: number) => {
      const svg = svgs.current[key]
      if (!svg || !plan || !assets) throw new Error('The card is not ready yet')
      const art = await svgToImage(svg, W, H, scale)
      const canvas = document.createElement('canvas')
      canvas.width = W * scale
      canvas.height = H * scale
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(art, 0, 0)
      ctx.scale(scale, scale)
      DRAW[key](ctx, { assets, ...plan })
      return canvas
    },
    [plan, assets],
  )

  const [previews, setPreviews] = useState<Partial<Record<PageKey, string>>>({})
  useEffect(() => {
    if (!plan) return
    let live = true
    const urls: string[] = []
    ;(async () => {
      for (const p of PAGES) {
        const canvas = await render(p.key, 1)
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
        if (!blob || !live) return
        const url = URL.createObjectURL(blob)
        urls.push(url)
        setPreviews((prev) => ({ ...prev, [p.key]: url }))
      }
    })().catch((e: Error) => live && setError(e.message))
    return () => {
      live = false
      urls.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [plan, render])

  const [showShare, setShowShare] = useState(false)
  const [scale, setScale] = useState(2)
  const [busy, setBusy] = useState<string | null>(null)
  const run = async (label: string, job: () => Promise<void>) => {
    setBusy(label)
    try {
      await job()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(null)
    }
  }
  const savePage = (p: (typeof PAGES)[number]) =>
    run(p.label, async () => download(await canvasToPng(await render(p.key, scale), CARD_DPI * scale), fileName(p.file, scale, PAGES.indexOf(p) + 1)))
  const saveSpread = (s: (typeof SPREADS)[number]) =>
    run(s.label, async () => {
      const [a, b] = [await render(s.pages[0], scale), await render(s.pages[1], scale)]
      const sheet = document.createElement('canvas')
      sheet.width = a.width * 2
      sheet.height = a.height
      const ctx = sheet.getContext('2d')!
      ctx.drawImage(a, 0, 0)
      ctx.drawImage(b, a.width, 0)
      download(await canvasToPng(sheet, CARD_DPI * scale), fileName(s.file, scale, PAGES.length + SPREADS.indexOf(s) + 1))
    })

  const ready = !!plan && Object.keys(previews).length === PAGES.length

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      {/* the share card: keep in step with the /invitation entry in web/scripts/prerender.mjs */}
      <Seo title={INVITATION.title} bareTitle description={INVITATION.description} path={INVITATION.path} image={INVITATION.shareImage} noindex />
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-bold">Invitation card · {CARD.year}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A folded greetings card, each page {W} × {H} like the 2024 card (4.53 × 6 in at {CARD_DPI} dpi). Print the
            outside sheet on one side and the inside sheet on the other. The timings come from the published nirghanto.
          </p>
        </div>
        <Button size="sm" variant="outline" className="self-start" onClick={() => setShowShare(!showShare)}>
          <Link2 /> {showShare ? 'Hide link' : 'Share link'}
        </Button>
        {showShare && (
          <SharePanel
            title="Invitation card link"
            description="This page, open to everyone — no sign-in. Share it on WhatsApp or Facebook; it previews with the card."
            url={invitationUrl()}
            message={`${INVITATION.title} — ${pujoDates()}, ${CARD.venue}, ${CARD.place}. The invitation card with the full nirghanto, to view and download.`}
            onClose={() => setShowShare(false)}
          />
        )}
      </div>

      {error && <p className="text-sm font-medium text-jaba">{error}</p>}
      {timetable.isError && <p className="text-sm text-muted-foreground">The nirghanto could not be loaded right now.</p>}
      {!ready && !error && <p className="text-sm text-muted-foreground">Drawing the card…</p>}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Size</span>
        {[1, 2].map((s) => (
          <Button key={s} size="sm" variant={scale === s ? 'default' : 'outline'} onClick={() => setScale(s)}>
            {s === 1 ? `${W} × ${H}` : `${W * 2} × ${H * 2} (print)`}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {SPREADS.map((s) => (
          <Button key={s.file} size="sm" disabled={!ready || !!busy} onClick={() => saveSpread(s)}>
            <Download aria-hidden="true" />
            {busy === s.label ? 'Saving…' : s.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {PAGES.map((p) => (
          <figure key={p.key} className="flex flex-col gap-2">
            {previews[p.key] ? (
              <img src={previews[p.key]} alt={p.label} width={W} height={H} className="h-auto w-full rounded-md border shadow-sm" />
            ) : (
              <div className="aspect-[34/45] w-full animate-pulse rounded-md bg-muted" />
            )}
            <figcaption className="flex items-center justify-between gap-2 text-sm">
              <span className="font-medium">{p.label}</span>
              <Button size="sm" variant="outline" disabled={!ready || !!busy} onClick={() => savePage(p)}>
                <Download aria-hidden="true" />
                {busy === p.label ? 'Saving…' : 'PNG'}
              </Button>
            </figcaption>
          </figure>
        ))}
      </div>

      {/* the pages' art, drawn here and painted onto the canvases */}
      <div aria-hidden="true" className="pointer-events-none fixed -left-[10000px] top-0 h-0 w-0 overflow-hidden">
        {plan && (
          <>
            <CoverArt svgRef={refFor('cover')} />
            <InsideArt svgRef={refFor('inside1')} plan={plan.inside[0]} />
            <InsideArt svgRef={refFor('inside2')} plan={plan.inside[1]} />
            <BackArt svgRef={refFor('back')} />
          </>
        )}
      </div>
    </div>
  )
}
