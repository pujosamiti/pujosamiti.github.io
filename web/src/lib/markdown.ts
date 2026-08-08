// Shared markdown plumbing for content sections (the Durga Puja book now,
// Pujo Sankhya later): frontmatter parsing and filename→slug rules.

export interface Frontmatter {
  title: string
  bengali?: string
  order: number
  when?: string
  oneLiner?: string
  /** share image: a bare filename resolves to /book/<name> (see docs/seotags.md) */
  image?: string
  [key: string]: string | number | undefined
}

/** Minimal YAML frontmatter parser — flat `key: value` pairs only. */
export function parseFrontmatter(raw: string): { meta: Frontmatter; body: string } {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/)
  const meta: Record<string, string | number> = { title: '', order: 0 }
  if (!m) return { meta: meta as Frontmatter, body: raw }
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/)
    if (!kv) continue
    let v: string = kv[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    meta[kv[1]] = /^\d+$/.test(v) ? Number(v) : v
  }
  return { meta: meta as Frontmatter, body: raw.slice(m[0].length) }
}

/** "…/09-ashtami.md" → { order: 9, slug: "ashtami" } */
export function slugFromPath(path: string): { order: number; slug: string } {
  const file = path.split('/').pop()!.replace(/\.md$/, '')
  const m = file.match(/^(\d+)-(.*)$/)
  return m ? { order: Number(m[1]), slug: m[2] } : { order: 0, slug: file }
}

export function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
