-- The 2026 sponsorship board brought in line with the samiti's latest sheet
-- (sponsorship-01, 2 Oct 2026). Run AFTER fix-sponsorship-2026-ledger.sql,
-- which creates the Kojagari Lakshmi Puja slot renamed here.
-- Only additions: slots the sheet offers that the board didn't, and the
-- sheet's new pledges. Every other line of the sheet already matched.

-- ── Slots already in the catalog, now offered for 2026 at the sheet's price ─
UPDATE sponsorship_item_year SET is_active = 1, amount = 20000 WHERE id = 'siy-nabami-bhog-2-2026';
UPDATE sponsorship_item_year SET is_active = 1, amount = 20000 WHERE id = 'siy-dashami-bhog-1-2026';
UPDATE sponsorship_item_year SET is_active = 1, amount = 5000 WHERE id = 'siy-dhaki-1-2026';
UPDATE sponsorship_item_year SET is_active = 1, amount = 5000 WHERE id = 'siy-dhaki-2-2026';
UPDATE sponsorship_item_year SET is_active = 1, amount = 5000 WHERE id = 'siy-purohit-dakshina-2-2026';

-- ── New slots: Padma Phul 2, Ashtami Puja 8, Lakshmi Puja 2 ──────────────
-- (the sheet's "Padma Phul 3" left out at the samiti's word: two lotus slots)
INSERT INTO sponsorship_item (id, category, title, default_amount, sort_order, is_active, created_at, tagline, tagline_bn) VALUES
  ('padma-phul-2', 'Flowers & Garlands', 'Sandhi Puja Lotus Flowers 2', 5000, 366, 1, 1790960951, NULL, NULL),
  ('ashtami-puja-8', 'Puja', 'Ashtami Puja 8', 5000, 431, 1, 1790960951, NULL, NULL),
  ('lakshmi-pujo-2', 'Lakshmi Puja', 'Kojagari Lakshmi Puja 2', 5000, 795, 1, 1790960951, NULL, NULL);
INSERT INTO sponsorship_item_year (id, item_id, year, amount, is_active, notes) VALUES
  ('siy-padma-phul-2-2026', 'padma-phul-2', 2026, 5000, 1, NULL),
  ('siy-ashtami-puja-8-2026', 'ashtami-puja-8', 2026, 5000, 1, NULL),
  ('siy-lakshmi-pujo-2-2026', 'lakshmi-pujo-2', 2026, 5000, 1, NULL);
-- the sheet numbers the Lakshmi Puja slots: the first becomes "1"
UPDATE sponsorship_item SET title = 'Kojagari Lakshmi Puja 1' WHERE id = 'lakshmi-pujo';

-- ── New pledges (pledged — not yet paid) ──────────────────────────────────
INSERT INTO sponsorship_pledge (id, item_id, year, person_id, amount, status, ledger_entry_id, pledged_on, notes) VALUES
  ('c6d3ed4e-0460-4648-8ef8-820f0b922a09', 'padma-phul-2', 2026, 'arc-bidisha-chakraborty', 5000, 'pledged', NULL, '2026-10-02', 'Bidisha & Arindam'),
  ('5040b22d-6e8f-4af1-ba8c-8b4d1c4061b3', 'sandhi-puja-4', 2026, 'arc-purnima-chattopadhyay', 5000, 'pledged', NULL, '2026-10-02', NULL);

-- ── Names, at the samiti's word: two Nabami Bhog slots are "1" and "2", as
-- are the two Sandhi Puja Lotus Flowers; the one Dashami Bhog loses its number. (Titles are the slot's own, so earlier
-- years' boards read the new names too.)
UPDATE sponsorship_item SET title = 'Nabami Bhog 1' WHERE id = 'nabami-bhog-1';
UPDATE sponsorship_item SET title = 'Dashami Bhog' WHERE id = 'dashami-bhog-1';
UPDATE sponsorship_item SET title = 'Sandhi Puja Lotus Flowers 1' WHERE id = 'padma-phul';
