# Content & SEO

How content gets published, and how every public URL gets its own title,
description and WhatsApp/Google preview. Two content models exist: **docs-as-
code** (live — the Durga Puja book) and **Drive drop-zone** (built server-side
but dormant — see the note at the end).

## 1. Docs-as-code: the Durga Puja book (and Pujo Sankhya later)

Content is markdown checked into the repo. **Edit → commit → push =
published.** CI rebuilds on every push to `main`; each chapter becomes its own
lazy-loaded chunk, and the prerenderer writes real HTML per page for search
engines and preview bots. No CMS, no database; `git log` is the edit history
and a bad edit is a `git revert` away.

| What | Where | URL |
| --- | --- | --- |
| Book chapters | `web/src/content/durga-puja/*.md` | `/durga-puja` and `/durga-puja/<slug>` |
| Content images | `web/public/bookdurgapuja/` | `https://pujosamiti.github.io/bookdurgapuja/<file>` |
| Pujo Sankhya (future) | own folder + routes on the same machinery | planned |

### Filenames decide order and URL

`NN-some-slug.md` → chapter `NN`, URL `/durga-puja/some-slug`.
`00-index.md` is the book's front page at `/durga-puja`. Prev/next follow the
`NN` numbering. **Renaming a file changes its URL** — old WhatsApp shares
break, so treat published slugs as permanent.

### Frontmatter

```yaml
---
title: "Maha Ashtami"          # required — page <title> + og:title; the site
                               #   suffix "Magarpatta City Pune" is auto-appended
bengali: "মহাষ্টমী"              # optional — Bengali-script title
order: 9                       # required — keep in sync with the filename NN
when: "Eighth tithi of Devi Paksha"   # optional — subtitle material
oneLiner: "…140–160 chars…"    # required — meta description + og:description;
                               #   this is the text under the link in Google/WhatsApp
image: ashtami.webp            # optional — share image; falls back to /og.webp
author: "…"                    # optional for the book; required for magazine
---
```

The chapter header (title, bengali, when, author, hero image) renders **from
frontmatter** — start the body at `##` level, don't repeat an `# H1`. The
parser (`web/src/lib/markdown.ts → parseFrontmatter`) handles flat
`key: value` only — no nested YAML, no lists; quote values containing `:`
or `—`.

### Images

Copy to `web/public/bookdurgapuja/`; reference by bare filename in
frontmatter (or a full `https://` URL, used as-is). The image becomes
`og:image` in **both** layers (client tags + prerendered HTML) — that's what
makes WhatsApp show a rich card. Specs: 1200×630 (or ≥3:2, subject centred —
WhatsApp crops square-ish), WebP, under ~300 KB. In-body images are normal
markdown: `![alt](/bookdurgapuja/file.webp)`.

Three app pages carry share cards of their own, set in the page's `<Seo>` (with
`bareTitle`) and in its `scripts/prerender.mjs` entry, kept word for word
alike: `/uma` (`uma-share.webp`, 782 × 782), the bhog headcount link
`/bhog/count` (`bhog-share-v2.webp`, 1200 × 790, 90 KB — a bhog thali on a
banana leaf; the link stays noindex and out of the sitemap), and the cultural
evening's flyer `/cultural/flyer/01` (`cultural-evenings-card-2026-v2.webp`,
1200 × 630, 92 KB — the print card's own art, Maa in the chakra beside
"Cultural Evenings", drawn by `npx tsx --tsconfig web/tsconfig.app.json
scripts/cultural-share-card.mts`; v1 was "Evening Itineraries"; public, no
sign-in, noindex and out of the sitemap; a cultural admin shares it from
/cultural → Share link).
Since 2 Oct 2026 the page *is* a print card, one-sided, the size of the
invitation card's pages (1360 × 1800, 4.53 × 6 in at 300 dpi), drawn the same
way (`components/CardArt.tsx` art on a canvas, words as canvas text,
`lib/useCardPages.ts`): all jaba red, white rice-paste alpona in the layered
frame (outer rule, temple band with tara corner blocks, a line of dots, a
quarter mandala in each corner), Maa (Souvik Laha's photograph, Pexels,
`web/public/cultural/durga-2026-flyer.webp`) in a chakra between two dhak,
each evening in a card bordered by the leaf band under its day's motif, Warli
dancers hand in hand between two dhakis at the foot, every line through the
rice-paste filter. At the bottom: Download PNG (1× or 2×, 600 dpi at 2×) and
Print (the 2× image at its true size, centred on the paper). Every word comes
from `web/src/lib/culturalEvening.ts`; the image's alt text carries all of it.
A new year's flyer gets new file names. Keep share
images under 100 KB: WhatsApp showed no preview for this one at 113 KB,
though Facebook did. A replaced image gets a new file name, since WhatsApp
caches previews by URL.

A fourth is the year's **invitation card**, `/invitation` (`invitation-card-2026.webp`,
1200 × 630, 92 KB — Maa in the alpona chakra beside শুভ শারদীয়া, the dates
and the venue, Warli dhakis below; public, no sign-in, noindex, out of the
sitemap, shared from its own page → Share link). Its words live in
`INVITATION` in `web/src/lib/invitationCard.ts`, matched by the `/invitation`
entry in `prerender.mjs`; the share image is drawn from the card's own art by
`npx tsx --tsconfig web/tsconfig.app.json scripts/invitation-share-card.mts`
(headless Chrome + `cwebp -size`, so it lands under 100 KB by itself — the
shared part is `scripts/lib/share-card.mts`). The
page is the card: a folded greetings card of four pages, each 1360 × 1800 like
the 2024 card (34 : 45, 4.53 × 6 in at 300 dpi) — the cover (Joydeb Biswas's
photograph of Maa, Pexels, in the chakra between two dhak), the nirghanto
across the two inside pages, the back (the welcome, a Warli ring round the
samiti's mark, Kojagari Lakshmi Puja, the cultural evenings). Each page is SVG
art (`components/CardArt.tsx`, `components/Warli.tsx`, Maa's face traced to a
vector in `components/durgaFace.ts`) painted on a canvas with the words as
canvas text (`lib/cardCanvas.ts`), and downloads as PNG at 1× or 2× (2720 ×
3600, tagged 600 dpi so it prints at the same 4.53 × 6 in) — one page at a time
(`01-…` to `04-…`) or as the two printed sheets, outside (back · cover) `05-…`
and inside `06-…`. The timings are the public nirghanto's own, read live: a correction in
the workspace reaches the card. The inside pages split the days where the two
come out most even and shrink their type together until both fit. Each year:
the photograph, the words in `CARD`/`INVITATION`, the year in the share
image's name (and its prerender entry), then rerun the script.

### Linking and markdown features

Link siblings by filename — `[Mahalaya](04-mahalaya.md)` → `/durga-puja/
mahalaya`; `00-index.md` → `/durga-puja`. External links open in new tabs.
Renderer is `web/src/components/MarkdownArticle.tsx` (GFM): tables work and
scroll horizontally on phones; blockquotes get the shiuli left border (the
book's mantra convention: Devanagari → Bengali → *roman* → "**In simple
words:**" gloss); Bengali/Devanagari needs no special handling; **no raw
HTML**.

### Publish checklist

1. Edit/add `web/src/content/durga-puja/NN-slug.md`.
2. Image → `web/public/bookdurgapuja/`, set `image:`.
3. Optional check: `npm run build -w web` — one `prerendered /durga-puja/…`
   line per page must include yours (and `dist/sitemap.xml` updates).
4. Commit, push. CI deploys page + tags + prerendered HTML + sitemap together.

## 2. SEO: the two layers

| Audience | Executes JS? | Sees | Answer |
| --- | --- | --- | --- |
| Browsers, Google | yes | React-rendered tags per route | **Layer 1**: the `<Seo>` component (`web/src/components/Seo.tsx`) — React 19 hoists `<title>`/`<meta>` into `<head>`, no library |
| WhatsApp/Facebook/X/LinkedIn bots | **no** | only raw server HTML | **Layer 2**: build-time prerendering — real HTML per book page |

GitHub Pages serves the same `index.html` for every route, and deep links go
through the `404.html` SPA fallback (**HTTP 404 status**). So un-prerendered
routes show site-default previews and a 404 status to crawlers; Layer 1 alone
is fine for routes people don't deep-share, Layer 2 is what the book needs —
its links live on WhatsApp.
(Prerendered pages set `og:*` and, since 26 Sep 2026, the matching
`twitter:title` / `twitter:description` / `twitter:image` too — before that
X showed every page with the home page's title. A route may also give
`imageWidth`, `imageHeight`, `imageType` and `imageAlt` for its card.) (The Uma magazine was prerendered the same way
until it was archived on 26 Sep 2026; `/uma` is now one static page.) Full recipe and history:
the archived `seotags.md` (git history, or locally `docs/tmp/docs-v1/`).

**Addresses and the sitemap (26–27 Sep 2026).** Every prerendered route is a
folder (`uma/index.html`), so GitHub Pages answers `/uma` with a **301 to
`/uma/`**. Canonical, `og:url` and the sitemap therefore name the served
address with its trailing slash (`servedUrl` in both `prerender.mjs` and
`Seo.tsx`) — naming `/uma` made the canonical point at a redirect, a mixed
signal search engines skip. **The app's own links use the slashed address
too** (27 Sep 2026) — the header and tab bar, Home, the guide's chapter
links (`resolveLink` in `DurgaPuja.tsx` turns `05-anando-naru.md` into
`/durga-puja/anando-naru/`), prev/next, উমা's links into the guide, and
every members-area link — so a crawler following them never takes a 301
hop. `AppLayout` settles any address that arrives without the slash (a typed
URL, the dev server) onto the slashed one in place. New links: write the
slash (`/schedule/`, `` `/durga-puja/${slug}/` ``). `robots.txt` allows all
crawlers and names the sitemap.

**The sitemap (from 27 Sep 2026).** `sitemap.xml` lists every public page —
Home, Schedule, উমা, the Durga Puja guide and all 21 chapters (25) — and
nothing members-only. Each entry carries:

- `<lastmod>` — the last commit that touched the page's own source (the
  chapter's markdown; `Home.tsx`; `Schedule.tsx` and the pujo calendar;
  উমা's page and content), read with `git log` at build. CI checks out full
  history for this (`fetch-depth: 0` in `deploy-web.yml`); a shallow clone
  would stamp every page with today, and Google stops trusting a lastmod
  that always moves.
- `<changefreq>weekly</changefreq>` and a `<priority>` — Home 1.0, Schedule
  0.9, the guide's front page 0.8, উমা and the day-and-ritual chapters (1–12,
  21) 0.7, the mantra and fordo chapters 0.6. **Google ignores both**; Bing
  and others may read them.
- the page's picture as an `<image:image>` (image-sitemap extension).

`public/sitemap.xsl` makes the file a readable, branded table in a browser;
crawlers ignore it.

**The favicon Google shows** (next to results, and as the property's icon in
Search Console) must be square with a side that is a multiple of 48 px, and
crawlable. Every page links `/favicon.ico` (16/32/48), `favicon-48.png`,
`favicon-96.png` and `icon-192.png`, all cut from `icon-512.png` — the old
32 px `favicon.png` was too small to qualify, and `/favicon.ico`, where many
crawlers look first, did not exist. The Organization's `logo` in the JSON-LD
is `icon-512.png`. Google refreshes favicons on its own schedule — days to a
few weeks after a recrawl of the home page.

**Breadcrumbs** do not come from the sitemap: every public page below Home
carries a `BreadcrumbList` in its JSON-LD — "Home › Durga Puja, Explained ›
Maha Ashtami", "Home › Schedule", "Home › উমা · UMA" — which Google may show
above a result in place of the bare address. Google indexing also
needs the site verified in **Google Search Console** and the sitemap
submitted there (the owner's Google account — not something the code can do).

**What is indexed (audited 27 Sep 2026).** 25 public pages are indexed —
Home, Schedule, Uma, the Durga Puja guide's front page ("Durga Puja,
Explained", so it no longer shares the home page's title) and its 21
chapters. Every members-only route is prerendered **noindex** — including
Bhog, Procurement and its master list, which had no prerendered page and
gave crawlers following the Members Only cards a 404 — and Brand Colours,
which sits behind the sign-in (its `brand-identity.html` carries noindex
too). Private content is gated by the app and the API; noindex only keeps
the empty shells out of search. When adding a route: public → a prerender
entry with its own title and description; members-only → the noindex list.

**Structured data and the samiti's story (27 Sep 2026).** Every public,
indexable page — Home, Schedule, উমা and the Durga Puja guide with its
chapters — carries JSON-LD written by `prerender.mjs`: the samiti as an
`Organization` (its Bengali name and the names people search by — "Magarpatta
Durga Puja", "Durga Puja in Magarpatta City, Pune" — its founding in 2018 at
the Aditi Garden Amphitheatre, founders with their roles, volunteers,
Magarpatta City as its place) and the `WebSite`; the Schedule adds the
year's Durga Puja as an `Event` (Panchami → Dashami, from
`src/content/pujo-calendar.json`). Every page also describes itself — a
`WebPage`, or an `Article` for each of the guide's chapters (headline, image)
— as part of the website, with **Pradyumna Das Roy and Koyeli Roy as its
author and creator** (and the website's). The two are `Person` nodes of their
own, linked to their LinkedIn profiles through `sameAs` and referred to by
`@id` as founders, creators and authors, so search engines see one person
each; `authors` and each founder's `sameAs` live in `samiti.json`. (The
chapters show no author line on the page, so the markup names the site's
makers, not a byline it would contradict.) The same pages show the story in their
footer, folded under "Durga Puja, Magarpatta City, Pune" — Google asks that
structured data match what a page shows, and collapsed text counts as shown.
Both come from one file, `src/content/samiti.json`: change the story there
and the footer and the JSON-LD move together. Members-only routes carry
neither (`isPublicPath` in `SiteFooter.tsx` and the noindex list in
`prerender.mjs` must agree). Share previews are untouched: WhatsApp and
Facebook read `og:description`, which stays each page's own.

## 3. Other content on the site

- **Nirghanto / events / timetable**: rows in D1, edited through the admin
  UI (`/api/admin/events`, `/api/admin/timetable`) — [004](004-database.md) §2.
  The nirghanto method itself (Beni Madhab Shil panjika, Mumbai section
  recomputed for Pune) is domain knowledge, not code.
- **Accounting**: recorded directly in the D1 ledger by fin_admins
  ([009](009-auth-and-membership.md) §4).

## 4. The dormant Drive drop-zone

An earlier design had blogs/magazine articles dropped as markdown into a
Drive folder (named `blog--<event-id>--<slug>.md` / `magazine--<slug>.md`,
optional frontmatter) and served via `/api/public/posts` reading the folder
with the service account. The server side is fully built
(`api/src/routes/posts.ts`, `api/src/lib/google.ts`) but **no frontend calls
it and its prod secret (`CONTENT_DRIVE_FOLDER_ID`) is unset**. If Pujo
Sankhya ships as docs-as-code (the current direction), this path can be
removed; if the drop-zone wins, set the secret and build the UI. Decision
tracked in [013-known-gaps.md](013-known-gaps.md).
