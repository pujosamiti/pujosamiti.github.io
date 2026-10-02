-- Two 2026 expense entries set onto the ledger's lists (2 Oct 2026), now that
-- category and sub-category are pick-from-list only. Both from 9 Aug, the
-- puja meeting, entered by Samiran Patra on 12 Aug.
--  · ₹600 Food: the remark typed as its sub-category moves to Notes; the
--    sub-category is Tea Coffee Snacks.
--  · ₹100 "Porter": the porter carried the meeting's food — Food, under the
--    new Food › Food Transport. Vendor and note stay as they were.

UPDATE ledger_entry SET sub_category = 'Tea Coffee Snacks', notes = 'Singada on Puja meeting on 9th Aug'
WHERE id = 'a33a83d8-60da-4cb1-a60c-31e8cc63ae18' AND category = 'Food';

UPDATE ledger_entry SET category = 'Food', sub_category = 'Food Transport'
WHERE id = 'd6bd53f5-8212-40b8-bbfd-69ff67fc48c3' AND category = 'Porter';
