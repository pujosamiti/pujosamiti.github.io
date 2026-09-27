import type { CSSProperties } from 'react'

/**
 * The pastel five on members-area surfaces (see .tint-tile in index.css and
 * docs/012): a wash of a pastel, a thin strip of it down the left edge.
 * Pastels are for surfaces only — never text, never buttons.
 */
export const PASTELS = ['golap', 'ganga', 'chandan', 'nilkamal'] as const
export type Pastel = (typeof PASTELS)[number]
/** A pastel, or 'woven': shankha cream with all four in its edge. */
export type Tint = Pastel | 'woven'

/** The pastels in turn, so neighbouring groups never share one. */
export const pastelAt = (i: number): Pastel => PASTELS[((i % PASTELS.length) + PASTELS.length) % PASTELS.length]!

/**
 * Props for a tinted surface. `amount` is the wash's strength: 22 % for
 * tiles (the default), about 10 % for cards that hold tables or lists, and
 * 5–7 % for rows, where the strip does the talking.
 */
export function tint(t: Tint, amount?: string): { className: string; style?: CSSProperties } {
  const style: Record<string, string> = {}
  if (t !== 'woven') style['--tint'] = `var(--${t})`
  if (amount) style['--tint-amount'] = amount
  return {
    className: t === 'woven' ? 'tint-tile tint-woven' : 'tint-tile',
    style: Object.keys(style).length ? (style as CSSProperties) : undefined,
  }
}

/**
 * Each members-area page's own colour: its tile on Members Only and the
 * underline of its title — so a page wears the colour of the tile that led
 * to it. Neighbouring tiles never share one (MembersOnly.tsx lays them out).
 */
export const PAGE_TINT = {
  ledger: 'ganga',
  wallets: 'chandan',
  sponsorship: 'golap',
  reimbursements: 'nilkamal',
  tasks: 'woven',
  procurement: 'ganga',
  bhog: 'chandan',
  membership: 'nilkamal',
  nirghanto: 'ganga',
  events: 'golap',
  brandcolours: 'woven',
} as const satisfies Record<string, Tint>

/** Style for a .tint-heading — a section heading marked by a short pastel bar. */
export const headingTint = (t: Pastel): CSSProperties => ({ '--tint': `var(--${t})` }) as CSSProperties
