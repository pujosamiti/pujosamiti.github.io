import calendar from '@/content/pujo-calendar.json'

/**
 * The pujo's days (src/content/pujo-calendar.json — from the finalised
 * nirghanto, Mahalaya ahead of them). Static on purpose: the header, উমা and
 * the Schedule's structured data read them on every page with no server call,
 * so the site keeps working when the API is down. Update the JSON every year.
 */
export const PUJO_YEAR = calendar.year
export const SHASHTHI = calendar.shashthi
export const PUJO_DAYS: Record<string, string> = calendar.days
/** The pujo days proper — Panchami to Dashami — when the header wears its festive border. */
export const PUJO_FROM = calendar.from
export const PUJO_TO = calendar.to

/** Today's date in India, "YYYY-MM-DD" (midnight turnover — unlike উমা's 5 am). */
export const istToday = (now = Date.now()): string => new Date(now + 5.5 * 3600_000).toISOString().slice(0, 10)

/** Is `date` one of the pujo days (Panchami → Dashami)? */
export const isPujoDay = (date: string): boolean => date >= PUJO_FROM && date <= PUJO_TO
