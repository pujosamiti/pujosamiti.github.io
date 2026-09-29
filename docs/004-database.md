# Database

Cloudflare D1 (SQLite at the edge), accessed through Drizzle ORM. The single
source of schema truth is **`api/src/db/schema.ts`** — read its block comments;
they encode real domain decisions. This doc is the map: what exists, why, and
how changes reach production.

## 1. The facts (live-verified 28 Aug 2026)

| | Prod | Local |
| --- | --- | --- |
| Database | D1 `pujosamiti`, id `ecdf8218-2679-4866-abde-57d405d5efb2` | SQLite file at `api/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/<hash>.sqlite` |
| Region / size | APAC · ~623 kB · created 27 Jul 2026 | — |
| Binding | `env.DB` (declared in `api/wrangler.jsonc`) | same binding via `wrangler dev` |
| Tables | 18 (+ `_cf_KV`, `sqlite_sequence` internals) | same when mirrored |
| Console access | dashboard → Storage & Databases → D1 → pujosamiti → Console, or `wrangler d1 execute … --remote` | `--local`, or `sqlite3` directly |

**Local and prod are entirely separate databases.** Every `wrangler d1`
command takes `--local` or `--remote` — getting this flag wrong is the #1
footgun. Nothing syncs automatically; mirror deliberately via
[005-backup-and-restore.md](005-backup-and-restore.md).

## 2. Schema tour — the tables by domain

> Written when there were 18. Uma added three more (below) and the
> sponsorship board grew a `tagline`; row counts here are from 28 Aug 2026.

### Auth (better-auth managed): `user`, `session`, `account`, `verification`

Standard better-auth shapes — regenerate with `npx @better-auth/cli generate`
and diff if a better-auth upgrade changes them. A `user` row appears for
anyone who signs in; **membership is separate** (below). `session` rows are
live tokens; `verification` holds single-use OAuth state.

### Events & timetable: `event`, `timetable_entry`

`event` is first-class — timetable rows, ledger entries and reimbursements
tag one. Id pattern `"durga-pujo-2026"`; `kind` is one of the five fixed
`EVENT_KINDS` (shared); carries bilingual names, ISO date range, optional
purohit name/phone (nirghanto header — **the phone is served only to signed-in
members**, never on the public feed) and a free `notes` field shown above the
nirghanto (its first paragraph in view, the rest folded). `timetable_entry` is
the nirghanto: rows grouped by day (bilingual tithi labels), bilingual ritual
titles, `time_from`/`time_to` ("HH:MM", NULL until the purohit confirms),
panchang `comments` — the working note, shown only in the nirghanto workspace
since 27 Sep 2026 — and `alert_note`, the public note, rendered in red under
the timing.

### Membership: `person`, `family`

Person-centric — each individual carries their own `tier`
(`non_member`/`member`/`core`), `eligibility` (`resident`/`works_in_mgp`/
`by_invitation`), location, `phone`, flags. `family` is a thin, optional,
admin-curated grouping — **it gates nothing**. Key columns:

- `email` (unique, nullable) — the sign-in match key. NULL = a full member on
  the rolls who simply doesn't use the site.
- `alt_email` — a second Google account, matched the same way.
- `is_admin` — full admin. `is_fin_admin` — finance authority *without* the
  membership roll (the treasurer case); admins hold fin powers implicitly.
- `is_cultural_admin` — **cultural_admin** (migration 0013): runs the cultural
  programme — adds, edits, deletes and arranges its items. Counts only for
  core members; admins hold it implicitly (`canRunCulture` in shared).
- `tier` — `core` · `member` · `non_member`. The column defaults to
  `non_member`, but every insert names its tier: admins choose it when
  creating anyone, and self-registration writes `non_member` explicitly.
- `origin` — `roster` (entered by an admin / historical import) vs `self`
  (signed in and registered themselves) vs `counter` (walk-up creation);
  separates people genuinely awaiting activation from the long tail of names
  on the rolls.
- `is_active` false = left the portal (soft delete).

### Task planning: `durgapuja_task`, `task_year`, `task_assignment`

`durgapuja_task` = year-independent master catalog (stable slugs like
`idol-transport-in`, curated over time, seeded from the 2020–2025 archives —
`seed-tasks.sql`). `task_year` = one row per task per year: phase
(`todo`/`in_progress`/`completed`), three checkdates with notes, per-year skip.
`task_assignment` links people per year as `owner` (max 5, app-enforced —
`TASK_MAX_OWNERS` in shared) or `volunteer`. Soft deletes everywhere.

### Days of the Pujo: `puja_day` (+ `event.nirghanto_finalized_on`)

The canonical per-year calendar every day-scoped feature builds on
(procurement deliveries, bhog menu, RSVP, coupons, ritual-volunteer slots).
An **admin** finalises the nirghanto (`event.nirghanto_finalized_on`), then
seeds Puja Days from it: Panchami → Dashami as **tithi-days** — in a crunched
year two tithis share one date (2024: Oct 10 was Saptami AND Ashtami) and a
tithi can span two dates ("Ashtami · Day 2", 2026's Adhik Diba). No finalised
nirghanto → no seeding; features wait. Later nirghanto edits surface as an
out-of-sync warning with an admin re-sync.

`has_cultural_evening` (migration 0013) marks the days whose evening carries a
cultural programme — Shashthi, Saptami, Ashtami and Ashtami · Day 2 in 2026. Admins switch it per day in
the Days of the Pujo on /nirghanto; re-sync updates rows in place, so the mark
survives it.

### Procurement: `procurement_item` (+`procurement_suggestion`), `procurement_item_year`, `procurement_day`, `procurement_need`

The digital form of the samiti's yearly procurement sheet (2024/2025 format):
items grouped in category sections × per-year day columns, each split
Morning/Evening. `procurement_day` is first-class per year because a tithi can
span two calendar days ("Saptami · Day 2") and Sandhi Puja gets its own column
when the timings call for it. `procurement_need` is one cell (item × day ×
slot, free-text quantity, per-cell purchased tick for the market run);
`procurement_item_year` carries the sheet's Total Quantity, status
(pending/partial/done) and remarks ("Purohit will bring"). Core members
curate; only the active pujo year is writable.

Delivery columns reference their `puja_day` and are **admin-seeded** from it:
delivery date = the evening before the tithi at 19:00 by default; a nirghanto
Sandhi Puja row adds a same-morning 10:00 column carrying its real window.
Items carry optional **name_hi/name_bn** vendor names (the flowers order is
handed to the Pune phoolwala bilingual) and a year-independent **master
list**: `suggested_total` plus tithi × slot `procurement_suggestion` rows
(distilled from 2023–2025; edited at /procurement/master). An admin prefill
maps suggestions onto the year's actual days — both Ashtamis in an Adhik
Diba year — never overwriting existing values.

### Bhog & food menus: `bhog_menu`, `bhog_menu_item`, `bhog_rsvp`

**One menu per calendar DATE per EVENT.** Five occasions carry menus each
season (1 Jul → 30 Jun): Durga Pujo is multi-day — admin-seeded from the
finalised Puja Days, Saptami → Dashami, one lunch per date (crunched 2024
served "Saptami/Ashtami" together) — while Kojagari, Bijoya Sammelani,
Saraswati and Poila Baishakh are single meals core members add directly.
Kojagari/Saraswati serve "Bhog", Bijoya Sammelani/Poila Baishakh a "Food
Menu" — a naming difference the UI carries (`menuKindLabel` in shared), not
the schema. Each day carries bilingual dish rows (`bhog_menu_item`, cascade),
a whole-₹ `per_plate_cost` (₹160/180/190 in the 2024–25 sheets) and an
`is_published` flag: drafts are core-editor-only, published days are visible
to every member. Only the current season is writable.

`bhog_rsvp` is the **headcount** — the digital food-coupon-details sheet
("Bhog Count, 5+ yrs"), 0 a valid answer. The unit is the **household**: a
`family`, or a person who has none (`api/src/lib/households.ts`). A household
keeps one row per menu day — saving replaces whatever its people had on that
day with a single row recorded against whoever answered (unique per menu ×
person in the schema; one-per-household in `api/src/lib/headcount.ts`). The
core members' sheet lists the households that paid a subscription or
sponsorship, or pledged one, that season (`seasonMoney` in
`api/src/lib/roll.ts`), plus any that have answered — lifetime members who no
longer pay are left off.

**Durga Pujo coupons.** A family's season money — subscriptions and
sponsorships paid, plus pledges still marked `pledged` — sets its allowance
(`bhogAllowance` in shared): **₹10,000 or more → up to 10 people each day**;
less → **one coupon per ₹500**, spent on any days (all on one if they like).
Each day closes **four days before it** (Saptami 17 Oct takes its last change
on 13 Oct, IST); admin/fin_admin can still change a closed day. Counts left
above the allowance by a cancelled pledge stand and may come down, not up,
and are flagged on the sheet. Other occasions have no allowance or cut-off.

`bhog_link` (0012) is the **headcount link**: one live code per event
(`/bhog/count/?c=X481216` — a letter without I/O, six digits), shared with
the samiti. Opening it offers the same household list as the sheet; saves go
through the same rules. Replacing a code sets `revoked_at` on the old row.

**Guest bhog.** A core household (₹10,000+ that season) may bring office
colleagues and friends: `bhog_rsvp.guests`, up to 20 a day on top of its
own count, same cut-off. They are charged per head at the event's rate in
`bhog_setting` (`guest_rate`, NULL = off; `incharge_person_id` is the Food &
Bhog in-charge, pre-selected as the receiver and named on the form). Money
received is **not stored here**: it is read from the ledger — active pujo
entries `contribution · misc_income · Guest Bhog`, tagged to the event or
untagged within its season — so voiding an entry reopens the balance. No
refunds: an overpaid household shows a negative balance. Plates on the
count sheet include guests.

### Money: `book`, `ledger_entry`, `sponsorship_item`, `sponsorship_item_year`, `sponsorship_pledge`, `expense_reimbursement`, `budget_line`

The heart of the system. Design decisions (from the schema comments and the
bookkeeping conventions):

- **ONE money table** (`ledger_entry`) and **two PERPETUAL books**:
  `pujo-ledger` (Durga Pujo · Kojagari · Bijoy Sammelani · Saraswati — always
  one combined book) and `poila-baishakh-ledger`. No per-year books;
  carry-forward is implicit in the perpetual ledger.
- Entry `kind`: `contribution` | `expense` | `transfer`. Categories:
  contributions use `subscription`/`sponsorship`/`donation`/`misc_income`;
  expenses use the expense taxonomy; transfers carry none.
- `sub_category` is free text with per-category suggestions, except for a
  subscription, where it must be `core` or `non-core` (a shared constant): the
  form is a fixed dropdown and the API rejects anything else.
- The entries tab downloads a season's core subscriptions, non-core
  subscriptions or sponsorships as a PDF, one book at a time, listing each
  contribution under the contributor's **family** (their own name when they
  are not linked to one; `LedgerEntry.familyName`), from the 2026
  season on (`LEDGER_PDF_FROM_SEASON`); earlier seasons were tagged by hand
  and would mislabel members. Built in the browser — [012](012-design-system.md)
  §PDF reports.
- The sponsorship page downloads a year's board as a PDF: every slot as drawn
  on screen with its appeal in both languages, the listed price, who pledged
  (the person's own name, not the household) and the date the payment came in
  (`pledge.paidOn` = the linked ledger entry's date; blank until paid). Any
  year.
- **No bank account exists.** All cash sits with wallet-holders. Wallets are
  *emergent*: anyone named as `wallet_person_id` holds samiti money; balances
  are always derived (credits − debits ± transfers), never stored.
- `amount` is whole rupees, always > 0; direction comes from `kind`.
- Dates are IST date strings `"YYYY-MM-DD"`; the reporting **season runs
  1 July → 30 June**.
- **Entries harden 48 h after creation** — no edit/void after that (locked
  history). Voiding within the window sets `is_active = false`.
- Event-wise tagging: bhog entries are recorded per event (Lakshmi and
  Saraswati bhog stay separate), via the optional `event_id` tag.

Sponsorship mirrors the task catalog: `sponsorship_item` (master, e.g.
`sandhi-puja-3`, with `default_amount`) → `sponsorship_item_year` (offered
this year? priced this year?) → `sponsorship_pledge` (person, year, amount,
`pledged`/`paid`/`cancelled`). **Pledges move no money** — paying one writes
the ledger entry and links it (`ledger_entry_id`). Paid sponsorships count
toward core alongside subscriptions: a person whose puja subscriptions and
sponsorships in one season total ≥ the threshold (a shared constant,
₹10,000) is marked **Qualifies for Core** for an admin to promote — nothing
changes a tier automatically. See [009](009-auth-and-membership.md) §5.

`expense_reimbursement`: a core member spent from their own pocket; a wallet
holder self-assigns the claim ("I'll pay this one" — prevents double payment),
then settlement writes the underlying **vendor** expense to the ledger (the
claimant is a pass-through) and links it. Status:
`requested`/`settled`/`rejected`/`cancelled`.

`budget_line`: season expense budget, one line per (year, category,
sub_category); NULL sub_category = whole-category "General" line. Budgets
exist from season 2026 onward — no historical budgets.

### Cultural function: `cultural_program`

The pujo's evening programmes (27 Sep 2026). An evening is a Puja Day marked
`has_cultural_evening` (above), so nothing about it is stored here: its name
and date are the Puja Day's and follow the nirghanto. One row per item:
`puja_day_id`, the evening; `sort_order`, its place in the evening's running
order (new items join at the end; cultural admins move them up and down, and a
move renumbers the evening 10, 20, 30… in one batch); `item_name`; `item_type` (dance, music, instrumental, skit,
poetry_recitation, dance_drama, others — `item_type_other` describes an
Others); `performers` (kids · adults · both); `duration_min` (optional); free-text
`participants`; `created_by`, the member who added it. Only the active
pujo's evenings take new or changed items — past years are the record — and
a day cannot be unmarked while items are planned on it. Who may do what:
[014](014-roles-and-access.md).

### উমা, the magazine: `uma_issue`, `uma_article`, `uma_section_editor`

> **Archived 26 Sep 2026** — kept as a record, read by no code. See [015](015-uma-magazine.md).

Added after this doc's audit — see **[015](015-uma-magazine.md)** for the
model in full. In short: a `uma_issue` is one numbered সংখ্যা; `uma_article`
carries the whole editorial lifecycle (`draft → in_review → accepted/held/
rejected → published`) plus both language versions and the public reaction
counters; `uma_section_editor` seats **one editor per section** (section is the
primary key, so a person may hold several rows). The chief editor's chair lives
on `person.uma_role`. Hero art is not in the database — it ships in
`web/public/uma-media/` and the columns hold `/uma-media/<name>.webp` paths.

Also since the audit: `sponsorship_item.tagline` / `tagline_bn` (migration
0010) hold each slot's bilingual one-line appeal.

## 3. Seeds

| File (in `api/`) | Contains |
| --- | --- |
| `seed.sql` | The 2020–2035 event calendar and base rows |
| `seed-tasks.sql` | The Durga Pujo task catalog from the 2020–2025 archives |
| `seed-nirghanto.sql` | Nirghanto timetable rows |
| `seed-ledger.sql` | Books/ledger seed (the historical import shape) |

Apply with `npx wrangler d1 execute pujosamiti --local --file=seed.sql` (they
were applied to prod once; you'll rarely touch them — mirroring prod is the
normal way to get a full local DB).

## 4. Making a schema change (the real workflow)

1. Edit `api/src/db/schema.ts`.
2. `npm run db:generate -w api` — drizzle-kit emits the next numbered
   migration into `api/drizzle/` (currently 0000–0005 exist).
3. Apply to **local** first and test:
   `cd api && npx wrangler d1 execute pujosamiti --local --file=drizzle/<n>_<name>.sql`
4. Apply to **prod** *before* merging the code that needs it:
   `npx wrangler d1 execute pujosamiti --remote --file=drizzle/<n>_<name>.sql`
5. Push/merge — CI deploys the Worker.

**Order matters (step 4 before 5): CI never migrates.** The deployed Worker
assumes the schema already exists; deploy first and prod breaks. This is a
deliberate design — schema changes are too destructive to auto-apply on push.

## 5. Existing migrations

| # | File | What it did |
| - | --- | --- |
| 0000 | `0000_init.sql` | Everything up to go-live |
| 0001 | `0001_person-origin.sql` | `person.origin` (roster vs self) |
| 0002 | `0002_person-fin-admin.sql` | `person.is_fin_admin` |
| 0003 | `0003_event-notes.sql` | `event.notes` (note above the nirghanto) |
| 0004 | `0004_person-alt-email.sql` | `person.alt_email` (second sign-in address) |
| 0005 | `0005_timetable-alert-note.sql` | `timetable_entry.alert_note` (red note) |
| 0006 | `0006_puja-days-procurement.sql` | Puja Days (`puja_day`, `event.nirghanto_finalized_on`) + the full procurement suite (catalog with vendor names & master-list suggestions, item-years with due date/time, puja-day-linked delivery columns, quantity cells) |
| 0007 | `0007_bhog-menu.sql` | Bhog & food menus (`bhog_menu` per event per calendar date + `bhog_menu_item` dishes) |
| 0008 | `0008_bhog-rsvp.sql` | Headcount (`bhog_rsvp`, unique per menu day × person) |
| 0009 | `0009_uma.sql` | উমা — `uma_issue`, `uma_article`, `person.uma_role` ([015](015-uma-magazine.md)) |
| 0010 | `0010_sponsorship-tagline.sql` | `sponsorship_item.tagline` / `tagline_bn` — each slot's bilingual appeal |
| 0011 | `0011_uma-section-editors.sql` | `uma_section_editor` — one editor per Uma section; retires `uma_role = 'editor'` |
| 0012 | `0012_bhog-headcount.sql` | `bhog_link` — the headcount link, one live code per event (partial unique index), revoked codes kept; `bhog_rsvp.guests`; `bhog_setting` — per-event Food & Bhog in-charge and guest rate |
| 0013 | `0013_cultural-program.sql` | `person.is_cultural_admin` (cultural_admin) + `puja_day.has_cultural_evening` (set for 2026's Shashthi, Saptami, Ashtami and Ashtami · Day 2) + `cultural_program`, the evening programmes |

## 6. ⚠️ Why `npm run db:migrate:*` is broken (and what to use instead)

The package.json scripts `db:migrate:local` / `db:migrate:remote` wrap
`wrangler d1 migrations apply`, which tracks state in a `d1_migrations`
table. **Neither prod nor local has that table** — migrations 0000–0005 were
applied by hand with `d1 execute --file`. So the scripts try to re-run
`0000_init` against an existing schema and fail with "table already exists".

Until a `d1_migrations` table seeded with 0000–0005 is created on both sides
(the planned fix — [013](013-known-gaps.md)), apply migrations exactly as §4
shows: `d1 execute --file`, local first, prod before deploy.

## 7. Ad-hoc queries

```sh
cd api
npx wrangler d1 execute pujosamiti --remote --command "SELECT count(*) FROM person"   # PROD
npx wrangler d1 execute pujosamiti --local  --command "SELECT count(*) FROM person"   # local
```

Add `--json` for machine-readable output. For anything bulk, prefer working
on a fresh local mirror and treating prod as read-mostly; direct prod writes
are for the documented flows (member allowlisting, migration application)
and emergencies.
