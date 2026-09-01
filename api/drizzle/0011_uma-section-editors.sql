-- The masthead becomes one chief editor plus ONE EDITOR PER SECTION.
--
-- A section's editor runs that section's queue and nothing outside it, so an
-- assignment now means something: Poetry has someone answerable for Poetry.
-- One person may hold several sections (the common case), and a section with
-- nobody yet — Games & Puzzles, which has no articles — sits unassigned.
--
-- person.uma_role keeps the chair ('chief_editor'). Its 'editor' value is
-- retired: a section seat lives here instead. Nobody held a seat when this ran,
-- so there is nothing to migrate.

CREATE TABLE `uma_section_editor` (
	`section` text PRIMARY KEY NOT NULL,
	`person_id` text NOT NULL,
	`assigned_by` text NOT NULL,
	`assigned_at` integer NOT NULL,
	FOREIGN KEY (`person_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_by`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `uma_section_editor_person` ON `uma_section_editor` (`person_id`);
--> statement-breakpoint
UPDATE `person` SET `uma_role` = NULL WHERE `uma_role` = 'editor';
