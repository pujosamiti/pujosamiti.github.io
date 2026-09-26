/**
 * Photographs for উমা's daily sliding puzzle — one for each day of the 2026
 * season, 26 Sep to 21 Oct (Dashami), in order. Each is a 900 × 900 WebP in
 * web/public/uma-puzzle, cropped so Maa's face sits in the centre tile (the
 * empty square is the bottom-right corner, never the face). Day 0 is the
 * samiti's own 2023 photograph; Dashami is the boron, chosen for that day.
 * The rest are from Pexels and Unsplash, whose licences allow this use; each
 * carries its photographer's credit, shown small under the finished picture.
 * The originals live outside git in docs/tmp/durga-face/.
 */
export interface UmaPuzzleImage {
  src: string
  /** Shown under the finished picture. */
  caption: string
  /** Photographer and source, for stock photographs. */
  credit?: string
}

export const UMA_PUZZLES: UmaPuzzleImage[] = [
  { src: '/uma-puzzle/durga-2023-face.webp', caption: 'Maa Durga · 2023' }, // day 0 · 26 Sep
  { src: '/uma-puzzle/pexels-kolkatarchobiwala-28801381.webp', caption: 'Maa Durga', credit: 'Photo: kolkatarchobiwala / Pexels' }, // day 1 · 27 Sep
  { src: '/uma-puzzle/pexels-sanket-gaikwad-2148368419-38344763.webp', caption: 'Maa Durga', credit: 'Photo: Sanket Gaikwad / Pexels' }, // day 2 · 28 Sep
  { src: '/uma-puzzle/pexels-kolkatarchobiwala-28900366.webp', caption: 'Maa Durga', credit: 'Photo: kolkatarchobiwala / Pexels' }, // day 3 · 29 Sep
  { src: '/uma-puzzle/prithivi-das-ObI7xJ3vLrk-unsplash.webp', caption: 'Maa Durga', credit: 'Photo: Prithivi Das / Unsplash' }, // day 4 · 30 Sep
  { src: '/uma-puzzle/pexels-kolkatarchobiwala-28936174.webp', caption: 'Maa Durga', credit: 'Photo: kolkatarchobiwala / Pexels' }, // day 5 · 1 Oct
  { src: '/uma-puzzle/pexels-souvik-laha-3637528-5665005.webp', caption: 'Maa Durga', credit: 'Photo: Souvik Laha / Pexels' }, // day 6 · 2 Oct
  { src: '/uma-puzzle/pexels-kolkatarchobiwala-28945579.webp', caption: 'Maa Durga', credit: 'Photo: kolkatarchobiwala / Pexels' }, // day 7 · 3 Oct
  { src: '/uma-puzzle/pexels-trishik-bose-166596160-34093364.webp', caption: 'Maa Durga', credit: 'Photo: Trishik Bose / Pexels' }, // day 8 · 4 Oct
  { src: '/uma-puzzle/pexels-kolkatarchobiwala-34006066.webp', caption: 'Maa Durga', credit: 'Photo: kolkatarchobiwala / Pexels' }, // day 9 · 5 Oct
  { src: '/uma-puzzle/pexels-trishik-bose-166596160-34093394.webp', caption: 'Maa Durga', credit: 'Photo: Trishik Bose / Pexels' }, // day 10 · 6 Oct
  { src: '/uma-puzzle/pexels-kolkatarchobiwala-29403681.webp', caption: 'Maa Durga', credit: 'Photo: kolkatarchobiwala / Pexels' }, // day 11 · 7 Oct
  { src: '/uma-puzzle/durga-2023-crown.webp', caption: 'Maa Durga · 2023' }, // day 12 · 8 Oct
  { src: '/uma-puzzle/pexels-kolkatarchobiwala-28939901.webp', caption: 'Maa Durga', credit: 'Photo: kolkatarchobiwala / Pexels' }, // day 13 · 9 Oct
  { src: '/uma-puzzle/anirban-sarkar-4chOzq_4s-w-unsplash.webp', caption: 'Maa Durga', credit: 'Photo: Anirban Sarkar / Unsplash' }, // day 14 · 10 Oct
  { src: '/uma-puzzle/pexels-kolkatarchobiwala-27526843.webp', caption: 'Maa Durga', credit: 'Photo: kolkatarchobiwala / Pexels' }, // day 15 · 11 Oct
  { src: '/uma-puzzle/pexels-swagoto-mondal-701653119-29173215.webp', caption: 'Maa Durga', credit: 'Photo: Swagoto Mondal / Pexels' }, // day 16 · 12 Oct
  { src: '/uma-puzzle/pexels-kolkatarchobiwala-29011076.webp', caption: 'Maa Durga', credit: 'Photo: kolkatarchobiwala / Pexels' }, // day 17 · 13 Oct
  { src: '/uma-puzzle/souvik-laha--Zj7KbpzdIU-unsplash.webp', caption: 'Maa Durga', credit: 'Photo: Souvik Laha / Unsplash' }, // day 18 · 14 Oct
  { src: '/uma-puzzle/pexels-kolkatarchobiwala-29479060.webp', caption: 'Maa Durga', credit: 'Photo: kolkatarchobiwala / Pexels' }, // day 19 · 15 Oct
  { src: '/uma-puzzle/pexels-souvik-laha-3637528-10852594.webp', caption: 'Maa Durga', credit: 'Photo: Souvik Laha / Pexels' }, // day 20 · 16 Oct
  { src: '/uma-puzzle/pexels-kolkatarchobiwala-28936373.webp', caption: 'Maa Durga', credit: 'Photo: kolkatarchobiwala / Pexels' }, // day 21 · 17 Oct
  { src: '/uma-puzzle/pexels-arpan-ganguly-2154628020-34293695.webp', caption: 'Maa Durga', credit: 'Photo: Arpan Ganguly / Pexels' }, // day 22 · 18 Oct
  { src: '/uma-puzzle/pexels-arpan-adhikary-269100782-13921372.webp', caption: 'Maa Durga', credit: 'Photo: Arpan Adhikary / Pexels' }, // day 23 · 19 Oct
  { src: '/uma-puzzle/pexels-arjun-dutta-2154921521-33801384.webp', caption: 'Maa Durga', credit: 'Photo: Arjun Dutta / Pexels' }, // day 24 · 20 Oct
  { src: '/uma-puzzle/dashami-boron-2026.webp', caption: 'Dashami · the boron' }, // day 25 · 21 Oct
]
