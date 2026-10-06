/**
 * The cultural evenings' stage flex, /flex/01 — the year's 16 × 16 ft
 * backdrop, public, no sign-in: a preview, and the 8000 × 8000 print file to
 * download for the print shop. The files are too big for the site (the PNG is
 * 57 MB), so they live on Google Drive, shared with anyone who has the link,
 * and the buttons download them straight from there. Title, description and
 * the share card here must stay in step with the /flex/01 entry in
 * web/scripts/prerender.mjs: WhatsApp and Facebook read only that
 * prerendered HTML.
 */

/** A file on Google Drive, shared with anyone who has the link. */
type DriveFile = { id: string; label: string; bytes: number; name: string }

export const STAGE_FLEX = {
  path: '/flex/01',
  title: 'Durga Puja 2026 Stage Flex · Magarpatta City',
  description:
    'The 16 × 16 ft stage backdrop for the Magarpatta City Durga Puja 2026 cultural evenings — a Bengali thakur dalan, three arches and alpona in the courtyard. Download the 8000 × 8000 print file, PNG or JPG.',
  /**
   * The share card, 1200 × 630, under 100 KB (WhatsApp drops heavier images):
   * the whole flex beside its name, drawn by scripts/flex-share-card.mts. A new
   * image gets a new name: WhatsApp caches by URL.
   */
  shareImage: 'https://pujosamiti.github.io/flex-card-2026.webp',
  /** the flex at 1600 × 1600, for the page (made from the print file) */
  preview: '/flex/thakur-dalan-flex-2026-preview.webp',
  year: 2026,
  heading: 'Stage Flex',
  subheading: 'Durga Puja Cultural Evenings backdrop',
  place: 'Magarpatta City, Pune',
  feet: 16,
  px: 8000,
  /** the PNG first: it is the default download */
  files: [
    { id: '1MmWy_rEZL0-RBmmLzAvyCyo78zz7W3qm', label: 'PNG', bytes: 56_954_170, name: 'thakur-dalan-flex-2026-03i-8000.png' },
    { id: '10YiZWl82hvb3OPcBd2Z54FmJnF7hsMcv', label: 'JPG', bytes: 15_592_874, name: 'thakur-dalan-flex-2026-03i-8000.jpg' },
  ] satisfies DriveFile[],
  alt: 'The stage flex: a white Bengali thakur dalan with three cusped arches, red curtains and a lit hall, the words Durga Puja 2026, Magarpatta City, Pune on the band under its green eave, a banana plant and a mangal ghot beside each side of the steps, Lakshmi’s footsteps climbing them, and three alpona in white, marigold, red and blue on the brick courtyard.',
} as const

/** Downloads the file itself (confirm=t passes Drive's "too big to scan" notice). */
export const driveDownload = (f: DriveFile) => `https://drive.usercontent.google.com/download?id=${f.id}&export=download&confirm=t`
/** The file's own page on Drive — the fallback when a direct download is refused. */
export const driveView = (f: DriveFile) => `https://drive.google.com/file/d/${f.id}/view`
/** "57 MB" */
export const megabytes = (bytes: number) => `${Math.round(bytes / 1_000_000)} MB`

/** The address to share — served with its trailing slash, as Pages serves it. */
export const stageFlexUrl = () => `${window.location.origin}${STAGE_FLEX.path}/`
