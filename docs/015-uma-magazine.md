# উমা — the samiti magazine

Uma is the samiti's own magazine: bilingual articles in ten sections, gathered
into numbered editions called **সংখ্যা (sankhya)**, edited by samiti members and
published to the public site. It shipped after the 28 Aug 2026 audit, so this
chapter joins the series late. Verified against the code on **1 Sep 2026**.

## 1. The shape of it

```
uma_issue  (সংখ্যা)      number, title, cover_image, editorial_note,
                         status draft|published, published_on
   └── uma_article       one piece: slug, section, title/title_bn,
                         author (member or guest), body_md + body_md_alt,
                         hero_image, status, sort_order, hearts, claps
uma_section_editor       one editor per section (see §3)
person.uma_role          the chief editor's chair
```

An article belongs to **one section** and, once accepted, to **one sankhya**.
Its `slug` is its public identity and never changes after publication.

**Bilingual by construction.** `lang` says which language the piece was written
in; `title`/`title_bn` and `body_md`/`body_md_alt` hold both versions, and the
reader switches with a pill on the article page. Either side may be absent —
a piece written only in Bangla shows only Bangla.

**Ten sections** (`UMA_SECTIONS` in `shared`): Art শিল্পকলা · Fashion ফ্যাশন ·
Stories গল্প · Games & Puzzles ধাঁধা · Travel ভ্রমণ · Recipes হেঁশেল ·
Health স্বাস্থ্য · Mythology & Puja Rituals পুরাণ ও আচার · Poetry কবিতা ·
Commentary সমকাল.

## 2. The lifecycle

```
draft → in_review → accepted → (published, by publishing its sankhya)
                  ↘ held      (parked for a later edition)
                  ↘ rejected  (with the editor's note)
```

`draft` is the dev still converting a submission; the queue proper starts at
`in_review`. **An article is never published directly** — it is accepted into a
draft sankhya, and goes live when that sankhya is published.

**Publishing is one-way.** There is no unpublish route, by design: a sankhya
that has gone out has been read, linked and shared, and withdrawing it would
break those links and rewrite what the samiti has already said. A published
article cannot change status and cannot be deleted. Corrections are made by
editing the piece in place — which is why **ordering stays open on a published
issue**, so a live edition can still be rearranged.

## 3. Who may do what

The masthead is **one chief editor plus one editor per section**. Seats are for
active **core** members and only an admin assigns them. One person commonly
holds several sections; a section with nobody — Games & Puzzles today — sits
unassigned, and only the chief and admins can touch its pieces.

| | section editor | chief editor | admin |
| --- | --- | --- | --- |
| See the desk | ✅ | ✅ | ✅ |
| Create / edit an article | in their sections | ✅ | ✅ |
| Verdict: accept, hold, reject | in their sections | ✅ | ✅ |
| Upload article media | ✅ | ✅ | ✅ |
| Compose, edit, delete, **order** a sankhya | — | ✅ | ✅ |
| **Publish** a sankhya | — | ✅ | ✅ |
| Delete an article (unpublished only) | — | — | ✅ |
| Assign the masthead | — | — | ✅ |

Scope is enforced on both sides. `Me.umaSections` carries the seats;
`canEditUmaSection` gates create, edit (both the section it is in **and** the
one it is moving to) and the verdict. Refusals read
*"Poetry belongs to another section editor"*. On the desk an article outside
your sections is preview-only.

**The tier axis is independent.** A `member` with a section seat runs that
section while remaining locked out of the ledger; a `fin_admin` with no seat
sees no Uma card at all. Admins hold every editorial power implicitly, being
the people doing intake.

## 4. Editorial intake, in practice

Articles arrive as WhatsApp messages, documents or email — `submitted_via` and
`submitted_on` record how and when. A dev converts a submission into a `draft`
with both language versions and a hero image; the section's editor then works
the queue. Guest writers (`is_guest`) carry their own byline and bio, in both
scripts, and need no person row.

Hero art is authored as **webp** and lives in `web/public/uma-media/`, served
from the site itself: `hero_image` and `cover_image` hold `/uma-media/<name>.webp`.
**R2 is not enabled** on this project — the binding in `api/wrangler.jsonc` is
commented out and the upload routes answer 503 — so image work is a repo commit,
not an upload. The backup script copies these files alongside the database
([005](005-backup-and-restore.md)).

## 5. The public side

| Route | Page |
| --- | --- |
| `/uma` | The magazine home — latest sankhya, sections, masthead |
| `/uma/sankhya` | Archive of editions |
| `/uma/sankhya/:number` | One edition |
| `/uma/bibhag/:section` | One section |
| `/uma/:slug` | An article |

Readers react without signing in: **hearts** (one per reader) and **claps**
(Medium-style, capped at `UMA_MAX_CLAPS` = 21), via `POST /api/public/uma/react`.

**Publishing triggers a site rebuild.** The Worker fires a `repository_dispatch`
at the web workflow so the new articles get prerendered HTML for crawlers within
minutes — `GET /api/public/uma/prerender` is what the build reads. A new Uma
route therefore needs a **second** web build to appear prerendered: the first
publishes the data, the second bakes the HTML.

## 6. API surface

Public, unauthenticated — `/api/public/uma/*`:
`home` · `issues/:number` · `articles` · `articles/:slug` · `react` ·
`media/:key` · `prerender`

The desk — `/api/members/uma/*`, behind the editor gate:
`desk` · `articles` (POST/PUT/DELETE, `:id/status`) · `issues`
(POST/PUT, `:id/order`, `:id/publish`, DELETE) · `media` · `roles` · `sections`

`roles` seats the chief; `sections` seats one section's editor. Both are
admin-only and both refuse anyone who is not an active core member.

## 7. State today (1 Sep 2026)

One published sankhya (সংখ্যা ১), 18 articles across 9 sections, 18 hero images.
**The masthead is empty** — no chief, no section editors — so admins are
currently the only people who can work the desk.
