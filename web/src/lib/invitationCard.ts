import type { TimeTableEntry } from '@pujosamiti/shared'

import { motifForDay, type AlponaName } from '@/components/Alpona'
import { PUJO_TO, PUJO_YEAR, SHASHTHI } from '@/lib/pujoCalendar'
import { type TextStyle, fittedSize, measure, wrapText } from '@/lib/cardCanvas'

/**
 * The year's invitation card — a folded greetings card: the cover outside
 * front, the nirghanto across the two inside pages, the back outside back.
 * Each page is 1360 × 1800, the 2024 card's own size and shape (34 : 45,
 * 4.53 × 6 in at 300 dpi), drawn on a canvas and saved as PNG. The timings
 * come from the public nirghanto (the Schedule page's own feed), so a
 * correction there reaches the card; the days and the year come from
 * src/content/pujo-calendar.json. Update the words below each year.
 */
export const CARD_W = 1360
export const CARD_H = 1800
export const CARD_DPI = 300

export const CARD = {
  year: PUJO_YEAR,
  eventId: `durga-pujo-${PUJO_YEAR}`,
  /** Maa on the cover: Joydeb Biswas's photograph (Pexels licence — free to use, credit given anyway), cropped square round the face. */
  photo: '/invitation/durga-2026-cover.webp',
  photoCredit: 'Cover photograph: Joydeb Biswas · Pexels',
  logo: '/brand/pujo-samiti-logo.png',
  greetingBn: 'শুভ শারদীয়া',
  titleEn: `Shri Shri Durga Puja ${PUJO_YEAR}`,
  inviteBn: 'সকলকে সাদর আমন্ত্রণ',
  inviteEn: 'All Magarpatta citizens and Cybercity families are warmly invited',
  venue: 'Amphitheatre, Aditi Garden',
  place: 'Magarpatta City, Pune',
  address: 'Opposite Cybercity Tower 5, Magarpatta City, Pune',
  site: 'pujosamiti.github.io',
  samitiBn: 'পুজো সমিতি · মগরপাট্টা, পুনে',
  scheduleTitleBn: `নির্ঘণ্ট · ${toBengaliDigits(PUJO_YEAR)}`,
  scheduleTitleEn: `Durga Puja ${PUJO_YEAR} · Puja Schedule`,
  /**
   * Rows the nirghanto keeps for the record but the card leaves out: the
   * Ardharatri-bihita puja is offered with the morning puja ("No separate
   * puja will be held at night"), so it has no time of its own to attend.
   */
  omit: ['Ardharatri-bihita Puja (Ahoratra)'],
  /** The moments people plan their day round — set in red, as the 2024 card did. */
  highlight: ['Sandhi Puja', 'Ashtami Pushpanjali', 'Sindur Khela'],
} as const

/**
 * The card's own page, open to everyone, and what WhatsApp and Facebook show
 * when its link is shared: title, description and a 1200 × 630 share image
 * under 100 KB (WhatsApp shows nothing heavier), drawn from the card's own
 * art by scripts/invitation-share-card.mts. A new image takes a new name —
 * WhatsApp caches by URL. Keep all of it in step with the /invitation entry
 * in web/scripts/prerender.mjs: the apps read only that prerendered HTML.
 */
export const INVITATION = {
  path: '/invitation',
  title: `Shri Shri Durga Puja ${PUJO_YEAR} · Invitation · Magarpatta City`,
  description:
    'Shashthi to Bijaya Dashami, 16–21 October 2026, at the Amphitheatre, Aditi Garden, Magarpatta City, Pune. The samiti’s invitation card with the full nirghanto — every puja timing, day by day. All Magarpatta citizens and Cybercity families welcome.',
  shareImage: `https://pujosamiti.github.io/invitation-card-${PUJO_YEAR}.webp`,
  /** what the share image says, as the script draws it */
  shareTagline: 'Invitation & Puja Schedule',
} as const

/** The address to share — served with its trailing slash, as Pages serves it. */
export const invitationUrl = () => `${window.location.origin}${INVITATION.path}/`

/** The brand palette (brand-identity.html; index.css). */
export const INK = {
  jaba: '#C40039',
  sindoor: '#A3002F',
  kash: '#FAF8F4',
  ink: '#2B1A10',
  inkSoft: '#6B5340',
  shankha: '#F2EFDA',
  white: '#FFFFFF',
} as const

export function toBengaliDigits(n: number | string) {
  return String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)])
}

/** "08:05" → "8:05" and its meridiem. */
function clock(t: string) {
  const [h, m] = t.split(':').map(Number)
  return { text: `${h % 12 || 12}:${String(m).padStart(2, '0')}`, ampm: h >= 12 ? 'PM' : 'AM' }
}

/** "8:05 – 10:15 AM", "6:30 – 7:30 PM", "11:00 AM"; the meridiem once when both ends share it. */
export function formatSpan(from: string | null, to: string | null) {
  if (!from) return '—'
  const a = clock(from)
  if (!to) return `${a.text} ${a.ampm}`
  const b = clock(to)
  return a.ampm === b.ampm ? `${a.text} – ${b.text} ${b.ampm}` : `${a.text} ${a.ampm} – ${b.text} ${b.ampm}`
}

/** "2026-10-17" → "Saturday, 17 Oct" */
export function formatDay(iso: string, month: 'short' | 'long' = 'short') {
  const d = new Date(`${iso}T00:00:00+05:30`)
  const weekday = d.toLocaleDateString('en-IN', { weekday: 'long', timeZone: 'Asia/Kolkata' })
  const date = d.toLocaleDateString('en-IN', { day: 'numeric', month, timeZone: 'Asia/Kolkata' })
  return `${weekday}, ${date}`
}

/** "16 – 21 October 2026", Shashthi to Dashami. */
export function pujoDates() {
  const from = new Date(`${SHASHTHI}T00:00:00+05:30`)
  const to = new Date(`${PUJO_TO}T00:00:00+05:30`)
  const month = (d: Date) => d.toLocaleDateString('en-IN', { month: 'long', timeZone: 'Asia/Kolkata' })
  const sameMonth = month(from) === month(to)
  return sameMonth
    ? `${from.getDate()} – ${to.getDate()} ${month(to)} ${PUJO_YEAR}`
    : `${from.getDate()} ${month(from)} – ${to.getDate()} ${month(to)} ${PUJO_YEAR}`
}

export type CardDay = { date: string; labelBn: string; labelEn: string; rows: TimeTableEntry[] }

/**
 * The nirghanto as days (by date and label, as the Schedule groups them — a
 * date can hold two tithis), the omitted rows left out. `inside` runs to
 * Dashami, Mahalaya with it; `after` is what follows the pujo (Kojagari
 * Lakshmi Puja), for the back page.
 */
export function cardDays(rows: TimeTableEntry[]) {
  const days: CardDay[] = []
  for (const t of rows) {
    if ((CARD.omit as readonly string[]).includes(t.titleEn)) continue
    const last = days[days.length - 1]
    if (last && last.date === t.dayDate && last.labelEn === t.dayLabelEn) last.rows.push(t)
    else days.push({ date: t.dayDate, labelBn: t.dayLabelBn, labelEn: t.dayLabelEn, rows: [t] })
  }
  return { inside: days.filter((d) => d.date <= PUJO_TO), after: days.filter((d) => d.date > PUJO_TO) }
}

// ── The inside pages' table ─────────────────────────────────────────────────

/** Columns, in card pixels. */
export const COL = {
  motifX: 108,
  dayX: 166,
  dayW: 214,
  eventX: 400,
  eventW: 590,
  timeRight: 1252,
  timeW: 236,
} as const

export const TYPE = {
  dayBn: { size: 34, weight: 600, family: 'serif', color: INK.jaba } satisfies TextStyle,
  dayEn: { size: 21, weight: 500, family: 'sans', color: INK.inkSoft } satisfies TextStyle,
  dayDate: { size: 22, weight: 600, family: 'sans', color: INK.ink } satisfies TextStyle,
  rowBn: { size: 29, weight: 500, family: 'sans', color: INK.ink } satisfies TextStyle,
  rowEn: { size: 21, weight: 400, family: 'sans', color: INK.inkSoft } satisfies TextStyle,
  time: { size: 27, weight: 600, family: 'sans', color: INK.ink } satisfies TextStyle,
} as const
type TypeKey = keyof typeof TYPE

/** Line heights, at full size. */
const LINE = { dayBn: 40, dayEn: 28, dayDate: 30, rowBn: 34, rowEn: 26 } as const
/** The gap between two days, for the dotted rule. */
export const DAY_GAP = 24
/** The table's top and bottom on an inside page. */
export const TABLE_TOP = 300
export const TABLE_BOTTOM = 1646
/** The least room between two rows, and the smallest the table's type may go to fit its page. */
const MIN_PAD = 6
const MIN_SCALE = 0.78

/**
 * The table's type at a scale: when a year's nirghanto is too long for two
 * pages at full size, both pages shrink together (a spread reads as one).
 */
export type Scaled = { type: Record<TypeKey, TextStyle>; lh: Record<keyof typeof LINE, number> }
function scaled(s: number): Scaled {
  const type = Object.fromEntries(Object.entries(TYPE).map(([k, t]) => [k, { ...t, size: t.size * s }])) as Scaled['type']
  const lh = Object.fromEntries(Object.entries(LINE).map(([k, v]) => [k, v * s])) as Scaled['lh']
  return { type, lh }
}

export type RowPlan = {
  y: number
  h: number
  bn: string[]
  bnSize: number
  en: string[]
  enSize: number
  time: string
  strong: boolean
}
export type DayPlan = {
  y: number
  h: number
  /** where the day's label starts — centred in its block, as the 2024 card set it */
  labelTop: number
  labelBn: string[]
  labelEn: string
  date: string
  motif: AlponaName | null
  rows: RowPlan[]
}
export type PagePlan = { days: DayPlan[]; rules: number[]; scaled: Scaled }

/** A title in its column: one line, shrunk a little if it must be, else broken in two. */
function fitTitle(ctx: CanvasRenderingContext2D, text: string, style: TextStyle, width: number) {
  const fitted = { ...style, maxWidth: width, minScale: 0.88 }
  if (measure(ctx, text, fitted) <= width) return { lines: [text], size: fittedSize(ctx, text, fitted) }
  return { lines: wrapText(ctx, text, style, width), size: style.size }
}

/** The bare heights of a day at a scale, before the page's spare room is shared out. */
function measureDay(ctx: CanvasRenderingContext2D, day: CardDay, sc: Scaled) {
  const labelBn = wrapText(ctx, day.labelBn, sc.type.dayBn, COL.dayW)
  const rows = day.rows.map((t) => {
    const bn = fitTitle(ctx, t.titleBn, sc.type.rowBn, COL.eventW)
    const en = fitTitle(ctx, t.titleEn, sc.type.rowEn, COL.eventW)
    return { t, bn, en, h: bn.lines.length * sc.lh.rowBn + en.lines.length * sc.lh.rowEn }
  })
  const labelH = labelBn.length * sc.lh.dayBn + sc.lh.dayEn + sc.lh.dayDate
  return { day, labelBn, labelH, rows }
}
type Measured = ReturnType<typeof measureDay>

/** A page's height with `pad` under every row. */
const pageHeight = (days: Measured[], pad: number) =>
  days.reduce((s, d) => s + Math.max(d.labelH + pad, d.rows.reduce((r, x) => r + x.h + pad, 0)), 0) +
  DAY_GAP * (days.length - 1)

const AVAIL = TABLE_BOTTOM - TABLE_TOP

/** Lay one page's days out between TABLE_TOP and TABLE_BOTTOM, the spare room shared between the rows. */
function planPage(days: Measured[], sc: Scaled): PagePlan {
  const rowCount = days.reduce((s, d) => s + d.rows.length, 0)
  // padding per row, between snug and airy; whatever is left centres the table
  const pad = Math.max(MIN_PAD, Math.min(26, (AVAIL - pageHeight(days, 0)) / rowCount))
  const heights = days.map((d) => Math.max(d.labelH + pad, d.rows.reduce((s, r) => s + r.h + pad, 0)))
  const total = heights.reduce((a, b) => a + b, 0) + DAY_GAP * (days.length - 1)
  let y = TABLE_TOP + Math.max(0, (AVAIL - total) / 2)
  const rules: number[] = []
  const planned = days.map((d, i) => {
    const h = heights[i]
    // the rows sit centred in the day's block when its label is the taller
    const rowsH = d.rows.reduce((s, r) => s + r.h + pad, 0)
    let ry = y + (h - rowsH) / 2
    const rows = d.rows.map((r) => {
      const rh = r.h + pad
      const plan: RowPlan = {
        y: ry,
        h: rh,
        bn: r.bn.lines,
        bnSize: r.bn.size,
        en: r.en.lines,
        enSize: r.en.size,
        time: formatSpan(r.t.timeFrom, r.t.timeTo),
        strong: (CARD.highlight as readonly string[]).includes(r.t.titleEn),
      }
      ry += rh
      return plan
    })
    const day: DayPlan = {
      y,
      h,
      labelTop: y + (h - d.labelH) / 2,
      labelBn: d.labelBn,
      labelEn: d.day.labelEn,
      date: formatDay(d.day.date),
      motif: motifForDay(d.day.labelEn),
      rows,
    }
    y += h
    if (i < days.length - 1) {
      rules.push(y + DAY_GAP / 2)
      y += DAY_GAP
    }
    return day
  })
  return { days: planned, rules, scaled: sc }
}

/**
 * The two inside pages: the days split where the two pages come out most
 * nearly equal, then the largest type at which both fit — the same on both
 * pages — and each page laid out to fill its height.
 */
export function planInside(ctx: CanvasRenderingContext2D, days: CardDay[]): [PagePlan, PagePlan] {
  const full = days.map((d) => measureDay(ctx, d, scaled(1)))
  let k = 1
  let bestScore = Infinity
  for (let i = 1; i < full.length; i++) {
    const score = Math.max(pageHeight(full.slice(0, i), MIN_PAD), pageHeight(full.slice(i), MIN_PAD))
    if (score < bestScore) {
      bestScore = score
      k = i
    }
  }
  for (let s = 1; ; s -= 0.02) {
    const sc = scaled(Math.max(s, MIN_SCALE))
    const measured = days.map((d) => measureDay(ctx, d, sc))
    const [a, b] = [measured.slice(0, k), measured.slice(k)]
    const fits = pageHeight(a, MIN_PAD) <= AVAIL && pageHeight(b, MIN_PAD) <= AVAIL
    if (fits || s <= MIN_SCALE) {
      if (!fits) console.warn('[invitation] the nirghanto is too long for two pages even at the smallest type')
      return [planPage(a, sc), planPage(b, sc)]
    }
  }
}
