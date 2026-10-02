-- 2026 budget: a line for Food › Food Transport (₹100), so the porter's ₹100
-- has a row of its own on the Budget vs spend page (2 Oct 2026, at the
-- samiti's word). The id is the one the app gives a budget line.
INSERT INTO budget_line (id, year, category, sub_category, amount, notes, created_at)
VALUES ('bl-2026-food-food-transport', 2026, 'Food', 'Food Transport', 100, NULL, 1790963326)
ON CONFLICT(id) DO UPDATE SET amount = excluded.amount;
