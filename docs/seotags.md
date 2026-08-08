# Per-page SEO tags in the pujosamiti SPA

How every public URL gets its own title, description and share-preview tags —
what exists today, and the recipe for the Durga Puja mini book and, later,
Pujo Sankhya articles.

## The two layers (read this first)

A React SPA has **two audiences** for SEO tags, and they need different
plumbing:

| Audience | Executes JS? | What it sees | Our answer |
|---|---|---|---|
| Browsers, Google | yes | tags rendered by React per route | **Layer 1: the `<Seo>` component** (done) |
| WhatsApp, Facebook, Twitter/X, LinkedIn preview bots | **no** | only the raw HTML the server sends | **Layer 2: build-time prerendering** (recipe below — required for the book) |

Today, GitHub Pages serves the same `index.html` for every route — and deep
links actually go through the `404.html` SPA fallback, returning **HTTP 404
status**. So until a route is prerendered, its WhatsApp preview shows the
site-wide defaults, and Google sees a 404 status. Layer 1 alone is enough for
routes people don't deep-share; Layer 2 is what the book and magazine need,
because those links live on WhatsApp.

## Layer 1 — the `<Seo>` component (implemented)

React 19 hoists `<title>`, `<meta>` and `<link>` rendered anywhere in the
tree into `<head>`, replacing the static defaults from `index.html`. No
library needed. The wrapper lives at `web/src/components/Seo.tsx`:

```tsx
<Seo
  title="দুর্গাপূজা"                     // site name auto-appended
  description="…150–160 chars…"
  path="/"                              // canonical + og:url
  image="https://…/cover.webp"          // optional; defaults to /og.webp
  type="article"                        // "website" (default) | "article"
/>
```

In use on `Home.tsx` and `Schedule.tsx`. Rules of thumb:

- **Every public route** renders exactly one `<Seo>` at the top of its tree.
- **Canonical is the clean path** — never include query params (`/schedule`,
  not `/schedule?event=…`), or Google sees N duplicate pages.
- **Descriptions**: 150–160 characters, written for a human deciding whether
  to tap.
- **Members-only routes get no `<Seo>`** — they should also emit
  `<meta name="robots" content="noindex" />` if we ever prerender near them.
- The static defaults in `web/index.html` (og:image = `/og.webp`, site
  title/description) are the fallback every non-prerendered URL shows in link
  previews. Keep them good.

## Layer 2 — prerendering public routes (the recipe)

Goal: real HTML files in `dist/` for each public URL, so GitHub Pages serves
**200 status + correct tags in raw HTML**, with the React app hydrating on
top. This is a post-build script, not a framework change.

Sketch (a ~60-line `web/scripts/prerender.mjs` run after `vite build`):

1. Define the route list: `/`, `/schedule`, `/durga-puja`, plus one entry per
   book chapter (from the markdown files' frontmatter — see below).
2. For each route, read `dist/index.html`, replace the `<title>` and the
   `og:*`/`description`/`canonical` block with that route's values, and write
   it to `dist/<route>/index.html`.
3. Emit `dist/sitemap.xml` from the same list, and a `robots.txt` pointing at
   it.

That's the minimum that fixes WhatsApp previews and 404-status: the *tags*
are per-URL even though the *body* still renders client-side. (A fuller
variant also injects the chapter's rendered HTML into `<div id="root">` for
true content SEO — worth doing for the book since the markdown is static; use
`marked` or `remark` in the script. Hydration mismatch is avoided by having
React render the same content from the same markdown.)

GitHub Pages serves `dist/<route>/index.html` for `GET /<route>/` natively —
those URLs stop needing the `404.html` hack entirely. Keep the hack for the
remaining SPA-only routes.

## The Durga Puja mini book (`docs/about-puja-v3` → `/durga-puja/…`)

The book was built for this. Every chapter has uniform frontmatter:

```yaml
title: "Maha Ashtami"          # → <title> and og:title
bengali: "মহাষ্টমী"              # → can join the title: "Maha Ashtami · মহাষ্টমী"
order: 9                        # → prev/next navigation, sitemap order
when: "…"                       # → good subtitle material
oneLiner: "…"                   # → meta description + og:description, ready-made
```

Recipe when we build the page:

1. **URLs**: `/durga-puja/` (index) and `/durga-puja/<slug>/` per chapter —
   slug from the filename (`09-ashtami.md` → `ashtami`). Clean, shareable,
   one canonical each.
2. **Tags per chapter** from frontmatter: title = `title` (+ `bengali`),
   description = `oneLiner`, `type="article"`, canonical =
   `/durga-puja/<slug>/`.
3. **og:image**: one book cover at minimum (`/durga-puja-og.webp`); ideally a
   small set (a murti image for the murti chapter, a diya image for the
   mantra shelf) — WhatsApp previews with the right image get tapped.
4. **Prerender all chapters** (Layer 2). The markdown is static content in
   the repo — this is the textbook case for full-content prerendering, not
   just tag injection.
5. **Structured data**: each chapter can carry a JSON-LD `Article` block
   (headline, inLanguage `en` + `bn` terms, isPartOf the book) — cheap to add
   in the prerender script.
6. **Cross-links**: the chapters already link each other relatively
   (`(04-mahalaya.md)`) — the page renderer maps those to `/durga-puja/<slug>/`.

## Pujo Sankhya (the magazine, later)

Same machinery, one addition: articles have **authors and dates**, which SEO
and previews care about.

- Frontmatter to standardize when we design it: `title`, `bengali`, `author`,
  `publishedOn`, `excerpt` (the description), `cover` (per-article og:image),
  `issue` (e.g. "Sharad 1433").
- URLs: `/pujo-sankhya/<issue-slug>/<article-slug>/`; an issue index page per
  year.
- JSON-LD `Article` with `author` and `datePublished`; og:type `article` with
  `article:published_time` and `article:author`.
- Per-article cover image is worth insisting on editorially — magazine links
  on WhatsApp live or die by the preview card.
- The shared `PostType`/`PostSummary`/`Post` types in `shared/src/index.ts`
  already anticipate this shape.

## One more thing worth doing eventually

A **custom domain** (e.g. pujosamiti.org) helps every layer at once: stable
canonical origin, better link trust, and it unlocks first-party cookies for
the API on Safari. The `ORIGIN` constant in `Seo.tsx` and the prerender
script are the only places the origin lives.
