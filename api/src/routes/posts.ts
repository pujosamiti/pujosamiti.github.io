import type { ApiResult, Post, PostSummary, PostType } from '@pujosamiti/shared'
import { Hono } from 'hono'

import type { Env } from '../env'
import { listDriveFolder, readDriveFile } from '../lib/google'

/**
 * Blogs and magazine articles are markdown files in the content Drive folder —
 * committee members drop a file in, the site picks it up. File-name convention:
 *   blog--durga-pujo-2026--amar-pujo-smriti.md
 *   magazine--sharad-sonkha-2026.md
 * Frontmatter (--- key: value ---) supplies title/author/date; the file name
 * supplies type, optional event id, and slug.
 */

interface ParsedName {
  type: PostType
  eventId: string | null
  slug: string
}

function parseName(name: string): ParsedName | null {
  if (!name.endsWith('.md')) return null
  const parts = name.slice(0, -3).split('--')
  const type = parts[0]
  if (type !== 'blog' && type !== 'magazine') return null
  if (parts.length === 3) return { type, eventId: parts[1] ?? null, slug: parts[2] ?? '' }
  if (parts.length === 2) return { type, eventId: null, slug: parts[1] ?? '' }
  return null
}

function parseFrontmatter(md: string): { meta: Record<string, string>; body: string } {
  const match = md.match(/^---\n([\s\S]*?)\n---\n?/)
  if (!match) return { meta: {}, body: md }
  const meta: Record<string, string> = {}
  for (const line of match[1]!.split('\n')) {
    const i = line.indexOf(':')
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return { meta, body: md.slice(match[0].length) }
}

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data }
}

export const postRoutes = new Hono<{ Bindings: Env }>()

postRoutes.get('/posts', async (c) => {
  const typeFilter = c.req.query('type')
  const files = await listDriveFolder(c.env, c.env.CONTENT_DRIVE_FOLDER_ID)
  const summaries: PostSummary[] = []
  for (const f of files) {
    const parsed = parseName(f.name)
    if (!parsed) continue
    if (typeFilter && parsed.type !== typeFilter) continue
    summaries.push({
      slug: parsed.slug,
      type: parsed.type,
      eventId: parsed.eventId as PostSummary['eventId'],
      title: parsed.slug.replace(/-/g, ' '), // refined below when the file is read
      author: null,
      publishedAt: f.modifiedTime,
      excerpt: null,
    })
  }
  return c.json(ok(summaries))
})

postRoutes.get('/posts/:slug', async (c) => {
  const slug = c.req.param('slug')
  const files = await listDriveFolder(c.env, c.env.CONTENT_DRIVE_FOLDER_ID)
  const file = files.find((f) => parseName(f.name)?.slug === slug)
  if (!file) return c.json({ ok: false, error: 'post not found' }, 404)
  const parsed = parseName(file.name)!
  const { meta, body } = parseFrontmatter(await readDriveFile(c.env, file.id))
  const post: Post = {
    slug,
    type: parsed.type,
    eventId: parsed.eventId as Post['eventId'],
    title: meta.title ?? slug.replace(/-/g, ' '),
    author: meta.author ?? null,
    publishedAt: meta.date ?? file.modifiedTime,
    excerpt: null,
    body,
  }
  return c.json(ok(post))
})
