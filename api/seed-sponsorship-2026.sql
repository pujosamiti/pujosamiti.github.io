-- Sponsorship board for Durga Pujo 2026.
--
-- The master catalog is perpetual; what changes each year is the OFFERING
-- (sponsorship_item_year). This file does both, and running it twice is a
-- no-op:
--   1. the catalog is FILE-OWNED — slots, titles, categories and order are
--      upserted from here every run,
--   2. the 2026 offering is APP-OWNED once it exists — section 2 fills gaps
--      only, so a price set by finance or a slot skipped by the webmaster
--      survives a re-run.
--
-- Old slots are reused wherever the 2026 name is the same real-world thing
-- (Murti N → Durga Puja Pratima N, Padma Phul → Sandhi Puja Lotus Flowers…)
-- so past pledges keep pointing at a slot that still means something. Paid
-- ledger entries froze their own title text, so retitling rewrites no history.
--
-- Apply:  npx wrangler d1 execute pujosamiti --local --file seed-sponsorship-2026.sql

-- ── 1. The catalog ──────────────────────────────────────────────────────────

INSERT INTO sponsorship_item (id, category, title, default_amount, sort_order, is_active, created_at) VALUES
  -- Pratima: the five Durga slots are the old 'Murti 1-5' shares, un-retired.
  ('murti-slot-1',              'Murti',              'Durga Puja Pratima 1',                                       5000, 100, 1, unixepoch()),
  ('murti-slot-2',              'Murti',              'Durga Puja Pratima 2',                                       5000, 101, 1, unixepoch()),
  ('murti-slot-3',              'Murti',              'Durga Puja Pratima 3',                                       5000, 102, 1, unixepoch()),
  ('murti-slot-4',              'Murti',              'Durga Puja Pratima 4',                                       5000, 103, 1, unixepoch()),
  ('murti-slot-5',              'Murti',              'Durga Puja Pratima 5',                                       5000, 104, 1, unixepoch()),
  ('lakshmi-idol',              'Murti',              'Kojagari Lakshmi Puja Pratima',                              5000, 110, 1, unixepoch()),
  -- Mancha
  ('murti-moncha',              'Stage',              'Goddess Mother''s Abode / Durga Mancha',                     5000, 200, 1, unixepoch()),
  ('mancha-lighting',           'Stage',              'Mother''s Abode / Durga Mancha Lighting',                    5000, 210, 1, unixepoch()),
  -- Aagomon o bisorjon
  ('pratima-homecoming',        'Transport',          'Goddess Mother''s Homecoming (Transportation)',              5000, 250, 1, unixepoch()),
  ('pratima-farewell',          'Transport',          'Goddess Mother''s Farewell (Boat and Majhi Fare)',           5000, 255, 1, unixepoch()),
  -- Bhog: one slot per day in 2026, not the old split halves.
  ('saptami-bhog-1',            'Bhog',               'Saptami Bhog',                                              20000, 300, 1, unixepoch()),
  ('ashtami-bhog-1',            'Bhog',               'Ashtami Bhog',                                              30000, 310, 1, unixepoch()),
  ('sandhi-luchi-bhog',        'Bhog',               'Sandhi Puja Maha Bhog',                                     20000, 315, 1, unixepoch()),
  ('nabami-bhog-1',             'Bhog',               'Nabami Bhog',                                               20000, 320, 1, unixepoch()),
  -- Phul o mala
  ('thakurer-mala',             'Flowers & Garlands', 'Goddess Mother''s Garland',                                  5000, 350, 1, unixepoch()),
  ('all-garlands',              'Flowers & Garlands', 'All Garlands for all Idols',                                 5000, 355, 1, unixepoch()),
  ('sandhi-puja-flowers',       'Flowers & Garlands', 'Sandhi Puja Flowers, 108 Bel Pata Mala and all Garlands',    5000, 360, 1, unixepoch()),
  ('padma-phul',                'Flowers & Garlands', 'Sandhi Puja Lotus Flowers',                                  5000, 365, 1, unixepoch()),
  -- Puja, day by day
  ('kala-bou-saree',            'Puja',               'Kala Bou Saree / Nabapatrika',                               5000, 400, 1, unixepoch()),
  ('saptami-puja-1',            'Puja',               'Saptami Puja 1',                                             5000, 403, 1, unixepoch()),
  ('saptami-puja-2',            'Puja',               'Saptami Puja 2',                                             5000, 406, 1, unixepoch()),
  ('saptami-puja-3',            'Puja',               'Saptami Puja 3',                                             5000, 409, 1, unixepoch()),
  ('ashtami-puja-1',            'Puja',               'Ashtami Puja 1',                                             5000, 412, 1, unixepoch()),
  ('ashtami-puja-2',            'Puja',               'Ashtami Puja 2',                                             5000, 415, 1, unixepoch()),
  ('ashtami-puja-3',            'Puja',               'Ashtami Puja 3',                                             5000, 418, 1, unixepoch()),
  ('ashtami-puja-4',            'Puja',               'Ashtami Puja 4',                                             5000, 421, 1, unixepoch()),
  ('ashtami-puja-5',            'Puja',               'Ashtami Puja 5',                                             5000, 424, 1, unixepoch()),
  ('ashtami-puja-6',            'Puja',               'Ashtami Puja 6',                                             5000, 427, 1, unixepoch()),
  ('ashtami-puja-7',            'Puja',               'Ashtami Puja 7',                                             5000, 430, 1, unixepoch()),
  ('sandhi-puja-1',             'Puja',               'Sandhi Puja 1',                                              5000, 433, 1, unixepoch()),
  ('sandhi-puja-2',             'Puja',               'Sandhi Puja 2',                                              5000, 436, 1, unixepoch()),
  ('sandhi-puja-3',             'Puja',               'Sandhi Puja 3',                                              5000, 439, 1, unixepoch()),
  ('sandhi-puja-4',             'Puja',               'Sandhi Puja 4',                                              5000, 442, 1, unixepoch()),
  ('sandhi-puja-5',             'Puja',               'Sandhi Puja 5',                                              5000, 445, 1, unixepoch()),
  ('sandhi-puja-6',             'Puja',               'Sandhi Puja 6',                                              5000, 448, 1, unixepoch()),
  ('sandhi-puja-7',             'Puja',               'Sandhi Puja 7',                                              5000, 451, 1, unixepoch()),
  ('sandhi-puja-8',             'Puja',               'Sandhi Puja 8',                                              5000, 454, 1, unixepoch()),
  ('sandhi-puja-9',             'Puja',               'Sandhi Puja 9',                                              5000, 457, 1, unixepoch()),
  ('nabami-puja-1',             'Puja',               'Nabami Puja 1',                                              5000, 460, 1, unixepoch()),
  ('nabami-puja-2',             'Puja',               'Nabami Puja 2',                                              5000, 463, 1, unixepoch()),
  ('nabami-puja-3',             'Puja',               'Nabami Puja 3',                                              5000, 466, 1, unixepoch()),
  ('dashami-puja',              'Puja',               'Dashami Puja 1',                                             5000, 469, 1, unixepoch()),
  ('dashami-puja-2',            'Puja',               'Dashami Puja 2',                                             5000, 472, 1, unixepoch()),
  ('dashami-puja-3',            'Puja',               'Dashami Puja 3',                                             5000, 475, 1, unixepoch()),
  -- Kojagari
  ('lakshmi-pujo-bhog',         'Lakshmi Puja',       'Kojagari Lakshmi Puja Bhog',                                 10000, 800, 1, unixepoch()),
  -- Cultural: the artist fee is priced when the artist is booked.
  ('cultural-external-artist',  'Cultural',           'External Artist Fee',                                        NULL, 850, 1, unixepoch()),
  ('cultural-prizes',           'Cultural',           'Prizes & Awards (Kids'' Cultural Events)',                   5000, 860, 1, unixepoch()),
  -- Banner
  ('banner-sponsor-1',          'Banner Sponsor',     'Banner Sponsor (Display Commercial) 1',                      5000, 900, 1, unixepoch()),
  ('banner-sponsor-2',          'Banner Sponsor',     'Banner Sponsor (Display Commercial) 2',                      5000, 901, 1, unixepoch()),
  ('banner-sponsor-3',          'Banner Sponsor',     'Banner Sponsor (Display Commercial) 3',                      5000, 902, 1, unixepoch()),
  ('banner-sponsor-4',          'Banner Sponsor',     'Banner Sponsor (Display Commercial) 4',                      5000, 903, 1, unixepoch()),
  ('banner-sponsor-5',          'Banner Sponsor',     'Banner Sponsor (Display Commercial) 5',                      5000, 904, 1, unixepoch()),
  ('banner-sponsor-6',          'Banner Sponsor',     'Banner Sponsor (Display Commercial) 6',                      5000, 905, 1, unixepoch()),
  ('banner-sponsor-7',          'Banner Sponsor',     'Banner Sponsor (Display Commercial) 7',                      5000, 906, 1, unixepoch())
ON CONFLICT(id) DO UPDATE SET
  category       = excluded.category,
  title          = excluded.title,
  default_amount = excluded.default_amount,
  sort_order     = excluded.sort_order,
  is_active      = excluded.is_active;

-- ── 2. The 2026 offering ────────────────────────────────────────────────────
-- GAP-FILLING, NOT AUTHORITATIVE. This writes a year row only where none
-- exists. Once a slot has one, the app owns it: the webmaster decides whether
-- it is offered and finance sets its amount, both through the same
-- 'siy-<item>-<year>' row this file creates. A re-run must never undo that
-- work, so there is no DELETE here — running this file twice is a no-op.
--
-- Which means the file no longer enforces the list below. To take a slot off
-- the 2026 board now, use "Skip this year" in the app; to change a price, set
-- it there. Editing this file only affects a database that has never been
-- seeded for 2026.

-- Everything on the 2026 list, at its 2026 price.
INSERT INTO sponsorship_item_year (id, item_id, year, amount, is_active, notes)
SELECT 'siy-' || id || '-2026', id, 2026, default_amount, 1, NULL
FROM sponsorship_item
WHERE id NOT IN (SELECT item_id FROM sponsorship_item_year WHERE year = 2026)
AND id IN (
  'murti-slot-1','murti-slot-2','murti-slot-3','murti-slot-4','murti-slot-5','lakshmi-idol',
  'murti-moncha','mancha-lighting',
  'pratima-homecoming','pratima-farewell',
  'saptami-bhog-1','ashtami-bhog-1','sandhi-luchi-bhog','nabami-bhog-1',
  'thakurer-mala','all-garlands','sandhi-puja-flowers','padma-phul',
  'kala-bou-saree',
  'saptami-puja-1','saptami-puja-2','saptami-puja-3',
  'ashtami-puja-1','ashtami-puja-2','ashtami-puja-3','ashtami-puja-4','ashtami-puja-5','ashtami-puja-6','ashtami-puja-7',
  'sandhi-puja-1','sandhi-puja-2','sandhi-puja-3','sandhi-puja-4','sandhi-puja-5',
  'sandhi-puja-6','sandhi-puja-7','sandhi-puja-8','sandhi-puja-9',
  'nabami-puja-1','nabami-puja-2','nabami-puja-3',
  'dashami-puja','dashami-puja-2','dashami-puja-3',
  'lakshmi-pujo-bhog',
  'cultural-external-artist','cultural-prizes',
  'banner-sponsor-1','banner-sponsor-2','banner-sponsor-3','banner-sponsor-4',
  'banner-sponsor-5','banner-sponsor-6','banner-sponsor-7'
);

-- Every other catalog slot: on the books, off the 2026 board. Stated rather
-- than left to the master flag, so an old item can never leak onto the board.
-- Same rule — only where the year has no row yet.
INSERT INTO sponsorship_item_year (id, item_id, year, amount, is_active, notes)
SELECT 'siy-' || id || '-2026', id, 2026, NULL, 0, 'not offered in 2026'
FROM sponsorship_item
WHERE id NOT IN (SELECT item_id FROM sponsorship_item_year WHERE year = 2026);

-- ── 3. Standing pledges ─────────────────────────────────────────────────────
-- The external artist fee is Tapash Basu's, at an amount he has not disclosed.
-- amount = 0 is how the app records "pledged the cost, figure unknown": the
-- slot is off the board for anyone else, the board reads "the cost" rather
-- than ₹0, and it adds nothing to the pledged total. Recording payment asks
-- for the amount received and writes it to both the ledger entry and this row.
-- DO NOTHING, not REPLACE: a re-run must never resurrect a pledge that was
-- since paid or cancelled in the app.
INSERT INTO sponsorship_pledge (id, item_id, year, person_id, amount, status, ledger_entry_id, pledged_on, notes) VALUES
  ('plg-cultural-external-artist-2026', 'cultural-external-artist', 2026, 'arc-tapash-basu', 0, 'pledged', NULL, '2026-09-01', 'Amount undisclosed — set the real figure before recording payment')
ON CONFLICT(id) DO NOTHING;

-- Pledged before the board opened, at the 2026 price of each slot. Plain
-- 'pledged' — no money has moved until finance records the payment.
INSERT INTO sponsorship_pledge (id, item_id, year, person_id, amount, status, ledger_entry_id, pledged_on, notes) VALUES
  -- Samit Banerjee
  ('plg-ashtami-bhog-1-2026', 'ashtami-bhog-1', 2026, 'arc-samit-banerjee', 30000, 'pledged', NULL, '2026-09-01', NULL),
  -- Pulakesh Chatterjee
  ('plg-sandhi-luchi-bhog-2026', 'sandhi-luchi-bhog', 2026, 'arc-pulakesh-chatterjee', 20000, 'pledged', NULL, '2026-09-01', NULL),
  -- Asish Barman
  ('plg-padma-phul-2026', 'padma-phul', 2026, 'arc-asish-barman', 5000, 'pledged', NULL, '2026-09-01', NULL),
  -- Devashish Bhattacharya
  ('plg-ashtami-puja-1-2026', 'ashtami-puja-1', 2026, 'arc-devashish-bhattacharya', 5000, 'pledged', NULL, '2026-09-01', NULL),
  -- Pradyumna Das Roy
  ('plg-murti-moncha-2026', 'murti-moncha', 2026, 'p-prady', 5000, 'pledged', NULL, '2026-09-01', NULL)
ON CONFLICT(id) DO NOTHING;
