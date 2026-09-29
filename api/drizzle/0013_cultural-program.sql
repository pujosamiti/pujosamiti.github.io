ALTER TABLE `person` ADD `is_cultural_admin` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `puja_day` ADD `has_cultural_evening` integer DEFAULT false NOT NULL;
--> statement-breakpoint
UPDATE `puja_day` SET `has_cultural_evening` = true WHERE `event_id` = 'durga-pujo-2026' AND `label_en` IN ('Shashthi', 'Saptami', 'Ashtami', 'Ashtami · Day 2');
--> statement-breakpoint
CREATE TABLE `cultural_program` (
	`id` text PRIMARY KEY NOT NULL,
	`puja_day_id` text NOT NULL,
	`item_name` text NOT NULL,
	`item_type` text NOT NULL,
	`item_type_other` text,
	`performers` text NOT NULL,
	`duration_min` integer,
	`participants` text,
	`sort_order` integer DEFAULT 1000 NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`puja_day_id`) REFERENCES `puja_day`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `cultural_program_puja_day` ON `cultural_program` (`puja_day_id`,`sort_order`);
