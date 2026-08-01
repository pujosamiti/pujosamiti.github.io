# DB schema v2 — proposal from the 2020–2025 data crunch

Derived from reading all six years of samiti Drive folders (every sheet tab and
document). Status: **proposal, not yet implemented**. The current `member`
table gets replaced; everything else in the current schema survives.

## What six years of operations actually contain

Every workflow the samiti has run, found in the archives:

| # | Workflow | Seen in | Today's tool |
| - | --- | --- | --- |
| 1 | Membership & families (tier, society, subscription status) | 2020→2025 | sheet tab per year |
| 2 | Contributions (per event, collector attribution, carry-forward) | 2020→2025 | sheet tabs |
| 3 | Sponsorship catalog (item, patron, received-by, multi-event items) | 2022→2025 | sheet tab |
| 4 | Double-entry-ish ledger (credit/debit/internal transfer, collector wallets, sub-project ledgers) | 2021→2025 | sheet tabs |
| 5 | Budget with prior-year actual vs projection + reasons | 2021→2025 | sheet tab |
| 6 | Procurement (categories, day-wise morning/evening quantities, status) | 2022→2025 | sheet + doc |
| 7 | Puja essentials / fordo (ritual sections, purohit-vs-committee owner) | 2022 only (!) | sheet tab |
| 8 | Nirghanto / timetable (bilingual, template + yearly times) | every year | doc (template since 2024) |
| 9 | Food/bhog coupons (per family per day counts, per-plate rates, printed numbered coupons) | 2024→2025 | sheet + docx |
| 10 | Event RSVP with veg/non-veg headcounts (Vijaya Sammilani, Poila Baishakh) | 2023→2024 | sheet tabs |
| 11 | Volunteer slots per ritual (incl. gendered slots, Mahila attendance schedule) | 2020→2022, then dropped | sheets |
| 12 | Task list (owner 1/2, due date, status) | 2022→2025 | sheet tab, then doc |
| 13 | Vendor list | 2022 | sheet tab (mostly empty) |
| 14 | Paperwork (police application Q&A, PMC intimation — Marathi letters, yearly) | every year | docs/PDFs in Drive |
| 15 | Small-event books (Saraswati, Poila Baishakh: contributions + bhog counts + expenses) | 2023→2025 | separate sheets |
| 16 | Comms & assets (WhatsApp poster, invitation cards, stamps, banners, dhak mp3s) | every year | Drive files |

Key historical facts encoded in the design:
- The ₹10,000 core-membership threshold dates to 2022 (founding families ×
  ₹10,000 pool). 2020–21 had flat ₹4,000 contributions. Amounts change — they
  are data, not schema.
- Membership formalized in 2023 (`core-members-details`: family couple-name +
  society + subscription status) and legally via the registered society
  ("Magarpatta Bangiya Parishad", Societies Registration Act 1860 — classes:
  Life / Ordinary members).
- Collector attribution ("Collected By" / "Received By" / wallet) appears in
  every money record since 2020 — it is a first-class concept.
- Sponsorship items are a *catalog defined before patrons attach* (2023→2025),
  and one item can span multiple events (2025 murti covered Durga + Lakshmi +
  Saraswati pujo).
- Annual books chain by carry-forward (verified consistent 2021→2025).
- 2024 ran a sub-project ledger (music system) with its own collectors.

## Phase 1 — replaces `member`, unblocks membership + money features

```
family
  id TEXT PK
  name TEXT                     -- "Sudeshna & Mousum" style couple/family name
  society TEXT                  -- from shared locations list, or free text
  residence_detail TEXT         -- flat no
  workplace TEXT                -- tower, for works-in-MGP families
  workplace_detail TEXT         -- company name
  eligibility TEXT enum: resident | works_in_mgp
  tier TEXT enum: member | core -- cached; derived from contributions (see rule)
  phone TEXT
  notes TEXT                    -- e.g. "including parents from both sides"
  is_active INTEGER bool
  created_at

person                          -- replaces `member`; email nullable = manual members
  id TEXT PK
  family_id FK -> family
  display_name TEXT
  email TEXT UNIQUE NULL        -- login match key; NULL for no-Google members
  phone TEXT
  gender TEXT NULL              -- some rituals schedule mahila volunteers
  is_admin INTEGER bool
  portfolio TEXT NULL           -- free text by decision
  created_at

contribution                    -- all money IN, any event
  id TEXT PK
  family_id FK NULL             -- NULL for anonymous (dan peti / hundi)
  source TEXT NULL              -- "Big Dan Peti", "Named envelope" when anonymous
  event_id FK -> event
  kind TEXT enum: subscription | sponsorship | donation
  sponsorship_item_id FK NULL   -- set when kind = sponsorship
  amount INTEGER                -- whole rupees
  collected_by FK -> person NULL
  method TEXT NULL              -- cash | upi | bank
  paid_on TEXT
  receipt_no TEXT
  notes TEXT

sponsorship_item                -- the catalog, defined before patrons exist
  id TEXT PK
  year INTEGER
  event_id FK NULL              -- NULL = season-wide (e.g. murti for all pujos)
  type TEXT                     -- Bhog | Murti | Dhak | Stage | Puja Item | ...
  item TEXT                     -- "Full day bhog 2", "Murti Moncha"
  amount INTEGER
  patron_family_id FK NULL
  patron_name TEXT NULL         -- for non-family patrons
  referred_by TEXT
  status TEXT enum: open | committed | received
  is_public INTEGER bool        -- show on sponsors board
  notes TEXT
```

**Tier rule**: family is `core` for a membership year (Durga Pujo → next
Durga Pujo) iff it has a `kind=subscription` contribution on that year's
durga-pujo event ≥ threshold (constant in shared config; ₹10,000 today).
Open question: whether large sponsorships alone confer core (2022 practice
suggests subscription-only; pending decision).

**Access rule**: session email → `person.email` → member access;
`family.tier = core` → committee content; `person.is_admin` → admin screens.

## Phase 2 — designed now, built when the feature ships

```
ledger_txn        -- replaces fin_accounting when the treasurer UI is ready
  id, year, date, description, kind enum: credit | debit | internal
  from_wallet FK -> person NULL, from_text NULL   -- text for vendors/external
  to_wallet FK -> person NULL, to_text NULL
  amount, expense_category, expense_subcategory
  event_id FK NULL, project TEXT NULL             -- "music-system" style sub-ledgers
  notes
  -- opening balance = one carry-forward credit txn per year

bhog_day          -- per-day bhog pricing for an event
  id, event_id, date, label ("Nabami"), per_plate INTEGER, extras TEXT
bhog_coupon       -- per-family booking; printed coupons derive from count
  id, bhog_day_id, family_id, count, amount, paid bool, collected_by FK NULL

rsvp              -- Vijaya Sammilani / Poila Baishakh pattern
  id, event_id, family_id, headcount_veg, headcount_nonveg,
  amount, collected_by FK NULL, contact_person TEXT, status

volunteer_slot    -- restores the lost 2020–22 workflow
  id, event_id, date, activity, time_from, time_to, needed INTEGER,
  gender_pref TEXT NULL
volunteer_signup
  id, slot_id, person_id FK NULL, name TEXT   -- name for non-app volunteers

task
  id, event_id NULL, year, title, owner1 FK/TEXT, owner2 FK/TEXT,
  due_date, status enum: todo | in_progress | done, notes

vendor            -- year-independent master
  id, name, description, phone1, phone2, email, notes

document          -- lightweight index over Drive paperwork (files stay in Drive)
  id, year, kind (police-application | pmc-noc | society-registration | ...),
  title, drive_file_id, status, notes
```

## Deliberately NOT in the database

- **Puja Essentials / fordo** — curated bilingual reference content; stays in
  Sheets, served via the service account as a (future) public page. ⚠️ It
  exists only in the 2022 workbook — preserve/copy it forward.
- **Nirghanto ritual times** — the template structure maps to
  `timetable_entry` (add `name_bn`); yearly times entered via admin UI.
- **Historical books 2020–2025** — stay in their sheets; readable on demand
  via the service account. No migration of old data.
- **Graphics/PDF assets** — Drive, indexed by `document` where useful.
- **Cash denomination counting** (2020–21 tabs) — physical treasurer ritual,
  out of scope.

## Migration plan (when approved)

Current prod data is only seed + 2 test allowlist rows, so: drop `member`,
create Phase 1 tables in one new Drizzle migration, update the allowlist query
(join person→family), update seed with the admin family, keep everything else.
