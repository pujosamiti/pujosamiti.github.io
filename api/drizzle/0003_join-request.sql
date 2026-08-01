CREATE TABLE `join_request` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` text NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`note` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`decided_by` text,
	`decided_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`family_id`) REFERENCES `family`(`id`) ON UPDATE no action ON DELETE no action
);
