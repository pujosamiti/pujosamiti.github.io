-- 2026 flower order, from the samiti's vendor sheet (3 Oct 2026). Every
-- 2026 Flowers / Garlands quantity is replaced by the sheet's: its six
-- delivery columns — Shashthi, Saptami, Ashtami, Sandhi Puja, Nabami,
-- Dashami, each the day before by 7 pm (the phoolwala's rule; the order
-- image dates them from the puja days) — one quantity per item and column,
-- on the evening slot. Items the sheet leaves out (Sheuli, Aparajita daal,
-- the jaba mala for Maa's hands, the 108 aparajita mala) and the Ashtami
-- Day 2 column (folded into Sandhi Puja on the sheet) carry no flower order.
-- The sheet's Dashami lotus "0" is left blank. Items take the sheet's order.

DELETE FROM procurement_need
WHERE item_id IN (SELECT id FROM procurement_item WHERE category = 'Flowers / Garlands')
  AND day_id IN (SELECT id FROM procurement_day WHERE year = 2026);

UPDATE procurement_item SET sort_order = 1140 WHERE id = 'c6409f98-bd8f-56d8-bd53-70eb866b1e29';
UPDATE procurement_item SET sort_order = 1150 WHERE id = 'ce7f2ca4-b646-50c5-88f1-791eeac4ac98';
UPDATE procurement_item SET sort_order = 1160 WHERE id = '7cc00f50-3468-5005-bc24-2b6e08229b25';
UPDATE procurement_item SET sort_order = 1170 WHERE id = 'bf4cfc5f-66c6-5e46-843e-b90a6f648350';
UPDATE procurement_item SET sort_order = 1180 WHERE id = 'eb2d3e17-939b-509e-85b8-d8fc50bce2f5';
UPDATE procurement_item SET sort_order = 1190 WHERE id = 'ae717be9-cbf0-509d-8b5e-ef3ee3aebfe4';
UPDATE procurement_item SET sort_order = 1200 WHERE id = '16f86332-afd4-59de-8f16-64d0e0ae844d';
UPDATE procurement_item SET sort_order = 1210 WHERE id = '61f91e1d-397c-5450-8313-32f799ae2400';
UPDATE procurement_item SET sort_order = 1220 WHERE id = 'f8d9968e-bd75-531d-a13c-6e57b0a663a4';
UPDATE procurement_item SET sort_order = 1230 WHERE id = 'a2177ad5-c11b-5d62-95de-117b0196a467';
UPDATE procurement_item SET sort_order = 1280 WHERE id = 'ebad6d45-bcd3-525e-ac62-b81fb4a2635a';
UPDATE procurement_item SET sort_order = 1290 WHERE id = '857d98b4-c596-5c80-9292-70f102a6e798';
UPDATE procurement_item SET sort_order = 1295 WHERE id = '19b21375-9b6f-5801-b967-4338fbee64ce';
UPDATE procurement_item SET sort_order = 1300 WHERE id = '55c2c265-4d2d-50da-836a-be49c9982c81';
UPDATE procurement_item SET sort_order = 1330 WHERE id = '5bfb70ba-a83b-5d6d-8742-c7adbe734d85';
UPDATE procurement_item SET sort_order = 1340 WHERE id = '54277989-be8f-5b01-9fd1-7df9dd1a1a6c';
UPDATE procurement_item SET sort_order = 1350 WHERE id = 'de08cf86-78fe-577f-bfb1-5affc4619c73';
UPDATE procurement_item SET sort_order = 1355 WHERE id = '19dba465-537d-5c6c-9cc4-b8ec87e0656d';
UPDATE procurement_item SET sort_order = 1357 WHERE id = 'a4f3fb1c-76c6-5fc6-a6d5-ae09877b815f';

INSERT INTO procurement_need (id, item_id, day_id, slot, quantity, notes, purchased) VALUES
  ('4b2d7491-78f4-5b80-a07c-aae81937a538', 'c6409f98-bd8f-56d8-bd53-70eb866b1e29', 'a04d4fde-98a7-4307-bb15-152af0bf0bb1', 'evening', '1 गड्डी / গোচ্ছা', NULL, 0),
  ('dc0f1878-99c7-5fc9-afe4-37be2266e0cd', 'c6409f98-bd8f-56d8-bd53-70eb866b1e29', '4dd6e744-f113-40ed-b376-f0ed47e30e97', 'evening', '1 गड्डी / গোচ্ছা', NULL, 0),
  ('19d02bf1-47a6-5c2f-8076-0abb8427dbf0', 'c6409f98-bd8f-56d8-bd53-70eb866b1e29', '30945b43-a405-4c4a-ac84-cc38698de9f7', 'evening', '1 गड्डी / গোচ্ছা', NULL, 0),
  ('1fa7a1f4-9b3f-5d73-9496-38cc04046703', 'c6409f98-bd8f-56d8-bd53-70eb866b1e29', 'c33b1a12-24be-46ed-abf3-f25a8555808f', 'evening', '1 गड्डी / গোচ্ছা', NULL, 0),
  ('7ed296af-e4bd-517b-ba21-001fef186ea8', 'c6409f98-bd8f-56d8-bd53-70eb866b1e29', '141387fd-c7ca-4b53-93fb-f4d34da6cbb1', 'evening', '1 गड्डी / গোচ্ছা', NULL, 0),
  ('af29e6eb-5e36-5462-acd8-a00db5e90b18', 'c6409f98-bd8f-56d8-bd53-70eb866b1e29', 'b9aed6f8-37c4-468f-ba67-9286bb95dfa8', 'evening', '1 गड्डी / গোচ্ছা', NULL, 0),
  ('8147ac82-8b01-57f6-81c4-56c1ee49b3de', 'ce7f2ca4-b646-50c5-88f1-791eeac4ac98', 'a04d4fde-98a7-4307-bb15-152af0bf0bb1', 'evening', '1 गड्डी / গোচ্ছা', NULL, 0),
  ('89e1d988-6162-50e5-a033-769a651e3056', 'ce7f2ca4-b646-50c5-88f1-791eeac4ac98', '4dd6e744-f113-40ed-b376-f0ed47e30e97', 'evening', '1 गड्डी / গোচ্ছা', NULL, 0),
  ('c50edea5-523a-56c8-b42b-ee2c67bddd78', 'ce7f2ca4-b646-50c5-88f1-791eeac4ac98', '30945b43-a405-4c4a-ac84-cc38698de9f7', 'evening', '1 गड्डी / গোচ্ছা', NULL, 0),
  ('bf796ae1-e444-5173-b00d-b4c61a0fc817', 'ce7f2ca4-b646-50c5-88f1-791eeac4ac98', 'c33b1a12-24be-46ed-abf3-f25a8555808f', 'evening', '1 गड्डी / গোচ্ছা', NULL, 0),
  ('e450acae-bafc-5555-96cb-6b7c203104da', 'ce7f2ca4-b646-50c5-88f1-791eeac4ac98', '141387fd-c7ca-4b53-93fb-f4d34da6cbb1', 'evening', '1 गड्डी / গোচ্ছা', NULL, 0),
  ('b4bc5d8c-93d2-530b-b14d-61f69aff03c7', 'ce7f2ca4-b646-50c5-88f1-791eeac4ac98', 'b9aed6f8-37c4-468f-ba67-9286bb95dfa8', 'evening', '1 गड्डी / গোচ্ছা', NULL, 0),
  ('e09f9287-4b54-5bcb-8ae7-0dd234ddaae5', '7cc00f50-3468-5005-bc24-2b6e08229b25', 'a04d4fde-98a7-4307-bb15-152af0bf0bb1', 'evening', '50/-', NULL, 0),
  ('258220af-e532-5942-b306-ee6a6050a71e', '7cc00f50-3468-5005-bc24-2b6e08229b25', '4dd6e744-f113-40ed-b376-f0ed47e30e97', 'evening', '100/-', NULL, 0),
  ('be148d8b-8ada-554c-986b-6568df5367cf', '7cc00f50-3468-5005-bc24-2b6e08229b25', '30945b43-a405-4c4a-ac84-cc38698de9f7', 'evening', '200/-', NULL, 0),
  ('effa819e-166d-5a2d-b6a2-f9f28978510b', '7cc00f50-3468-5005-bc24-2b6e08229b25', 'c33b1a12-24be-46ed-abf3-f25a8555808f', 'evening', '100/-', NULL, 0),
  ('b5571607-006d-5c97-a40a-36b308d78d43', '7cc00f50-3468-5005-bc24-2b6e08229b25', '141387fd-c7ca-4b53-93fb-f4d34da6cbb1', 'evening', '100/-', NULL, 0),
  ('19ea47be-de33-5713-9845-d994fe20e2e7', '7cc00f50-3468-5005-bc24-2b6e08229b25', 'b9aed6f8-37c4-468f-ba67-9286bb95dfa8', 'evening', '50/-', NULL, 0),
  ('43bc3834-fded-5743-978f-9f46fe442f84', 'bf4cfc5f-66c6-5e46-843e-b90a6f648350', '141387fd-c7ca-4b53-93fb-f4d34da6cbb1', 'evening', '300 pc', NULL, 0),
  ('f35585a4-da28-5755-a5ba-864cfb07132b', 'eb2d3e17-939b-509e-85b8-d8fc50bce2f5', '141387fd-c7ca-4b53-93fb-f4d34da6cbb1', 'evening', '30 pc', NULL, 0),
  ('166f92aa-44ca-5d4f-882b-65780dab9ff8', 'ae717be9-cbf0-509d-8b5e-ef3ee3aebfe4', 'a04d4fde-98a7-4307-bb15-152af0bf0bb1', 'evening', '30 pc', NULL, 0),
  ('64296f43-4b37-5918-b1e8-98d7ec3e826d', 'ae717be9-cbf0-509d-8b5e-ef3ee3aebfe4', '4dd6e744-f113-40ed-b376-f0ed47e30e97', 'evening', '50 pc', NULL, 0),
  ('9ebb17c0-3e1d-5635-bbff-a70efdea1214', 'ae717be9-cbf0-509d-8b5e-ef3ee3aebfe4', '30945b43-a405-4c4a-ac84-cc38698de9f7', 'evening', '80 pc', NULL, 0),
  ('0e34386e-bdb2-5f83-96be-7c783d767db2', 'ae717be9-cbf0-509d-8b5e-ef3ee3aebfe4', 'c33b1a12-24be-46ed-abf3-f25a8555808f', 'evening', '30 pc', NULL, 0),
  ('eed17db4-d606-5240-9c13-2b466b005579', 'ae717be9-cbf0-509d-8b5e-ef3ee3aebfe4', '141387fd-c7ca-4b53-93fb-f4d34da6cbb1', 'evening', '50 pc', NULL, 0),
  ('26c8b1e0-7774-520e-b432-1d9b95ba6695', 'ae717be9-cbf0-509d-8b5e-ef3ee3aebfe4', 'b9aed6f8-37c4-468f-ba67-9286bb95dfa8', 'evening', '100 pc', NULL, 0),
  ('bcf9bcef-d366-55ff-bf25-968be9d88d7c', '16f86332-afd4-59de-8f16-64d0e0ae844d', 'a04d4fde-98a7-4307-bb15-152af0bf0bb1', 'evening', '3 pc', NULL, 0),
  ('fcb7778c-ac69-50d9-9128-fadc494440d5', '16f86332-afd4-59de-8f16-64d0e0ae844d', '4dd6e744-f113-40ed-b376-f0ed47e30e97', 'evening', '8 pc', NULL, 0),
  ('14e28c2b-ca45-5a3e-bae3-8294ebb67b77', '16f86332-afd4-59de-8f16-64d0e0ae844d', '30945b43-a405-4c4a-ac84-cc38698de9f7', 'evening', '2 pc', NULL, 0),
  ('f8780f36-15c6-5607-8801-6eaf5e8f003c', '16f86332-afd4-59de-8f16-64d0e0ae844d', 'c33b1a12-24be-46ed-abf3-f25a8555808f', 'evening', '2 pc', NULL, 0),
  ('597f6913-9786-5f5f-a4cb-1e71c6cf5ff2', '16f86332-afd4-59de-8f16-64d0e0ae844d', '141387fd-c7ca-4b53-93fb-f4d34da6cbb1', 'evening', '2 pc', NULL, 0),
  ('008ab0db-73b3-5c74-bdfe-14362c80f060', '16f86332-afd4-59de-8f16-64d0e0ae844d', 'b9aed6f8-37c4-468f-ba67-9286bb95dfa8', 'evening', '2 pc', NULL, 0),
  ('463536c8-fbd2-5d13-9b50-f33b556fbbbc', '61f91e1d-397c-5450-8313-32f799ae2400', 'a04d4fde-98a7-4307-bb15-152af0bf0bb1', 'evening', '2 set', NULL, 0),
  ('0a1f07eb-21ce-5637-9b7c-5fe137d7890d', '61f91e1d-397c-5450-8313-32f799ae2400', '4dd6e744-f113-40ed-b376-f0ed47e30e97', 'evening', '2 set', NULL, 0),
  ('d8a4f73a-c636-592b-bf6d-95833aae0ed7', 'f8d9968e-bd75-531d-a13c-6e57b0a663a4', 'a04d4fde-98a7-4307-bb15-152af0bf0bb1', 'evening', '1 kg', NULL, 0),
  ('7e5e10fc-6d29-5d74-86ce-24bbd7a8d99c', 'f8d9968e-bd75-531d-a13c-6e57b0a663a4', '4dd6e744-f113-40ed-b376-f0ed47e30e97', 'evening', '2 kg', NULL, 0),
  ('32682906-68a1-572e-88df-9285f664ac47', 'f8d9968e-bd75-531d-a13c-6e57b0a663a4', '30945b43-a405-4c4a-ac84-cc38698de9f7', 'evening', '6 kg', NULL, 0),
  ('d7aa6d40-42fa-5ddc-aa71-96373d1aa5d3', 'f8d9968e-bd75-531d-a13c-6e57b0a663a4', 'c33b1a12-24be-46ed-abf3-f25a8555808f', 'evening', '4 kg', NULL, 0),
  ('e9037821-e3f4-5c33-9520-d0f414afa132', 'f8d9968e-bd75-531d-a13c-6e57b0a663a4', '141387fd-c7ca-4b53-93fb-f4d34da6cbb1', 'evening', '3 kg', NULL, 0),
  ('9fc74b7c-46aa-553f-b809-c40082ee0d77', 'f8d9968e-bd75-531d-a13c-6e57b0a663a4', 'b9aed6f8-37c4-468f-ba67-9286bb95dfa8', 'evening', '2 kg', NULL, 0),
  ('0a4b9085-153c-54dc-97f2-1132027cd246', 'a2177ad5-c11b-5d62-95de-117b0196a467', 'a04d4fde-98a7-4307-bb15-152af0bf0bb1', 'evening', '3', NULL, 0),
  ('05645e25-5d52-57e2-b550-a358389a3231', 'a2177ad5-c11b-5d62-95de-117b0196a467', '4dd6e744-f113-40ed-b376-f0ed47e30e97', 'evening', '3', NULL, 0),
  ('7c5f1306-1e3a-567f-85ed-7f5f0ffb76c2', 'a2177ad5-c11b-5d62-95de-117b0196a467', '30945b43-a405-4c4a-ac84-cc38698de9f7', 'evening', '3', NULL, 0),
  ('8da881e0-72a3-516d-8336-bc701752de4c', 'a2177ad5-c11b-5d62-95de-117b0196a467', 'c33b1a12-24be-46ed-abf3-f25a8555808f', 'evening', '125', NULL, 0),
  ('64c5683c-1185-50a9-9e33-d95e26095049', 'ebad6d45-bcd3-525e-ac62-b81fb4a2635a', 'a04d4fde-98a7-4307-bb15-152af0bf0bb1', 'evening', '2', NULL, 0),
  ('5b71b5bf-5b44-5dff-a263-05e79395663a', 'ebad6d45-bcd3-525e-ac62-b81fb4a2635a', '4dd6e744-f113-40ed-b376-f0ed47e30e97', 'evening', '2', NULL, 0),
  ('188090cf-4ad3-5591-b955-ccf045497519', '857d98b4-c596-5c80-9292-70f102a6e798', 'a04d4fde-98a7-4307-bb15-152af0bf0bb1', 'evening', '5', NULL, 0),
  ('1c322858-7e4d-5188-83c4-cf9836d97131', '857d98b4-c596-5c80-9292-70f102a6e798', '4dd6e744-f113-40ed-b376-f0ed47e30e97', 'evening', '16', NULL, 0),
  ('0019b98f-ebef-51be-8cef-a14d65417ce8', '857d98b4-c596-5c80-9292-70f102a6e798', '30945b43-a405-4c4a-ac84-cc38698de9f7', 'evening', '2', NULL, 0),
  ('a0c88740-8f6d-50da-85d4-0599ea9a4589', '857d98b4-c596-5c80-9292-70f102a6e798', 'c33b1a12-24be-46ed-abf3-f25a8555808f', 'evening', '2', NULL, 0),
  ('88886608-31e9-50aa-840c-d7ac0f15ce51', '857d98b4-c596-5c80-9292-70f102a6e798', 'b9aed6f8-37c4-468f-ba67-9286bb95dfa8', 'evening', '1', NULL, 0),
  ('75c3cfdd-6f3e-52f2-9abd-3393851f4acc', '19b21375-9b6f-5801-b967-4338fbee64ce', '4dd6e744-f113-40ed-b376-f0ed47e30e97', 'evening', '2', NULL, 0),
  ('a04a33e5-dbf1-5b62-9545-1a89c4fee300', '19b21375-9b6f-5801-b967-4338fbee64ce', '30945b43-a405-4c4a-ac84-cc38698de9f7', 'evening', '6', NULL, 0),
  ('0140efa0-31a5-59c6-9b66-ee7ffb58d35d', '55c2c265-4d2d-50da-836a-be49c9982c81', '4dd6e744-f113-40ed-b376-f0ed47e30e97', 'evening', '8', NULL, 0),
  ('35bccbf9-490a-5009-8c57-fca5d013ca1a', '5bfb70ba-a83b-5d6d-8742-c7adbe734d85', '4dd6e744-f113-40ed-b376-f0ed47e30e97', 'evening', '1', NULL, 0),
  ('ce04d712-2eec-5538-9fca-dfe3d2b504c9', '54277989-be8f-5b01-9fd1-7df9dd1a1a6c', '30945b43-a405-4c4a-ac84-cc38698de9f7', 'evening', '1', NULL, 0),
  ('bb5ca306-cc6e-5ddd-a3b5-d26f3c292c70', 'de08cf86-78fe-577f-bfb1-5affc4619c73', '30945b43-a405-4c4a-ac84-cc38698de9f7', 'evening', '1', NULL, 0),
  ('82091fef-0bca-525b-ac73-087f7db39d99', '19dba465-537d-5c6c-9cc4-b8ec87e0656d', 'a04d4fde-98a7-4307-bb15-152af0bf0bb1', 'evening', '10 pc', NULL, 0),
  ('c39cbdee-d3a6-58c4-be5b-0eb532a09208', '19dba465-537d-5c6c-9cc4-b8ec87e0656d', '4dd6e744-f113-40ed-b376-f0ed47e30e97', 'evening', '10 pc', NULL, 0),
  ('550f7b75-5046-5aad-811c-27c35f975007', '19dba465-537d-5c6c-9cc4-b8ec87e0656d', '30945b43-a405-4c4a-ac84-cc38698de9f7', 'evening', '10 pc', NULL, 0),
  ('39f6d8e4-7907-5e2f-9856-bcd37e68f4b9', '19dba465-537d-5c6c-9cc4-b8ec87e0656d', 'c33b1a12-24be-46ed-abf3-f25a8555808f', 'evening', '10 pc', NULL, 0),
  ('fc23b7fa-2323-535d-b134-4759c473d5e4', '19dba465-537d-5c6c-9cc4-b8ec87e0656d', '141387fd-c7ca-4b53-93fb-f4d34da6cbb1', 'evening', '10 pc', NULL, 0),
  ('9a2af9f7-683e-5f02-a2d7-377bcf7a3101', '19dba465-537d-5c6c-9cc4-b8ec87e0656d', 'b9aed6f8-37c4-468f-ba67-9286bb95dfa8', 'evening', '10 pc', NULL, 0),
  ('8967ff98-0b7e-5ce7-9f2a-a26e5b1e42ee', 'a4f3fb1c-76c6-5fc6-a6d5-ae09877b815f', 'a04d4fde-98a7-4307-bb15-152af0bf0bb1', 'evening', '10 pc', NULL, 0),
  ('0f200199-3cf9-5d4c-8c29-74421aec2c9f', 'a4f3fb1c-76c6-5fc6-a6d5-ae09877b815f', '4dd6e744-f113-40ed-b376-f0ed47e30e97', 'evening', '10 pc', NULL, 0),
  ('a38aed35-99ca-578c-94fe-0ad0b9236995', 'a4f3fb1c-76c6-5fc6-a6d5-ae09877b815f', '30945b43-a405-4c4a-ac84-cc38698de9f7', 'evening', '10 pc', NULL, 0),
  ('398f7597-e6f1-582a-9638-06d8171d12aa', 'a4f3fb1c-76c6-5fc6-a6d5-ae09877b815f', 'c33b1a12-24be-46ed-abf3-f25a8555808f', 'evening', '10 pc', NULL, 0),
  ('2edefd25-3e0b-53c2-8610-ea7a154544ea', 'a4f3fb1c-76c6-5fc6-a6d5-ae09877b815f', '141387fd-c7ca-4b53-93fb-f4d34da6cbb1', 'evening', '10 pc', NULL, 0),
  ('43fef6bf-fca8-5c92-b9fd-6aa2c1b150f4', 'a4f3fb1c-76c6-5fc6-a6d5-ae09877b815f', 'b9aed6f8-37c4-468f-ba67-9286bb95dfa8', 'evening', '10 pc', NULL, 0);
