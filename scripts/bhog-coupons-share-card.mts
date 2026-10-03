/**
 * The bhog coupons page's share image — what WhatsApp and Facebook show when
 * /bhog/coupons/ is shared: 1200 × 630, WebP, under 100 KB. One coupon of
 * each bhog day, fanned out in its colour, beside the page's name — drawn
 * from the coupons' own look (lib/bhogCoupons.ts), photographed and squeezed
 * by scripts/lib/share-card.mts. Writes web/public/bhog-coupons-card-<year>.webp,
 * the name BHOG_COUPONS.shareImage and the /bhog/coupons prerender entry use.
 *
 *     npx tsx --tsconfig web/tsconfig.app.json scripts/bhog-coupons-share-card.mts
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { COUPON_DAYS, COUPON_YEAR, serialOf } from '@/lib/bhogCoupons'
import { INK } from '@/lib/invitationCard'

import { cardPage, photographCard } from './lib/share-card.mts'

const W = 1200
const H = 630
const pub = join(dirname(fileURLToPath(import.meta.url)), '..', 'web', 'public')
const out = join(pub, `bhog-coupons-card-${COUPON_YEAR}.webp`)
const logo = `file://${join(pub, 'brand', 'pujo-samiti-logo-bw-transparent.png')}`

const first = COUPON_DAYS[0]
const last = COUPON_DAYS[COUPON_DAYS.length - 1]
const span = `${first.dateLabel.split(', ')[1].split(' ').slice(0, 1)}–${last.dateLabel.split(', ')[1]}` // "17–21 Oct 2026"

/** A coupon as on the sheet: its frame of colour, the white field, the words. */
const coupon = (i: number) => {
  const d = COUPON_DAYS[i]
  const angle = [-9, -4.5, 0, 4.5, 9][i] ?? 0
  const x = 548 + i * 72
  const y = 58 + i * 86
  return `<div style="position:absolute;left:${x}px;top:${y}px;width:318px;height:172px;background:${d.colour};border-radius:10px;padding:16px;box-sizing:border-box;transform:rotate(${angle}deg);box-shadow:0 8px 22px rgba(43,26,16,.28)">
  <div style="background:#fff;border-radius:6px;height:100%;display:flex;align-items:center;gap:12px;padding:0 12px;box-sizing:border-box">
    <img src="${logo}" style="width:96px;height:96px">
    <div style="display:flex;flex-direction:column;line-height:1.02">
      <div style="font:700 25px/1.08 'Hind Siliguri',sans-serif;color:${d.colour}">${d.title}</div>
      <div style="font:700 25px/1.08 'Hind Siliguri',sans-serif;color:${d.colour};display:flex;align-items:center;gap:6px">Bhog${d.badge ? `<span style="font-size:12px;color:#fff;background:${d.colour};border-radius:4px;padding:2px 6px 0">${d.badge.toUpperCase()}</span>` : ''}</div>
      <div style="font:600 13px/1.08 'Noto Serif Bengali',serif;color:${INK.ink};margin-top:4px;white-space:nowrap">${d.bn}</div>
      <div style="font:500 14px/1.08 'Hind Siliguri',sans-serif;color:${INK.ink};margin-top:5px">${d.dateLabel}</div>
      <div style="align-self:flex-start;margin-top:6px;font:700 17px/1.08 'Hind Siliguri',sans-serif;color:#fff;background:${d.colour};border-radius:4px;padding:2px 9px 0">${serialOf(d, 1, 3)}</div>
    </div>
  </div></div>`
}

const html = cardPage(
  W,
  H,
  INK.kash,
  `<div style="position:absolute;inset:0;border:14px solid ${INK.jaba}"></div>
<div style="position:absolute;inset:14px;border:2px solid ${INK.jaba};opacity:.35;margin:8px"></div>
<div style="position:absolute;left:70px;top:96px;width:450px">
  <img src="${logo}" style="width:92px;height:92px">
  <div style="font:600 64px/1.08 'Noto Serif Bengali',serif;color:${INK.jaba};margin-top:18px;line-height:1.05">Bhog Coupons</div>
  <div style="font:600 38px/1.08 'Noto Serif Bengali',serif;color:${INK.ink};margin-top:10px">Durga Puja ${COUPON_YEAR}</div>
  <div style="font:600 25px/1.08 'Hind Siliguri',sans-serif;color:${INK.ink};margin-top:22px">Saptami to Dashami · ${span}</div>
  <div style="font:500 21px/1.08 'Hind Siliguri',sans-serif;color:${INK.inkSoft};margin-top:10px;line-height:1.35">A4 sheets of 24 · a colour for each day<br>Download and print</div>
</div>
${COUPON_DAYS.map((_, i) => coupon(i)).join('\n')}`,
)

photographCard(html, W, H, out)
