/**
 * The ledger's season lists — core subscriptions, non-core subscriptions,
 * sponsorships — defined once, so the PDF and the spreadsheet of a report
 * always hold the same rows in the same order.
 *
 * No PDF or spreadsheet code here: both builders import this, and each loads
 * its own library only when someone downloads.
 */
import { BOOKS, type BookId, type LedgerEntry } from '@pujosamiti/shared'

export type LedgerReportId = 'core' | 'non-core' | 'sponsorship'

interface LedgerReportSpec {
  title: string
  /** The column that tells entries apart: subscription tier is implied by the report, an item for a sponsorship. */
  detail: { header: string; of: (e: LedgerEntry) => string } | null
  matches: (e: LedgerEntry) => boolean
}

const LEDGER_REPORTS: Record<LedgerReportId, LedgerReportSpec> = {
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

export interface LedgerReportInput {
  report: LedgerReportId
  bookId: BookId
  season: number
  /** Entries of this book and season; the report picks its own rows from them. */
  entries: LedgerEntry[]
}

export interface LedgerReport extends LedgerReportSpec {
  bookName: string
  /** "2026–27 season" */
  seasonName: string
  rows: LedgerEntry[]
  total: number
  /** "pujo-ledger-core-subscriptions-2026-27" — the caller adds .pdf or .xlsx. */
  fileStem: string
}

export const seasonLabel = (y: number) => `${y}–${String(y + 1).slice(2)} season`

/** "5 Sept 2026, 2:35 pm IST" — the samiti's clock, whatever the device is set to. */
export const stampIST = (d: Date) =>
  d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  }) + ' IST'

/** Who a row is for: the family when the contributor has one, else the person or the walk-in name. */
export const payerOf = (e: LedgerEntry) => e.familyName ?? e.personName ?? e.counterparty ?? ''

export function ledgerReport({ report, bookId, season, entries }: LedgerReportInput): LedgerReport {
  const spec = LEDGER_REPORTS[report]
  const rows = entries
    .filter((e) => e.isActive && e.kind === 'contribution' && spec.matches(e))
    // Payment order: by date, then by when the record was made — on a
    // counter day that is the order people actually paid in.
    .sort((a, b) => a.entryDate.localeCompare(b.entryDate) || a.createdAt - b.createdAt)
  const slug = spec.title.toLowerCase().replace(/[^a-z]+/g, '-')
  return {
    ...spec,
    bookName: BOOKS.find((b) => b.id === bookId)?.name ?? bookId,
    seasonName: seasonLabel(season),
    rows,
    total: rows.reduce((s, e) => s + e.amount, 0),
    fileStem: `${bookId}-${slug}-${season}-${String(season + 1).slice(2)}`,
  }
}
