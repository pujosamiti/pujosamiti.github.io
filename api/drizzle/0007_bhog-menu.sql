CREATE TABLE `bhog_menu` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`puja_day_id` text,
	`date` text NOT NULL,
	`label` text NOT NULL,
	`label_bn` text,
	`per_plate_cost` integer,
	`notes` text,
	`is_published` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 1000 NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`puja_day_id`) REFERENCES `puja_day`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `bhog_menu_item` (
	`id` text PRIMARY KEY NOT NULL,
	`menu_id` text NOT NULL,
	`title` text NOT NULL,
	`title_bn` text,
	`sort_order` integer DEFAULT 1000 NOT NULL,
	FOREIGN KEY (`menu_id`) REFERENCES `bhog_menu`(`id`) ON UPDATE no action ON DELETE cascade
);
