DROP TABLE `join_request`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_person` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` text,
	`display_name` text NOT NULL,
	`email` text,
	`society` text,
	`residence_detail` text,
	`workplace` text,
	`workplace_detail` text,
	`eligibility` text DEFAULT 'resident' NOT NULL,
	`tier` text DEFAULT 'non_member' NOT NULL,
	`phone` text,
	`gender` text,
	`is_admin` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`portfolio` text,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`family_id`) REFERENCES `family`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_person`("id", "family_id", "display_name", "email", "society", "residence_detail", "workplace", "workplace_detail", "eligibility", "tier", "phone", "gender", "is_admin", "is_active", "portfolio", "notes", "created_at") SELECT "id", "family_id", "display_name", "email", NULL, NULL, NULL, NULL, 'resident', 'non_member', "phone", "gender", "is_admin", 1, "portfolio", "notes", "created_at" FROM `person`;--> statement-breakpoint
DROP TABLE `person`;--> statement-breakpoint
ALTER TABLE `__new_person` RENAME TO `person`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `person_email_unique` ON `person` (`email`);--> statement-breakpoint
ALTER TABLE `family` DROP COLUMN `society`;--> statement-breakpoint
ALTER TABLE `family` DROP COLUMN `residence_detail`;--> statement-breakpoint
ALTER TABLE `family` DROP COLUMN `workplace`;--> statement-breakpoint
ALTER TABLE `family` DROP COLUMN `workplace_detail`;--> statement-breakpoint
ALTER TABLE `family` DROP COLUMN `eligibility`;--> statement-breakpoint
ALTER TABLE `family` DROP COLUMN `tier`;--> statement-breakpoint
ALTER TABLE `family` DROP COLUMN `phone`;