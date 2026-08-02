CREATE TABLE `book` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`notes` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
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
