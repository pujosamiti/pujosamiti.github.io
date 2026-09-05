/**
 * Season reports as PDF — the ledger's core / non-core subscriptions and
 * sponsorship lists, and the sponsorship board of a pujo year.
 *
 * Pure with respect to the page: each builder takes the already-filtered
 * rows and the logo as a data URL, so the same code runs in a Node smoke
 * test. Look: docs/012-design-system §PDF reports.
 */
import { jsPDF } from 'jspdf'
import { autoTable, type RowInput, type UserOptions } from 'jspdf-autotable'
import { BOOKS, type BookId, type LedgerEntry, type SponsorshipItemView } from '@pujosamiti/shared'

// jaba and kali from docs/012 — the two colours a report is allowed.
const JABA: [number, number, number] = [0xd7, 0x00, 0x00]
const KALI: [number, number, number] = [0x2b, 0x1a, 0x10]
const GREY: [number, number, number] = [0x80, 0x78, 0x70]
const WASH: [number, number, number] = [0xf6, 0xf1, 0xea]
const RULE: [number, number, number] = [0xe6, 0xdd, 0xd2]
const BAND_H = 12 // mm
const MARGIN = 12

const rs = (n: number) => `Rs ${n.toLocaleString('en-IN')}`
const seasonLabel = (y: number) => `${y}–${String(y + 1).slice(2)} season`
/** "5 Sept 2026, 2:35 pm IST" — the samiti's clock, whatever the device is set to. */
const stampIST = (d: Date) =>
  d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  }) + ' IST'

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

export type LedgerReportId = 'core' | 'non-core' | 'sponsorship'

interface LedgerReport {
  title: string
  /** The column that tells entries apart: subscription tier is implied by the report, an item for a sponsorship. */
  detail: { header: string; of: (e: LedgerEntry) => string } | null
  matches: (e: LedgerEntry) => boolean
}

const LEDGER_REPORTS: Record<LedgerReportId, LedgerReport> = {
  core: {
    title: 'Core subscriptions',
    detail: null,
    matches: (e) => e.category === 'subscription' && e.subCategory === 'core',
  },
  'non-core': {
    title: 'Non-core subscriptions',
    detail: null,
    matches: (e) => e.category === 'subscription' && e.subCategory === 'non-core',
  },
  sponsorship: {
    title: 'Sponsorships',
    detail: { header: 'Item', of: (e) => e.subCategory ?? '' },
    matches: (e) => e.category === 'sponsorship',
  },
}

export interface LedgerPdfInput {
  report: LedgerReportId
  bookId: BookId
  season: number
  /** Entries of this book and season; the report picks its own rows from them. */
  entries: LedgerEntry[]
  /** PNG as a data URL, drawn inside the band. */
  logo: string
}

/** Build the document. Returns it unsaved so the caller decides where it goes. */
export function renderLedgerPdf({ report, bookId, season, entries, logo }: LedgerPdfInput): { doc: jsPDF; filename: string } {
  const spec = LEDGER_REPORTS[report]
  const bookName = BOOKS.find((b) => b.id === bookId)?.name ?? bookId
  const rows = entries
    .filter((e) => e.isActive && e.kind === 'contribution' && spec.matches(e))
    // Payment order: by date, then by when the record was made — on a
    // counter day that is the order people actually paid in.
    .sort((a, b) => a.entryDate.localeCompare(b.entryDate) || a.createdAt - b.createdAt)
  const total = rows.reduce((s, e) => s + e.amount, 0)

  const page = openReport(spec.title, `${bookName} · ${seasonLabel(season)}`, logo, 'portrait')
  if (rows.length === 0) {
    page.empty(`No ${spec.title.toLowerCase()} recorded for the ${seasonLabel(season)}.`)
  } else {
    const head = ['#', 'Date', 'Family', ...(spec.detail ? [spec.detail.header] : []), 'Amount', 'Wallet', 'Notes']
    const body: RowInput[] = rows.map((e, i) => [
      String(i + 1),
      e.entryDate,
      e.familyName ?? e.personName ?? e.counterparty ?? '',
      ...(spec.detail ? [spec.detail.of(e)] : []),
      rs(e.amount),
      e.walletName,
      e.notes ?? '',
    ])
    const amountCol = spec.detail ? 4 : 3
    page.table({
      head: [head],
      body,
      foot: [[{ content: `${rows.length} ${rows.length === 1 ? 'entry' : 'entries'}`, colSpan: amountCol }, { content: rs(total), styles: { halign: 'right' } }, '', '']],
      columnStyles: {
        0: { cellWidth: 8, halign: 'right', textColor: GREY },
        1: { cellWidth: 20 },
        [amountCol]: { cellWidth: 24, halign: 'right' },
        [amountCol + 1]: { cellWidth: 32 },
      },
    })
  }

  const slug = spec.title.toLowerCase().replace(/[^a-z]+/g, '-')
  return { doc: page.finish(), filename: `${bookId}-${slug}-${season}-${String(season + 1).slice(2)}.pdf` }
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
  const live = (i: SponsorshipItemView) => (i.pledge && i.pledge.status !== 'cancelled' ? i.pledge : null)
  const taken = items.filter((i) => live(i)).length
  const paidItems = items.filter((i) => i.pledge?.status === 'paid')
  const receivedTotal = paidItems.reduce((s, i) => s + (i.pledge?.amount ?? 0), 0)

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
      foot: [[{ content: `${items.length} slots · ${taken} pledged · ${paidItems.length} paid · ${rs(receivedTotal)} received`, colSpan: 6 }]],
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
