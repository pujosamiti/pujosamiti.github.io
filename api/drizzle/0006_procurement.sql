CREATE TABLE `procurement_item` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`details` text,
	`sort_order` integer DEFAULT 1000 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `procurement_item_year` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`year` integer NOT NULL,
	`total_quantity` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`notes` text,
	FOREIGN KEY (`item_id`) REFERENCES `procurement_item`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `procurement_day` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`label` text NOT NULL,
	`date` text,
	`sort_order` integer DEFAULT 1000 NOT NULL,
	`notes` text
);
--> statement-breakpoint
CREATE TABLE `procurement_need` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`day_id` text NOT NULL,
	`slot` text DEFAULT 'morning' NOT NULL,
	`quantity` text NOT NULL,
	`notes` text,
	`purchased` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `procurement_item`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`day_id`) REFERENCES `procurement_day`(`id`) ON UPDATE no action ON DELETE cascade
);
