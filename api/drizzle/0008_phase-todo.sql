PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_task_year` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`year` integer NOT NULL,
	`phase` text DEFAULT 'todo' NOT NULL,
	`check1_date` text,
	`check1_notes` text,
	`check2_date` text,
	`check2_notes` text,
	`check3_date` text,
	`check3_notes` text,
	FOREIGN KEY (`task_id`) REFERENCES `durgapuja_task`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_task_year`("id", "task_id", "year", "phase", "check1_date", "check1_notes", "check2_date", "check2_notes", "check3_date", "check3_notes") SELECT "id", "task_id", "year", "phase", "check1_date", "check1_notes", "check2_date", "check2_notes", "check3_date", "check3_notes" FROM `task_year`;--> statement-breakpoint
DROP TABLE `task_year`;--> statement-breakpoint
ALTER TABLE `__new_task_year` RENAME TO `task_year`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
UPDATE task_year SET phase = 'todo' WHERE phase = 'initiated';
