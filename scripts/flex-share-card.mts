/**
 * The stage flex's share image — what WhatsApp and Facebook show when
 * /flex/01/ is shared: 1200 × 630, WebP, under 100 KB (WhatsApp shows no
 * image above ~100 KB). The whole flex, square, beside its name on the jaba
 * red inside the alpona frame, drawn as an HTML page, photographed by
 * headless Chrome and squeezed by cwebp. Writes web/public/flex-card-<year>.webp
 * — the name STAGE_FLEX.shareImage and the /flex/01 entry in
 * web/scripts/prerender.mjs point at. A changed image needs a new file name
 * (WhatsApp caches by URL).
 *
 *     npx tsx --tsconfig web/tsconfig.app.json scripts/flex-share-card.mts
 *
 * Needs Chrome and cwebp (scripts/lib/share-card.mts).
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { AlponaFrame, ArtSvg, Divider, type FrameSpec } from '@/components/CardArt'
import { INK } from '@/lib/invitationCard'
import { STAGE_FLEX } from '@/lib/stageFlex'

import { cardPage, photographCard } from './lib/share-card.mts'

const W = 1200
const H = 630
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pub = join(root, 'web', 'public')
const out = join(pub, `flex-card-${STAGE_FLEX.year}.webp`)

// ── the art: the frame, and the flex in a white mount at the left ──────────
const FRAME: FrameSpec = { w: W, h: H, edge: 12, k: 1, dotK: 1.1, mandala: 104, mandalaGap: 8 }
const FLEX = { x: 100, y: 96, s: 438 }
const TEXT_CX = 836

const art = renderToStaticMarkup(
  h(
    ArtSvg,
    { w: W, h: H },
    h('rect', { width: W, height: H, fill: INK.jaba }),
    h('g', { color: INK.white }, h(AlponaFrame, FRAME), h(Divider, { cx: TEXT_CX, y: 262, half: 140, size: 34 })),
  ),
)

const line = (text: string, y: number, css: string) =>
  `<div style="position:absolute;left:${TEXT_CX - 260}px;width:520px;top:${y}px;text-align:center;${css}">${text}</div>`
const serif = `font-family:'Noto Serif Bengali',serif;font-weight:600;color:${INK.white}`
const sans = (weight: number, colour: string) => `font-family:'Hind Siliguri',sans-serif;font-weight:${weight};color:${colour}`
const f = STAGE_FLEX

const html = cardPage(
  W,
  H,
  INK.jaba,
  `<div style="position:absolute;inset:0">${art}</div>
<img src="file://${join(pub, f.preview)}" style="position:absolute;left:${FLEX.x}px;top:${FLEX.y}px;width:${FLEX.s}px;height:${FLEX.s}px;border:6px solid ${INK.white};box-shadow:0 6px 18px rgba(0,0,0,.35)">
${line(`${f.heading} ${f.year}`, 126, `${serif};font-size:56px`)}
${line(f.subheading, 206, `${sans(600, INK.shankha)};font-size:25px;letter-spacing:.5px`)}
${line(`The ${f.feet} × ${f.feet} ft backdrop`, 312, `${sans(700, INK.white)};font-size:36px`)}
${line(`${f.px} × ${f.px} px · PNG and JPG`, 364, `${sans(500, INK.shankha)};font-size:26px`)}
${line('Download for printing', 404, `${sans(500, INK.shankha)};font-size:26px`)}
${line(f.place, 478, `${sans(600, INK.white)};font-size:26px`)}`,
)

photographCard(html, W, H, out)
