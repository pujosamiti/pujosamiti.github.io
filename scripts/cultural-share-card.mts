/**
 * The cultural flyer's share image — what WhatsApp and Facebook show when
 * /cultural/flyer/01/ is shared: 1200 × 630, WebP, under 100 KB. Drawn from
 * the flyer's own art (CardArt, Warli, the flyer's photograph of Maa) and
 * words (lib/culturalEvening.ts), photographed and squeezed by
 * scripts/lib/share-card.mts. Writes the file CULTURAL_EVENING.shareImage
 * names, in web/public/ — the /cultural/flyer/01 entry in
 * web/scripts/prerender.mjs points at it too. A changed image needs a new
 * file name (WhatsApp caches by URL).
 *
 *     npx tsx --tsconfig web/tsconfig.app.json scripts/cultural-share-card.mts
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { AlponaFrame, ArtSvg, Divider, type FrameSpec, Motif } from '@/components/CardArt'
import { WarliFigure } from '@/components/Warli'
import { CULTURAL_EVENING } from '@/lib/culturalEvening'
import { INK } from '@/lib/invitationCard'

import { cardPage, photographCard } from './lib/share-card.mts'

const W = 1200
const H = 630
const e = CULTURAL_EVENING
const pub = join(dirname(fileURLToPath(import.meta.url)), '..', 'web', 'public')
const out = join(pub, e.shareImage.split('/').pop()!)

// ── the art: the frame, Maa's chakra on the left, the Warli chain under the words
const FRAME: FrameSpec = { w: W, h: H, edge: 12, k: 1, dotK: 1.1, mandala: 160, mandalaGap: 10 }
const MEDALLION = { cx: 312, cy: 315, r: 210 }
const PHOTO_R = MEDALLION.r * 0.58 - 5
const TEXT_CX = 796
const WARLI_Y = 566

const art = renderToStaticMarkup(
  h(
    ArtSvg,
    { w: W, h: H },
    h('rect', { width: W, height: H, fill: INK.jaba }),
    h(
      'g',
      { color: INK.white },
      h(AlponaFrame, FRAME),
      h(Motif, { name: 'chakra', x: MEDALLION.cx - MEDALLION.r, y: MEDALLION.cy - MEDALLION.r, w: 2 * MEDALLION.r, stroke: 1.6 }),
      h(Divider, { cx: TEXT_CX, y: 262, half: 150, size: 34 }),
      ...[-3, -2, -1, 0, 1, 2, 3].map((n) =>
        h(WarliFigure, { key: n, pose: 'hold', woman: n % 2 === 0, x: TEXT_CX + n * 34, y: WARLI_Y, scale: 0.55, strokeWidth: 3.6, hand: true }),
      ),
      h(WarliFigure, { pose: 'dhaki', x: TEXT_CX - 172, y: WARLI_Y, scale: 0.58, strokeWidth: 3.6, hand: true }),
      h(WarliFigure, { pose: 'dhaki', x: TEXT_CX + 172, y: WARLI_Y, scale: 0.58, strokeWidth: 3.6, flip: true, hand: true }),
    ),
  ),
)

// ── the words, in the site's own type ──────────────────────────────────────
const line = (text: string, y: number, css: string) =>
  `<div style="position:absolute;left:${TEXT_CX - 300}px;width:600px;top:${y}px;text-align:center;${css}">${text}</div>`
const serif = (colour: string) => `font-family:'Noto Serif Bengali',serif;font-weight:600;color:${colour}`
const sans = (weight: number, colour: string) => `font-family:'Hind Siliguri',sans-serif;font-weight:${weight};color:${colour}`

const html = cardPage(
  W,
  H,
  INK.jaba,
  `<div style="position:absolute;inset:0">${art}</div>
<img src="file://${join(pub, e.photo)}" style="position:absolute;left:${MEDALLION.cx - PHOTO_R}px;top:${MEDALLION.cy - PHOTO_R}px;width:${2 * PHOTO_R}px;height:${2 * PHOTO_R}px;border-radius:50%;object-fit:cover">
${line(e.heading[0], 128, `${serif(INK.white)};font-size:34px`)}
${line(e.heading[1], 172, `${serif(INK.shankha)};font-size:56px`)}
${line(e.shareLines[0], 294, `${sans(700, INK.white)};font-size:30px`)}
${line(e.shareLines[1], 340, `${sans(500, INK.shankha)};font-size:24px`)}
${line(`${e.venue} · ${e.time}`, 378, `${sans(500, INK.white)};font-size:24px`)}`,
)

photographCard(html, W, H, out)
