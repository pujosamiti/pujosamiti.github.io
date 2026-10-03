import type { ProcurementDay, ProcurementItemView, ProcurementSlot } from '@pujosamiti/shared'

/**
 * A procurement category as an order image — the sheet the samiti sends the
 * phoolwala or the grocer on WhatsApp: a title in Hindi and Bengali, then a
 * ruled table of the category's items (Hindi / Bengali names, as the vendor
 * reads them) against each delivery column (date, time, tithi), the
 * quantities as typed. A category bought once (pottery, utensils) gets a
 * single quantity column instead. Drawn on a canvas, saved as PNG.
 */

const FONT = '"Hind", "Hind Siliguri", "Noto Sans Devanagari", sans-serif'
const INK = '#1a1a1a'
const RULE = '#2b2b2b'
const SCALE = 2 // pixels per layout unit, so WhatsApp's recompression keeps it legible

/** The Devanagari word for a delivery column's tithi, as the vendor reads it. */
const TITHI_HI: [RegExp, string][] = [
  [/sandhi/i, 'सन्धि पूजा'],
  [/panchami/i, 'पंचमी'],
  [/shashthi|sasthi/i, 'षष्ठी'],
  [/saptami/i, 'सप्तमी'],
  [/ashtami.*2/i, 'अष्टमी (दूसरा दिन)'],
  [/ashtami/i, 'अष्टमी'],
  [/nabami|navami/i, 'नवमी'],
  [/dashami/i, 'दशमी'],
  [/lakshmi/i, 'लक्ष्मी पूजा'],
]
const tithiHi = (label: string) => TITHI_HI.find(([re]) => re.test(label))?.[1] ?? label

/** "19:00" → "7 pm", "10:30" → "10:30 am" */
const clock = (t: string | null) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h >= 12 ? 'pm' : 'am'}`
}

const SLOT_HI: Record<ProcurementSlot, string> = { morning: 'सुबह', evening: 'शाम' }

/**
 * Vendors who keep a delivery rule of their own, by category: the phoolwala
 * delivers for every puja day or event the day before, by 7 pm (the samiti's
 * rule, 3 Oct 2026) — so a flower sheet dates each column from its puja day,
 * whatever moment the shared delivery column carries for other vendors.
 */
export const VENDOR_DELIVERY: Record<string, { daysBefore: number; time: string }> = {
  'Flowers / Garlands': { daysBefore: 1, time: '19:00' },
}

const minusDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}

type Column = { day: ProcurementDay; head: string[] }

export type OrderSheet = {
  category: string
  title: string
  columns: Column[]
  rows: { no: number; name: string; cells: string[] }[]
}

/**
 * The sheet for one category: its items that have anything to order, against
 * the delivery columns (all of them, or the one `onlyDay`) where any of them
 * has a quantity. Null when there is nothing to order.
 */
export function orderSheet(
  category: string,
  items: ProcurementItemView[],
  days: ProcurementDay[],
  year: number,
  onlyDay: ProcurementDay | null,
  /** puja day id → its tithi date, for vendors with a delivery rule */
  pujaDates: Map<string, string> = new Map(),
): OrderSheet | null {
  const inCat = items.filter((i) => i.category === category && i.isActive)
  const shown = onlyDay ? [onlyDay] : days
  const SLOT_ORDER: ProcurementSlot[] = ['morning', 'evening']
  const filled = (i: ProcurementItemView, d: ProcurementDay) =>
    i.cells
      .filter((c) => c.dayId === d.id && c.quantity.trim() !== '')
      .sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot))
  const used = shown.filter((d) => inCat.some((i) => filled(i, d).length > 0))
  // the delivery moment: the vendor's own rule from the puja day where there is one, else the column's
  const rule = VENDOR_DELIVERY[category]
  const moment = (d: ProcurementDay) => {
    const puja = d.pujaDayId ? pujaDates.get(d.pujaDayId) : undefined
    return rule && puja ? { date: minusDays(puja, rule.daysBefore), time: rule.time } : { date: d.date, time: d.time }
  }
  const columns: Column[] = used.map((d) => {
    const { date: iso, time } = moment(d)
    const date = iso ? new Date(`${iso}T00:00:00+05:30`) : null
    const dayMonth = date ? date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }) : ''
    return { day: d, head: [dayMonth, date ? 'तारिख' : '', clock(time), tithiHi(d.label)].filter(Boolean) }
  })
  const name = (i: ProcurementItemView) =>
    [i.nameHi, i.nameBn].filter(Boolean).join(' / ') || i.title
  let rows: OrderSheet['rows']
  if (columns.length) {
    const withAny = inCat.filter((i) => used.some((d) => filled(i, d).length > 0))
    rows = withAny.map((i, k) => ({
      no: k + 1,
      name: name(i),
      cells: used.map((d) => {
        const cs = filled(i, d)
        // a day with both a morning and an evening delivery says which is which
        return cs.length > 1 ? cs.map((c) => `${SLOT_HI[c.slot]} ${c.quantity}`).join('\n') : (cs[0]?.quantity ?? '')
      }),
    }))
  } else if (!onlyDay) {
    // bought once: the year's total is the order
    const withTotal = inCat.filter((i) => (i.totalQuantity ?? '').trim() !== '')
    rows = withTotal.map((i, k) => ({ no: k + 1, name: name(i), cells: [i.totalQuantity ?? ''] }))
  } else rows = []
  if (!rows.length) return null
  return {
    category,
    title: `मगरपट्टा दुर्गा पूजा ${year} / মগরপাট্টা দুর্গা পূজা ${year}`,
    columns,
    rows,
  }
}

/** Break text to fit `width`, at spaces (and at the newlines a cell already carries). */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const out: string[] = []
  for (const para of text.split('\n')) {
    const words = para.split(' ')
    let line = ''
    for (const w of words) {
      const next = line ? `${line} ${w}` : w
      if (line && ctx.measureText(next).width > width) {
        out.push(line)
        line = w
      } else line = next
    }
    out.push(line)
  }
  return out
}

/** Load the faces the sheet draws with (Hind for Devanagari, Hind Siliguri for Bengali). */
export async function loadOrderFonts() {
  if (!document.querySelector('link[data-order-fonts]')) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Hind:wght@500;700&family=Hind+Siliguri:wght@500;700&display=swap'
    link.dataset.orderFonts = ''
    document.head.append(link)
    await new Promise((resolve) => link.addEventListener('load', resolve, { once: true }))
  }
  const sample = 'तुलसी तारिख षष्ठी তুলসী গোচ্ছা 1234'
  await Promise.all(['500 20px "Hind"', '700 20px "Hind"', '500 20px "Hind Siliguri"', '700 20px "Hind Siliguri"'].map((f) => document.fonts.load(f, sample)))
}

/** The sheet drawn on a canvas, sized to its content. */
export function drawOrderSheet(sheet: OrderSheet): HTMLCanvasElement {
  const pad = 24
  const noW = 52
  const nameW = 300
  const colW = sheet.columns.length ? Math.max(104, Math.min(150, 760 / sheet.columns.length)) : 200
  const nCols = Math.max(1, sheet.columns.length)
  const tableW = noW + nameW + colW * nCols
  const width = tableW + pad * 2
  const body = '500 18px ' + FONT
  const bold = '700 18px ' + FONT
  const lh = 24

  // measure first, on a scratch context
  const m = document.createElement('canvas').getContext('2d')!
  m.font = bold
  const headLines = sheet.columns.length ? sheet.columns.map((c) => c.head.flatMap((h) => wrap(m, h, colW - 12))) : [['मात्रा / পরিমাণ']]
  const headH = Math.max(2, ...headLines.map((l) => l.length)) * lh + 16
  m.font = body
  const rowLines = sheet.rows.map((r) => {
    const name = wrap(m, r.name, nameW - 14)
    const cells = r.cells.map((c) => wrap(m, c, colW - 12))
    return { name, cells, h: Math.max(1, name.length, ...cells.map((c) => c.length)) * lh + 12 }
  })
  const titleH = 44
  const catH = 30
  const tableH = headH + rowLines.reduce((s, r) => s + r.h, 0)
  const height = pad + titleH + catH + tableH + pad

  const canvas = document.createElement('canvas')
  canvas.width = width * SCALE
  canvas.height = height * SCALE
  const ctx = canvas.getContext('2d')!
  ctx.scale(SCALE, SCALE)
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = INK
  ctx.textBaseline = 'alphabetic'

  // title, and the category under it
  ctx.font = '700 24px ' + FONT
  ctx.textAlign = 'center'
  ctx.fillText(sheet.title, width / 2, pad + 26)
  ctx.font = '700 18px ' + FONT
  ctx.fillStyle = '#555'
  ctx.fillText(sheet.category, width / 2, pad + titleH + 14)
  ctx.fillStyle = INK

  const x0 = pad
  const y0 = pad + titleH + catH
  const colX = [x0, x0 + noW, x0 + noW + nameW, ...Array.from({ length: nCols }, (_, i) => x0 + noW + nameW + colW * (i + 1))]
  const centre = (i: number) => (colX[i] + colX[i + 1]) / 2

  // header
  ctx.font = bold
  ctx.fillText('न. / ন.', centre(0), y0 + 28)
  ctx.fillText('आइटम / আইটেম', centre(1), y0 + 28)
  headLines.forEach((lines, i) => lines.forEach((l, k) => ctx.fillText(l, centre(i + 2), y0 + 28 + k * lh)))

  // rows
  ctx.font = body
  let y = y0 + headH
  const rowYs = [y0, y]
  sheet.rows.forEach((r, ri) => {
    const rl = rowLines[ri]
    const top = y + 24
    ctx.fillText(String(r.no), centre(0), top)
    rl.name.forEach((l, k) => ctx.fillText(l, centre(1), top + k * lh))
    rl.cells.forEach((lines, ci) => lines.forEach((l, k) => ctx.fillText(l, centre(ci + 2), top + k * lh)))
    y += rl.h
    rowYs.push(y)
  })

  // the ruling
  ctx.strokeStyle = RULE
  ctx.lineWidth = 1.2
  ctx.beginPath()
  for (const ry of rowYs) {
    ctx.moveTo(x0, ry)
    ctx.lineTo(x0 + tableW, ry)
  }
  for (const cx of colX) {
    ctx.moveTo(cx, y0)
    ctx.lineTo(cx, y)
  }
  ctx.stroke()
  return canvas
}

export const sheetFileName = (sheet: OrderSheet, year: number, day: ProcurementDay | null) =>
  `procurement-${year}-${sheet.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}${day ? `-${day.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : ''}.png`
