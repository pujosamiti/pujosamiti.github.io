-- Sponsorship 2026: the ledger and the Sponsorship board made to agree
-- (2 Oct 2026). Two payments were typed into the ledger by hand rather than
-- recorded against their pledges, so the board still showed the pledges as
-- unpaid. Each hand entry is deleted and the payment re-entered as the app's
-- "record payment" makes it — under the pledge-holder, the slot's category,
-- "Sponsorship: <slot> 2026" — keeping its date, amount, wallet, who
-- recorded it and when; the pledge is then marked paid against it.
-- Kakoli Baroi's voided duplicate is removed outright.
-- Nothing else refers to the deleted entries (checked: pledges, claims).

-- ── Dr Snita Nag Shinukumar · Saptami Bhog 2 · ₹20,000 (Samiran's wallet) ──
INSERT INTO ledger_entry (id, book_id, event_id, entry_date, kind, category, sub_category, amount, person_id, counterparty, wallet_person_id, to_wallet_person_id, notes, is_active, created_by, created_at)
SELECT 'c05866a2-e53d-451f-9d31-62520930105b', book_id, event_id, entry_date, 'contribution', 'sponsorship', 'Bhog', amount, 'arc-snita-nag-shinukumar', NULL, wallet_person_id, NULL, 'Sponsorship: Saptami Bhog 2 2026', 1, created_by, created_at
FROM ledger_entry WHERE id = '61c5a27f-4b21-48d4-9041-4a0809c2c83a';
UPDATE sponsorship_pledge SET status = 'paid', ledger_entry_id = 'c05866a2-e53d-451f-9d31-62520930105b'
WHERE id = '7cc80602-27d8-4523-9edb-b251b0e8e601' AND status = 'pledged';
DELETE FROM ledger_entry WHERE id = '61c5a27f-4b21-48d4-9041-4a0809c2c83a';

-- ── Soumitra Ganguly's pledge · Kojagari Lakshmi Puja Bhog · ₹10,000 ──────
-- Typed in under Dr Paulami Bagchi Ganguly (same household); the pledge is
-- Soumitra's, so the entry is his, as "record payment" would make it.
INSERT INTO ledger_entry (id, book_id, event_id, entry_date, kind, category, sub_category, amount, person_id, counterparty, wallet_person_id, to_wallet_person_id, notes, is_active, created_by, created_at)
SELECT '98d17112-4735-424b-9b1d-5bf3dd571cf5', book_id, event_id, entry_date, 'contribution', 'sponsorship', 'Lakshmi Puja', amount, 'arc-soumitra-ganguly', NULL, wallet_person_id, NULL, 'Sponsorship: Kojagari Lakshmi Puja Bhog 2026 (paid by Dr Paulami Bagchi Ganguly)', 1, created_by, created_at
FROM ledger_entry WHERE id = '69973272-58a2-4a80-9d58-171558dd2be1';
UPDATE sponsorship_pledge SET status = 'paid', ledger_entry_id = '98d17112-4735-424b-9b1d-5bf3dd571cf5'
WHERE id = '3ca68ccb-f62f-479d-b6f4-978598ff6af3' AND status = 'pledged';
DELETE FROM ledger_entry WHERE id = '69973272-58a2-4a80-9d58-171558dd2be1';

-- ── Kakoli Baroi · the voided duplicate of her Ashtami Puja 6 payment ─────
DELETE FROM ledger_entry WHERE id = 'c5c8ea4b-183a-4c59-82dc-ab5c6670ad45' AND is_active = 0;

-- ── Nisith Sarkar · Lakshmi Puja · ₹5,000, sent in by Urbi Sarkar ─────────
-- Entered under Urbi Sarkar; the sponsor is Nisith Sarkar (same household)
-- and Urbi sent the money. The hand-typed sub-category "Lakkhi Pujo 1" takes
-- the board's own "Lakshmi Puja", as every other Lakshmi sponsorship has it.
-- No 2026 slot or pledge exists for it, so it stays a ledger-only sponsorship.
UPDATE ledger_entry SET person_id = 'arc-nisith-sarkar', sub_category = 'Lakshmi Puja',
  notes = 'Lakkhi Pujo 1 — sent in by Urbi Sarkar'
WHERE id = 'e5561834-45f1-41c9-962a-858eb2096ff7' AND person_id = 'arc-urbi-sarkar';

-- ── A Kojagari Lakshmi Puja slot on the 2026 board, Nisith Sarkar's ──────
-- The ₹5,000 above had no slot to sit in. The board gains "Kojagari Lakshmi
-- Puja" (₹5,000, Lakshmi Puja, beside its Bhog), offered for 2026; Nisith's
-- pledge on it is recorded paid against that entry, which takes the note
-- "record payment" would give it.
INSERT INTO sponsorship_item (id, category, title, default_amount, sort_order, is_active, created_at, tagline, tagline_bn)
VALUES ('lakshmi-pujo', 'Lakshmi Puja', 'Kojagari Lakshmi Puja', 5000, 790, 1, 1790960713,
  'Keep Lakshmi''s seat ready on Kojagari night.', 'কোজাগরী রাতে লক্ষ্মীর আসন পাতুন আপনিই।');
INSERT INTO sponsorship_item_year (id, item_id, year, amount, is_active, notes)
VALUES ('siy-lakshmi-pujo-2026', 'lakshmi-pujo', 2026, 5000, 1, NULL);
INSERT INTO sponsorship_pledge (id, item_id, year, person_id, amount, status, ledger_entry_id, pledged_on, notes)
VALUES ('44a9326b-d2c7-4f1c-8d9e-a0c3d69a2a6f', 'lakshmi-pujo', 2026, 'arc-nisith-sarkar', 5000, 'paid', 'e5561834-45f1-41c9-962a-858eb2096ff7', '2026-10-02', 'Sent in by Urbi Sarkar');
UPDATE ledger_entry SET notes = 'Sponsorship: Kojagari Lakshmi Puja 2026 — sent in by Urbi Sarkar'
WHERE id = 'e5561834-45f1-41c9-962a-858eb2096ff7';
