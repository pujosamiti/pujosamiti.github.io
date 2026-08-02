CREATE TABLE `durgapuja_task` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`details` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `task_assignment` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`year` integer NOT NULL,
	`person_id` text NOT NULL,
	`role` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `durgapuja_task`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`person_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `task_year` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`year` integer NOT NULL,
	`phase` text DEFAULT 'initiated' NOT NULL,
	`check1_date` text,
	`check1_notes` text,
	`check2_date` text,
	`check2_notes` text,
	`check3_date` text,
	`check3_notes` text,
	FOREIGN KEY (`task_id`) REFERENCES `durgapuja_task`(`id`) ON UPDATE no action ON DELETE cascade
);
