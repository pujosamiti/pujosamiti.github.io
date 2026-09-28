/** The two files every report downloads as — Excel first, see components/ReportDownload. */
export type ReportFormat = 'xlsx' | 'pdf'
export const FORMAT_LABEL: Record<ReportFormat, string> = { xlsx: 'Excel', pdf: 'PDF' }
