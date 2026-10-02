import { Download, Printer } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { BAND_TILES } from '@/components/Alpona'
import { AlponaFrame, ArtSvg, Band, Divider, type FrameSpec, Motif } from '@/components/CardArt'
import { Seo } from '@/components/Seo'
import { Button } from '@/components/ui/button'
import { WarliFigure } from '@/components/Warli'
import { type TextStyle, balancedLines, canvasToPng, download, drawText, loadCardFonts, loadImage, printImage, wrapText } from '@/lib/cardCanvas'
import { CULTURAL_EVENING } from '@/lib/culturalEvening'
import { CARD_DPI, CARD_H, CARD_W, INK } from '@/lib/invitationCard'
import { useCardPages } from '@/lib/useCardPages'

const W = CARD_W
const H = CARD_H
const CX = W / 2

/**
 * The cultural evening's flyer, for everyone — no sign-in: a one-sided print
 * card the size of the invitation's pages (1360 × 1800, 4.53 × 6 in at
 * 300 dpi), drawn as a floor alpona is — white rice-paste line-work on the
 * jaba red, the layered frame with a mandala in each corner, Maa (from Souvik
 * Laha's photograph) in a chakra between two dhak, each evening in a card
 * under its day's motif, Warli dancers hand in hand between two dhakis below.
 * The art is SVG and the words canvas text (lib/cardCanvas.ts); it downloads
 * as PNG at 1× or 2× (tagged 600 dpi, the same print size) and prints at its
 * true size. Every word comes from lib/culturalEvening.ts. A cultural admin
 * shares the link from /cultural (Share link); the share card comes from the
 * prerendered HTML (scripts/prerender.mjs).
 */

/** The frame: the invitation's, with smaller corner mandalas so the evenings have the width. */
const FRAME: FrameSpec = { w: W, h: H, edge: 18, k: 1.5, dotK: 1.4, mandala: 200, mandalaGap: 16 }

const L = {
  inviteY: 132,
  inviteLH: 40,
  kuriY: 252,
  chakra: { cy: 512, r: 230 },
  greetingY: 832,
  dividerY: 876,
  headingY: [948, 1012],
  cards: { top: 1044, h: 232, gap: 16, w: 556, colGap: 28 },
  venueY: 1566,
  timeY: 1610,
  warliY: 1714,
} as const

const PHOTO_R = L.chakra.r * 0.58 - 5
const cardX = (col: number) => CX + (col === 0 ? -L.cards.colGap / 2 - L.cards.w : L.cards.colGap / 2)
const cardY = (row: number) => L.cards.top + row * (L.cards.h + L.cards.gap)

/** An evening's card, as a panel inside a floor alpona: a leaf band round it, a tara block at each corner. */
function CardFrame({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
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

function FlyerArt({ svgRef }: { svgRef: (el: SVGSVGElement | null) => void }) {
  const e = CULTURAL_EVENING
  const { cy, r } = L.chakra
  // the chain: dancers hand in hand, a dhaki at each end facing in
  const chain = [-3, -2, -1, 0, 1, 2, 3]
  return (
    <ArtSvg w={W} h={H} svgRef={svgRef}>
      <rect width={W} height={H} fill={INK.jaba} />
      <g color={INK.white}>
        <AlponaFrame {...FRAME} />
        <Band tile="kuri" k={1} side="top" x={CX - 250} y={L.kuriY} len={500} opacity={0.8} />
        <Motif name="chakra" x={CX - r} y={cy - r} w={2 * r} stroke={2.2} />
        <Motif name="dhak" x={128} y={cy - 30} w={190} stroke={2.6} />
        <Motif name="dhak" x={W - 128 - 190} y={cy - 30} w={190} stroke={2.6} mirror="x" />
        <Divider cx={CX} y={L.dividerY} />
        {e.evenings.map((ev, i) => {
          const x = cardX(i % 2)
          const y = cardY(Math.floor(i / 2))
          return (
            <g key={ev.day}>
              <CardFrame x={x} y={y} w={L.cards.w} h={L.cards.h} />
              <Motif name={ev.motif} x={x + L.cards.w / 2 - 22} y={y + 24} w={44} h={44} stroke={2} />
            </g>
          )
        })}
        {chain.map((n) => (
          <WarliFigure key={n} pose="hold" woman={n % 2 === 0} x={CX + n * 50} y={L.warliY} scale={0.8} strokeWidth={3.4} hand />
        ))}
        <WarliFigure pose="dhaki" x={CX - 250} y={L.warliY} scale={0.8} strokeWidth={3.4} hand />
        <WarliFigure pose="dhaki" x={CX + 250} y={L.warliY} scale={0.8} strokeWidth={3.4} flip hand />
      </g>
    </ArtSvg>
  )
}

function drawFlyer(ctx: CanvasRenderingContext2D, photo: HTMLImageElement) {
  const e = CULTURAL_EVENING
  const white: TextStyle = { size: 26, weight: 500, family: 'sans', color: INK.white, align: 'center' }
  const cream: TextStyle = { ...white, color: INK.shankha }

  let y = L.inviteY
  for (const line of balancedLines(ctx, e.invite, { ...cream, size: 30 }, 620)) {
    drawText(ctx, line, CX, y, { ...cream, size: 30 })
    y += L.inviteLH
  }

  // Maa, in the chakra's open centre
  ctx.save()
  ctx.beginPath()
  ctx.arc(CX, L.chakra.cy, PHOTO_R, 0, Math.PI * 2)
  ctx.clip()
  ctx.drawImage(photo, CX - PHOTO_R, L.chakra.cy - PHOTO_R, PHOTO_R * 2, PHOTO_R * 2)
  ctx.restore()

  drawText(ctx, e.greetingBn, CX, L.greetingY, { size: 88, weight: 600, family: 'serif', color: INK.white, align: 'center' })
  drawText(ctx, e.heading[0], CX, L.headingY[0], { size: 54, weight: 600, family: 'serif', color: INK.white, align: 'center', maxWidth: 1000 })
  drawText(ctx, e.heading[1], CX, L.headingY[1], { size: 62, weight: 600, family: 'serif', color: INK.shankha, align: 'center' })

  e.evenings.forEach((ev, i) => {
    const x = cardX(i % 2) + L.cards.w / 2
    const top = cardY(Math.floor(i / 2))
    const inner = L.cards.w - 70
    drawText(ctx, ev.day, x, top + 106, { size: 36, weight: 600, family: 'serif', color: INK.white, align: 'center', maxWidth: inner })
    drawText(ctx, ev.date, x, top + 136, { ...cream, size: 22 })
    // each item on its own line, a long one broken at its comma where it has one
    const lines = ev.items.flatMap((item) => wrapText(ctx, item, { ...white, size: 24 }, inner))
    let ly = top + 168
    for (const line of lines) {
      drawText(ctx, line, x, ly, { ...white, size: 24, maxWidth: inner })
      ly += 28
    }
    if (ly - 28 > top + L.cards.h - 34) console.warn(`[flyer] ${ev.day}'s card overruns`)
  })

  drawText(ctx, `Venue: ${e.venue}`, CX, L.venueY, { ...white, size: 36, weight: 600 })
  drawText(ctx, `Time: ${e.time}`, CX, L.timeY, { ...white, size: 36, weight: 600 })
}

const KEYS = ['flyer'] as const

export function CulturalEvening() {
  const e = CULTURAL_EVENING
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    Promise.all([loadCardFonts(), loadImage(e.photo)])
      .then(([, img]) => live && setPhoto(img))
      .catch((err: Error) => live && setLoadError(err.message))
    return () => {
      live = false
    }
  }, [e.photo])

  const draw = useMemo(() => (photo ? (_: 'flyer', ctx: CanvasRenderingContext2D) => drawFlyer(ctx, photo) : null), [photo])
  const { refFor, render, previews, ready, error: drawError, setError } = useCardPages(KEYS, { w: W, h: H }, draw)
  const error = loadError ?? drawError

  const [scale, setScale] = useState(2)
  const [busy, setBusy] = useState<'save' | 'print' | null>(null)
  const run = async (what: 'save' | 'print', job: () => Promise<void>) => {
    setBusy(what)
    try {
      await job()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(null)
    }
  }
  const save = () =>
    run('save', async () => download(await canvasToPng(await render('flyer', scale), CARD_DPI * scale), `${e.file}${scale > 1 ? `-${scale}x` : ''}.png`))
  // always at print resolution, whatever size is chosen for the download
  const print = () => run('print', async () => printImage(await canvasToPng(await render('flyer', 2), CARD_DPI * 2), W / CARD_DPI, H / CARD_DPI))

  const alt = `${e.greetingBn} — ${e.heading.join(' ')}. ${e.invite}. ${e.evenings
    .map((ev) => `${ev.day}, ${ev.date}: ${ev.items.join('; ')}`)
    .join('. ')}. Venue: ${e.venue}. Time: ${e.time}.`

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      {/* the share card: keep in step with the /cultural/flyer/01 entry in scripts/prerender.mjs */}
      <Seo title={e.title} bareTitle description={e.description} path={e.path} image={e.shareImage} noindex />
      <h1 className="sr-only">{e.heading.join(' ')}</h1>

      <figure className="flex flex-col gap-2">
        {previews.flyer ? (
          <img src={previews.flyer} alt={alt} width={W} height={H} className="h-auto w-full rounded-md shadow-lg max-sm:rounded-none" />
        ) : (
          <div className="aspect-[34/45] w-full animate-pulse rounded-md bg-band/80" aria-label="Drawing the flyer…" />
        )}
        <figcaption className="text-center text-xs text-muted-foreground">{e.photoCredit}</figcaption>
      </figure>

      {error && <p className="text-sm font-medium text-jaba">{error}</p>}

      <div className="flex flex-col items-center gap-3 pb-2">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-sm font-medium">Size</span>
          {[1, 2].map((s) => (
            <Button key={s} size="sm" variant={scale === s ? 'default' : 'outline'} aria-pressed={scale === s} onClick={() => setScale(s)}>
              {s === 1 ? `${W} × ${H}` : `${W * 2} × ${H * 2} (print)`}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button disabled={!ready || !!busy} onClick={() => void save()}>
            <Download aria-hidden="true" /> {busy === 'save' ? 'Saving…' : 'Download PNG'}
          </Button>
          <Button variant="outline" disabled={!ready || !!busy} onClick={() => void print()}>
            <Printer aria-hidden="true" /> {busy === 'print' ? 'Preparing…' : 'Print'}
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          One side, {(W / CARD_DPI).toFixed(2)} × {(H / CARD_DPI).toFixed(0)} in at {CARD_DPI} dpi — the size of the invitation card's pages.
        </p>
      </div>

      {/* the flyer's art, drawn here and painted onto the canvas */}
      <div aria-hidden="true" className="pointer-events-none fixed -left-[10000px] top-0 h-0 w-0 overflow-hidden">
        <FlyerArt svgRef={refFor('flyer')} />
      </div>
    </div>
  )
}
