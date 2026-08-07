-- 1 · Auth (better-auth)
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
-- 2 · Events & timetable
--> statement-breakpoint
CREATE TABLE `event` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`year` integer NOT NULL,
	`name_bn` text NOT NULL,
	`name_en` text NOT NULL,
	`starts_on` text NOT NULL,
	`ends_on` text NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	`purohit_name` text,
	`purohit_phone` text
);
--> statement-breakpoint
CREATE TABLE `timetable_entry` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`day_date` text NOT NULL,
	`day_label_bn` text NOT NULL,
	`day_label_en` text NOT NULL,
	`title_bn` text NOT NULL,
	`title_en` text NOT NULL,
	`time_from` text,
	`time_to` text,
	`comments` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
-- 3 · Membership
--> statement-breakpoint
CREATE TABLE `family` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`notes` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `person` (
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
-- 4 · Task distribution
--> statement-breakpoint
CREATE TABLE `durgapuja_task` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`details` text,
	`sort_order` integer DEFAULT 1000 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `task_year` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`year` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`phase` text DEFAULT 'todo' NOT NULL,
	`check1_date` text,
	`check1_notes` text,
	`check2_date` text,
	`check2_notes` text,
	`check3_date` text,
	`check3_notes` text,
	`notes` text,
	FOREIGN KEY (`task_id`) REFERENCES `durgapuja_task`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `task_assignment` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`year` integer NOT NULL,
	`person_id` text NOT NULL,
	`role` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `durgapuja_task`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`person_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
-- 5 · Money: ledger, sponsorship, reimbursements, budget
--> statement-breakpoint
CREATE TABLE `book` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`notes` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ledger_entry` (
	`id` text PRIMARY KEY NOT NULL,
	`book_id` text NOT NULL,
	`event_id` text,
	`entry_date` text NOT NULL,
	`kind` text NOT NULL,
	`category` text,
	`sub_category` text,
	`amount` integer NOT NULL,
	`person_id` text,
	`counterparty` text,
	`wallet_person_id` text NOT NULL,
	`to_wallet_person_id` text,
	`notes` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `book`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`person_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`wallet_person_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_wallet_person_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sponsorship_item` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`default_amount` integer,
	`sort_order` integer DEFAULT 1000 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sponsorship_item_year` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`year` integer NOT NULL,
	`amount` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`notes` text,
	FOREIGN KEY (`item_id`) REFERENCES `sponsorship_item`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sponsorship_pledge` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`year` integer NOT NULL,
	`person_id` text NOT NULL,
	`amount` integer NOT NULL,
	`status` text DEFAULT 'pledged' NOT NULL,
	`ledger_entry_id` text,
	`pledged_on` text NOT NULL,
	`notes` text,
	FOREIGN KEY (`item_id`) REFERENCES `sponsorship_item`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`person_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ledger_entry_id`) REFERENCES `ledger_entry`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `expense_reimbursement` (
	`id` text PRIMARY KEY NOT NULL,
	`book_id` text NOT NULL,
	`event_id` text,
	`person_id` text NOT NULL,
	`expense_date` text NOT NULL,
	`amount` integer NOT NULL,
	`category` text NOT NULL,
	`sub_category` text,
	`counterparty` text NOT NULL,
	`details` text,
	`status` text DEFAULT 'requested' NOT NULL,
	`assigned_to` text,
	`assigned_on` text,
	`ledger_entry_id` text,
	`settled_by` text,
	`settled_on` text,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `book`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`person_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_to`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ledger_entry_id`) REFERENCES `ledger_entry`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`settled_by`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `budget_line` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`category` text NOT NULL,
	`sub_category` text,
	`amount` integer NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
-- Indexes
--> statement-breakpoint
CREATE UNIQUE INDEX `person_email_unique` ON `person` (`email`);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);
