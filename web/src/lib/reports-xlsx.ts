/**
 * Reports as spreadsheets — the same core / non-core subscription and
 * sponsorship lists, the same sponsorship board and the same bhog count
 * sheet as the PDFs (see ledger-reports, bhog-report), as an .xlsx a
 * treasurer can sort, filter and add up.
 *
 * Where the PDF prints text, the sheet keeps values: dates are dates and
 * amounts are numbers, written in rupees with Indian grouping, and the total
 * is a SUM so it follows any figure edited later. Look: docs/012-design-system
 * §Reports.
 */
import type { SponsorshipItemView } from '@pujosamiti/shared'
import writeXlsxFile, { type Cell, type CellObject, type SheetData, type SheetOptions } from 'write-excel-file/browser'

import { bhogReport, type BhogReportInput } from '@/lib/bhog-report'
import { fileStampIST, ledgerReport, payerOf, sponsorshipBoard, stampIST, type LedgerReportInput } from '@/lib/ledger-reports'

// The PDF's palette (docs/012): jaba for the title only, kali ink, the wash behind header and total.
const JABA = '#C40039'
const GREY = '#807870'
const WASH = '#F6F1EA'
const RULE = '#E6DDD2'
// durba, the paan-leaf green: guest bhog heads, as on the screen
const DURBA = '#17664F'

/**
 * ₹1,00,000 rather than ₹100,000: a spreadsheet format has no lakh grouping
 * of its own, so the thresholds place the commas by hand.
 */
const RUPEES = '[>=10000000]"₹"##\\,##\\,##\\,##0;[>=100000]"₹"##\\,##\\,##0;"₹"##,##0'
const DATE = 'd mmm yyyy'

/** Rows above the table: title, generated stamp, a gap. The header row follows them. */
const HEADER_ROW = 4

/** A1-style column letter for a 0-based index — the tables never pass Z. */
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

// ── Bhog count sheet of one event ───────────────────────────────────────────

/**
 * One row per household, one column per day, blank where a household has not
 * answered — so a sheet downloaded before anyone answers is the form to fill
 * in by hand. The totals are formulas, so counts typed in later add up: a
 * household's total stays blank until it has a figure, and the plates row
 * sums each day. Plates only — the money stays on the screen and the PDF.
 * The file name carries the moment it was taken (IST), so successive
 * downloads during the pujo sit side by side instead of overwriting.
 */
export function renderBhogSheet(input: BhogReportInput, now = new Date()): {
  data: SheetData
  options: SheetOptions<Blob>
  filename: string
} {
  const r = bhogReport(input)
  const n = r.days.length
  const firstDay = 2
  // Guest bhog: a day's cell is its plates, family and guests together, so the
  // sums are the caterer's numbers; a Guests column (only once anyone has
  // guests) and the remarks keep the guests visible.
  const withGuests = r.grandGuests > 0
  const guestCol = withGuests ? firstDay + n : -1
  const totalCol = firstDay + n + (withGuests ? 1 : 0)
  const heads = [
    '#',
    'Household',
    ...r.days.map((d) => `${d.heading}\n${d.shortDate}`),
    ...(withGuests ? ['Guests'] : []),
    'Total',
    'Remarks',
  ]
  const pad = padTo(heads.length)
  const data = topRows(`${r.title} — ${r.subtitle}`, now, heads.length)

  if (r.households.length === 0 || n === 0) {
    data.push(pad([emptyLine(n === 0 ? `No bhog days for ${r.subtitle} yet.` : 'No household has paid or pledged this season yet.')]))
  } else {
    data.push(
      heads.map((h, i) => ({
        ...headCell(h, i === 0 || (i >= firstDay && i <= totalCol)),
        ...(i === guestCol ? { textColor: DURBA } : {}),
        wrap: true,
        alignVertical: 'bottom' as const,
        height: 32,
      })),
    )
    const first = HEADER_ROW + 1
    const last = HEADER_ROW + r.households.length
    const dayCells = `${col(firstDay)}{row}:${col(firstDay + n - 1)}{row}`
    for (const [i, h] of r.households.entries()) {
      const row = first + i
      const days = dayCells.replaceAll('{row}', String(row))
      const guestNote = h.guestTotal
        ? `Guests: ${r.days.flatMap((d, j) => (h.guests[j] ? [`${d.heading} ${h.guests[j]}`] : [])).join(', ')}`
        : ''
      const remarks = [guestNote, h.remarks].filter(Boolean).join('; ')
      data.push([
        { value: i + 1, textColor: GREY },
        h.name,
        ...h.counts.map((c, j): Cell =>
          c == null && !h.guests[j] ? null : { value: (c ?? 0) + h.guests[j], type: Number },
        ),
        ...(withGuests ? [h.guestTotal ? ({ value: h.guestTotal, type: Number, textColor: DURBA } as Cell) : null] : []),
        { type: 'Formula', value: `IF(COUNT(${days}),SUM(${days}),"")`, fontWeight: 'bold' },
        remarks ? { value: remarks, textColor: GREY, wrap: true } : null,
      ])
    }
    data.push(
      heads.map((_, i): Cell => {
        if (i === 0) return { ...FOOT, value: `Total plates · ${r.answered} of ${r.households.length} answered`, columnSpan: firstDay }
        if (i < firstDay) return null // under the span
        if (i <= totalCol) return { ...FOOT, type: 'Formula', value: `SUM(${col(i)}${first}:${col(i)}${last})` }
        return FOOT
      }),
    )
  }

  return {
    data,
    options: {
      sheet: 'Bhog headcount',
      orientation: 'landscape',
      // A day column is as wide as its heading, so the header stays two lines — label, then date
      // ("Ashtami · Day-2" at a fixed 13 wrapped and pushed its date out of the row).
      columns: [5, 40, ...r.days.map((d) => Math.max(12, d.heading.length + 4)), ...(withGuests ? [9] : []), 9, 40].map(
        (width) => ({ width }),
      ),
      stickyRowsCount: r.households.length && n ? HEADER_ROW : 0,
    },
    filename: `${r.fileStem}_${fileStampIST(now)}.xlsx`,
  }
}

export async function downloadBhogXlsx(input: BhogReportInput): Promise<void> {
  const { data, options, filename } = renderBhogSheet(input)
  await writeXlsxFile(data, options).toFile(filename)
}
