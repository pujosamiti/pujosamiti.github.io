-- Three 4 Oct 2026 purchases entered as Procurement › Misc with "Grocery" in
-- the notes move to the new Procurement › Grocery (the samiti's word, 4 Oct
-- 2026), and the notes keep only the details. Ledger, these three rows only.
UPDATE ledger_entry SET sub_category = 'Grocery', notes = NULL
WHERE id = 'beeb2754-7e14-49bc-8c54-57302b28d95e' AND category = 'Procurement'; -- Vaibhav Vikas Market · ₹5,925 · was "Grocery"
UPDATE ledger_entry SET sub_category = 'Grocery', notes = 'Muk Sudhi'
WHERE id = '07dd7e36-3a74-4916-a3de-1bed586af7c6' AND category = 'Procurement'; -- Parmar Foods · ₹130 · was "Grocery (Muk Sudhi)"
UPDATE ledger_entry SET sub_category = 'Grocery', notes = 'Ghee, Oil and Madhu'
WHERE id = 'a63ad481-4537-440f-9db0-bfc25dace807' AND category = 'Procurement'; -- Mataji Dry Fruits · ₹1,840 · was "Grocery (Ghee, Oil and Madhu)"
