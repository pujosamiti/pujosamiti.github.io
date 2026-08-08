// Post-build prerender: write real per-route HTML files into dist/ so that
// no-JS crawlers (WhatsApp/Facebook/Twitter previews) see each public route's
// own title/description/OG tags, and GitHub Pages serves 200s instead of the
// 404.html SPA fallback. The React app still hydrates and takes over.
//
// Add public routes here as they are born (Durga Puja book chapters, Pujo
// Sankhya articles) — see docs/seotags.md.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ORIGIN = 'https://pujosamiti.github.io'
const SITE = 'পুজো সমিতি · Magarpatta'

const ROUTES = [
  {
    path: '/schedule',
    title: 'Durga Puja Timetable and Schedule Magarpatta City Pune',
    description:
      'Nirghanto/Timetable/Schedule for Durga Pujo at Magarpatta City, Pune — tithi-wise puja timings from Shashthi to Dashami, as confirmed by the purohit.',
  },
]

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
  html = html.replace('</head>', `<link rel="canonical" href="${ORIGIN}${r.path}" />\n</head>`)
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
