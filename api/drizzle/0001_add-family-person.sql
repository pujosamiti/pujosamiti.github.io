CREATE TABLE `family` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`society` text,
	`residence_detail` text,
	`workplace` text,
	`workplace_detail` text,
	`eligibility` text DEFAULT 'resident' NOT NULL,
	`tier` text DEFAULT 'non_member' NOT NULL,
	`phone` text,
	`notes` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `person` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` text NOT NULL,
	`display_name` text NOT NULL,
	`email` text,
	`phone` text,
	`gender` text,
	`is_admin` integer DEFAULT false NOT NULL,
	`portfolio` text,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`family_id`) REFERENCES `family`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `person_email_unique` ON `person` (`email`);