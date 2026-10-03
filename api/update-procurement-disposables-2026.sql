-- 2026 Disposables for Prasad Distribution, at the samiti's word (3 Oct 2026).
-- A year's quantity lives in procurement_item_year, so earlier years keep
-- theirs. Item 4 is a different product this year — a plastic packaging box
-- with lid, not aluminium boxes / pattal dona — so it joins the catalog as an
-- item of its own and the old one sits out 2026 (renaming the old item would
-- have rewritten what earlier years show). Items 8 and 9 sit out 2026.

-- 1 · Pattal bowl for fruit prasad · 600 (unchanged)
UPDATE procurement_item_year SET total_quantity = '600'  WHERE item_id = 'c4f810e6-b871-53e3-8206-cda27025065f' AND year = 2026;
-- 2 · Disposable glass for drinking water · 1000 → 1200
UPDATE procurement_item_year SET total_quantity = '1200' WHERE item_id = 'd7f08bb6-698b-5e1f-a3cf-21c14f252517' AND year = 2026;
-- 3 · Small disposable glass for tea (members) · 100 (unchanged)
UPDATE procurement_item_year SET total_quantity = '100'  WHERE item_id = '1d145fd1-3565-58a4-b3f3-6b26624658f7' AND year = 2026;
-- 4 · Plastic packaging box with lid · 200 — new; the aluminium boxes / pattal dona sit out 2026
INSERT INTO procurement_item (id, category, title, name_hi, name_bn, details, suggested_total, sort_order, is_active, created_at)
VALUES ('plastic-packaging-box-lid', 'Disposables for Prasad Distribution', 'Plastic Packaging Box with lid', NULL, NULL, NULL, NULL, 385, 1, 1791042669)
ON CONFLICT(id) DO NOTHING;
INSERT INTO procurement_item_year (id, item_id, year, total_quantity, status, due_date, due_time, notes)
VALUES ('piy-plastic-packaging-box-lid-2026', 'plastic-packaging-box-lid', 2026, '200', 'pending', NULL, NULL, NULL)
ON CONFLICT(id) DO UPDATE SET total_quantity = excluded.total_quantity;
DELETE FROM procurement_item_year WHERE item_id = '9eee1965-04ac-564d-8d7b-ea8906423fc3' AND year = 2026;
-- 5 · Disposable spoon · 1400 (unchanged)
UPDATE procurement_item_year SET total_quantity = '1400' WHERE item_id = 'fbb8a393-7135-511a-b54b-1cd3799cee9a' AND year = 2026;
-- 6 · Smallest pattal dona in plate · 700 → 1200
UPDATE procurement_item_year SET total_quantity = '1200' WHERE item_id = 'ac3b59e6-d5a7-532c-821c-9da9b95e1509' AND year = 2026;
-- 7 · Hard plate for members · 700 → 1000
UPDATE procurement_item_year SET total_quantity = '1000' WHERE item_id = 'e0235d26-a5db-5d4a-8414-bd4bdde6e659' AND year = 2026;
-- 8 · Pattal bowl for prasad distribution · sits out 2026
DELETE FROM procurement_item_year WHERE item_id = '258d6d40-3e80-571c-bfe1-c86dcc0cf2c5' AND year = 2026;
-- 9 · Pattal plate for members · sits out 2026
DELETE FROM procurement_item_year WHERE item_id = '8649a802-c203-5ccf-ba78-96b3cebee16a' AND year = 2026;
