// Post-build prerender: write real per-route HTML files into dist/ so that
// no-JS crawlers (WhatsApp/Facebook/Twitter previews) see each public route's
// own title/description/OG tags, and GitHub Pages serves 200s instead of the
// 404.html SPA fallback. The React app still hydrates and takes over.
//
// Add public routes here as they are born (Durga Puja book chapters, Pujo
// Sankhya articles) — see docs/seotags.md.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ORIGIN = 'https://pujosamiti.github.io'
const SITE = 'পুজো সমিতি · Magarpatta'

const TITLE_SUFFIX = 'Magarpatta City Pune'

const ROUTES = [
  {
    path: '/schedule',
    title: `Durga Puja Timetable and Schedule ${TITLE_SUFFIX}`,
    description:
      'Nirghanto/Timetable/Schedule for Durga Pujo at Magarpatta City, Pune — tithi-wise puja timings from Shashthi to Dashami, as confirmed by the purohit.',
  },
]

// ── The Durga Puja book: one route per markdown chapter ─────────────────────
// Frontmatter drives the tags: title (+suffix), oneLiner → description,
// image → og:image (bare filenames resolve to /bookdurgapuja/<name>).
const contentDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content', 'durga-puja')
const fm = (raw) => {
  const m = raw.match(/^---\n([\s\S]*?)\n---/)
  const meta = {}
  if (m)
    for (const line of m[1].split('\n')) {
      const kv = line.match(/^(\w+):\s*(.*)$/)
      if (kv) meta[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '')
    }
  return meta
}
for (const file of readdirSync(contentDir).filter((f) => f.endsWith('.md')).sort()) {
  const meta = fm(readFileSync(join(contentDir, file), 'utf8'))
  const m = file.match(/^(\d+)-(.*)\.md$/)
  if (!m) continue
  const isIndex = Number(m[1]) === 0
  ROUTES.push({
    path: isIndex ? '/durga-puja' : `/durga-puja/${m[2]}`,
    title: `${isIndex ? 'Durga Puja' : meta.title} ${TITLE_SUFFIX}`,
    description: meta.oneLiner || meta.title || 'Bengali Durga Puja, explained properly.',
    image: meta.image ? (meta.image.startsWith('http') ? meta.image : `${ORIGIN}/bookdurgapuja/${meta.image}`) : undefined,
  })
}

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const template = readFileSync(join(dist, 'index.html'), 'utf8')

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

for (const r of ROUTES) {
  let html = template
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(r.title)}</title>`)
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/>/s,
    `<meta name="description" content="${esc(r.description)}" />`,
  )
  html = html.replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${esc(r.title)}" />`)
  html = html.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/s,
    `<meta property="og:description" content="${esc(r.description)}" />`,
  )
  html = html.replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${ORIGIN}${r.path}" />`)
  if (r.image) html = html.replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${esc(r.image)}" />`)
  html = html.replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${ORIGIN}${r.path}" />`)
  const out = join(dist, ...r.path.split('/').filter(Boolean), 'index.html')
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, html)
  console.log('prerendered', r.path, '->', out)
}

// sitemap for the public routes
const urls = ['/', ...ROUTES.map((r) => r.path)]
writeFileSync(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${ORIGIN}${u}</loc></url>`).join('\n') +
    `\n</urlset>\n`,
)
writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${ORIGIN}/sitemap.xml\n`)
console.log('sitemap.xml + robots.txt written')
