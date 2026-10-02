// Post-build prerender: write real per-route HTML files into dist/ so that
// no-JS crawlers (WhatsApp/Facebook/Twitter previews) see each public route's
// own title/description/OG tags, and GitHub Pages serves 200s instead of the
// 404.html SPA fallback. The React app still hydrates and takes over.
//
// Add public routes here as they are born (Durga Puja book chapters, Pujo
// Sankhya articles) — see docs/seotags.md.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ORIGIN = 'https://pujosamiti.github.io'
const SITE = 'পুজো সমিতি · Magarpatta'

const TITLE_SUFFIX = 'Magarpatta City Pune'

/**
 * The address GitHub Pages actually serves a page at. Each prerendered route
 * is a folder (uma/index.html), so Pages answers /uma with a 301 to /uma/ —
 * canonical, og:url and the sitemap must name /uma/, or the canonical points
 * at a redirect and search engines skip the page. Keep in step with
 * servedUrl in web/src/components/Seo.tsx.
 */
const servedUrl = (path) => `${ORIGIN}${path === '/' ? '/' : path.replace(/\/?$/, '/')}`

// ── Structured data (JSON-LD) for the public pages ─────────────────────────
// Built from src/content/samiti.json — the same story the footer's collapsed
// "Durga Puja, Magarpatta City, Pune" shows on these pages, so the markup
// always matches the page (as Google asks). Members-only routes get none.
const contentRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content')
const samiti = JSON.parse(readFileSync(join(contentRoot, 'samiti.json'), 'utf8'))
const pujo = JSON.parse(readFileSync(join(contentRoot, 'pujo-calendar.json'), 'utf8'))
const ORG_ID = `${ORIGIN}/#samiti`
const MAGARPATTA = {
  '@type': 'Place',
  name: 'Magarpatta City, Pune',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Magarpatta City, Hadapsar',
    addressLocality: 'Pune',
    addressRegion: 'Maharashtra',
    addressCountry: 'IN',
  },
}
const person = (p) => ({
  '@type': 'Person',
  ...(p.id ? { '@id': `${ORIGIN}/#${p.id}` } : {}),
  name: p.name,
  ...(p.alternateName ? { alternateName: p.alternateName } : {}),
  ...(p.role ? { jobTitle: p.role } : {}),
  ...(p.sameAs ? { sameAs: p.sameAs } : {}),
})
// the founders with an id (and public profiles) are full nodes of their own,
// referred to by @id wherever they appear — founder, the site's creator, each
// page's author — so Google sees one person, not several
const namedPeople = samiti.founders.filter((f) => f.id).map((f) => ({ ...person(f), worksFor: { '@id': ORG_ID } }))
const ref = (id) => ({ '@id': `${ORIGIN}/#${id}` })
const AUTHORS = samiti.authors.map(ref)
const siteGraph = [
  {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: samiti.name,
    alternateName: [samiti.nameBn, ...samiti.alternateNames],
    url: `${ORIGIN}/`,
    logo: `${ORIGIN}/icon-512.png`,
    description: samiti.about,
    foundingDate: samiti.foundingYear,
    foundingLocation: { '@type': 'Place', name: samiti.foundingPlace },
    founder: samiti.founders.map((f) => (f.id ? ref(f.id) : person(f))),
    member: samiti.volunteers.map((name) => ({ '@type': 'Person', name })),
    location: MAGARPATTA,
    areaServed: MAGARPATTA,
  },
  {
    '@type': 'WebSite',
    '@id': `${ORIGIN}/#website`,
    url: `${ORIGIN}/`,
    name: 'Durga Puja Magarpatta City Pune',
    alternateName: samiti.nameBn,
    inLanguage: ['en', 'bn'],
    publisher: { '@id': ORG_ID },
    creator: AUTHORS,
    author: AUTHORS,
  },
  ...namedPeople,
]
/** The year's Durga Pujo as an Event — on the Schedule, which shows its days. */
const pujoEvent = {
  '@type': 'Event',
  '@id': `${ORIGIN}/schedule/#durga-puja-${pujo.year}`,
  name: `Durga Puja ${pujo.year} — Magarpatta City, Pune`,
  alternateName: `Durga Pujo ${pujo.year} in Magarpatta`,
  description: `Durga Pujo at Magarpatta City, Pune, from Panchami to Dashami, ${pujo.year} — the tithi-wise nirghanto, as confirmed by the purohit.`,
  startDate: pujo.from,
  endDate: pujo.to,
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  location: MAGARPATTA,
  organizer: { '@id': ORG_ID },
  image: `${ORIGIN}/og.webp`,
  url: servedUrl('/schedule'),
}
/**
 * The page itself: a WebPage (an Article for the Durga Puja book's chapters),
 * part of the website, authored and created by the samiti's authors. The
 * Schedule's page is about the year's pujo, its Event.
 */
const pageNode = (r) => {
  const chapter = r.path.startsWith('/durga-puja/')
  const url = servedUrl(r.path)
  return {
    '@type': chapter ? 'Article' : 'WebPage',
    '@id': `${url}#page`,
    url,
    ...(chapter ? { headline: r.title.replace(` ${TITLE_SUFFIX}`, '') } : { name: r.title }),
    description: r.description,
    inLanguage: ['en', 'bn'],
    isPartOf: { '@id': `${ORIGIN}/#website` },
    ...(chapter ? { mainEntityOfPage: url } : {}),
    ...(r.image ? { image: r.image } : {}),
    ...(r.path === '/schedule' ? { about: { '@id': pujoEvent['@id'] }, mainEntity: { '@id': pujoEvent['@id'] } } : {}),
    author: AUTHORS,
    creator: AUTHORS,
    publisher: { '@id': ORG_ID },
  }
}
/**
 * The trail Google may show above a result instead of the bare address:
 * Home › Durga Puja, Explained › Maha Ashtami. Every page below Home has one;
 * `crumbs` lists the pages between Home and this one.
 */
const breadcrumbNode = (r) => {
  const name = r.path === '/uma' ? 'উমা · UMA' : r.title.replace(` ${TITLE_SUFFIX}`, '')
  const trail = [['Home', '/'], ...(r.crumbs ?? []), [name, r.path]]
  return {
    '@type': 'BreadcrumbList',
    '@id': `${servedUrl(r.path)}#breadcrumb`,
    itemListElement: trail.map(([label, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: label,
      item: servedUrl(path),
    })),
  }
}
const jsonLdFor = (r) => {
  const page = pageNode(r)
  const crumbs = r.path === '/' ? [] : [breadcrumbNode(r)]
  if (crumbs.length) page.breadcrumb = { '@id': crumbs[0]['@id'] }
  return {
    '@context': 'https://schema.org',
    '@graph': [...siteGraph, page, ...crumbs, ...(r.path === '/schedule' ? [pujoEvent] : [])],
  }
}
const ldScript = (data) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`

const ROUTES = [
  // Members-only routes: prerendered so a shared link previews properly and a
  // direct visit skips the 404-fallback redirect — but never indexed. The app
  // still gates the content, and the API gates the data.
  ...[
    ['/membersonly', 'Members Only', 'The samiti members area — ledger, wallets, sponsorship and planning.'],
    ['/login', 'Member sign in', 'Sign in to the samiti members area.'],
    ['/profile', 'Profile', 'Your samiti profile.'],
    ['/tasks', 'Puja Planning', 'Durga Pujo task distribution for samiti members.'],
    ['/membership', 'Membership', 'Samiti membership register.'],
    ['/events', 'Events', 'The samiti events calendar.'],
    ['/nirghanto', 'Nirghanto workspace', 'Durga Pujo nirghanto workspace.'],
    ['/ledger', 'Ledger', 'Ledger — samiti accounts, for core members.'],
    ['/wallets', 'Wallets', 'Wallets — samiti accounts, for core members.'],
    ['/sponsorship', 'Sponsorship', 'Sponsorship — samiti accounts, for core members.'],
    ['/reimbursements', 'Reimbursements', 'Reimbursements — samiti accounts, for core members.'],
    // carded on Members Only too: without a prerendered page a crawler
    // following the card got a 404 (and a shared link, no preview)
    ['/bhog', 'Bhog & Food Menu', 'Bhog and food menus, and headcounts, for samiti members.'],
    ['/procurement', 'Procurement', 'Day-wise shopping lists and order sheets, for core members.'],
    ['/procurement/master', 'Procurement master list', 'The procurement item catalog, for core members.'],
    ['/cultural', 'Cultural Function', "The pujo's evening programmes, for samiti members."],
    // members-only behind the sign-in, so kept out of search like the rest
    ['/brandcolours', 'Brand Colours', 'The laal-paar shada visual identity of the Magarpatta pujo samiti — palette, logo variants, alpona rules and usage.'],
  ].map(([path, title, description]) => ({ path, title: `${title} ${TITLE_SUFFIX}`, description, noindex: true })),
  {
    path: '/schedule',
    title: `Durga Puja Timetable and Schedule ${TITLE_SUFFIX}`,
    description:
      'Nirghanto/Timetable/Schedule for Durga Pujo at Magarpatta City, Pune — tithi-wise puja timings from Shashthi to Dashami, as confirmed by the purohit.',
    sources: ['web/src/pages/Schedule.tsx', 'web/src/content/pujo-calendar.json'],
    priority: 0.9,
  },
]

// ── The bhog headcount link, /bhog/count/?c=… ─────────────────────────────
// Shared on WhatsApp, so it carries a card of its own: a bhog thali on a
// banana leaf, 1200 × 790 WebP, 90 KB — WhatsApp showed no image at 113 KB,
// so kept under 100 KB like uma-share.webp; renamed (v2) past WhatsApp's cache. No sign-in, but kept out of search and the sitemap like the
// members' pages. Title and description match the page's <Seo> in BhogCount.tsx.
ROUTES.push({
  path: '/bhog/count',
  title: 'Durga Pujo bhog · Give your household’s headcount',
  description:
    'Find your household and tell the samiti how many will eat bhog each day, Saptami to Dashami — everyone aged 5 and above. Each day’s count closes four days before it. Magarpatta Pujo Samiti.',
  image: `${ORIGIN}/bhog-share-v2.webp`,
  imageWidth: 1200,
  imageHeight: 790,
  imageType: 'image/webp',
  imageAlt: 'Bengali bhog on a banana leaf — khichuri, labra, beguni, papad, chutney and payesh, with marigolds, on a red alpona cloth',
  noindex: true,
})

// ── The cultural evening's flyer, /cultural/flyer/01 ─────────────────────
// For an open audience, no sign-in: a cultural admin shares it on WhatsApp and
// Facebook from /cultural. Its card is the print card's own art — Maa in the
// chakra beside "Cultural Evenings", the run of evenings, the venue, Warli
// dancers — 1200 × 630 WebP, 92 KB (under WhatsApp's ~100 KB), drawn by
// scripts/cultural-share-card.mts; v2, as WhatsApp caches the first by its
// URL. Kept out of search and the sitemap
// like the bhog link. Title and description match web/src/lib/culturalEvening.ts.
const culturalEvening = {
  title: 'Durga Pujo Cultural Evenings · Magarpatta City',
  description:
    'Shashthi to Ashtami Day 2, 16–19 October · Amphitheatre, Aditi Garden · 6:30 pm onwards. Musical Quiz, Chandalika dance drama and a live performance by Shreya Verma — all Magarpatta citizens and Cybercity families welcome.',
  image: `${ORIGIN}/cultural-evenings-card-2026-v2.webp`,
  imageWidth: 1200,
  imageHeight: 630,
  imageType: 'image/webp',
  imageAlt: 'The Magarpatta City Durga Pujo Cultural Evenings card — Maa Durga in a white alpona chakra on red; Shashthi to Ashtami, 16–19 October; Musical Quiz, Chandalika, Shreya Verma live; Amphitheatre, Aditi Garden, 6:30 pm onwards; Warli dancers',
  noindex: true,
}
ROUTES.push({ path: '/cultural/flyer/01', ...culturalEvening })

// ── The year's invitation card, /invitation ───────────────────────────────
// Shared on WhatsApp and Facebook, so it carries its own card: Maa in the
// alpona chakra beside the year, the dates and the venue, Warli dhakis below —
// 1200 × 630 WebP, 92 KB (under WhatsApp's ~100 KB), drawn by
// scripts/invitation-share-card.mts. No sign-in, but kept out of search and
// the sitemap like the flyer. Title, description and image match INVITATION
// in web/src/lib/invitationCard.ts — keep the two in step.
ROUTES.push({
  path: '/invitation',
  title: 'Shri Shri Durga Puja 2026 · Invitation · Magarpatta City',
  description:
    'Shashthi to Bijaya Dashami, 16–21 October 2026, at the Amphitheatre, Aditi Garden, Magarpatta City, Pune. The samiti’s invitation card with the full nirghanto — every puja timing, day by day. All Magarpatta citizens and Cybercity families welcome.',
  image: `${ORIGIN}/invitation-card-2026.webp`,
  imageWidth: 1200,
  imageHeight: 630,
  imageType: 'image/webp',
  imageAlt: "The Magarpatta City Durga Puja 2026 invitation — Maa Durga in a white alpona chakra on red, শুভ শারদীয়া, 16–21 October 2026, Amphitheatre, Aditi Garden, with Warli dhakis and dhunuchi dancers",
  noindex: true,
})

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
      // unquote a value only when it is wrapped in matching quotes — a line that
      // merely ends in a quotation ("come again next year.") keeps its mark
      if (kv) {
        const v = kv[2].trim()
        meta[kv[1]] = /^(["']).*\1$/.test(v) ? v.slice(1, -1) : v
      }
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
    // the guide's front page is "Durga Puja, Explained" — "Durga Puja" alone
    // duplicated the home page's title
    title: `${isIndex ? 'Durga Puja, Explained' : meta.title} ${TITLE_SUFFIX}`,
    description: meta.oneLiner || meta.title || 'Bengali Durga Puja, explained properly.',
    image: meta.image ? (meta.image.startsWith('http') ? meta.image : `${ORIGIN}/bookdurgapuja/${meta.image}`) : undefined,
    // sitemap: the chapter's own file dates it; the days and rituals (1–12,
    // 21) rank above the reference chapters of mantras and the fordo
    sources: [`web/src/content/durga-puja/${file}`],
    priority: isIndex ? 0.8 : Number(m[1]) <= 12 || Number(m[1]) === 21 ? 0.7 : 0.6,
    crumbs: isIndex ? [] : [['Durga Puja, Explained', '/durga-puja']],
  })
}

// ── Uma: the daily quiz and puzzle — one static page ───────────────────────
// (Until 26 Sep 2026 this fetched the magazine's article routes from the
// Worker; the magazine is archived and its old URLs redirect to /uma.)
// The share card (WhatsApp, Facebook, X): a shuffled puzzle of Maa's face,
// 782 × 782 WebP, ~100 KB — WhatsApp drops preview images much over 300 KB.
ROUTES.push({
  path: '/uma',
  // the share card's own title, without the site suffix
  title: 'UMA · A Durga Pujo puzzle and quiz, every day',
  description:
    "Slide Maa Durga's face back together and answer one question about the pujo, in Bengali/English — new every morning till Dashami, with a badge and a prayer for every win. From the Magarpatta Pujo Samiti.",
  image: `${ORIGIN}/uma-share.webp`,
  imageWidth: 782,
  imageHeight: 782,
  imageType: 'image/webp',
  imageAlt: "A shuffled 3 × 3 sliding puzzle of Maa Durga's face",
  sources: ['web/src/pages/Uma.tsx', 'web/src/content/uma-quiz.ts', 'web/src/content/uma-puzzles.ts'],
  priority: 0.7,
})

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
  // X/Twitter reads its own title and description; keep them in step with og:
  html = html.replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${esc(r.title)}" />`)
  html = html.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/s,
    `<meta name="twitter:description" content="${esc(r.description)}" />`,
  )
  html = html.replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${servedUrl(r.path)}" />`)
  html = html.replace(
    /<meta name="robots" content="[^"]*" \/>/,
    `<meta name="robots" content="${r.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}" />`,
  )
  if (r.image) {
    html = html.replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${esc(r.image)}" />`)
    html = html.replace(/<meta name="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${esc(r.image)}" />`)
  }
  // size, type and alt let WhatsApp and Facebook render the card on first share
  if (r.image && r.imageWidth) {
    const extra = [
      `<meta property="og:image:width" content="${r.imageWidth}" />`,
      `<meta property="og:image:height" content="${r.imageHeight}" />`,
      r.imageType && `<meta property="og:image:type" content="${r.imageType}" />`,
      r.imageAlt && `<meta property="og:image:alt" content="${esc(r.imageAlt)}" />`,
      r.imageAlt && `<meta name="twitter:image:alt" content="${esc(r.imageAlt)}" />`,
    ].filter(Boolean).join('')
    html = html.replace('</head>', `${extra}</head>`)
  }
  html = html.replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${servedUrl(r.path)}" />`)
  if (r.type === 'article') html = html.replace(/<meta property="og:type" content="[^"]*" \/>/, `<meta property="og:type" content="article" />`)
  // the public, indexable pages carry the samiti's structured data
  if (!r.noindex) html = html.replace('</head>', `${ldScript(jsonLdFor(r))}</head>`)
  const out = join(dist, ...r.path.split('/').filter(Boolean), 'index.html')
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, html)
  console.log('prerendered', r.path, '->', out)
}

// the home page is the build's own index.html (the template above): give it
// the structured data too
const homeRoute = {
  path: '/',
  title: template.match(/<title>([^<]*)<\/title>/)[1],
  description: template.match(/<meta\s+name="description"\s+content="([^"]*)"/s)[1].replace(/\s+/g, ' ').trim(),
  image: `${ORIGIN}/og.webp`,
  sources: ['web/src/pages/Home.tsx', 'web/index.html'],
  priority: 1.0,
}
writeFileSync(join(dist, 'index.html'), template.replace('</head>', `${ldScript(jsonLdFor(homeRoute))}</head>`))
console.log('structured data -> /')

// ── sitemap.xml: every public page ─────────────────────────────────────────
// Home, Schedule, উমা, the Durga Puja guide and every chapter, at the
// addresses Pages serves them. <lastmod> is the last commit that touched the
// page's own source (git log — CI checks out full history for it), so it only
// moves when the page does; Google trusts lastmod only while it stays honest.
// <changefreq> and <priority> are for the other search engines — Google
// ignores both. Each page's picture rides along as an image-sitemap entry. The
// XSL turns the file into a readable page in a browser; crawlers ignore it.
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const today = new Date().toISOString().slice(0, 10)
const lastmod = (files = []) => {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', ...files], { cwd: repoRoot, encoding: 'utf8' }).trim()
    return out || today
  } catch {
    return today
  }
}
const xmlEsc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const inSitemap = [homeRoute, ...ROUTES.filter((r) => !r.noindex)].sort((a, b) => (b.priority ?? 0.5) - (a.priority ?? 0.5))
const entry = (r) =>
  [
    '  <url>',
    `    <loc>${xmlEsc(servedUrl(r.path))}</loc>`,
    `    <lastmod>${lastmod(r.sources)}</lastmod>`,
    '    <changefreq>weekly</changefreq>',
    `    <priority>${(r.priority ?? 0.5).toFixed(1)}</priority>`,
    ...(r.image
      ? [
          '    <image:image>',
          `      <image:loc>${xmlEsc(r.image)}</image:loc>`,
          '    </image:image>',
        ]
      : []),
    '  </url>',
  ].join('\n')
writeFileSync(
  join(dist, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n' +
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
    inSitemap.map(entry).join('\n') +
    '\n</urlset>\n',
)
writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${ORIGIN}/sitemap.xml\n`)
console.log(`sitemap.xml (${inSitemap.length} pages) + robots.txt written`)
