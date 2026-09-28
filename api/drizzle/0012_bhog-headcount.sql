-- Durga Pujo bhog headcount: the shared link, and guest bhog.
--
-- The headcount link: one code per event, shared with the whole samiti (the
-- WhatsApp group), so a family gives its Durga Pujo bhog count from
-- /bhog/count/?c=X481216 without signing in. Opening it, they pick their
-- household from the same list the Responses sheet shows and fill in its
-- days. The code is the key to every paying household's counts for that
-- event, and to nothing else. A leaked code is revoked (revoked_at) and a
-- new one issued; the old row stays as the record.

CREATE TABLE `bhog_link` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`code` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`revoked_at` integer,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bhog_link_code` ON `bhog_link` (`code`);
--> statement-breakpoint
CREATE UNIQUE INDEX `bhog_link_live_event` ON `bhog_link` (`event_id`) WHERE `revoked_at` IS NULL;
--> statement-breakpoint
-- Guest bhog: a core household (₹10,000+ this season) may bring office
-- colleagues and friends — up to 20 a day, beyond the family's own 10 — at a
-- per-head rate paid to the Food & Bhog in-charge. `guests` sits beside the
-- family's count on the household's row for the day.
ALTER TABLE `bhog_rsvp` ADD `guests` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
-- Per-event bhog settings, set by admin / fin_admin on /bhog: who is the
-- Food & Bhog in-charge (pre-selected as "Received by" and named on the
-- form's payment line) and the guest rate per head (NULL = no guest bhog).
CREATE TABLE `bhog_setting` (
	`event_id` text PRIMARY KEY NOT NULL,
	`incharge_person_id` text,
	`guest_rate` integer,
	`updated_by` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`incharge_person_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`updated_by`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
