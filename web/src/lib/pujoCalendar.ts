/**
 * The pujo's days in 2026, as the samiti's Days of the Pujo list them (seeded
 * from the finalised nirghanto), with Mahalaya ahead of them. Static on
 * purpose: the header and উমা read it on every page with no server call, so
 * the site keeps working when the API is down. Update it each year from the
 * finalised nirghanto.
 */
export const PUJO_YEAR = 2026
export const SHASHTHI = '2026-10-16'
export const PUJO_DAYS: Record<string, string> = {
  '2026-10-10': 'Mahalaya',
  '2026-10-15': 'Panchami',
  '2026-10-16': 'Shashthi',
  '2026-10-17': 'Saptami',
  '2026-10-18': 'Ashtami',
  '2026-10-19': 'Ashtami · Day 2',
  '2026-10-20': 'Nabami',
  '2026-10-21': 'Dashami',
}
/** The pujo days proper — Panchami to Dashami — when the header wears its festive border. */
export const PUJO_FROM = '2026-10-15'
export const PUJO_TO = '2026-10-21'

/** Today's date in India, "YYYY-MM-DD" (midnight turnover — unlike উমা's 5 am). */
export const istToday = (now = Date.now()): string => new Date(now + 5.5 * 3600_000).toISOString().slice(0, 10)

/** Is `date` one of the pujo days (Panchami → Dashami)? */
export const isPujoDay = (date: string): boolean => date >= PUJO_FROM && date <= PUJO_TO
