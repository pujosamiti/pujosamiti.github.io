-- Uma (উমা) — the samiti's magazine.
-- A Sankhya (uma_issue) is one edition; uma_article carries the full editorial
-- lifecycle (draft → in_review → accepted/held/rejected → published) plus the
-- public reaction counters. person.uma_role seats the masthead: one
-- chief_editor + up to two editors, core members, admin-assigned.

ALTER TABLE `person` ADD `uma_role` text;
--> statement-breakpoint
CREATE TABLE `uma_issue` (
	`id` text PRIMARY KEY NOT NULL,
	`number` integer NOT NULL,
	`title` text,
	`cover_image` text,
	`editorial_note` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_on` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uma_issue_number` ON `uma_issue` (`number`);
--> statement-breakpoint
CREATE TABLE `uma_article` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`section` text NOT NULL,
	`title` text NOT NULL,
	`title_bn` text,
	`author_name` text NOT NULL,
	`author_name_bn` text,
	`author_bio` text,
	`author_bio_bn` text,
	`author_person_id` text,
	`is_guest` integer DEFAULT false NOT NULL,
	`excerpt` text,
	`hero_image` text,
	`body_md` text NOT NULL,
	`body_md_alt` text,
	`lang` text DEFAULT 'bn' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`issue_id` text,
	`sort_order` integer DEFAULT 1000 NOT NULL,
	`submitted_via` text,
	`submitted_on` text,
	`editor_note` text,
	`hearts` integer DEFAULT 0 NOT NULL,
	`claps` integer DEFAULT 0 NOT NULL,
	`published_at` text,
	`created_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`author_person_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`issue_id`) REFERENCES `uma_issue`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uma_article_slug` ON `uma_article` (`slug`);
--> statement-breakpoint
CREATE INDEX `uma_article_status` ON `uma_article` (`status`);
--> statement-breakpoint
CREATE INDEX `uma_article_issue` ON `uma_article` (`issue_id`);
