import type { AlponaName } from '@/components/Alpona'

/**
 * The cultural evening's public page, /cultural/flyer/01 — the year's flyer
 * for an open audience, no sign-in: a one-sided print card the size of the
 * invitation's pages (1360 × 1800), drawn in the site's own laal-paar, alpona
 * and Warli, to view, download and print. A cultural admin shares its link
 * from /cultural. Title, description and the
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
   * The share card, 1200 × 630, under 100 KB (WhatsApp drops heavier images):
   * the print card's own art — Maa in the chakra, the evenings, Warli dancers —
   * drawn by scripts/cultural-share-card.mts. A new image gets a new name:
   * WhatsApp caches by URL (v2 replaced the first, "Evening Itineraries").
   */
  shareImage: 'https://pujosamiti.github.io/cultural-evenings-card-2026-v2.webp',
  /** what the share card says under the heading: the run of evenings, and what's on */
  shareLines: ['Shashthi to Ashtami · 16–19 October', 'Musical Quiz · Chandalika · Shreya Verma live'],

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

  // ── The printed flyer ──────────────────────────────────────────────────
  /** Maa in the chakra: Souvik Laha's photograph (Pexels licence), cropped square round the face. */
  photo: '/cultural/durga-2026-flyer.webp',
  photoCredit: 'Photograph of Maa: Souvik Laha · Pexels',
  /** the PNG's name, before "-2x" and ".png" */
  file: 'durga-puja-2026-cultural-evenings',
} as const

/** The address to share — served with its trailing slash, as Pages serves it. */
export const culturalEveningUrl = () => `${window.location.origin}${CULTURAL_EVENING.path}/`
