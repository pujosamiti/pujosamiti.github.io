-- Durga Pujo 2026: the caterer's menu and per-plate rates for the five bhog
-- days — the final menu agreed with the vendor (Suvo Gupta, 5 Oct 2026; bhog
-- at 11 am). Saptami is khichudi with bandhakopi, Ashtami takes the paneer
-- pulao and luchi menu that was Saptami's, Ashtami · Day-2 keeps its khichudi
-- (and the special of luchi and alu dum for 25 heads), Nabami's papad is plain
-- papad, Dashami has no ghee. Rates 225 for Saptami to Ashtami · Day-2, 250 for
-- Nabami and Dashami (were 250 and 270, from the 29 Sep sheet). Keyed by day
-- label, so it applies to any seeding of the year. Idempotent: it replaces the
-- year's dishes wholesale, with stable ids.
DELETE FROM bhog_menu_item WHERE menu_id IN (SELECT id FROM bhog_menu WHERE event_id='durga-pujo-2026');

UPDATE bhog_menu SET per_plate_cost=225, notes=NULL WHERE event_id='durga-pujo-2026' AND label='Saptami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '228d6863-6d21-488e-be71-e4b915eee766', id, 'Khichudi', 'খিচুড়ি', 10 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Saptami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT 'cd888923-ea8a-424f-8234-3b3f97562274', id, 'Bandhakopi Torkari with Alu & Koraishuti', 'আলু-কড়াইশুঁটি দিয়ে বাঁধাকপির তরকারি', 20 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Saptami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '62bea413-a7ca-43ab-9cf3-3d93d6fcebf5', id, 'Beguni', 'বেগুনি', 30 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Saptami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT 'd919449a-87d8-4c04-a0f0-4c9b4a35cc06', id, 'Papad', 'পাপড়', 40 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Saptami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '33dbf578-b850-4f30-b015-0d3431daa457', id, 'Tomato & Khejur Chatni', 'টমেটো খেজুরের চাটনি', 50 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Saptami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '87e44e6c-efd5-4789-9288-ea34702d9c6e', id, 'Kheer Cham Cham', 'ক্ষীর চমচম', 60 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Saptami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT 'c428d60e-c4ad-48c7-8d74-38d60bd2c987', id, 'Water Bottle', 'জলের বোতল', 70 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Saptami Bhog';

UPDATE bhog_menu SET per_plate_cost=225, notes=NULL WHERE event_id='durga-pujo-2026' AND label='Ashtami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT 'e6c41ee4-d8e8-5051-9069-86dce9130bd2', id, 'Paneer Pulao', 'পনির পোলাও', 10 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Ashtami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT 'b5b981cd-05e1-5b60-9b7a-a177fece635e', id, 'Cholar Dal', 'ছোলার ডাল', 20 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Ashtami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT 'd68ab442-15a5-516d-8567-474e36b6a869', id, 'Fulkopi Torkari', 'ফুলকপির তরকারি', 30 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Ashtami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '0ae577eb-6efd-57db-95ef-a2d159411b4f', id, 'Luchi (Atta + Maida)', 'লুচি (আটা-ময়দা)', 40 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Ashtami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '138dfc48-2f84-58a7-9e3d-4df30c77560d', id, 'Tomato Chatni', 'টমেটোর চাটনি', 50 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Ashtami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '0bf3d1c4-ae99-5aaa-9071-870a9606bf95', id, 'Papad', 'পাপড়', 60 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Ashtami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT 'cb0305ee-f106-5c26-bfa6-61f4aab943bc', id, 'Sondesh', 'সন্দেশ', 70 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Ashtami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '23d3ba5e-096d-5e51-bb26-8021c22239b4', id, 'Water Bottle', 'জলের বোতল', 80 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Ashtami Bhog';

UPDATE bhog_menu SET per_plate_cost=225, notes='Special: Luchi + Alu Dum, for 25 heads only' WHERE event_id='durga-pujo-2026' AND label='Ashtami · Day-2 Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '0dd6fbb8-a57d-57ed-92f2-c56dca701131', id, 'Khichudi', 'খিচুড়ি', 10 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Ashtami · Day-2 Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '82c1d25e-c150-5ea9-901c-874318503547', id, 'Labra', 'লাবড়া', 20 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Ashtami · Day-2 Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT 'b17053ee-5e43-51bd-8666-642b9c6ff87e', id, 'Beguni', 'বেগুনি', 30 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Ashtami · Day-2 Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '26f082c0-7627-5607-add5-9553d4671dd7', id, 'Papad', 'পাপড়', 40 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Ashtami · Day-2 Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT 'e2f47028-88b7-5dfa-a3cd-22a627388cf5', id, 'Rasgulla', 'রসগোল্লা', 50 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Ashtami · Day-2 Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT 'aaa460fe-6d59-5ddd-b7e5-43db897ba380', id, 'Pineapple Chatni', 'আনারসের চাটনি', 60 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Ashtami · Day-2 Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '584bbe48-67cf-5de5-a559-f7eae3a3a2f8', id, 'Water Bottle', 'জলের বোতল', 70 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Ashtami · Day-2 Bhog';

UPDATE bhog_menu SET per_plate_cost=250, notes=NULL WHERE event_id='durga-pujo-2026' AND label='Nabami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '40656895-e6c4-5eee-b26c-a7cb4070166e', id, 'Pulao', 'পোলাও', 10 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Nabami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT 'f688446a-f03d-50d1-9e84-53e0745b6872', id, 'Paneer Gravy', 'পনির', 20 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Nabami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '5a657df3-a85a-506c-9a33-e19905c415d7', id, 'Dal', 'ডাল', 30 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Nabami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT 'b0228b00-7d71-55ac-917a-527e193fd59e', id, 'Mixed Fruit Chatni', 'ফলের চাটনি', 40 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Nabami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '5397cf6c-146c-515e-ac06-c4a9c86f82ac', id, 'Papad', 'পাপড়', 50 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Nabami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '9e49875c-769a-593e-9a79-6c9cce2caf36', id, 'Komola Bhog', 'কমলাভোগ', 60 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Nabami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT 'cad093a5-a6a1-57fe-8168-24efd5842086', id, 'Water Bottle', 'জলের বোতল', 70 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Nabami Bhog';

UPDATE bhog_menu SET per_plate_cost=250, notes=NULL WHERE event_id='durga-pujo-2026' AND label='Dashami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '5405420c-6460-5cf3-a022-5732ce6fb111', id, 'Rice', 'ভাত', 10 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Dashami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '5d27f2e9-8243-5ef9-81f9-39f744a10514', id, 'Alu Posto', 'আলু পোস্ত', 20 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Dashami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '27607181-4a55-5aaa-ae1e-50af5866ac59', id, 'Dal', 'ডাল', 30 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Dashami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT 'fd4474d8-2b06-53c0-b998-fb9e75902b75', id, 'Jhuri Alu Bhaja', 'ঝুরি আলু ভাজা', 40 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Dashami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '6629f816-29b2-5227-bf77-020b2502160c', id, 'Tomato & Khejur Chatni', 'টমেটো খেজুরের চাটনি', 50 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Dashami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '193f3c62-9601-589c-93fa-77983373c3b9', id, 'Papad', 'পাপড়', 60 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Dashami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT '4dff4418-52d8-51bf-99b5-8b4f57031421', id, 'Cham Cham', 'চমচম', 70 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Dashami Bhog';
INSERT INTO bhog_menu_item (id, menu_id, title, title_bn, sort_order) SELECT 'd9f7a88d-8f65-5cdb-b8f1-d71d92d2a780', id, 'Water Bottle', 'জলের বোতল', 80 FROM bhog_menu WHERE event_id='durga-pujo-2026' AND label='Dashami Bhog';
