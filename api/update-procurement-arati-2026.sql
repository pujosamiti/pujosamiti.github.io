-- 2026 Arati Items, at the samiti's word (3 Oct 2026). A year's quantity lives
-- in procurement_item_year, so earlier years keep theirs; the rest of the
-- list keeps its 2026 quantity.

-- 1 · Match Box · 5 → 6
UPDATE procurement_item_year SET total_quantity = '6'  WHERE item_id = 'c0400ba1-74d3-5fb5-8ab7-360f7a9b0be9' AND year = 2026;
-- 2 · Dhoop Kathi Box - big · 10 → 12
UPDATE procurement_item_year SET total_quantity = '12' WHERE item_id = 'bb310605-c47d-5291-94a2-f09aba73a398' AND year = 2026;
-- 11 · Cotton Pkt · sits out 2026
DELETE FROM procurement_item_year WHERE item_id = '4e5f8adf-c612-5fed-abfa-ee0f7800e6bc' AND year = 2026;
-- 12 · Dhuno / Lobaan · sits out 2026
DELETE FROM procurement_item_year WHERE item_id = '469609b0-1489-5b29-aec2-bd57e41d545c' AND year = 2026;
