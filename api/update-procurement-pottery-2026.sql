-- 2026 Pottery: what was bought this year (the samiti's list, 4 Oct 2026).
-- Each bought item takes the quantity bought and is marked done; items not
-- bought sit out 2026. A year's quantity lives in procurement_item_year, so
-- earlier years keep theirs. Two products are new this year and join the
-- catalog as items of their own: the big kandil that replaces the jaag
-- haadi, and the medium diyas, bought apart from the biggest. Only
-- procurement tables are touched.

-- bought
UPDATE procurement_item_year SET total_quantity = '125', status = 'done' WHERE year = 2026 AND item_id = '4f58657e-0b50-5bdd-991b-eba939a5e3a5'; -- Diya (small) — small pradeep for sandhi puja
UPDATE procurement_item_year SET total_quantity = '2',   status = 'done' WHERE year = 2026 AND item_id = '81060834-a75d-5758-9dda-eac2f24e507f'; -- Diya (biggest, for akhanda pradip) — big pradeep
UPDATE procurement_item_year SET total_quantity = '20',  status = 'done' WHERE year = 2026 AND item_id = '145884be-35e5-57ba-87af-fe0cd7a4e64a'; -- Glass — jaler glass or kulhad
UPDATE procurement_item_year SET total_quantity = '1',   status = 'done' WHERE year = 2026 AND item_id = '455c39ff-aeae-5ba2-978f-83dcd97c65bc'; -- Large Dhunuchi — dhunochi for the purohit
UPDATE procurement_item_year SET total_quantity = '15',  status = 'done' WHERE year = 2026 AND item_id = '0503d65a-4af9-5bbd-a1d5-48b9274ac301'; -- Dhunuchi — dhunochi for dance
UPDATE procurement_item_year SET total_quantity = '7',   status = 'done' WHERE year = 2026 AND item_id = '8b650080-9a87-5ef3-80ea-663ad8e908bf'; -- Big Plates — maatir thaala
UPDATE procurement_item_year SET total_quantity = '1',   status = 'done' WHERE year = 2026 AND item_id = '1e9e5284-d2ac-590f-b125-5dbe224c3208'; -- Kalsi with base
UPDATE procurement_item_year SET total_quantity = '8',   status = 'done' WHERE year = 2026 AND item_id = '35e56461-3cfd-5dd7-a6ed-a4bce27f0c08'; -- Sara
UPDATE procurement_item_year SET total_quantity = '4',   status = 'done' WHERE year = 2026 AND item_id = 'edf9ed8a-1e9d-540e-9a49-fe3e5cd30eb5'; -- Ghat

-- the big pradeep's Shashthi note ("7 mid size pradip not found in the carton") — the medium diyas are bought now
DELETE FROM procurement_need WHERE id = '16b773fa-e0af-4db9-8853-9091359b7149';

-- new this year: the big kandil (in place of the jaag haadi) and the medium diyas
INSERT INTO procurement_item (id, category, title, name_hi, name_bn, details, suggested_total, sort_order, is_active, created_at) VALUES
  ('big-kandil', 'Pottery', 'Big Kandil (replacement of Jaag Haadi)', NULL, NULL, NULL, NULL, 65, 1, 1791090204),
  ('diya-medium', 'Pottery', 'Diya (medium size)', NULL, NULL, NULL, NULL, 25, 1, 1791090204)
ON CONFLICT(id) DO NOTHING;
INSERT INTO procurement_item_year (id, item_id, year, total_quantity, status, due_date, due_time, notes) VALUES
  ('piy-big-kandil-2026', 'big-kandil', 2026, '1', 'done', NULL, NULL, NULL),
  ('piy-diya-medium-2026', 'diya-medium', 2026, '7', 'done', NULL, NULL, NULL)
ON CONFLICT(id) DO UPDATE SET total_quantity = excluded.total_quantity, status = excluded.status;

-- not bought: sit out 2026
DELETE FROM procurement_item_year WHERE year = 2026 AND item_id IN (
  '05367cc7-4324-5062-8a54-ed10ebdda96d', -- jaag handi with cover (replaced by the big kandil)
  '45862cb1-3325-51a2-b006-cb1229fda573', -- Maatir Ghat with flat base
  '3a131465-7e24-5fd3-b096-77e90c8e20f4', -- dhunochi small (for dance)
  'eb01c8bf-eeee-5592-ab85-d100e250acb6'  -- maatir hadi
);

-- the samiti's own names and order for the pottery (an item's name is the
-- catalog's, so earlier years read the new names too; their quantities stay)
UPDATE procurement_item SET title = 'Big Kandil (replacement of Jaag Haadi)', sort_order = 10  WHERE id = 'big-kandil';
UPDATE procurement_item SET title = 'Diya (biggest size for akhanda Pradip)', sort_order = 20  WHERE id = '81060834-a75d-5758-9dda-eac2f24e507f';
UPDATE procurement_item SET title = 'Diya (medium size)',                     sort_order = 30  WHERE id = 'diya-medium';
UPDATE procurement_item SET title = 'Diya (small)',                           sort_order = 40  WHERE id = '4f58657e-0b50-5bdd-991b-eba939a5e3a5';
UPDATE procurement_item SET title = 'Dhunuchi',                               sort_order = 50  WHERE id = '0503d65a-4af9-5bbd-a1d5-48b9274ac301';
UPDATE procurement_item SET title = 'Large Dhunuchi',                         sort_order = 60  WHERE id = '455c39ff-aeae-5ba2-978f-83dcd97c65bc';
UPDATE procurement_item SET title = 'Ghat',                                   sort_order = 70  WHERE id = 'edf9ed8a-1e9d-540e-9a49-fe3e5cd30eb5';
UPDATE procurement_item SET title = 'Sara',                                   sort_order = 80  WHERE id = '35e56461-3cfd-5dd7-a6ed-a4bce27f0c08';
UPDATE procurement_item SET title = 'Glass',                                  sort_order = 90  WHERE id = '145884be-35e5-57ba-87af-fe0cd7a4e64a';
UPDATE procurement_item SET title = 'Kalsi with base',                        sort_order = 100 WHERE id = '1e9e5284-d2ac-590f-b125-5dbe224c3208';
UPDATE procurement_item SET title = 'Big Plates',                             sort_order = 110 WHERE id = '8b650080-9a87-5ef3-80ea-663ad8e908bf';
