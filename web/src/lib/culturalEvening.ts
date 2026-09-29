import type { AlponaName } from '@/components/Alpona'

/**
 * The cultural evening's public page, /cultural/flyer/01 — the year's flyer
 * for an open audience, no sign-in, drawn in the site's own laal-paar and
 * alpona rather than shown as a picture, so it reads crisply on any phone. A
 * cultural admin shares its link from /cultural. Title, description and the
 * share card here must stay in step with the /cultural/flyer/01 entry in
 * web/scripts/prerender.mjs: WhatsApp and Facebook read only that
 * prerendered HTML.
 */
export const CULTURAL_EVENING = {
  path: '/cultural/flyer/01',
  title: 'Durga Pujo Cultural Evenings · Magarpatta City',
  description:
    'Shashthi to Ashtami Day 2, 16–19 October · Amphitheatre, Aditi Garden · 6:30 pm onwards. Musical Quiz, Chandalika dance drama and a live performance by Shreya Verma — all Magarpatta citizens and Cybercity families welcome.',
  /**
   * The share card, 1200 × 630, 88 KB — under 100 KB, as WhatsApp drops heavier
   * images: "Evening Itineraries" in the flyer's own alpona, drawn in HTML and
   * photographed by a headless browser. A new image gets a new name: WhatsApp
   * caches by URL.
   */
  shareImage: 'https://pujosamiti.github.io/cultural-evenings-card-2026.webp',

  // ── The flyer's words, as the page draws them ──────────────────────────
  invite: 'Inviting all Magarpatta citizens and Cybercity families to the Magarpatta City Durga Pujo Cultural Evenings',
  greetingBn: 'শুভ শারদীয়া',
  heading: ['Magarpatta City Durga Pujo', 'Cultural Evenings'],
  evenings: [
    { day: 'Shashthi', date: '16th October', motif: 'panPata', items: ['Musical Quiz'] },
    { day: 'Saptami', date: '17th October', motif: 'dhanerShish', items: ['Sharodiyar Nostalgia', 'Mahanayak-er Chhayay'] },
    {
      day: 'Ashtami Day 1',
      date: '18th October',
      motif: 'shatadal',
      items: ['Performances by Magarpatta Citizens', 'Chandalika: Dance Drama'],
    },
    {
      day: 'Ashtami Day 2',
      date: '19th October',
      motif: 'podmo',
      items: ['Live performance by Shreya Verma, Indian Idol 16 Contestant'],
    },
  ] satisfies { day: string; date: string; motif: AlponaName; items: string[] }[],
  venue: 'Amphitheatre, Aditi Garden',
  time: '6:30 pm onwards',
} as const

/** The address to share — served with its trailing slash, as Pages serves it. */
export const culturalEveningUrl = () => `${window.location.origin}${CULTURAL_EVENING.path}/`
