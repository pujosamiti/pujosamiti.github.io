-- Durga Pujo 2026 bhog headcount go-live data, 28 Sep 2026 — run after
-- drizzle/0012_bhog-headcount.sql. Safe to re-run.
--
-- 1. The repeated Ashtami's bhog day reads "Day-2": hyphenated, the "2" never
--    breaks away from "Day" in a narrow column or a spreadsheet heading.
--    (Seeding now writes it this way; seed-bhog-2026.sql matches.)
UPDATE bhog_menu SET label = 'Ashtami · Day-2 Bhog'
WHERE event_id = 'durga-pujo-2026' AND label = 'Ashtami · Day 2 Bhog';

-- 2. Guest bhog: Suvadip (Suvo) Gupta is the Food & Bhog in-charge — the
--    default "Received by" — and a core household's guests are ₹250 a head.
--    Both can be changed on /bhog (Guest bhog panel).
INSERT INTO bhog_setting (event_id, incharge_person_id, guest_rate, updated_by, updated_at)
VALUES ('durga-pujo-2026', 'arc-suvadip-gupta', 250, 'p-prady', 1790589600)
ON CONFLICT (event_id) DO NOTHING;

-- 3. updated_at is Unix seconds (Drizzle's timestamp mode). The first run of
--    this script (28 Sep 2026) wrote milliseconds; this puts any such value
--    right and does nothing once it is.
UPDATE bhog_setting SET updated_at = updated_at / 1000 WHERE updated_at > 100000000000;
