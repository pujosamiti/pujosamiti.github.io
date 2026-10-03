-- 2026 Grocery order, at the samiti's word (3 Oct 2026). Six deliveries —
-- Shashthi, Saptami, Ashtami, Ashtami Day 2, Nabami, Dashami — and nothing in
-- the Sandhi Puja column (Ashtami Day 2's delivery covers it). What is bought
-- once — Anando Nadu's sugar, the Dadhikarma things — rides with Shashthi's.
-- Only 2026's delivery columns are touched.

-- nothing for grocery in the Sandhi Puja column
DELETE FROM procurement_need WHERE day_id = 'c33b1a12-24be-46ed-abf3-f25a8555808f'
  AND item_id IN (SELECT id FROM procurement_item WHERE category = 'Grocery');

-- 2 · Sugar: 250 gm each day; Anando Nadu's 4 kg with Shashthi's
DELETE FROM procurement_need WHERE item_id = '60fb8099-5bde-599a-a1dc-37655bdcb518' AND day_id IN (SELECT id FROM procurement_day WHERE year = 2026);
INSERT INTO procurement_need (id, item_id, day_id, slot, quantity, notes, purchased) VALUES
  ('3b1cd169-bc08-5970-a5e8-31033a6ec65b', '60fb8099-5bde-599a-a1dc-37655bdcb518', 'a04d4fde-98a7-4307-bb15-152af0bf0bb1', 'morning', '250 gm + 4 kg for Anando Nadu', NULL, 0),
  ('f03f60bf-8b3a-5a99-b67e-ed118d30ab32', '60fb8099-5bde-599a-a1dc-37655bdcb518', '4dd6e744-f113-40ed-b376-f0ed47e30e97', 'morning', '250 gm', NULL, 0),
  ('a9506747-f192-51e9-8a3c-955c4261e8a5', '60fb8099-5bde-599a-a1dc-37655bdcb518', '30945b43-a405-4c4a-ac84-cc38698de9f7', 'morning', '250 gm', NULL, 0),
  ('20fb630c-44f2-56f3-afb1-fef936d249bf', '60fb8099-5bde-599a-a1dc-37655bdcb518', '79cfaa86-d0d2-4e16-9f95-1b3b2ee22fe6', 'morning', '250 gm', NULL, 0),
  ('ba9c9c7e-9096-504f-a513-f3c589d2f2b7', '60fb8099-5bde-599a-a1dc-37655bdcb518', '141387fd-c7ca-4b53-93fb-f4d34da6cbb1', 'morning', '250 gm', NULL, 0),
  ('4c08dfb5-be9a-5888-a455-95cd378279d4', '60fb8099-5bde-599a-a1dc-37655bdcb518', 'b9aed6f8-37c4-468f-ba67-9286bb95dfa8', 'morning', '250 gm', NULL, 0);

-- 7 · Mustard oil 200 ml bottles: 2 each day
UPDATE procurement_need SET quantity = '2' WHERE item_id = '705fdcce-bfcd-5029-8443-34846445f824' AND day_id IN (SELECT id FROM procurement_day WHERE year = 2026);

-- 9 · the full name
UPDATE procurement_item SET title = 'Paan Masala (kaataa Supari, Mouri, labango, choto elaichi, masala)' WHERE id = '85f75446-92ea-5834-9e5b-fbbb5f67f1b9';

-- 10 · Gota Supari: none this year
DELETE FROM procurement_need WHERE item_id = 'f2afecc3-d9b6-5f56-bb9c-39e0f989a14b' AND day_id IN (SELECT id FROM procurement_day WHERE year = 2026);
UPDATE procurement_item_year SET total_quantity = '0' WHERE item_id = 'f2afecc3-d9b6-5f56-bb9c-39e0f989a14b' AND year = 2026;

-- 14 · Dabur Honey/Madhu very small bottles: sits out 2026
DELETE FROM procurement_need WHERE item_id = '56746b53-70e6-52a6-a989-b9025425064d' AND day_id IN (SELECT id FROM procurement_day WHERE year = 2026);
DELETE FROM procurement_item_year WHERE item_id = '56746b53-70e6-52a6-a989-b9025425064d' AND year = 2026;

-- bought once, with Shashthi's delivery: Elaichi, Batasha Sada, and the Dadhikarma jaggery and elaichi powders
DELETE FROM procurement_need WHERE day_id IN (SELECT id FROM procurement_day WHERE year = 2026) AND item_id IN ('caa0e8ad-5768-51f5-b49f-3df940ea9119', '9d1e5652-77dd-5473-b68c-a25a5057154b', 'c135b611-4042-54cd-a4c9-1ef55fe45cda', 'bc1d07a9-a0c5-5546-983a-ef35083ae98b');
INSERT INTO procurement_need (id, item_id, day_id, slot, quantity, notes, purchased) VALUES
  ('7b2539f6-9e40-5729-b170-a06a040cd64b', 'caa0e8ad-5768-51f5-b49f-3df940ea9119', 'a04d4fde-98a7-4307-bb15-152af0bf0bb1', 'morning', '2 packet', NULL, 0),
  ('81ae326c-d1e6-5b8d-9ac0-5ca936e727b2', '9d1e5652-77dd-5473-b68c-a25a5057154b', 'a04d4fde-98a7-4307-bb15-152af0bf0bb1', 'morning', '1 kg', NULL, 0),
  ('880609b5-b806-5233-935a-4fc14b0a5756', 'c135b611-4042-54cd-a4c9-1ef55fe45cda', 'a04d4fde-98a7-4307-bb15-152af0bf0bb1', 'morning', '500 gm', NULL, 0),
  ('aa24fdc3-729c-54c0-b8c3-c458d9f1f6b4', 'bc1d07a9-a0c5-5546-983a-ef35083ae98b', 'a04d4fde-98a7-4307-bb15-152af0bf0bb1', 'morning', '50 gm', NULL, 0);
