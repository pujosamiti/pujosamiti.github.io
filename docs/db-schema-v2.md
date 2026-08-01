# DB schema v2 — design notes

Derived from the 2020–2025 archive crunch. Being built **feature by feature** —
each section lands as its own migration when its feature ships; unimplemented
sections are reference sketches, expected to be refined right before building.
Settled decisions:

- **Sponsorships are separate generosity** — only the Durga Pujo subscription
  (≥ threshold, ₹10,000 today) confers core tier. Threshold is a shared
  constant, not schema.
- **No bank account.** All cash sits with 4–5 **wallet-holders** — core
  members acting as collectors ("wallets"). No bank/UPI account modeling.
- **Books are per event**, except Durga Pujo + Kojagari Lakshmi Puja which
  always share one book. Event kinds are fixed to the current five
  (`EVENT_KINDS` in shared) — adding a kind is a code change, by design.
- **Everything lives in D1**, including Puja Essentials. Google Sheets become
  generated read-only mirrors (write-through + nightly reconciler); documents
  (coupons, nirghanto, PMC/police letters) are generated from DB data.
- **History back to 2020 gets imported** (one-time ETL with per-year totals
  reconciled against the original sheets).

## Table inventory

**Auth (better-auth, unchanged):** `user`, `session`, `account`, `verification`.

### Membership

✅ **Implemented** (migrations `0001_add-family-person`, `0002_drop-member`):

```
family
  id, name, society, residence_detail,
  workplace, workplace_detail,           -- for works-in-MGP families
  eligibility  enum: resident | works_in_mgp   (default resident)
  tier         enum: non_member | member | core   (default non_member; cached,
                                          -- derived from Durga Pujo subscription)
  phone, notes, is_active, created_at

person                                   -- replaced `member`
  id, family_id FK, display_name,
  email UNIQUE NULL,                     -- login key; NULL = no-Google member
  phone, gender NULL,                    -- mahila-volunteer scheduling
  is_admin bool,
  portfolio TEXT NULL,                   -- free text
  notes, created_at
```

Access rule as implemented: session email → person (family joined); denied
unless family `is_active` and tier ≠ `non_member`. Role in the API contract:
`admin` if `person.is_admin`, else `committee` for core-tier families, else
`member`. Wallet-holders are not flagged on person — collector attribution
lives on future money tables.

### Money

```
ledger_book                              -- one set of books; carry-forward chains books
  id            -- "durga-kojagari-2025", "saraswati-pujo-2025"
  year, name,
  opening_balance INTEGER                -- carry-forward in (₹)

event (existing table, gains:)
  ledger_book_id FK                      -- DP + KLP of a year share one book
  purohit_name NULL, purohit_phone NULL  -- nirghanto header data

contribution                             -- money IN: who gave, why
  id, family_id FK NULL,                 -- NULL = anonymous (dan peti / hundi)
  source NULL,                           -- "Big Dan Peti" etc. when anonymous
  event_id FK,                           -- per-event contribution ledgers
  kind enum: subscription | sponsorship | donation,
  sponsorship_item_id FK NULL,
  amount, collected_by FK->person NULL,  -- which wallet received it
  paid_on, receipt_no, notes,
  status enum: committed | received

sponsorship_item                         -- catalog defined before patrons attach
  id, year, event_id FK NULL,            -- NULL = season-wide (murti for all pujos)
  type,                                  -- Bhog | Murti | Dhak | Stage | Puja Item…
  item, amount,
  patron_family_id FK NULL, patron_name NULL,
  referred_by, received_by FK->person NULL,
  status enum: open | committed | received,
  is_public bool, notes

ledger_txn                               -- money MOVEMENT between hands
  id, book_id FK->ledger_book,
  event_id FK NULL,                      -- finer tagging inside a clubbed book
  date, description,
  kind enum: credit | debit | internal,  -- internal = wallet→wallet transfer
  from_person FK NULL, from_text NULL,   -- text for vendors/external parties
  to_person FK NULL,   to_text NULL,
  amount,
  category, subcategory,                 -- canonical taxonomy
  category_raw NULL,                     -- original label from imported history
  project NULL,                          -- sub-ledgers ("music-system")
  contribution_id FK NULL,               -- auto-created credit ← contribution
  entered_by FK NULL, notes
```

Rules enforced in the app layer:
- Marking a contribution `received` auto-creates the matching `ledger_txn`
  credit (linked via `contribution_id`).
- Reconciliation query per book: credits minus non-contribution credits must
  equal received contributions. Import ETL must reproduce each historical
  year's sheet totals exactly.
- Wallet balances are derived (per person: credits − debits ± internals), not
  stored — the `fin_masterdata` view becomes a query.

### Operations (per event)

```
budget_line (existing, unchanged)        -- budgeted = projection; prior actual queryable

procurement_item (existing, gains day-wise needs via child:)
procurement_need
  id, procurement_item_id FK,
  day_label,                             -- "Saptami"
  slot enum: morning | noon | evening,
  quantity TEXT                          -- "250/500 gm", "2 set" — units are free text

bhog_day                                 -- per-day bhog pricing
  id, event_id FK, date, label, per_plate INTEGER, extras NULL
bhog_coupon                              -- per-family booking; coupons print from count
  id, bhog_day_id FK, family_id FK, count, amount,
  paid bool, collected_by FK NULL

rsvp                                     -- Vijaya Sammilani / Poila Baishakh pattern
  id, event_id FK, family_id FK,
  headcount_veg, headcount_nonveg, amount,
  collected_by FK NULL, contact_person NULL,
  status enum: invited | confirmed | done

volunteer_slot                           -- restores the 2020–22 workflow
  id, event_id FK, date, activity, time_from, time_to,
  needed INTEGER, gender_pref NULL
volunteer_signup
  id, slot_id FK, person_id FK NULL, name NULL   -- name for non-app volunteers

task
  id, event_id FK NULL, year, title,
  owner1 FK->person NULL, owner1_text NULL,
  owner2 FK->person NULL, owner2_text NULL,
  due_date, status enum: todo | in_progress | done, notes

vendor                                   -- year-independent master
  id, name, description, phone1, phone2, email, notes
```

### Content & reference

```
essential_item                           -- the পুজোর ফর্দমালা, imported from 2022
  id, section,                           -- "Kalparambho", "Sandhi Puja"… (13)
  section_order, sort_order,
  name_bn, name_translit, description,
  quantity NULL,
  owner enum: purohit | committee,
  notes

timetable_entry (existing, gains:)
  title_bn NULL                          -- bilingual nirghanto rendering

notice, gallery_item (existing, unchanged)

document                                 -- index over Drive paperwork; files stay in Drive
  id, year, kind,                        -- police-application | pmc-noc | mandap-plan…
  title, drive_file_id, status, notes
```

## Flow highlights

- **Tier**: family is `core` for the membership year iff it has a
  `subscription` contribution ≥ threshold on that year's durga-pujo event.
  Sponsorships never affect tier.
- **Flower orders / daily procurement docs**: `procurement_item`
  (category = Flowers) + `procurement_need` rows → generated printable
  order sheet, replacing the yearly docx.
- **Bhog coupons**: `bhog_coupon.count` → generated printable numbered
  coupons per day.
- **Nirghanto**: `event` purohit fields + `timetable_entry` (bilingual) →
  generated printable schedule from the 2024 template layout.
- **Locations** (societies/towers) stay in `shared/src/locations.ts` by
  decision; revisit if admin editing is wanted later.

## Historical import (one-time ETL)

2020 Contri/Expense → 2021 workbook → 2022 Sponsors/Accounts (messiest —
mixed-column format) → 2023–2025 accounting + sponsorship + core-members tabs.
Produces: back-dated `ledger_book`s per year, `contribution`s,
`sponsorship_item`s, `ledger_txn`s (with `category_raw` preserving original
labels), and the family registry seeded from all names seen since 2020
(canonicalization list reviewed by admin before load). Acceptance: every
year's totals and carry-forward chain must match the sheets to the rupee.

## Migration

Single Drizzle migration: drop `member`, create everything above, extend
`event`/`timetable_entry`/`procurement_item`. Prod holds only seed + two test
allowlist rows, so destructive is fine. Allowlist query changes to
person→family join; seed gains the admin family and the five current events
wired to their ledger books.
