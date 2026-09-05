/**
 * Season reports from the ledger as a PDF: core subscriptions, non-core
 * subscriptions, sponsorships — one book, one season per file. Rows name
 * the household: the contributor's family, or the member when unlinked.
 *
 * Pure with respect to the page: it takes the already-filtered entries and
 * the logo as a data URL, so the same builder runs in a Node smoke test.
 * Look: docs/012-design-system §PDF reports.
 */
import { jsPDF } from 'jspdf'
import { autoTable, type RowInput } from 'jspdf-autotable'
import { BOOKS, type BookId, type LedgerEntry } from '@pujosamiti/shared'

export type LedgerReportId = 'core' | 'non-core' | 'sponsorship'

interface Report {
  title: string
  /** The column that tells entries apart: subscription tier is implied by the report, an item for a sponsorship. */
  detail: { header: string; of: (e: LedgerEntry) => string } | null
  matches: (e: LedgerEntry) => boolean
}

const REPORTS: Record<LedgerReportId, Report> = {
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

// jaba and kali from docs/012 — the two colours the report is allowed.
const JABA: [number, number, number] = [0xd7, 0x00, 0x00]
const KALI: [number, number, number] = [0x2b, 0x1a, 0x10]
const GREY: [number, number, number] = [0x80, 0x78, 0x70]
const BAND_H = 12 // mm
const MARGIN = 12

const seasonLabel = (y: number) => `${y}–${String(y + 1).slice(2)} season`
const rs = (n: number) => `Rs ${n.toLocaleString('en-IN')}`
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
  const spec = REPORTS[report]
  const bookName = BOOKS.find((b) => b.id === bookId)?.name ?? bookId
  const rows = entries
    .filter((e) => e.isActive && e.kind === 'contribution' && spec.matches(e))
    // Payment order: by date, then by when the record was made — on a
    // counter day that is the order people actually paid in.
    .sort((a, b) => a.entryDate.localeCompare(b.entryDate) || a.createdAt - b.createdAt)
  const total = rows.reduce((s, e) => s + e.amount, 0)

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
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
    doc.text(spec.title, MARGIN + 11, 6.2)
    doc.setFont('helvetica', 'normal').setFontSize(7.5)
    doc.text(`${bookName} · ${seasonLabel(season)}`, MARGIN + 11, 9.8)
    doc.text(generated, pageW - MARGIN, 7.5, { align: 'right' })
  }
  const drawFooter = (page: number) => {
    doc.setTextColor(...GREY).setFont('helvetica', 'normal').setFontSize(7.5)
    doc.text(`Page ${page} of ${totalPagesToken}`, pageW - MARGIN, pageH - 7, { align: 'right' })
  }

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

  if (rows.length === 0) {
    // No table for nothing: the band, one line, the footer.
    drawBand()
    drawFooter(1)
    doc.setTextColor(...GREY).setFont('helvetica', 'italic').setFontSize(9)
    doc.text(`No ${spec.title.toLowerCase()} recorded for the ${seasonLabel(season)}.`, MARGIN, BAND_H + 12)
  } else {
    autoTable(doc, {
      head: [head],
      body,
      foot: [[{ content: `${rows.length} ${rows.length === 1 ? 'entry' : 'entries'}`, colSpan: amountCol }, rs(total), '', '']],
      startY: BAND_H + 8,
      margin: { top: BAND_H + 8, left: MARGIN, right: MARGIN, bottom: 14 },
      theme: 'plain',
      styles: { font: 'helvetica', fontSize: 8.5, textColor: KALI, cellPadding: 1.6, lineColor: [0xe6, 0xdd, 0xd2], lineWidth: 0.15 },
      headStyles: { fontStyle: 'bold', fillColor: [0xf6, 0xf1, 0xea], lineWidth: { bottom: 0.3 } },
      footStyles: { fontStyle: 'bold', fillColor: [0xf6, 0xf1, 0xea], lineWidth: { top: 0.3 } },
      bodyStyles: { lineWidth: { bottom: 0.15 } },
      columnStyles: {
        0: { cellWidth: 8, halign: 'right', textColor: GREY },
        1: { cellWidth: 20 },
        [amountCol]: { cellWidth: 24, halign: 'right' },
        [amountCol + 1]: { cellWidth: 32 },
      },
      didDrawPage: (data) => {
        drawBand()
        drawFooter(data.pageNumber)
      },
    })
  }
  doc.putTotalPages(totalPagesToken)

  const slug = spec.title.toLowerCase().replace(/[^a-z]+/g, '-')
  return { doc, filename: `${bookId}-${slug}-${season}-${String(season + 1).slice(2)}.pdf` }
}

/** Browser entry point: fetch the logo, build, hand the file to the browser. */
export async function downloadLedgerPdf(input: Omit<LedgerPdfInput, 'logo'>): Promise<void> {
  const { default: logoUrl } = await import('@/assets/logo-sm.png')
  const logo = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('logo could not be read'))
    fetch(logoUrl)
      .then((r) => r.blob())
      .then((b) => reader.readAsDataURL(b), reject)
  })
  const { doc, filename } = renderLedgerPdf({ ...input, logo })
  doc.save(filename)
}
