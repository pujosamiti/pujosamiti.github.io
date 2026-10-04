-- 2026 budget: a line for Procurement › Grocery (4 Oct 2026, at the
-- samiti's word). No earlier season had one, so it starts at what Grocery
-- has cost so far, ₹7,895; Finance can change it on the budget page. The id
-- is the one the app gives a budget line.
INSERT INTO budget_line (id, year, category, sub_category, amount, notes, created_at)
VALUES ('bl-2026-procurement-grocery', 2026, 'Procurement', 'Grocery', 7895, NULL, 1791123031)
ON CONFLICT(id) DO UPDATE SET amount = excluded.amount;
