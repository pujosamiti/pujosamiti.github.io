/**
 * Season reports as spreadsheets — the same core / non-core subscription and
 * sponsorship lists as the PDFs (see ledger-reports), as an .xlsx a treasurer
 * can sort, filter and add up.
 *
 * Where the PDF prints text, the sheet keeps values: dates are dates and
 * amounts are numbers, written in rupees with Indian grouping, and the total
 * is a SUM so it follows any figure edited later. Look: docs/012-design-system
 * §Reports.
 */
import writeXlsxFile, { type Cell, type CellObject, type SheetData, type SheetOptions } from 'write-excel-file/browser'

import { ledgerReport, payerOf, stampIST, type LedgerReportInput } from '@/lib/ledger-reports'

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

/** A1-style column letter for a 0-based index — the table never passes G. */
const col = (i: number) => String.fromCharCode(65 + i)

/** Build the sheet. Pure, so it can be checked without a browser. */
export function renderLedgerSheet(input: LedgerReportInput, now = new Date()): {
  data: SheetData
  options: SheetOptions<Blob>
  filename: string
} {
  const r = ledgerReport(input)
  const heads = ['#', 'Date', 'Family', ...(r.detail ? [r.detail.header] : []), 'Amount', 'Wallet', 'Notes']
  const amountCol = r.detail ? 4 : 3
  const pad = (row: Cell[]) => [...row, ...Array<Cell>(heads.length - row.length).fill(null)]

  const data: SheetData = [
    pad([{ value: `${r.title} — ${r.bookName} · ${r.seasonName}`, fontWeight: 'bold', fontSize: 13, textColor: JABA }]),
    pad([{ value: `Generated ${stampIST(now)}`, fontStyle: 'italic', textColor: GREY }]),
    pad([]),
  ]

  if (r.rows.length === 0) {
    data.push(pad([{ value: `No ${r.title.toLowerCase()} recorded for the ${r.seasonName}.`, fontStyle: 'italic', textColor: GREY }]))
  } else {
    const head = (value: string, i: number): CellObject => ({
      value,
      fontWeight: 'bold',
      backgroundColor: WASH,
      bottomBorderStyle: 'medium',
      bottomBorderColor: RULE,
      align: i === 0 || i === amountCol ? 'right' : 'left',
    })
    data.push(heads.map(head))

    for (const [i, e] of r.rows.entries()) {
      data.push([
        { value: i + 1, textColor: GREY },
        // Midnight UTC is exactly the serial day Excel wants: the entry's own date, whatever the device clock.
        { value: new Date(`${e.entryDate}T00:00:00Z`), type: Date, format: DATE, align: 'left' },
        payerOf(e),
        ...(r.detail ? [r.detail.of(e)] : []),
        { value: e.amount, type: Number, format: RUPEES },
        e.walletName,
        e.notes ?? null,
      ])
    }

    const first = HEADER_ROW + 1
    const last = HEADER_ROW + r.rows.length
    const foot: CellObject = { fontWeight: 'bold', backgroundColor: WASH, topBorderStyle: 'medium', topBorderColor: RULE }
    data.push(
      heads.map((_, i): Cell => {
        if (i === 0) return { ...foot, value: `${r.rows.length} ${r.rows.length === 1 ? 'entry' : 'entries'}`, columnSpan: amountCol }
        if (i < amountCol) return null // under the span
        if (i === amountCol)
          return { ...foot, type: 'Formula', value: `SUM(${col(amountCol)}${first}:${col(amountCol)}${last})`, format: RUPEES }
        return foot
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
