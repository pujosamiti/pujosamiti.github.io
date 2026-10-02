/**
 * The invitation card's share image — what WhatsApp and Facebook show when
 * /invitation/ is shared: 1200 × 630, WebP, under 100 KB (WhatsApp shows no
 * image above ~100 KB). Drawn from the card's own art (CardArt, Warli, the
 * cover photograph) as an HTML page, photographed by headless Chrome and
 * squeezed by cwebp. Writes web/public/invitation-card-<year>.webp — the name
 * INVITATION.shareImage and the /invitation entry in web/scripts/prerender.mjs
 * point at. Rerun when the card's year or words change; a changed image
 * needs a new file name (WhatsApp caches by URL).
 *
 *     npx tsx --tsconfig web/tsconfig.app.json scripts/invitation-share-card.mts
 *
 * Needs Chrome and cwebp (scripts/lib/share-card.mts).
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { AlponaFrame, ArtSvg, Divider, type FrameSpec, Motif } from '@/components/CardArt'
import { WarliFigure } from '@/components/Warli'
import { CARD, INK, INVITATION, pujoDates } from '@/lib/invitationCard'

import { cardPage, photographCard } from './lib/share-card.mts'

const W = 1200
const H = 630
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pub = join(root, 'web', 'public')
const out = join(pub, `invitation-card-${CARD.year}.webp`)

// ── the art ─────────────────────────────────────────────────────────────────
const FRAME: FrameSpec = { w: W, h: H, edge: 12, k: 1, dotK: 1.1, mandala: 160, mandalaGap: 10 }
const MEDALLION = { cx: 312, cy: 315, r: 210 }
/** the photograph's circle, inside the chakra's own (58 of its 100) */
const PHOTO_R = MEDALLION.r * 0.58 - 5
const TEXT_CX = 812
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
      h(Divider, { cx: TEXT_CX, y: 186, half: 150, size: 34 }),
      ...(
        [
          ['dhaki', false, false, -140],
          ['dhunuchi', true, false, -70],
          ['dance', false, false, 0],
          ['dhunuchi', false, true, 70],
          ['dhaki', false, true, 140],
        ] as const
      ).map(([pose, woman, flip, dx]) =>
        h(WarliFigure, { key: dx, pose, woman, flip, x: TEXT_CX + dx, y: WARLI_Y, scale: 0.6, strokeWidth: 3.6, hand: true }),
      ),
    ),
  ),
)

// ── the page: the art, Maa in the chakra, the words in the site's own type ─
const line = (text: string, y: number, css: string) =>
  `<div style="position:absolute;left:${TEXT_CX - 320}px;width:640px;top:${y}px;text-align:center;${css}">${text}</div>`
const serif = `font-family:'Noto Serif Bengali',serif;font-weight:600;color:${INK.white}`
const sans = (weight: number, colour: string) => `font-family:'Hind Siliguri',sans-serif;font-weight:${weight};color:${colour}`

const html = cardPage(
  W,
  H,
  INK.jaba,
  `<div style="position:absolute;inset:0">${art}</div>
<img src="file://${join(pub, CARD.photo)}" style="position:absolute;left:${MEDALLION.cx - PHOTO_R}px;top:${MEDALLION.cy - PHOTO_R}px;width:${2 * PHOTO_R}px;height:${2 * PHOTO_R}px;border-radius:50%;object-fit:cover">
${line(CARD.greetingBn, 98, `${serif};font-size:58px`)}
${line(CARD.titleEn, 222, `${serif};font-size:42px`)}
${line(INVITATION.shareTagline, 278, `${sans(600, INK.shankha)};font-size:26px;letter-spacing:.5px`)}
${line(pujoDates(), 322, `${sans(700, INK.white)};font-size:34px`)}
${line(CARD.venue, 372, `${sans(500, INK.shankha)};font-size:24px`)}
${line(CARD.place, 402, `${sans(500, INK.shankha)};font-size:24px`)}`,
)

photographCard(html, W, H, out)
