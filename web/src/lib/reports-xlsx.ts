/**
 * Reports as spreadsheets — the same core / non-core subscription and
 * sponsorship lists, and the same sponsorship board, as the PDFs (see
 * ledger-reports), as an .xlsx a treasurer can sort, filter and add up.
 *
 * Where the PDF prints text, the sheet keeps values: dates are dates and
 * amounts are numbers, written in rupees with Indian grouping, and the total
 * is a SUM so it follows any figure edited later. Look: docs/012-design-system
 * §Reports.
 */
import type { SponsorshipItemView } from '@pujosamiti/shared'
import writeXlsxFile, { type Cell, type CellObject, type SheetData, type SheetOptions } from 'write-excel-file/browser'

import { ledgerReport, payerOf, sponsorshipBoard, stampIST, type LedgerReportInput } from '@/lib/ledger-reports'

// The PDF's palette (docs/012): jaba for the title only, kali ink, the wash behind header and total.
const JABA = '#D70000'
const GREY = '#807870'
const WASH = '#F6F1EA'
const RULE = '#E6DDD2'

/**
 * ₹1,00,000 rather than ₹100,000: a spreadsheet format has no lakh grouping
 * of its own, so the thresholds place the commas by hand.
 */
const RUPEES = '[>=10000000]"₹"##\\,##\\,##\\,##0;[>=100000]"₹"##\\,##\\,##0;"₹"##,##0'
const DATE = 'd mmm yyyy'

/** Rows above the table: title, generated stamp, a gap. The header row follows them. */
const HEADER_ROW = 4

/** A1-style column letter for a 0-based index — the tables never pass H. */
const col = (i: number) => String.fromCharCode(65 + i)

/** A row as wide as the table, the unused cells empty. */
const padTo = (width: number) => (row: Cell[]) => [...row, ...Array<Cell>(width - row.length).fill(null)]

/** Title, the generated stamp, a gap — the rows every report opens with. */
const topRows = (title: string, now: Date, width: number): SheetData =>
  [
    [{ value: title, fontWeight: 'bold', fontSize: 13, textColor: JABA } satisfies CellObject],
    [{ value: `Generated ${stampIST(now)}`, fontStyle: 'italic', textColor: GREY } satisfies CellObject],
    [],
  ].map(padTo(width))

/** The one grey line a report with nothing to list carries in place of its table. */
const emptyLine = (line: string): CellObject => ({ value: line, fontStyle: 'italic', textColor: GREY })

const headCell = (value: string, right: boolean): CellObject => ({
  value,
  fontWeight: 'bold',
  backgroundColor: WASH,
  bottomBorderStyle: 'medium',
  bottomBorderColor: RULE,
  align: right ? 'right' : 'left',
})
const FOOT: CellObject = { fontWeight: 'bold', backgroundColor: WASH, topBorderStyle: 'medium', topBorderColor: RULE }

/** Midnight UTC is exactly the serial day Excel wants: the day itself, whatever the device clock. */
const day = (isoDate: string): CellObject => ({ value: new Date(`${isoDate}T00:00:00Z`), type: Date, format: DATE, align: 'left' })

/** "₹1,20,000" inside a line of text, where a cell format cannot reach. */
const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`

/** Build the sheet. Pure, so it can be checked without a browser. */
export function renderLedgerSheet(input: LedgerReportInput, now = new Date()): {
  data: SheetData
  options: SheetOptions<Blob>
  filename: string
} {
  const r = ledgerReport(input)
  const heads = ['#', 'Date', 'Family', ...(r.detail ? [r.detail.header] : []), 'Amount', 'Wallet', 'Notes']
  const amountCol = r.detail ? 4 : 3
  const pad = padTo(heads.length)
  const data = topRows(`${r.title} — ${r.bookName} · ${r.seasonName}`, now, heads.length)

  if (r.rows.length === 0) {
    data.push(pad([emptyLine(`No ${r.title.toLowerCase()} recorded for the ${r.seasonName}.`)]))
  } else {
    data.push(heads.map((h, i) => headCell(h, i === 0 || i === amountCol)))

    for (const [i, e] of r.rows.entries()) {
      data.push([
        { value: i + 1, textColor: GREY },
        day(e.entryDate),
        payerOf(e),
        ...(r.detail ? [r.detail.of(e)] : []),
        { value: e.amount, type: Number, format: RUPEES },
        e.walletName,
        e.notes ?? null,
      ])
    }

    const first = HEADER_ROW + 1
    const last = HEADER_ROW + r.rows.length
    data.push(
      heads.map((_, i): Cell => {
        if (i === 0) return { ...FOOT, value: `${r.rows.length} ${r.rows.length === 1 ? 'entry' : 'entries'}`, columnSpan: amountCol }
        if (i < amountCol) return null // under the span
        if (i === amountCol)
          return { ...FOOT, type: 'Formula', value: `SUM(${col(amountCol)}${first}:${col(amountCol)}${last})`, format: RUPEES }
        return FOOT
      }),
    )
  }

  const widths = [5, 13, 30, ...(r.detail ? [30] : []), 13, 22, 40]
  return {
    data,
    options: { sheet: r.title, columns: widths.map((width) => ({ width })), stickyRowsCount: r.rows.length ? HEADER_ROW : 0 },
    filename: `${r.fileStem}.xlsx`,
  }
}

/** Browser entry point: build and hand the file to the browser. */
export async function downloadLedgerXlsx(input: LedgerReportInput): Promise<void> {
  const { data, options, filename } = renderLedgerSheet(input)
  await writeXlsxFile(data, options).toFile(filename)
}

// ── Sponsorship board of a pujo year ────────────────────────────────────────

/**
 * One row per slot, the PDF's columns with each one-liner in a column of its
 * own — Bengali as plain text, which a spreadsheet shapes itself. The
 * received total stays a figure in the summary line: the sheet lists prices,
 * and a pledge may differ from its slot's price, so no column adds up to it.
 */
export function renderSponsorshipSheet(
  { year, items }: { year: number; items: SponsorshipItemView[] },
  now = new Date(),
): { data: SheetData; options: SheetOptions<Blob>; filename: string } {
  const board = sponsorshipBoard(items)
  const heads = ['#', 'Category', 'Item', 'Appeal (English)', 'Appeal (Bengali)', 'Price', 'Pledged by', 'Payment received']
  const pad = padTo(heads.length)
  const data = topRows(`Sponsorship board — Durga Pujo ${year}`, now, heads.length)

  if (items.length === 0) {
    data.push(pad([emptyLine(`No sponsorship slots on the board for Durga Pujo ${year}.`)]))
  } else {
    data.push(heads.map((h, i) => headCell(h, i === 0 || i === 5)))
    // Appeals wrap, so a row can run several lines deep: everything sits at its top.
    const top: CellObject = { alignVertical: 'top' }
    const note: CellObject = { ...top, textColor: GREY, wrap: true }
    for (const [n, i] of items.entries()) {
      const pl = board.live(i)
      const price = i.yearAmount ?? i.defaultAmount
      data.push([
        { ...top, value: n + 1, textColor: GREY },
        { ...top, value: i.category },
        { ...top, value: i.title, wrap: true },
        i.tagline ? { ...note, value: i.tagline } : null,
        i.taglineBn ? { ...note, value: i.taglineBn } : null,
        price === null ? { ...top, value: 'at cost', align: 'right' } : { ...top, value: price, type: Number, format: RUPEES },
        pl ? { ...top, value: pl.personName } : { ...top, value: 'open', fontStyle: 'italic', textColor: GREY },
        pl?.status === 'paid' && pl.paidOn ? { ...day(pl.paidOn), ...top } : null,
      ])
    }
    data.push(heads.map((_, i): Cell => (i === 0 ? { ...FOOT, value: board.summary(inr), columnSpan: heads.length } : null)))
  }

  return {
    data,
    options: {
      sheet: 'Sponsorship board',
      orientation: 'landscape',
      columns: [5, 16, 34, 44, 44, 13, 24, 17].map((width) => ({ width })),
      stickyRowsCount: items.length ? HEADER_ROW : 0,
    },
    filename: `sponsorship-board-${year}.xlsx`,
  }
}

export async function downloadSponsorshipXlsx(input: { year: number; items: SponsorshipItemView[] }): Promise<void> {
  const { data, options, filename } = renderSponsorshipSheet(input)
  await writeXlsxFile(data, options).toFile(filename)
}
