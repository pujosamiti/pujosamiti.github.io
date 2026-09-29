/**
 * The cultural evening's public page, /cultural/cultural-01 — the year's flyer for
 * an open audience, no sign-in. A cultural admin shares its link from
 * /cultural. Title, description and the share card here must stay in step
 * with the /cultural/cultural-01 entry in web/scripts/prerender.mjs: WhatsApp and
 * Facebook read only that prerendered HTML.
 */
export const CULTURAL_EVENING = {
  path: '/cultural/cultural-01',
  title: 'Durga Pujo Cultural Evening · Magarpatta City',
  description:
    'Shashthi to Ashtami Day 2, 16–19 October · Amphitheatre, Aditi Garden · 6:30 pm onwards. Musical Quiz, Chandalika dance drama and a live performance by Shreya Verma — all Magarpatta residents, friends and family welcome.',
  /** The flyer as the page shows it, 1283 × 1600. */
  flyer: '/cultural-evening-2026.webp',
  /** The share card, 1200 × 630, under 100 KB — WhatsApp drops heavier images. A new image gets a new name: WhatsApp caches by URL. */
  shareImage: 'https://pujosamiti.github.io/cultural-evening-share-2026.webp',
  flyerAlt:
    'Magarpatta City Durga Pujo Cultural Evening — শুভ শারদীয়া. Shashthi, 16th October: Musical Quiz. Saptami, 17th October: Sharodiyar Nostalgia; Mahanayak-er Chhayay. Ashtami Day 1, 18th October: Performances by Magarpatta Residents; Chandalika: Dance Drama. Ashtami Day 2, 19th October: Live performance by Shreya Verma, Indian Idol 16 contestant. Venue: Amphitheatre, Aditi Garden. Time: 6:30 pm onwards. Inviting all Magarpatta residents and their friends and families.',
} as const

/** The address to share — served with its trailing slash, as Pages serves it. */
export const culturalEveningUrl = () => `${window.location.origin}${CULTURAL_EVENING.path}/`
