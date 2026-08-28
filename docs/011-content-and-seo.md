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
is fine for routes people don't deep-share, Layer 2 is what the book and
magazine need — their links live on WhatsApp. Full recipe and history:
the archived `seotags.md` (git history, or locally `docs/tmp/docs-v1/`).

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
