/**
 * The daily clock behind উমা's quiz and puzzle. Everyone gets the same
 * question and the same shuffled puzzle on the same day in India, so members
 * can compare notes on WhatsApp. The Uma day turns over at **5 am IST** — the
 * new question and puzzle are waiting when the house wakes, and a late-night
 * player is still on the evening's games. Everything here is client-side:
 * no server, no sign-in.
 */

/** The first day of the games; day numbers count from here. */
export const UMA_LAUNCH = '2026-09-26'
/** The season runs 26 days, to Dashami (21 Oct 2026); after it the games rest until next year. */
export const UMA_SEASON_DAYS = 26

/**
 * The pujo's days in 2026, as the samiti's Days of the Pujo list them
 * (seeded from the finalised nirghanto), with Mahalaya ahead of them.
 */
const SHASHTHI = '2026-10-16'
const PUJO_DAYS: Record<string, string> = {
  '2026-10-10': 'Mahalaya',
  '2026-10-15': 'Panchami',
  '2026-10-16': 'Shashthi',
  '2026-10-17': 'Saptami',
  '2026-10-18': 'Ashtami',
  '2026-10-19': 'Ashtami · Day 2',
  '2026-10-20': 'Nabami',
  '2026-10-21': 'Dashami',
}

/**
 * The countdown line for a day: "19 days to Shashthi", "Shashthi is
 * tomorrow", with Mahalaya and Panchami named in front ("Mahalaya · 6 days
 * to Shashthi"); from Shashthi on, the pujo day's own name.
 */
export function pujoCountdown(date: string): string {
  const days = Math.round((Date.parse(SHASHTHI) - Date.parse(date)) / 86_400_000)
  if (days <= 0) return PUJO_DAYS[date] ?? 'After the pujo'
  const toGo = days === 1 ? 'Shashthi is tomorrow' : `${days} days to Shashthi`
  return PUJO_DAYS[date] ? `${PUJO_DAYS[date]} · ${toGo}` : toGo
}

/** The Uma day `n` days after launch, "YYYY-MM-DD". */
export const dateOfDay = (n: number): string =>
  new Date(Date.parse(UMA_LAUNCH) + n * 86_400_000).toISOString().slice(0, 10)

/**
 * Who may look ahead at days not yet played: a member whose portfolio is
 * "maestro" (an admin sets it on /membership). Everyone else sees today and
 * the days before it. The games' content ships in the page itself, so this is
 * a courtesy, not a secret.
 */
export const UMA_PREVIEW_PORTFOLIO = 'maestro'
export const canPreviewUma = (portfolio: string | null | undefined): boolean =>
  portfolio?.trim().toLowerCase() === UMA_PREVIEW_PORTFOLIO

const IST_OFFSET = 5.5 * 3600_000
/** The hour (IST) at which a new Uma day begins. */
export const UMA_DAY_STARTS_AT = 5
const DAY_SHIFT = IST_OFFSET - UMA_DAY_STARTS_AT * 3600_000

/** The current Uma day, "YYYY-MM-DD": the date in India, turning over at 5 am. */
export const umaToday = (now = Date.now()): string => new Date(now + DAY_SHIFT).toISOString().slice(0, 10)

/** Whole days from launch to `date` — the index into the daily rotations. */
export const dayNumber = (date: string): number =>
  Math.max(0, Math.round((Date.parse(date) - Date.parse(UMA_LAUNCH)) / 86_400_000))

/** Milliseconds until the next Uma day begins (5 am IST). */
export const msToNextDay = (now = Date.now()): number => 86_400_000 - ((now + DAY_SHIFT) % 86_400_000)

/** "5h 12m" — the countdown shown after today's game is done. */
export const formatCountdown = (ms: number): string => {
  const m = Math.max(1, Math.ceil(ms / 60_000))
  const h = Math.floor(m / 60)
  return h ? `${h}h ${m % 60}m` : `${m}m`
}

/** A small deterministic generator (mulberry32) seeded from a string. */
export function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  let a = h >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Per-phone memory (today's answer, puzzle progress, best times). Storage can
 * be missing or throw (private windows, blocked site data), so every access
 * is guarded and the games simply start fresh when it fails.
 */
export function readLocal<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeLocal(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable — the game still works, it just won't remember */
  }
}
