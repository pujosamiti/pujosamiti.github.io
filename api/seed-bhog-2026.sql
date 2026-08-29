-- Durga Pujo 2026: last season's menu and per-plate rates copied onto
-- the seeded bhog days (rates from 2025-Durga-Puja-Bhog.xlsx sheet 2;
-- the Ashtami menu repeats on both Ashtami days). Keyed by day label,
-- so it applies to any seeding of the year. Idempotent.
DELETE FROM bhog_menu_item WHERE menu_id IN (SELECT id FROM bhog_menu WHERE event_id='durga-pujo-2026');

UPDATE bhog_menu SET per_plate_cost=225 WHERE event_id='durga-pujo-2026' AND label='Saptami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT 'fa4e6114-bd95-537c-b05a-bcaab68fd265', id, 'Rice', 'ভাত', 10 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Saptami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '19ac71ba-a672-543c-8aaa-25a2bf1ac2b3', id, 'Alu Bhaja', 'আলু ভাজা', 20 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Saptami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '3ba3b1dc-cbce-55d8-8499-1d05675c5199', id, 'Dal', 'ডাল', 30 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Saptami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT 'bbc4a2a1-6846-5622-a0b7-0cf4b1e80a43', id, 'Veg Kofta', 'ভেজ কোফতা', 40 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Saptami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '0d8620a8-e629-5dac-a97f-c60713c650f0', id, 'Kumro Bhaja', 'কুমড়ো ভাজা', 50 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Saptami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '14f29894-7fe1-5379-b12a-83cd2ac2a505', id, 'Chatni', 'চাটনি', 60 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Saptami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '0082f536-d59c-5305-af10-51962a9810e5', id, 'Papad', 'পাপড়', 70 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Saptami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT 'ca465cd3-c55e-5d9e-86a6-6222af8c046b', id, 'Kheer Cham Cham', 'ক্ষীর চমচম', 80 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Saptami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '315b4e14-e4c5-57f3-8af5-2704d6d0d402', id, 'Water Bottle', 'জলের বোতল', 90 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Saptami Bhog';

UPDATE bhog_menu SET per_plate_cost=225 WHERE event_id='durga-pujo-2026' AND label='Ashtami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '13b8f815-1450-59f0-a785-8a3c505e0225', id, 'Khichudi', 'খিচুড়ি', 10 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Ashtami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT 'f477d10e-8c87-577f-bb3b-d6a53636ea04', id, 'Labra', 'লাবড়া', 20 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Ashtami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '3575914c-c049-556b-b486-15edb4315d09', id, 'Beguni', 'বেগুনি', 30 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Ashtami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '93a545f4-60ef-5321-b198-b1de6f71748d', id, 'Papad', 'পাপড়', 40 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Ashtami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '4cccbd47-9c9f-5309-b2ce-03327dfbe0b1', id, 'Rasgulla', 'রসগোল্লা', 50 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Ashtami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '7a6a9d95-02f3-593a-92d7-d70283023b1e', id, 'Pineapple Chatni', 'আনারসের চাটনি', 60 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Ashtami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '0890a590-db92-5c85-8581-7ecb2f597c31', id, 'Water Bottle', 'জলের বোতল', 70 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Ashtami Bhog';

UPDATE bhog_menu SET per_plate_cost=225 WHERE event_id='durga-pujo-2026' AND label='Ashtami · Day 2 Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT 'aa61a19e-12a9-530c-a915-51e4c66de132', id, 'Khichudi', 'খিচুড়ি', 10 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Ashtami · Day 2 Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '0927f1fb-d564-5150-9b99-233d1f06ae13', id, 'Labra', 'লাবড়া', 20 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Ashtami · Day 2 Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT 'f8b1d4b1-3f2e-5e95-847b-8d377baa5859', id, 'Beguni', 'বেগুনি', 30 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Ashtami · Day 2 Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT 'a36e7974-811a-5be3-85f0-c37b857c28ab', id, 'Papad', 'পাপড়', 40 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Ashtami · Day 2 Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT 'b890e593-9643-5ff7-bf9a-c639b0edd322', id, 'Rasgulla', 'রসগোল্লা', 50 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Ashtami · Day 2 Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT 'c2d00648-3342-5410-b2de-9a6c92db849c', id, 'Pineapple Chatni', 'আনারসের চাটনি', 60 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Ashtami · Day 2 Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT 'da96055e-979f-5fbb-9e59-0107fbb7e4ee', id, 'Water Bottle', 'জলের বোতল', 70 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Ashtami · Day 2 Bhog';

UPDATE bhog_menu SET per_plate_cost=250 WHERE event_id='durga-pujo-2026' AND label='Nabami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '9041cb15-2a6d-5db0-bed5-5e2c35ae69a7', id, 'Pulao', 'পোলাও', 10 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Nabami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '563911fc-7887-5ae5-a5fc-7b655e1218f1', id, 'Paneer Gravy', 'পনির', 20 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Nabami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT 'f205bfcd-499e-56a8-8e89-9d47f928d44f', id, 'Dal', 'ডাল', 30 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Nabami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT 'd56eed11-7bee-54bf-b945-ea250cd024fb', id, 'Mixed Fruit Chatni', 'ফলের চাটনি', 40 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Nabami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '2fe70203-45e4-58a3-862b-6e47dd361605', id, 'Papad', 'পাপড়', 50 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Nabami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '819f8d96-801b-53d0-9d96-b0939c00b4e7', id, 'Komola Bhog', 'কমলাভোগ', 60 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Nabami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '188b3c48-e26a-56a1-b6ad-dd58ce4598a1', id, 'Water Bottle', 'জলের বোতল', 70 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Nabami Bhog';

UPDATE bhog_menu SET per_plate_cost=250 WHERE event_id='durga-pujo-2026' AND label='Dashami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT 'e3a0213e-b51d-530f-a5f3-eed25d20cdd6', id, 'Rice', 'ভাত', 10 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Dashami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '1d52954c-51e5-5dd9-8d15-19812d7e6a42', id, 'Alu Posto', 'আলু পোস্ত', 20 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Dashami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '8ef21458-4824-5cb2-b77a-8021edd6a388', id, 'Dal', 'ডাল', 30 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Dashami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT 'e3f39fa0-9952-5ddf-b4d2-e84a6d572177', id, 'Ghee', 'ঘি', 40 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Dashami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '92a97ecf-d8c5-56fa-bd78-ea45a326f0dd', id, 'Fulkopi Bhaja', 'ফুলকপি ভাজা', 50 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Dashami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT 'b9201b21-2622-5d65-a6fe-76643c5c77c7', id, 'Tomato & Khejur Chatni', 'টমেটো খেজুরের চাটনি', 60 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Dashami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT 'f19c5e6a-925e-538f-975d-ccef00477868', id, 'Papad', 'পাপড়', 70 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Dashami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '03155767-5bce-559f-ba6b-120d93476e32', id, 'Cham Cham', 'চমচম', 80 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Dashami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT 'e0ea6962-8840-5f99-8d98-edfff33e0edb', id, 'Water Bottle', 'জলের বোতল', 90 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Dashami Bhog';

