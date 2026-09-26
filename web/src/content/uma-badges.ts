/**
 * The badges a win earns in উমা — five for the puzzle, five for the quiz, by
 * speed. Each badge is a portrait of Maa (a different face for every badge,
 * web/public/uma-badges) and a short prayer: the Sanskrit in Bengali script
 * exactly as the samiti's guide prints it on its Pushpanjali page, and the
 * guide's own English meaning.
 *
 * `maxSecs` is the slowest time that still earns the badge. The quiz's last
 * badge welcomes any right answer; the puzzle's stops at two minutes.
 */
export interface UmaBadge {
  id: string
  face: string
  prayerBn: [string, string]
  prayerEn: string
  /** Earned within this many seconds; null = any time. */
  maxSecs: number | null
  /** Ring colour — literal classes so Tailwind keeps them. */
  ring: string
}

/** Pujo colours for the five rings, fastest first: marigold, hibiscus, jarul, aparajita, lotus. */
const RINGS = ['bg-genda', 'bg-jaba', 'bg-jarul', 'bg-aparajita', 'bg-padma'] as const

export const PUZZLE_BADGES: UmaBadge[] = [
  {
    id: 'puzzle-1',
    face: '/uma-badges/puzzle-1.webp',
    prayerBn: ['সর্বমঙ্গলমঙ্গল্যে শিবে সর্বার্থসাধিকে।', 'শরণ্যে ত্র্যম্বকে গৌরি নারায়ণি নমোঽস্তুতে॥'],
    prayerEn:
      'O auspiciousness of all that is auspicious, gracious one, accomplisher of every aim, refuge, three-eyed Gauri, Narayani — salutation to you.',
    maxSecs: 60,
    ring: RINGS[0],
  },
  {
    id: 'puzzle-2',
    face: '/uma-badges/puzzle-2.webp',
    prayerBn: ['সংগ্রামে বিজয়ং দেহি ধনং দেহি সদা গৃহে।', 'ধর্মার্থকামসম্পত্তিং দেহি দেবী নমোঽস্তু তে॥'],
    prayerEn:
      'Grant victory in every struggle, prosperity always at home, and the full wealth of dharma, artha and kama — righteousness, means and joy — salutation to you, Devi.',
    maxSecs: 75,
    ring: RINGS[1],
  },
  {
    id: 'puzzle-3',
    face: '/uma-badges/puzzle-3.webp',
    prayerBn: ['নমঃ আয়ুর্দেহি যশো দেহি ভাগ্যং ভগবতি দেহি মে।', 'পুত্রান্ দেহি ধনং দেহি সর্বান্ কামাংশ্চ দেহি মে॥'],
    prayerEn:
      'Give me long life, Bhagavati — give me honour, give me good fortune; give me children, give me the means to live, give me all that I long for.',
    maxSecs: 90,
    ring: RINGS[2],
  },
  {
    id: 'puzzle-4',
    face: '/uma-badges/puzzle-4.webp',
    prayerBn: ['সর্বস্বরূপে সর্বেশে সর্বশক্তিসমন্বিতে।', 'ভয়েভ্যস্ত্রাহি নো দেবি দুর্গে দেবি নমোঽস্তুতে॥'],
    prayerEn:
      'You whose form is everything, sovereign of all, joined with every power — save us from our fears, Durga; Devi, salutation to you.',
    maxSecs: 105,
    ring: RINGS[3],
  },
  {
    id: 'puzzle-5',
    face: '/uma-badges/puzzle-5.webp',
    prayerBn: ['নমঃ শরণাগতদীনার্তপরিত্রাণপরায়ণে।', 'সর্বস্যার্তিহরে দেবী নারায়ণি নমোঽস্তু তে॥'],
    prayerEn:
      'You whose very nature is to rescue the poor and the distressed who come to you for shelter, remover of everyone’s pain — Narayani, salutation.',
    maxSecs: 120,
    ring: RINGS[4],
  },
]

export const QUIZ_BADGES: UmaBadge[] = [
  {
    id: 'quiz-1',
    face: '/uma-badges/quiz-1.webp',
    prayerBn: ['নমঃ মহিষঘ্নি মহামায়ে চামুণ্ডে মুণ্ডমালিনি।', 'আয়ুরারোগ্যবিজয়ং দেহি দেবী নমোঽস্তুতে॥'],
    prayerEn: 'Salutation, slayer of Mahisha, great Maya, Chamunda garlanded with severed heads — grant long life, health and victory.',
    maxSecs: 10,
    ring: RINGS[0],
  },
  {
    id: 'quiz-2',
    face: '/uma-badges/quiz-2.webp',
    prayerBn: ['জয়ন্তী মঙ্গলা কালী ভদ্রকালী কপালিনী।', 'দুর্গা শিবা ক্ষমা ধাত্রী স্বাহা স্বধা নমোঽস্তুতে॥'],
    prayerEn:
      'The ever-victorious, the auspicious, Kali, Bhadrakali, the skull-bearer; Durga, the gracious, forgiveness itself, the sustainer; svaha and svadha — salutation to you.',
    maxSecs: 20,
    ring: RINGS[1],
  },
  {
    id: 'quiz-3',
    face: '/uma-badges/quiz-3.webp',
    prayerBn: ['নমঃ সৃষ্টিস্থিতিবিনাশানাং শক্তিভূতে সনাতনি।', 'গুণাশ্রয়ে গুণময়ে নারায়ণি নমোঽস্তু তে॥'],
    prayerEn:
      'You who are the power behind creation, preservation and dissolution, eternal one; the resort of all qualities and made of them — Narayani, salutation.',
    maxSecs: 40,
    ring: RINGS[2],
  },
  {
    id: 'quiz-4',
    face: '/uma-badges/quiz-4.webp',
    prayerBn: ['লক্ষ্মি লজ্জে মহাবিদ্যে শ্রদ্ধে পুষ্টি স্বধে ধ্রুবে।', 'মহারাত্রি মহামায়ে নারায়ণি নমোঽস্তু তে॥'],
    prayerEn:
      'You are Lakshmi and modesty, the great knowledge and faith, nourishment, svadha, the fixed pole-star; the great night and the great Maya — Narayani, salutation.',
    maxSecs: 90,
    ring: RINGS[3],
  },
  {
    id: 'quiz-5',
    face: '/uma-badges/quiz-5.webp',
    prayerBn: ['হর পাপং হর ক্লেশং হর শোকং হরাসুখম্।', 'হর রোগং হর ক্ষোভং হর মারীং হরপ্রিয়ে॥'],
    prayerEn:
      'Take away sin, take away affliction, take away grief and misery; take away disease, turmoil and pestilence, O beloved of Hara (Shiva).',
    maxSecs: null,
    ring: RINGS[4],
  },
]

/** The badge a win in `secs` seconds earns, or null when it is too slow for any. */
export const badgeFor = (badges: UmaBadge[], secs: number): UmaBadge | null =>
  badges.find((b) => b.maxSecs === null || secs <= b.maxSecs) ?? null

/** "≤ 60s", "≤ 1m 45s", "any time" — the label under each badge in the row. */
export const limitLabel = (b: UmaBadge): string => {
  if (b.maxSecs === null) return 'any time'
  const s = b.maxSecs
  return s < 60 ? `≤ ${s}s` : s % 60 ? `≤ ${Math.floor(s / 60)}m ${s % 60}s` : `≤ ${s / 60} min`
}
