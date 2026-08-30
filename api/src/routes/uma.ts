import type {
  ApiResult,
  Me,
  UmaArticleCard,
  UmaArticleInput,
  UmaArticleView,
  UmaDeskArticle,
  UmaDeskView,
  UmaHomeView,
  UmaIssueCard,
  UmaIssueInput,
  UmaIssueView,
  UmaReactInput,
  UmaRole,
  UmaStatusInput,
} from '@pujosamiti/shared'
import { UMA_MAX_CLAPS, UMA_MAX_EDITORS, UMA_SECTIONS } from '@pujosamiti/shared'
import { and, asc, desc, eq, isNotNull, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'

import * as schema from '../db/schema'
import type { Env } from '../env'

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data }
}

const err = (error: string) => ({ ok: false as const, error })

const istToday = () => new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10)

/** ~200 words/min; Bengali text has no reliable word boundaries at low counts, so floor at 1. */
const readingMinutes = (md: string) => Math.max(1, Math.round(md.split(/\s+/).length / 200))

type ArticleRow = typeof schema.umaArticle.$inferSelect
type IssueRow = typeof schema.umaIssue.$inferSelect

const toCard = (a: ArticleRow, issueNumber: number | null): UmaArticleCard => ({
  slug: a.slug,
  section: a.section as UmaArticleCard['section'],
  title: a.title,
  titleBn: a.titleBn,
  authorName: a.authorName,
  authorNameBn: a.authorNameBn,
  isGuest: a.isGuest,
  excerpt: a.excerpt,
  heroImage: a.heroImage,
  issueNumber,
  publishedAt: a.publishedAt,
  hearts: a.hearts,
  claps: a.claps,
  readingMinutes: readingMinutes(a.bodyMd),
  lang: a.lang,
})

const toView = (a: ArticleRow, issueNumber: number | null, issueTitle: string | null): UmaArticleView => ({
  ...toCard(a, issueNumber),
  authorBio: a.authorBio,
  authorBioBn: a.authorBioBn,
  bodyMd: a.bodyMd,
  bodyMdAlt: a.bodyMdAlt,
  issueTitle,
})

const toIssueCard = (i: IssueRow, articleCount: number): UmaIssueCard => ({
  id: i.id,
  number: i.number,
  title: i.title,
  coverImage: i.coverImage,
  editorialNote: i.editorialNote,
  status: i.status,
  publishedOn: i.publishedOn,
  articleCount,
})

/** "আমার পুজো — smriti!" → "amar-pujo-smriti" would need transliteration; we only lower-case ASCII. */
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/**
 * Publishing a Sankhya asks GitHub to rebuild the Pages site so crawlers get
 * real prerendered HTML for the new articles (the deploy workflow listens for
 * repository_dispatch: uma-publish). Best-effort: without the token the pages
 * still render client-side and the next ordinary deploy prerenders them.
 */
async function triggerRebuild(env: Env): Promise<boolean> {
  if (!env.GITHUB_DISPATCH_TOKEN) return false
  try {
    const res = await fetch('https://api.github.com/repos/pujosamiti/pujosamiti.github.io/dispatches', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GITHUB_DISPATCH_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'pujosamiti-api',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event_type: 'uma-publish' }),
    })
    return res.status === 204
  } catch {
    return false
  }
}

const MEDIA_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
  svg: 'image/svg+xml',
}
const MEDIA_MAX_BYTES = 8 * 1024 * 1024

// ─────────────────────────────────────────────────────────────────────────────
// Public — the magazine itself. No auth: SEO and WhatsApp sharing depend on it.
// ─────────────────────────────────────────────────────────────────────────────

export const umaPublicRoutes = new Hono<{ Bindings: Env }>()

async function loadIssueView(db: ReturnType<typeof drizzle<typeof schema>>, issue: IssueRow): Promise<UmaIssueView> {
  const articles = await db
    .select()
    .from(schema.umaArticle)
    .where(and(eq(schema.umaArticle.issueId, issue.id), eq(schema.umaArticle.status, 'published')))
    .orderBy(asc(schema.umaArticle.sortOrder), asc(schema.umaArticle.createdAt))
  return { ...toIssueCard(issue, articles.length), articles: articles.map((a) => toCard(a, issue.number)) }
}

umaPublicRoutes.get('/home', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  const issues = await db
    .select()
    .from(schema.umaIssue)
    .where(eq(schema.umaIssue.status, 'published'))
    .orderBy(desc(schema.umaIssue.number))
  const counts = await db
    .select({ issueId: schema.umaArticle.issueId, n: sql<number>`count(*)` })
    .from(schema.umaArticle)
    .where(eq(schema.umaArticle.status, 'published'))
    .groupBy(schema.umaArticle.issueId)
  const countOf = new Map(counts.map((r) => [r.issueId, r.n]))
  const masthead = await db
    .select({ name: schema.person.displayName, umaRole: schema.person.umaRole })
    .from(schema.person)
    .where(and(isNotNull(schema.person.umaRole), eq(schema.person.isActive, true)))
  const out: UmaHomeView = {
    latest: issues[0] ? await loadIssueView(db, issues[0]) : null,
    issues: issues.map((i) => toIssueCard(i, countOf.get(i.id) ?? 0)),
    masthead: {
      chief: masthead.find((m) => m.umaRole === 'chief_editor')?.name ?? null,
      editors: masthead.filter((m) => m.umaRole === 'editor').map((m) => m.name),
    },
  }
  return c.json(ok(out))
})

umaPublicRoutes.get('/issues/:number', async (c) => {
  const number = Number(c.req.param('number'))
  const db = drizzle(c.env.DB, { schema })
  const [issue] = await db
    .select()
    .from(schema.umaIssue)
    .where(and(eq(schema.umaIssue.number, number), eq(schema.umaIssue.status, 'published')))
    .limit(1)
  if (!issue) return c.json(err('no such sankhya'), 404)
  return c.json(ok(await loadIssueView(db, issue)))
})

umaPublicRoutes.get('/articles', async (c) => {
  const section = c.req.query('section')
  const limit = Math.min(Number(c.req.query('limit')) || 100, 200)
  const db = drizzle(c.env.DB, { schema })
  const where = section
    ? and(eq(schema.umaArticle.status, 'published'), eq(schema.umaArticle.section, section))
    : eq(schema.umaArticle.status, 'published')
  const rows = await db
    .select()
    .from(schema.umaArticle)
    .where(where)
    .orderBy(desc(schema.umaArticle.publishedAt))
    .limit(limit)
  const issues = await db.select().from(schema.umaIssue)
  const numOf = new Map(issues.map((i) => [i.id, i.number]))
  return c.json(ok(rows.map((a) => toCard(a, a.issueId ? (numOf.get(a.issueId) ?? null) : null))))
})

umaPublicRoutes.get('/articles/:slug', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  const [a] = await db
    .select()
    .from(schema.umaArticle)
    .where(and(eq(schema.umaArticle.slug, c.req.param('slug')), eq(schema.umaArticle.status, 'published')))
    .limit(1)
  if (!a) return c.json(err('no such article'), 404)
  let issue: IssueRow | undefined
  if (a.issueId) [issue] = await db.select().from(schema.umaIssue).where(eq(schema.umaIssue.id, a.issueId)).limit(1)
  return c.json(ok(toView(a, issue?.number ?? null, issue ? (issue.title ?? `সংখ্যা ${issue.number}`) : null)))
})

/**
 * Anonymous reactions. Deltas are clamped server-side (a heart is ±1, claps
 * top out at UMA_MAX_CLAPS per request); the per-reader cap lives in the
 * client's localStorage. Good-faith counters, not a ballot box.
 */
umaPublicRoutes.post('/react', async (c) => {
  const body = (await c.req.json().catch(() => null)) as UmaReactInput | null
  if (!body?.slug) return c.json(err('slug required'), 400)
  const hearts = Math.max(-1, Math.min(1, Math.trunc(Number(body.hearts) || 0)))
  const claps = Math.max(0, Math.min(UMA_MAX_CLAPS, Math.trunc(Number(body.claps) || 0)))
  if (!hearts && !claps) return c.json(ok({ hearts: 0, claps: 0 }))
  const db = drizzle(c.env.DB, { schema })
  const [row] = await db
    .update(schema.umaArticle)
    .set({
      hearts: sql`max(0, ${schema.umaArticle.hearts} + ${hearts})`,
      claps: sql`${schema.umaArticle.claps} + ${claps}`,
    })
    .where(and(eq(schema.umaArticle.slug, body.slug), eq(schema.umaArticle.status, 'published')))
    .returning({ hearts: schema.umaArticle.hearts, claps: schema.umaArticle.claps })
  if (!row) return c.json(err('no such article'), 404)
  return c.json(ok(row))
})

/** Uploaded media, straight from R2. Keys are content-addressed-ish (uuid) — cache forever. */
umaPublicRoutes.get('/media/:key', async (c) => {
  const key = c.req.param('key')
  if (!/^[a-f0-9-]{36}\.[a-z0-9]+$/.test(key)) return c.json(err('bad key'), 400)
  if (!c.env.FILES) return c.json(err('media storage is not configured'), 503)
  const obj = await c.env.FILES.get(`uma/${key}`)
  if (!obj) return c.json(err('not found'), 404)
  return new Response(obj.body, {
    headers: {
      'Content-Type': obj.httpMetadata?.contentType ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
      ETag: obj.httpEtag,
    },
  })
})

/**
 * Build-time feed for web/scripts/prerender.mjs: every public Uma route with
 * its SEO tags, plus Article JSON-LD for article pages. The prerenderer
 * appends the site's title suffix itself.
 */
umaPublicRoutes.get('/prerender', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  const origin = new URL(c.req.url).origin
  // R2 uploads are served by this Worker; site art lives in web/public on Pages
  const abs = (path: string | null) =>
    path ? `${path.startsWith('/api/') ? origin : c.env.WEB_ORIGIN}${path}` : undefined
  const issues = await db
    .select()
    .from(schema.umaIssue)
    .where(eq(schema.umaIssue.status, 'published'))
    .orderBy(desc(schema.umaIssue.number))
  const articles = await db
    .select()
    .from(schema.umaArticle)
    .where(eq(schema.umaArticle.status, 'published'))
  const numOf = new Map(issues.map((i) => [i.id, i.number]))
  type Route = {
    path: string
    title: string
    description: string
    image?: string
    type?: 'article'
    jsonLd?: object
  }
  const routes: Route[] = [
    {
      path: '/uma',
      title: 'Uma · উমা — the samiti magazine',
      description:
        'Uma (উমা) — the Magarpatta pujo samiti magazine: stories, poetry, commentary, mythology, recipes, travel and art from the samiti families of Pune.',
    },
  ]
  if (issues.length)
    routes.push({
      path: '/uma/sankhya',
      title: 'সব সংখ্যা · All issues · Uma magazine',
      description:
        'Every issue of Uma (উমা), the Magarpatta pujo samiti magazine — stories, poetry, recipes, travel, mythology and commentary, in Bengali and English.',
    })
  for (const i of issues)
    routes.push({
      path: `/uma/sankhya/${i.number}`,
      title: `${i.title ?? `Sankhya ${i.number}`} · Uma magazine`,
      description: `Uma সংখ্যা ${i.number} — the Magarpatta pujo samiti magazine.`,
      image: abs(i.coverImage),
    })
  const sectionsWith = new Set(articles.map((a) => a.section))
  // 'games' hosts the interactive দুর্গা Sudoku — a real page even with no articles
  sectionsWith.add('games')
  for (const s of UMA_SECTIONS)
    if (sectionsWith.has(s.id))
      routes.push({
        path: `/uma/bibhag/${s.id}`,
        title: `${s.en} · ${s.bn} · Uma magazine`,
        description: `${s.en} (${s.bn}) in Uma — the Magarpatta pujo samiti magazine.`,
      })
  for (const a of articles)
    routes.push({
      path: `/uma/${a.slug}`,
      title: `${a.title} · Uma magazine`,
      description: a.excerpt ?? `${a.title} — by ${a.authorName}, in Uma, the Magarpatta pujo samiti magazine.`,
      image: abs(a.heroImage),
      type: 'article',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: a.title,
        ...(a.titleBn ? { alternativeHeadline: a.titleBn } : {}),
        author: { '@type': 'Person', name: a.authorName },
        publisher: { '@type': 'Organization', name: 'Pujo Samiti Magarpatta City Pune' },
        ...(a.publishedAt ? { datePublished: a.publishedAt } : {}),
        ...(a.heroImage ? { image: abs(a.heroImage) } : {}),
        inLanguage: a.lang,
        articleSection: UMA_SECTIONS.find((s) => s.id === a.section)?.en ?? a.section,
        isPartOf: a.issueId ? `Uma Sankhya ${numOf.get(a.issueId)}` : undefined,
      },
    })
  return c.json(ok(routes))
})

// ─────────────────────────────────────────────────────────────────────────────
// The editorial desk — mounted under /api/members (auth middleware upstream).
// Editors and the chief editor run it; admins (the devs doing intake) hold
// both roles implicitly.
// ─────────────────────────────────────────────────────────────────────────────

type Vars = { me: Me }

const isEditor = (me: Me) => me.role === 'admin' || !!me.umaRole
const isChief = (me: Me) => me.role === 'admin' || me.umaRole === 'chief_editor'

export const umaDeskRoutes = new Hono<{ Bindings: Env; Variables: Vars }>()

umaDeskRoutes.use('*', async (c, next) => {
  if (!isEditor(c.get('me'))) return c.json(err('the editorial desk is for Uma editors'), 403)
  await next()
})

umaDeskRoutes.get('/desk', async (c) => {
  const db = drizzle(c.env.DB, { schema })
  const articles = await db.select().from(schema.umaArticle).orderBy(desc(schema.umaArticle.updatedAt))
  const issues = await db.select().from(schema.umaIssue).orderBy(desc(schema.umaIssue.number))
  const numOf = new Map(issues.map((i) => [i.id, i.number]))
  const titleOf = new Map(issues.map((i) => [i.id, i.title ?? `সংখ্যা ${i.number}`]))
  const countOf = new Map<string, number>()
  for (const a of articles) if (a.issueId) countOf.set(a.issueId, (countOf.get(a.issueId) ?? 0) + 1)
  const seats = await db
    .select({ id: schema.person.id, name: schema.person.displayName, umaRole: schema.person.umaRole })
    .from(schema.person)
    .where(and(isNotNull(schema.person.umaRole), eq(schema.person.isActive, true)))
  const chief = seats.find((s) => s.umaRole === 'chief_editor')
  const out: UmaDeskView = {
    articles: articles.map(
      (a): UmaDeskArticle => ({
        ...toView(
          a,
          a.issueId ? (numOf.get(a.issueId) ?? null) : null,
          a.issueId ? (titleOf.get(a.issueId) ?? null) : null,
        ),
        id: a.id,
        status: a.status,
        issueId: a.issueId,
        sortOrder: a.sortOrder,
        authorPersonId: a.authorPersonId,
        submittedVia: a.submittedVia,
        submittedOn: a.submittedOn,
        editorNote: a.editorNote,
        updatedAt: a.updatedAt.toISOString(),
      }),
    ),
    issues: issues.map((i) => toIssueCard(i, countOf.get(i.id) ?? 0)),
    masthead: {
      chief: chief ? { id: chief.id, name: chief.name } : null,
      editors: seats.filter((s) => s.umaRole === 'editor').map((s) => ({ id: s.id, name: s.name })),
    },
  }
  return c.json(ok(out))
})

function validateArticle(body: UmaArticleInput): string | null {
  if (!body.title?.trim()) return 'title is required'
  if (!body.authorName?.trim()) return 'author name is required'
  if (!body.bodyMd?.trim()) return 'the body is required'
  if (!UMA_SECTIONS.some((s) => s.id === body.section)) return 'unknown section'
  if (body.lang !== 'bn' && body.lang !== 'en') return 'lang must be bn or en'
  return null
}

umaDeskRoutes.post('/articles', async (c) => {
  const me = c.get('me')
  const body = (await c.req.json()) as UmaArticleInput
  const bad = validateArticle(body)
  if (bad) return c.json(err(bad), 400)
  const slug = (body.slug?.trim() ? slugify(body.slug) : slugify(body.title)) || null
  if (!slug) return c.json(err('a URL slug is required (the title has no ASCII letters to derive one from)'), 400)
  const db = drizzle(c.env.DB, { schema })
  const [dup] = await db.select({ id: schema.umaArticle.id }).from(schema.umaArticle).where(eq(schema.umaArticle.slug, slug)).limit(1)
  if (dup) return c.json(err(`slug "${slug}" is already taken`), 409)
  const id = crypto.randomUUID()
  const now = new Date()
  await db.insert(schema.umaArticle).values({
    id,
    slug,
    section: body.section,
    title: body.title.trim(),
    titleBn: body.titleBn?.trim() || null,
    authorName: body.authorName.trim(),
    authorNameBn: body.authorNameBn?.trim() || null,
    authorBio: body.authorBio?.trim() || null,
    authorBioBn: body.authorBioBn?.trim() || null,
    authorPersonId: body.authorPersonId || null,
    isGuest: !!body.isGuest,
    excerpt: body.excerpt?.trim() || null,
    heroImage: body.heroImage || null,
    bodyMd: body.bodyMd,
    bodyMdAlt: body.bodyMdAlt?.trim() || null,
    lang: body.lang,
    status: 'draft',
    submittedVia: body.submittedVia ?? null,
    submittedOn: body.submittedOn || null,
    createdBy: me.personId,
    createdAt: now,
    updatedAt: now,
  })
  return c.json(ok({ id, slug }))
})

umaDeskRoutes.put('/articles/:id', async (c) => {
  const body = (await c.req.json()) as UmaArticleInput
  const bad = validateArticle(body)
  if (bad) return c.json(err(bad), 400)
  const db = drizzle(c.env.DB, { schema })
  const [a] = await db.select().from(schema.umaArticle).where(eq(schema.umaArticle.id, c.req.param('id'))).limit(1)
  if (!a) return c.json(err('no such article'), 404)
  // The slug is the article's public identity — a published URL never changes.
  let slug = a.slug
  if (a.status !== 'published' && body.slug?.trim()) {
    const next = slugify(body.slug)
    if (next && next !== a.slug) {
      const [dup] = await db.select({ id: schema.umaArticle.id }).from(schema.umaArticle).where(eq(schema.umaArticle.slug, next)).limit(1)
      if (dup) return c.json(err(`slug "${next}" is already taken`), 409)
      slug = next
    }
  }
  await db
    .update(schema.umaArticle)
    .set({
      slug,
      section: body.section,
      title: body.title.trim(),
      titleBn: body.titleBn?.trim() || null,
      authorName: body.authorName.trim(),
      authorNameBn: body.authorNameBn?.trim() || null,
      authorBio: body.authorBio?.trim() || null,
      authorBioBn: body.authorBioBn?.trim() || null,
      authorPersonId: body.authorPersonId || null,
      isGuest: !!body.isGuest,
      excerpt: body.excerpt?.trim() || null,
      heroImage: body.heroImage || null,
      bodyMd: body.bodyMd,
      bodyMdAlt: body.bodyMdAlt?.trim() || null,
      lang: body.lang,
      submittedVia: body.submittedVia ?? null,
      submittedOn: body.submittedOn || null,
      updatedAt: new Date(),
    })
    .where(eq(schema.umaArticle.id, a.id))
  return c.json(ok({ id: a.id, slug }))
})

/**
 * The editorial verdict. Accept slots the piece into an unpublished Sankhya;
 * hold parks it (any editor can pull it into a later issue); reject records
 * the reason. Publishing never happens here — only via the Sankhya.
 */
umaDeskRoutes.post('/articles/:id/status', async (c) => {
  const body = (await c.req.json()) as UmaStatusInput
  const db = drizzle(c.env.DB, { schema })
  const [a] = await db.select().from(schema.umaArticle).where(eq(schema.umaArticle.id, c.req.param('id'))).limit(1)
  if (!a) return c.json(err('no such article'), 404)
  if (a.status === 'published') return c.json(err('published articles change only by unpublishing their sankhya'), 400)
  if (body.status === 'published') return c.json(err('publish the sankhya, not the article'), 400)
  if (!['draft', 'in_review', 'accepted', 'held', 'rejected'].includes(body.status))
    return c.json(err('unknown status'), 400)
  let issueId: string | null = null
  if (body.status === 'accepted') {
    if (!body.issueId) return c.json(err('accepting needs a sankhya to slot into'), 400)
    const [issue] = await db.select().from(schema.umaIssue).where(eq(schema.umaIssue.id, body.issueId)).limit(1)
    if (!issue) return c.json(err('no such sankhya'), 404)
    if (issue.status === 'published') return c.json(err('that sankhya is already published'), 400)
    issueId = issue.id
  }
  await db
    .update(schema.umaArticle)
    .set({
      status: body.status,
      issueId,
      editorNote: body.editorNote?.trim() || a.editorNote,
      updatedAt: new Date(),
    })
    .where(eq(schema.umaArticle.id, a.id))
  return c.json(ok({ id: a.id, status: body.status }))
})

umaDeskRoutes.delete('/articles/:id', async (c) => {
  if (c.get('me').role !== 'admin') return c.json(err('admins only'), 403)
  const db = drizzle(c.env.DB, { schema })
  const [a] = await db.select().from(schema.umaArticle).where(eq(schema.umaArticle.id, c.req.param('id'))).limit(1)
  if (!a) return c.json(err('no such article'), 404)
  if (a.status === 'published') return c.json(err('unpublish its sankhya first'), 400)
  await db.delete(schema.umaArticle).where(eq(schema.umaArticle.id, a.id))
  return c.json(ok({ id: a.id }))
})

// — Sankhyas (chief editor + admins) —

umaDeskRoutes.post('/issues', async (c) => {
  if (!isChief(c.get('me'))) return c.json(err('the chief editor composes sankhyas'), 403)
  const body = (await c.req.json()) as UmaIssueInput
  const number = Math.trunc(Number(body.number))
  if (!number || number < 1) return c.json(err('a positive issue number is required'), 400)
  const db = drizzle(c.env.DB, { schema })
  const [dup] = await db.select({ id: schema.umaIssue.id }).from(schema.umaIssue).where(eq(schema.umaIssue.number, number)).limit(1)
  if (dup) return c.json(err(`sankhya ${number} already exists`), 409)
  const id = `sankhya-${number}`
  await db.insert(schema.umaIssue).values({
    id,
    number,
    title: body.title?.trim() || null,
    coverImage: body.coverImage || null,
    editorialNote: body.editorialNote?.trim() || null,
    createdAt: new Date(),
  })
  return c.json(ok({ id }))
})

umaDeskRoutes.put('/issues/:id', async (c) => {
  if (!isChief(c.get('me'))) return c.json(err('the chief editor composes sankhyas'), 403)
  const body = (await c.req.json()) as UmaIssueInput
  const db = drizzle(c.env.DB, { schema })
  const [issue] = await db.select().from(schema.umaIssue).where(eq(schema.umaIssue.id, c.req.param('id'))).limit(1)
  if (!issue) return c.json(err('no such sankhya'), 404)
  await db
    .update(schema.umaIssue)
    .set({
      title: body.title?.trim() || null,
      coverImage: body.coverImage || null,
      editorialNote: body.editorialNote?.trim() || null,
    })
    .where(eq(schema.umaIssue.id, issue.id))
  return c.json(ok({ id: issue.id }))
})

/** Reorder a Sankhya's table of contents. */
umaDeskRoutes.put('/issues/:id/order', async (c) => {
  if (!isChief(c.get('me'))) return c.json(err('the chief editor composes sankhyas'), 403)
  const body = (await c.req.json()) as { articleIds: string[] }
  if (!Array.isArray(body.articleIds)) return c.json(err('articleIds required'), 400)
  const db = drizzle(c.env.DB, { schema })
  const issueId = c.req.param('id')
  for (let i = 0; i < body.articleIds.length; i++)
    await db
      .update(schema.umaArticle)
      .set({ sortOrder: (i + 1) * 10 })
      .where(and(eq(schema.umaArticle.id, body.articleIds[i]!), eq(schema.umaArticle.issueId, issueId)))
  return c.json(ok({ id: issueId }))
})

umaDeskRoutes.post('/issues/:id/publish', async (c) => {
  if (!isChief(c.get('me'))) return c.json(err('the chief editor publishes'), 403)
  const db = drizzle(c.env.DB, { schema })
  const [issue] = await db.select().from(schema.umaIssue).where(eq(schema.umaIssue.id, c.req.param('id'))).limit(1)
  if (!issue) return c.json(err('no such sankhya'), 404)
  if (issue.status === 'published') return c.json(err('already published'), 400)
  const accepted = await db
    .select({ id: schema.umaArticle.id })
    .from(schema.umaArticle)
    .where(and(eq(schema.umaArticle.issueId, issue.id), eq(schema.umaArticle.status, 'accepted')))
  if (accepted.length === 0) return c.json(err('a sankhya needs at least one accepted article'), 400)
  const now = new Date()
  await db
    .update(schema.umaArticle)
    .set({ status: 'published', publishedAt: now.toISOString(), updatedAt: now })
    .where(and(eq(schema.umaArticle.issueId, issue.id), eq(schema.umaArticle.status, 'accepted')))
  await db
    .update(schema.umaIssue)
    .set({ status: 'published', publishedOn: istToday() })
    .where(eq(schema.umaIssue.id, issue.id))
  const rebuildTriggered = await triggerRebuild(c.env)
  return c.json(ok({ id: issue.id, published: accepted.length, rebuildTriggered }))
})

umaDeskRoutes.post('/issues/:id/unpublish', async (c) => {
  if (!isChief(c.get('me'))) return c.json(err('the chief editor publishes'), 403)
  const db = drizzle(c.env.DB, { schema })
  const [issue] = await db.select().from(schema.umaIssue).where(eq(schema.umaIssue.id, c.req.param('id'))).limit(1)
  if (!issue) return c.json(err('no such sankhya'), 404)
  if (issue.status !== 'published') return c.json(err('not published'), 400)
  const now = new Date()
  await db
    .update(schema.umaArticle)
    .set({ status: 'accepted', publishedAt: null, updatedAt: now })
    .where(and(eq(schema.umaArticle.issueId, issue.id), eq(schema.umaArticle.status, 'published')))
  await db.update(schema.umaIssue).set({ status: 'draft', publishedOn: null }).where(eq(schema.umaIssue.id, issue.id))
  const rebuildTriggered = await triggerRebuild(c.env)
  return c.json(ok({ id: issue.id, rebuildTriggered }))
})

umaDeskRoutes.delete('/issues/:id', async (c) => {
  if (!isChief(c.get('me'))) return c.json(err('the chief editor composes sankhyas'), 403)
  const db = drizzle(c.env.DB, { schema })
  const [issue] = await db.select().from(schema.umaIssue).where(eq(schema.umaIssue.id, c.req.param('id'))).limit(1)
  if (!issue) return c.json(err('no such sankhya'), 404)
  if (issue.status === 'published') return c.json(err('unpublish first'), 400)
  // Its accepted pieces go back to the parking lot, not into limbo.
  await db
    .update(schema.umaArticle)
    .set({ status: 'held', issueId: null, updatedAt: new Date() })
    .where(eq(schema.umaArticle.issueId, issue.id))
  await db.delete(schema.umaIssue).where(eq(schema.umaIssue.id, issue.id))
  return c.json(ok({ id: issue.id }))
})

// — media —

umaDeskRoutes.post('/media', async (c) => {
  if (!c.env.FILES)
    return c.json(
      err('Image uploads are switched off — R2 storage is not enabled yet. Ask a dev to add the picture to the site instead.'),
      503,
    )
  const name = c.req.query('name') ?? ''
  const ext = name.toLowerCase().split('.').pop() ?? ''
  const contentType = MEDIA_TYPES[ext]
  if (!contentType) return c.json(err(`unsupported image type ".${ext}" — use jpg/png/webp/gif/avif/svg`), 400)
  const declared = Number(c.req.header('content-length') ?? 0)
  if (declared > MEDIA_MAX_BYTES) return c.json(err('image too large (8 MB max) — resize before uploading'), 413)
  const bytes = await c.req.arrayBuffer()
  if (bytes.byteLength === 0) return c.json(err('empty upload'), 400)
  if (bytes.byteLength > MEDIA_MAX_BYTES) return c.json(err('image too large (8 MB max) — resize before uploading'), 413)
  const key = `${crypto.randomUUID()}.${ext === 'jpeg' ? 'jpg' : ext}`
  await c.env.FILES.put(`uma/${key}`, bytes, { httpMetadata: { contentType } })
  return c.json(ok({ url: `/api/public/uma/media/${key}` }))
})

// — the masthead (admins only — assigning editors is a membership act) —

umaDeskRoutes.put('/roles', async (c) => {
  const me = c.get('me')
  if (me.role !== 'admin') return c.json(err('admins assign the masthead'), 403)
  const body = (await c.req.json()) as { personId: string; role: UmaRole | null }
  if (!body.personId) return c.json(err('personId required'), 400)
  if (body.role != null && body.role !== 'chief_editor' && body.role !== 'editor')
    return c.json(err('role must be chief_editor, editor or null'), 400)
  const db = drizzle(c.env.DB, { schema })
  const [p] = await db.select().from(schema.person).where(eq(schema.person.id, body.personId)).limit(1)
  if (!p) return c.json(err('no such person'), 404)
  if (body.role != null) {
    if (!p.isActive || p.tier !== 'core') return c.json(err('masthead seats are for active core members'), 400)
    if (body.role === 'chief_editor') {
      // one chair: the outgoing chief steps down automatically
      await db
        .update(schema.person)
        .set({ umaRole: null })
        .where(eq(schema.person.umaRole, 'chief_editor'))
    } else {
      const editors = await db
        .select({ id: schema.person.id })
        .from(schema.person)
        .where(eq(schema.person.umaRole, 'editor'))
      if (editors.filter((e) => e.id !== p.id).length >= UMA_MAX_EDITORS)
        return c.json(err(`the masthead seats ${UMA_MAX_EDITORS} editors — clear one first`), 400)
    }
  }
  await db.update(schema.person).set({ umaRole: body.role }).where(eq(schema.person.id, p.id))
  return c.json(ok({ personId: p.id, role: body.role }))
})
