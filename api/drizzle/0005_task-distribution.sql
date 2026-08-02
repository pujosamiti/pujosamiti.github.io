CREATE TABLE `task` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`title` text NOT NULL,
	`details` text,
	`phase` text DEFAULT 'initiated' NOT NULL,
	`check1_date` text,
	`check1_notes` text,
	`check2_date` text,
	`check2_notes` text,
	`check3_date` text,
	`check3_notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `task_assignment` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`person_id` text NOT NULL,
	`role` text NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `task`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`person_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
