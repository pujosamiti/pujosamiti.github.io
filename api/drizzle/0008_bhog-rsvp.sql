CREATE TABLE `bhog_rsvp` (
	`id` text PRIMARY KEY NOT NULL,
	`menu_id` text NOT NULL,
	`person_id` text NOT NULL,
	`count` integer NOT NULL,
	`notes` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`menu_id`) REFERENCES `bhog_menu`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`person_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bhog_rsvp_menu_person` ON `bhog_rsvp` (`menu_id`,`person_id`);
