ALTER TABLE `person` ADD `alt_email` text;--> statement-breakpoint
CREATE UNIQUE INDEX `person_alt_email_unique` ON `person` (`alt_email`);
