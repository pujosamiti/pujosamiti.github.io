/**
 * Season reports as PDF — the ledger's core / non-core subscriptions and
 * sponsorship lists, the sponsorship board of a pujo year, and the bhog
 * count sheet of an event.
 *
 * Pure with respect to the page: each builder takes the already-filtered
 * rows and the logo as a data URL, so the same code runs in a Node smoke
 * test. Look: docs/012-design-system §Reports.
 */
import { jsPDF } from 'jspdf'
import { autoTable, type RowInput, type UserOptions } from 'jspdf-autotable'
import type { SponsorshipItemView } from '@pujosamiti/shared'

import { bhogReport, type BhogReportInput } from '@/lib/bhog-report'
import { ledgerReport, payerOf, sponsorshipBoard, stampIST, type LedgerReportInput } from '@/lib/ledger-reports'

// jaba and kali from docs/012 — the two colours a report is allowed.
const JABA: [number, number, number] = [0xc4, 0x00, 0x39]
const KALI: [number, number, number] = [0x2b, 0x1a, 0x10]
const GREY: [number, number, number] = [0x80, 0x78, 0x70]
const WASH: [number, number, number] = [0xf6, 0xf1, 0xea]
const RULE: [number, number, number] = [0xe6, 0xdd, 0xd2]
// durba, the paan-leaf green: guest bhog heads, as on the screen
const DURBA: [number, number, number] = [0x17, 0x66, 0x4f]
const BAND_H = 12 // mm
const MARGIN = 12

const rs = (n: number) => `Rs ${n.toLocaleString('en-IN')}`

// ── Page furniture shared by every report ───────────────────────────────────

interface ReportPage {
  doc: jsPDF
  /** Draw the table; the band and footer land on every page it spans. */
  table: (opts: Omit<UserOptions, 'startY' | 'margin' | 'theme' | 'styles' | 'headStyles' | 'footStyles' | 'bodyStyles' | 'didDrawPage'>) => void
  /** For a report with nothing to list: band, one grey line, footer. */
  empty: (line: string) => void
  finish: () => jsPDF
}

function openReport(title: string, subtitle: string, logo: string, orientation: 'portrait' | 'landscape'): ReportPage {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const totalPagesToken = '{total_pages}'
  const generated = `Generated ${stampIST(new Date())}`

  const drawBand = () => {
    doc.setFillColor(...JABA)
    doc.rect(0, 0, pageW, BAND_H, 'F')
    doc.addImage(logo, 'PNG', MARGIN, 2, 8, 8)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold').setFontSize(11)
    doc.text(title, MARGIN + 11, 6.2)
    doc.setFont('helvetica', 'normal').setFontSize(7.5)
    doc.text(subtitle, MARGIN + 11, 9.8)
    doc.text(generated, pageW - MARGIN, 7.5, { align: 'right' })
  }
  const drawFooter = (page: number) => {
    doc.setTextColor(...GREY).setFont('helvetica', 'normal').setFontSize(7.5)
    doc.text(`Page ${page} of ${totalPagesToken}`, pageW - MARGIN, pageH - 7, { align: 'right' })
  }

  return {
    doc,
    table: (opts) =>
      autoTable(doc, {
        ...opts,
        startY: BAND_H + 8,
        margin: { top: BAND_H + 8, left: MARGIN, right: MARGIN, bottom: 14 },
        theme: 'plain',
        styles: { font: 'helvetica', fontSize: 8.5, textColor: KALI, cellPadding: 1.6, lineColor: RULE, lineWidth: 0.15 },
        headStyles: { fontStyle: 'bold', fillColor: WASH, lineWidth: { bottom: 0.3 } },
        footStyles: { fontStyle: 'bold', fillColor: WASH, lineWidth: { top: 0.3 } },
        bodyStyles: { lineWidth: { bottom: 0.15 } },
        didDrawPage: (data) => {
          drawBand()
          drawFooter(data.pageNumber)
        },
      }),
    empty: (line) => {
      drawBand()
      drawFooter(1)
      doc.setTextColor(...GREY).setFont('helvetica', 'italic').setFontSize(9)
      doc.text(line, MARGIN, BAND_H + 12)
    },
    finish: () => {
      doc.putTotalPages(totalPagesToken)
      return doc
    },
  }
}

/** Browser side: the small logo as a data URL, for the band. */
async function loadLogo(): Promise<string> {
  const { default: logoUrl } = await import('@/assets/logo-sm.png')
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('logo could not be read'))
    fetch(logoUrl)
      .then((r) => r.blob())
      .then((b) => reader.readAsDataURL(b), reject)
  })
}

// ── Ledger: one book, one season, three lists ───────────────────────────────

export interface LedgerPdfInput extends LedgerReportInput {
  /** PNG as a data URL, drawn inside the band. */
  logo: string
}

/** Build the document. Returns it unsaved so the caller decides where it goes. */
export function renderLedgerPdf({ logo, ...input }: LedgerPdfInput): { doc: jsPDF; filename: string } {
  const r = ledgerReport(input)
  const page = openReport(r.title, `${r.bookName} · ${r.seasonName}`, logo, 'portrait')
  if (r.rows.length === 0) {
    page.empty(`No ${r.title.toLowerCase()} recorded for the ${r.seasonName}.`)
  } else {
    const head = ['#', 'Date', 'Family', ...(r.detail ? [r.detail.header] : []), 'Amount', 'Wallet', 'Notes']
    const body: RowInput[] = r.rows.map((e, i) => [
      String(i + 1),
      e.entryDate,
      payerOf(e),
      ...(r.detail ? [r.detail.of(e)] : []),
      rs(e.amount),
      e.walletName,
      e.notes ?? '',
    ])
    const amountCol = r.detail ? 4 : 3
    page.table({
      head: [head],
      body,
      foot: [[{ content: `${r.rows.length} ${r.rows.length === 1 ? 'entry' : 'entries'}`, colSpan: amountCol }, { content: rs(r.total), styles: { halign: 'right' } }, '', '']],
      columnStyles: {
        0: { cellWidth: 8, halign: 'right', textColor: GREY },
        1: { cellWidth: 20 },
        [amountCol]: { cellWidth: 24, halign: 'right' },
        [amountCol + 1]: { cellWidth: 32 },
      },
    })
  }
  return { doc: page.finish(), filename: `${r.fileStem}.pdf` }
}

/** Browser entry point: fetch the logo, build, hand the file to the browser. */
export async function downloadLedgerPdf(input: Omit<LedgerPdfInput, 'logo'>): Promise<void> {
  const { doc, filename } = renderLedgerPdf({ ...input, logo: await loadLogo() })
  doc.save(filename)
}

// ── Sponsorship board of a pujo year ────────────────────────────────────────

/** A line of text the browser drew for us, as a PNG — how Bengali gets onto the page. */
export interface TextImage {
  data: string
  wPx: number
  hPx: number
}

export interface SponsorshipPdfInput {
  year: number
  /** The slots exactly as the board shows them, in board order. */
  items: SponsorshipItemView[]
  logo: string
  /**
   * Bengali one-liners by item id, pre-drawn. The PDF's built-in fonts have
   * no Bengali, and jsPDF cannot shape the script even with one embedded, so
   * the browser draws each line (see bengaliLines) and the cell gets a picture.
   */
  bengali: Record<string, TextImage>
}

const PAD = 1.6 // autotable cellPadding, mm
const TITLE_LH = 3.45 // 8.5 pt line, mm
const NOTE_PT = 7
const NOTE_LH = 2.9 // 7 pt line, mm
const BN_H = 4.4 // a Bengali line drawn at ~7.5 pt needs headroom for the matras, mm
const ITEM_W = 100 // Item column, mm — fixed so the row height can be sized before drawing

/**
 * One row per slot: the item with its appeal in both languages, the listed
 * price, who pledged, and the date the money came in — blank until it has.
 */
export function renderSponsorshipPdf({ year, items, logo, bengali }: SponsorshipPdfInput): { doc: jsPDF; filename: string } {
  const { live, summary } = sponsorshipBoard(items)

  const page = openReport('Sponsorship board', `Durga Pujo ${year}`, logo, 'landscape')
  if (items.length === 0) {
    page.empty(`No sponsorship slots on the board for Durga Pujo ${year}.`)
  } else {
    const { doc } = page
    const innerW = ITEM_W - 2 * PAD
    // What goes under each title, measured once so the row can be sized before it is drawn.
    const notes = items.map((i) => {
      doc.setFont('helvetica', 'normal').setFontSize(NOTE_PT)
      const en: string[] = i.tagline ? doc.splitTextToSize(i.tagline, innerW) : []
      const bn = i.taglineBn ? (bengali[i.id] ?? null) : null
      return { en, bn }
    })
    const body: RowInput[] = items.map((i, n) => {
      const pl = live(i)
      const price = i.yearAmount ?? i.defaultAmount
      return [
        String(n + 1),
        i.category,
        i.title,
        price === null ? 'at cost' : rs(price),
        pl ? pl.personName : { content: 'open', styles: { textColor: GREY, fontStyle: 'italic' } },
        pl?.status === 'paid' && pl.paidOn ? pl.paidOn : '',
      ]
    })
    page.table({
      head: [['#', 'Category', 'Item', 'Price', 'Pledged', 'Payment received']],
      body,
      foot: [[{ content: summary(rs), colSpan: 6 }]],
      columnStyles: {
        0: { cellWidth: 8, halign: 'right', textColor: GREY },
        1: { cellWidth: 30 },
        2: { cellWidth: ITEM_W },
        3: { cellWidth: 26, halign: 'right' },
        5: { cellWidth: 34 },
      },
      didParseCell: (data) => {
        if (data.section !== 'body' || data.column.index !== 2) return
        const note = notes[data.row.index]
        doc.setFont('helvetica', 'normal').setFontSize(8.5)
        const titleLines = doc.splitTextToSize(items[data.row.index].title, innerW).length
        data.cell.styles.minCellHeight =
          2 * PAD + titleLines * TITLE_LH + note.en.length * NOTE_LH + (note.bn ? BN_H + 0.6 : 0)
      },
      didDrawCell: (data) => {
        if (data.section !== 'body' || data.column.index !== 2) return
        const note = notes[data.row.index]
        const x = data.cell.x + PAD
        let y = data.cell.y + PAD + data.cell.text.length * TITLE_LH
        if (note.en.length) {
          doc.setFont('helvetica', 'normal').setFontSize(NOTE_PT).setTextColor(...GREY)
          doc.text(note.en, x, y + 2.3)
          y += note.en.length * NOTE_LH
        }
        if (note.bn) {
          const h = BN_H
          const w = Math.min(innerW, (h * note.bn.wPx) / note.bn.hPx)
          doc.addImage(note.bn.data, 'PNG', x, y + 0.4, w, (w * note.bn.hPx) / note.bn.wPx)
        }
      },
    })
  }
  return { doc: page.finish(), filename: `sponsorship-board-${year}.pdf` }
}

/**
 * Draw each Bengali line with the browser's text engine — proper shaping, in
 * the site's own Hind Siliguri — and hand back a crisp PNG per item.
 */
async function bengaliLines(items: SponsorshipItemView[]): Promise<Record<string, TextImage>> {
  const font = "500 30px 'Hind Siliguri', 'Noto Sans Bengali', sans-serif"
  await document.fonts.load(font).catch(() => undefined)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const out: Record<string, TextImage> = {}
  if (!ctx) return out
  for (const i of items) {
    if (!i.taglineBn) continue
    ctx.font = font
    const wPx = Math.ceil(ctx.measureText(i.taglineBn).width) + 4
    const hPx = 50 // 30 px type with room above and below for the matras
    canvas.width = wPx
    canvas.height = hPx
    ctx.font = font // a resize clears the context
    ctx.fillStyle = `rgb(${GREY.join(',')})`
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(i.taglineBn, 2, 35)
    out[i.id] = { data: canvas.toDataURL('image/png'), wPx, hPx }
  }
  return out
}

export async function downloadSponsorshipPdf(input: Omit<SponsorshipPdfInput, 'logo' | 'bengali'>): Promise<void> {
  const [logo, bengali] = await Promise.all([loadLogo(), bengaliLines(input.items)])
  const { doc, filename } = renderSponsorshipPdf({ ...input, logo, bengali })
  doc.save(filename)
}

// ── Bhog count sheet of one event ───────────────────────────────────────────

export interface BhogPdfInput extends BhogReportInput {
  logo: string
}

/**
 * Landscape, one row per household under a Core members / Members heading,
 * one column per day. Unanswered days print blank and every row has room to
 * write in, so the sheet taken before anyone answers is the counter's form.
 */
export function renderBhogPdf({ logo, ...input }: BhogPdfInput): { doc: jsPDF; filename: string } {
  const r = bhogReport(input)
  const page = openReport(r.title, r.subtitle, logo, 'landscape')
  if (r.households.length === 0 || r.days.length === 0) {
    page.empty(r.days.length === 0 ? `No bhog days for ${r.subtitle} yet.` : 'No household has paid or pledged this season yet.')
  } else {
    const n = r.days.length
    // Guest bhog: a day reads "4 + 5" (family + guests); a Guests column shows once anyone has guests
    const withGuests = r.grandGuests > 0
    const g = withGuests ? 1 : 0
    const width = n + 4 + g // #, household, the days, [guests], total, remarks
    const body: RowInput[] = []
    let number = 0
    for (const [i, h] of r.households.entries()) {
      if (i === 0 || r.households[i - 1].tier !== h.tier)
        body.push([
          {
            content: h.tier === 'core' ? 'Core members' : 'Members',
            colSpan: width,
            styles: { fontStyle: 'bold', textColor: GREY, fontSize: 7.5, halign: 'left' },
          },
        ])
      number++
      body.push([
        String(number),
        h.name,
        ...h.counts.map((c, j) => (h.guests[j] ? `${c ?? 0} + ${h.guests[j]}` : c == null ? '' : String(c))),
        ...(withGuests ? [h.guestTotal ? String(h.guestTotal) : ''] : []),
        h.counts.some((c) => c != null) || h.guestTotal ? String(h.total) : '',
        { content: h.remarks, styles: { textColor: GREY, fontSize: 7.5 } },
      ])
    }
    const footRow = (label: string, cells: string[], total: string, guests = ''): RowInput => [
      { content: label, colSpan: 2 },
      ...cells.map((c) => ({ content: c, styles: { halign: 'right' as const } })),
      ...(withGuests ? [{ content: guests, styles: { halign: 'right' as const } }] : []),
      { content: total, styles: { halign: 'right' as const } },
      '',
    ]
    // Nobody has answered: the form's total row stays blank to be written in, like its cells.
    const blank = r.answered === 0
    const foot: RowInput[] = [
      footRow(
        `Total plates · ${r.answered} of ${r.households.length} answered`,
        r.plates.map((n) => (blank ? '' : String(n))),
        blank ? '' : String(r.grandPlates),
        withGuests ? String(r.grandGuests) : '',
      ),
    ]
    if (r.money)
      foot.push(
        footRow('Per plate', r.days.map((d) => (d.perPlateCost != null ? rs(d.perPlateCost) : '')), ''),
        footRow('Total', r.money.map((m) => (m != null ? rs(m) : '')), r.grandMoney != null ? rs(r.grandMoney) : ''),
      )
    const dayCols = Object.fromEntries(
      r.days.map((_, i) => [i + 2, { cellWidth: withGuests ? 27 : 28, halign: 'right' as const }]),
    )
    page.table({
      head: [
        [
          '#',
          'Household',
          ...r.days.map((d) => `${d.heading}\n${d.shortDate}`),
          ...(withGuests ? ['Guests'] : []),
          'Total',
          'Remarks',
        ],
      ],
      body,
      foot,
      columnStyles: {
        0: { cellWidth: 8, halign: 'right', textColor: GREY },
        1: { cellWidth: withGuests ? 54 : 64 },
        ...dayCols,
        ...(withGuests ? { [n + 2]: { cellWidth: 14, halign: 'right' as const, textColor: DURBA } } : {}),
        [n + 2 + g]: { cellWidth: 16, halign: 'right', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.section === 'head' && data.column.index >= 2 && data.column.index <= n + 2 + g) data.cell.styles.halign = 'right'
        // Household rows get room to write a figure in by hand; the headings stay slim.
        if (data.section === 'body' && Array.isArray(data.row.raw) && data.row.raw.length > 1) {
          data.cell.styles.minCellHeight = 6.5
          data.cell.styles.valign = 'middle'
        }
      },
    })
  }
  return { doc: page.finish(), filename: `${r.fileStem}.pdf` }
}

export async function downloadBhogPdf(input: BhogReportInput): Promise<void> {
  const { doc, filename } = renderBhogPdf({ ...input, logo: await loadLogo() })
  doc.save(filename)
}
