CREATE TABLE `budget_line` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`category` text NOT NULL,
	`sub_category` text,
	`amount` integer NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL
);
