# Content authoring guide

How to write, edit and publish content on the site — the Durga Puja book
today, Pujo Sankhya articles on the same machinery later.

## The model: docs-as-code

Content is markdown checked into the repo. **Edit → commit → push =
published.** CI rebuilds the site on every push to `main`; the markdown is
compiled into the site at build time (each chapter becomes its own
lazy-loaded chunk, and the prerenderer writes real HTML per page for
search engines and WhatsApp previews).

There is no CMS, no database — `git log` is the edit history, and a bad edit
is a `git revert` away.

## Where content lives

| Section | Folder | URL |
|---|---|---|
| Durga Puja book | `web/src/content/durga-puja/*.md` | `/durga-puja` and `/durga-puja/<slug>` |
| Content images | `web/public/book/` | `https://pujosamiti.github.io/book/<filename>` |
| Pujo Sankhya (future) | `web/src/content/pujo-sankhya/…` (planned) | `/pujo-sankhya/…` (planned) |

## Filenames decide order and URL

`NN-some-slug.md` → chapter number `NN`, URL `/durga-puja/some-slug`.

- `09-ashtami.md` → chapter 9, `/durga-puja/ashtami`
- `00-index.md` is special: it renders at `/durga-puja` as the book's front
  page / table of contents.
- Prev/next buttons follow the `NN` numbering, so renumbering files reorders
  the book. **Renaming a file changes its URL** — old links (and WhatsApp
  shares) break, so treat published slugs as permanent.

## Frontmatter reference

Every file starts with a YAML block:

```yaml
---
title: "Maha Ashtami"
bengali: "মহাষ্টমী"
order: 9
when: "Eighth tithi of Devi Paksha — the festival's summit"
oneLiner: "The summit of the pujo: anjali on an empty stomach, a young girl worshipped as the goddess, and the knife-edge forty-eight minutes of Sandhi Puja."
image: ashtami.webp
author: "Pradyumna Das Roy"
---
```

| Key | Required | Used for |
|---|---|---|
| `title` | yes | The page `<title>` and `og:title`. The site suffix **"Magarpatta City Pune" is appended automatically** — write only the page's own part. |
| `bengali` | no | The Bengali-script title; available to the page renderer. |
| `order` | yes | Should match the filename's `NN` (the filename is what actually drives navigation; keep them in sync). |
| `when` | no | A one-phrase "when this happens" — subtitle material. |
| `oneLiner` | yes | The meta description and `og:description` — this is the text under the link in Google and in WhatsApp preview cards. Aim for 140–160 characters, written for a human deciding whether to tap. |
| `image` | no | The share image (see next section). Without it, pages fall back to the site cover (`/og.webp`). |
| `author` | no | Byline, rendered as "লিখেছেন · {author}" under the chapter header. For the book it's optional; for Pujo Sankhya articles it should be considered required. |

The parser (`web/src/lib/markdown.ts → parseFrontmatter`) handles flat
`key: value` pairs only — no nested YAML, no lists. Quotes around values are
optional but recommended when the value contains `:` or `—`.

## Images

**Where to copy:** `web/public/book/`
**Resulting URL:** `https://pujosamiti.github.io/book/<filename>`

In frontmatter, use either form:

```yaml
image: ashtami.webp                                  # → https://pujosamiti.github.io/book/ashtami.webp
image: https://example.com/full/url.webp             # used as-is
```

The image becomes the page's `og:image` in **both** layers — the client-side
tags and the prerendered raw HTML — which is what makes WhatsApp/Facebook
show a rich preview card for that chapter's link.

Practical specs:
- **1200×630** (the OG standard crop) or at least 3:2; WhatsApp crops
  square-ish from the centre, so keep the subject centred.
- WebP, ideally under 300 KB.
- Inside the article body, images work with normal markdown:
  `![Kola bou being bathed](/book/kola-bou-snan.webp)` — same folder, same
  URL rule.

## Linking between pages

Link to sibling files by filename — the renderer maps them to routes:

```markdown
See the [Mahalaya chapter](04-mahalaya.md) …        → /durga-puja/mahalaya
Back to [the book](00-index.md) …                    → /durga-puja
```

External links (`https://…`) open in a new tab automatically. Don't write
bare filenames in prose ("see 17-mantras-sandhi-puja.md") — make them real
markdown links so they resolve.

## Markdown features

Standard markdown plus GFM via the shared renderer
(`web/src/components/MarkdownArticle.tsx`):

- **Tables** work (the fordo chapter is 317 rows of them) and wide tables
  scroll horizontally inside their own container on phones.
- **Blockquotes** are styled with a shiuli left border — the book uses them
  for mantra text (the tri-script convention: Devanagari, then Bengali, then
  *roman transliteration*, then an "**In simple words:**" gloss).
- Bengali/Devanagari script needs no special handling — just type it.
- No raw HTML — keep everything markdown.

## The publish checklist

1. Edit or add `web/src/content/durga-puja/NN-slug.md` (frontmatter + body).
2. If the page has a share image, copy it to `web/public/book/` and set
   `image:` in the frontmatter.
3. `npm run build -w web` locally if you want to check — the build prints
   one `prerendered /durga-puja/…` line per page; a new file should appear
   in that list and in `dist/sitemap.xml` automatically.
4. Commit and push. CI deploys; the page, its SEO tags, its prerendered
   HTML and the sitemap entry all update together.

## Reusing this for Pujo Sankhya

The renderer (`MarkdownArticle`), the frontmatter parser and the
slug/ordering rules are all shared code, written to be section-agnostic.
When the magazine is built it gets its own content folder and routes, plus
two additions already anticipated: `author` (exists today) and a
`publishedOn` date; per-article `image` should be editorially required,
because magazine links live or die by their WhatsApp preview card. See
`docs/seotags.md` for the SEO side of the same story.
