-- A sponsorship slot is an appeal, not a line item: one short line, in both
-- languages, saying what the giver is really giving. Shown under the title on
-- the board. Copy lives in seed-sponsorship-taglines.sql and is reviewed in
-- bulk, so the admin item form deliberately does not write these columns —
-- an edit there leaves the tagline untouched.

ALTER TABLE `sponsorship_item` ADD `tagline` text;
--> statement-breakpoint
ALTER TABLE `sponsorship_item` ADD `tagline_bn` text;
