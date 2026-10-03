import calendar from '@/content/pujo-calendar.json'
import { PUJO_YEAR } from '@/lib/pujoCalendar'

/**
 * Bhog coupons for printing — /bhog/coupons, open to everyone so the samiti
 * can hand the link to the print shop. A4, 24 coupons a page (3 × 8). The
 * whole sheet is the day's colour; each coupon is a white field on it, and a
 * dashed white line runs down the middle of every band of colour between
 * two coupons: cut there and every coupon keeps a 4 mm frame of its day's
 * colour (a cut a millimetre off still leaves 3 mm and 5 mm). Crop marks in
 * the margin show every cut line. The day's initial leads every serial
 * (S-001, A-001, A2-001, N-001, D-001), so a coupon is told apart even in
 * black and white.
 *
 * A page is laid out once as a list of drawing operations in millimetres
 * and drawn twice: on a canvas for the preview, and into a vector PDF
 * (jsPDF) for download — the same page either way. Latin text is the site's
 * Hind Siliguri, embedded in the PDF; the Bengali line is drawn on a canvas
 * (jsPDF can't shape Bengali conjuncts) and placed as an image. The days
 * come from src/content/pujo-calendar.json, Saptami to Dashami, so a new
 * year needs only that file.
 */

export const PAGE = { w: 210, h: 297 } as const
const MARGIN = 8
const COLS = 3
const ROWS = 8
export const PER_PAGE = COLS * ROWS
/** the band of colour between two coupons; each keeps half of it after the cut */
const BAND = 8
const CELL_W = (PAGE.w - 2 * MARGIN) / COLS
const CELL_H = (PAGE.h - 2 * MARGIN) / ROWS

export type CouponDay = {
  date: string
  /** "Saptami", "Ashtami", … */
  title: string
  /** a second day of the same tithi: "Day 2" */
  badge: string | null
  bn: string
  /** leads every serial: S, A, A2, N, D */
  prefix: string
  colour: string
  /** "Sat, 17 Oct 2026" */
  dateLabel: string
}

const INK = '#2B1A10'
const INK_SOFT = '#6B5340'

/** Each bhog day's look, by its name in the pujo calendar. */
const LOOKS: { match: RegExp; title: string; badge: string | null; bn: string; prefix: string; colour: string }[] = [
  { match: /^saptami$/i, title: 'Saptami', badge: null, bn: 'মহা সপ্তমী ভোগ', prefix: 'S', colour: '#C40039' }, // jaba
  { match: /^ashtami$/i, title: 'Ashtami', badge: null, bn: 'মহা অষ্টমী ভোগ', prefix: 'A', colour: '#2A6493' }, // sharat
  { match: /^ashtami.*2/i, title: 'Ashtami', badge: 'Day 2', bn: 'মহা অষ্টমী (অধিক দিবা)', prefix: 'A2', colour: '#17664F' }, // durba
  { match: /^nabami$/i, title: 'Nabami', badge: null, bn: 'মহা নবমী ভোগ', prefix: 'N', colour: '#C2610C' }, // deep genda
  { match: /^dashami$/i, title: 'Dashami', badge: null, bn: 'বিজয়া দশমী ভোগ', prefix: 'D', colour: '#6B2F8F' }, // aparajita, kept apart from the blue
]

/** "2026-10-17" → "Sat, 17 Oct 2026" (built by hand: en-IN puts a comma after the month) */
const fmtDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00+05:30`)
  const part = (o: Intl.DateTimeFormatOptions) => d.toLocaleDateString('en-GB', { ...o, timeZone: 'Asia/Kolkata' })
  return `${part({ weekday: 'short' })}, ${part({ day: 'numeric' })} ${part({ month: 'short' })} ${part({ year: 'numeric' })}`
}

/** The bhog days — Saptami to Dashami in the pujo calendar — each with its coupon's look. */
export const COUPON_DAYS: CouponDay[] = Object.entries(calendar.days as Record<string, string>)
  .sort(([a], [b]) => a.localeCompare(b))
  .flatMap(([date, label]) => {
    const look = LOOKS.find((l) => l.match.test(label.trim()))
    return look ? [{ date, title: look.title, badge: look.badge, bn: look.bn, prefix: look.prefix, colour: look.colour, dateLabel: fmtDate(date) }] : []
  })

export const COUPON_YEAR = PUJO_YEAR

/** The address to share — served with its trailing slash, as Pages serves it. */
export const bhogCouponsUrl = () => `${window.location.origin}/bhog/coupons/`

/**
 * The page's own words and its share card (1200 × 630, under 100 KB, drawn by
 * scripts/bhog-coupons-share-card.mts; a new image takes a new name, as
 * WhatsApp caches by URL) — keep in step with the /bhog/coupons entry in
 * web/scripts/prerender.mjs, which is what WhatsApp and Facebook read.
 */
export const BHOG_COUPONS = {
  path: '/bhog/coupons',
  shareImage: `https://pujosamiti.github.io/bhog-coupons-card-${PUJO_YEAR}.webp`,
  title: `Durga Puja ${PUJO_YEAR} Bhog Coupons · Magarpatta City`,
  description: `Bhog coupons for Durga Puja ${PUJO_YEAR}, Saptami to Dashami — A4 pages of 24, a colour for each day, ready to download and print.`,
} as const

export const serialOf = (day: CouponDay, n: number, width: number) => `${day.prefix}-${String(n).padStart(width, '0')}`

// ── Drawing operations ─────────────────────────────────────────────────────

export type Op =
  | { t: 'rect'; x: number; y: number; w: number; h: number; fill: string; r?: number }
  | { t: 'line'; x1: number; y1: number; x2: number; y2: number; color: string; width: number; dash?: [number, number] }
  | { t: 'text'; x: number; y: number; s: string; pt: number; weight: 'bold' | 'medium'; color: string; align?: 'left' | 'center' | 'right' }
  | { t: 'image'; key: string; x: number; y: number; w: number; h: number }

export const LOGO_KEY = 'logo'
export const bnKey = (day: CouponDay) => `bn-${day.prefix}`
/** the Bengali line's box on a coupon, in mm — its image is drawn to fit */
export const BN_BOX = { w: 29, h: 3.8 }

/** One page: `serials` are the coupon numbers on it, in reading order (fewer than 24 on the last page). */
export function pageOps(day: CouponDay, serials: number[], page: number, pages: number, width: number): Op[] {
  const ops: Op[] = []
  const gx = MARGIN
  const gy = MARGIN
  const gw = PAGE.w - 2 * MARGIN
  const gh = PAGE.h - 2 * MARGIN
  serials.forEach((n, i) => {
    const cx = gx + (i % COLS) * CELL_W
    const cy = gy + Math.floor(i / COLS) * CELL_H
    // the coupon's own square of the day's colour — neighbours join into one sheet;
    // the boxes left over on a last page stay white
    ops.push({ t: 'rect', x: cx, y: cy, w: CELL_W, h: CELL_H, fill: day.colour })
    const fx = cx + BAND / 2
    const fy = cy + BAND / 2
    const fw = CELL_W - BAND
    const fh = CELL_H - BAND
    ops.push({ t: 'rect', x: fx, y: fy, w: fw, h: fh, fill: '#FFFFFF', r: 1.2 })
    // the samiti's mark
    const logo = 21
    ops.push({ t: 'image', key: LOGO_KEY, x: fx + 2.4, y: fy + (fh - logo) / 2, w: logo, h: logo })
    // the words
    const tx = fx + 2.4 + logo + 2.4
    ops.push({ t: 'text', x: tx, y: fy + 6.4, s: day.title, pt: 15, weight: 'bold', color: day.colour })
    ops.push({ t: 'text', x: tx, y: fy + 11.9, s: 'Bhog', pt: 15, weight: 'bold', color: day.colour })
    if (day.badge) {
      // "Day 2" in a chip beside "Bhog", in the day's colour
      const bx = tx + 12.6
      ops.push({ t: 'rect', x: bx, y: fy + 7.75, w: 11.4, h: 4.6, fill: day.colour, r: 0.9 })
      ops.push({ t: 'text', x: bx + 5.7, y: fy + 11.1, s: day.badge.toUpperCase(), pt: 8.5, weight: 'bold', color: '#FFFFFF', align: 'center' })
    }
    ops.push({ t: 'image', key: bnKey(day), x: tx, y: fy + 13.1, w: BN_BOX.w, h: BN_BOX.h })
    ops.push({ t: 'text', x: tx, y: fy + 20.3, s: day.dateLabel, pt: 8.6, weight: 'medium', color: INK })
    // the serial, white on the day's colour
    const serial = serialOf(day, n, width)
    const sw = 3.2 + serial.length * 2.15
    ops.push({ t: 'rect', x: tx, y: fy + 21.6, w: sw, h: 4.7, fill: day.colour, r: 0.9 })
    ops.push({ t: 'text', x: tx + sw / 2, y: fy + 25.1, s: serial, pt: 11, weight: 'bold', color: '#FFFFFF', align: 'center' })
  })

  // one dashed white cut line down the middle of every band between coupons
  const cut = { color: '#FFFFFF', width: 0.3, dash: [1.4, 1] as [number, number] }
  for (let i = 1; i < COLS; i++) ops.push({ t: 'line', x1: gx + i * CELL_W, y1: gy, x2: gx + i * CELL_W, y2: gy + gh, ...cut })
  for (let j = 1; j < ROWS; j++) ops.push({ t: 'line', x1: gx, y1: gy + j * CELL_H, x2: gx + gw, y2: gy + j * CELL_H, ...cut })

  // crop marks in the margin, on every cut line and the sheet's edges
  const mark = { color: INK, width: 0.25 }
  for (let i = 0; i <= COLS; i++) {
    const x = gx + i * CELL_W
    ops.push({ t: 'line', x1: x, y1: gy - 5.5, x2: x, y2: gy - 1.5, ...mark })
    ops.push({ t: 'line', x1: x, y1: gy + gh + 1.5, x2: x, y2: gy + gh + 5.5, ...mark })
  }
  for (let j = 0; j <= ROWS; j++) {
    const y = gy + j * CELL_H
    ops.push({ t: 'line', x1: gx - 5.5, y1: y, x2: gx - 1.5, y2: y, ...mark })
    ops.push({ t: 'line', x1: gx + gw + 1.5, y1: y, x2: gx + gw + 5.5, y2: y, ...mark })
  }

  // a line for the printer and the counter in the top margin, kept between the crop marks
  const first = serialOf(day, serials[0], width)
  const last = serialOf(day, serials[serials.length - 1], width)
  ops.push({
    t: 'text',
    x: gx + 2,
    y: gy - 2.4,
    s: `${day.title}${day.badge ? ` ${day.badge}` : ''} Bhog · ${day.dateLabel}`,
    pt: 6.4,
    weight: 'medium',
    color: INK_SOFT,
  })
  ops.push({
    t: 'text',
    x: gx + gw - 2,
    y: gy - 2.4,
    s: `Page ${page}/${pages} · ${first} – ${last} · A4 at 100%`,
    pt: 6.4,
    weight: 'medium',
    color: INK_SOFT,
    align: 'right',
  })
  return ops
}

/** The serials on each page for `count` coupons from `start`. */
export function pagesFor(start: number, count: number): number[][] {
  const pages: number[][] = []
  for (let i = 0; i < count; i += PER_PAGE) pages.push(Array.from({ length: Math.min(PER_PAGE, count - i) }, (_, k) => start + i + k))
  return pages
}

/** Digits in a serial: three, or more once the numbers pass 999. */
export const serialWidth = (start: number, count: number) => Math.max(3, String(start + count - 1).length)

// ── Images the pages use ───────────────────────────────────────────────────

export type Images = Map<string, HTMLImageElement | HTMLCanvasElement>

/** A day's Bengali line, drawn crisp at print resolution and scaled to fit its box. */
export function bengaliLine(day: CouponDay): HTMLCanvasElement {
  const pxPerMm = 24 // ~600 dpi
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(BN_BOX.w * pxPerMm)
  canvas.height = Math.round(BN_BOX.h * pxPerMm)
  const ctx = canvas.getContext('2d')!
  let size = 8.6 * 0.3528 * pxPerMm // 8.6 pt
  const font = (s: number) => `600 ${s}px "Noto Serif Bengali", serif`
  ctx.font = font(size)
  while (ctx.measureText(day.bn).width > canvas.width && size > 4) {
    size -= 1
    ctx.font = font(size)
  }
  ctx.fillStyle = INK
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(day.bn, 0, canvas.height * 0.78)
  return canvas
}

// ── Drawing on a canvas (the preview) ──────────────────────────────────────

const LATIN = '"Hind Siliguri", sans-serif'

export function drawOnCanvas(ctx: CanvasRenderingContext2D, ops: Op[], pxPerMm: number, images: Images) {
  ctx.save()
  ctx.scale(pxPerMm, pxPerMm)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, PAGE.w, PAGE.h)
  for (const op of ops) {
    if (op.t === 'rect') {
      ctx.fillStyle = op.fill
      ctx.beginPath()
      if (op.r) ctx.roundRect(op.x, op.y, op.w, op.h, op.r)
      else ctx.rect(op.x, op.y, op.w, op.h)
      ctx.fill()
    } else if (op.t === 'line') {
      ctx.strokeStyle = op.color
      ctx.lineWidth = op.width
      ctx.setLineDash(op.dash ?? [])
      ctx.beginPath()
      ctx.moveTo(op.x1, op.y1)
      ctx.lineTo(op.x2, op.y2)
      ctx.stroke()
    } else if (op.t === 'text') {
      ctx.fillStyle = op.color
      ctx.font = `${op.weight === 'bold' ? 700 : 500} ${op.pt * 0.3528}px ${LATIN}`
      ctx.textAlign = op.align ?? 'left'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText(op.s, op.x, op.y)
    } else {
      const img = images.get(op.key)
      if (img) ctx.drawImage(img, op.x, op.y, op.w, op.h)
    }
  }
  ctx.setLineDash([])
  ctx.restore()
}

// ── Drawing into a PDF (the download) ──────────────────────────────────────

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)) as [number, number, number]

async function fontBase64(url: string) {
  const buf = new Uint8Array(await (await fetch(url)).arrayBuffer())
  let s = ''
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000))
  return btoa(s)
}

/**
 * The coupons as one PDF: every page of every day given, in order. Vector
 * throughout, the fonts embedded; the logo and each day's Bengali line are
 * embedded once and reused.
 */
export async function couponsPdf(days: CouponDay[], start: number, count: number, images: Images) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true })
  const [bold, medium] = await Promise.all([fontBase64('/fonts/HindSiliguri-Bold.ttf'), fontBase64('/fonts/HindSiliguri-Medium.ttf')])
  doc.addFileToVFS('HindSiliguri-Bold.ttf', bold)
  doc.addFont('HindSiliguri-Bold.ttf', 'Hind', 'bold')
  doc.addFileToVFS('HindSiliguri-Medium.ttf', medium)
  doc.addFont('HindSiliguri-Medium.ttf', 'Hind', 'normal')
  doc.setProperties({ title: `Bhog coupons ${COUPON_YEAR} — ${days.map((d) => d.title + (d.badge ? ` ${d.badge}` : '')).join(', ')}`, creator: 'pujosamiti.github.io' })

  const width = serialWidth(start, count)
  const pages = pagesFor(start, count)
  let firstPage = true
  for (const day of days) {
    for (const [i, serials] of pages.entries()) {
      if (!firstPage) doc.addPage('a4', 'portrait')
      firstPage = false
      for (const op of pageOps(day, serials, i + 1, pages.length, width)) {
        if (op.t === 'rect') {
          doc.setFillColor(...hex(op.fill))
          if (op.r) doc.roundedRect(op.x, op.y, op.w, op.h, op.r, op.r, 'F')
          else doc.rect(op.x, op.y, op.w, op.h, 'F')
        } else if (op.t === 'line') {
          doc.setDrawColor(...hex(op.color))
          doc.setLineWidth(op.width)
          doc.setLineDashPattern(op.dash ?? [], 0)
          doc.line(op.x1, op.y1, op.x2, op.y2)
        } else if (op.t === 'text') {
          doc.setFont('Hind', op.weight === 'bold' ? 'bold' : 'normal')
          doc.setFontSize(op.pt)
          doc.setTextColor(...hex(op.color))
          doc.text(op.s, op.x, op.y, { align: op.align ?? 'left', baseline: 'alphabetic' })
        } else {
          const img = images.get(op.key)
          if (img) doc.addImage(img, 'PNG', op.x, op.y, op.w, op.h, op.key, 'FAST')
        }
      }
      doc.setLineDashPattern([], 0)
    }
  }
  return doc.output('blob')
}
