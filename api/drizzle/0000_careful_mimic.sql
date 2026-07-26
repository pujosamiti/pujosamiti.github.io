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
CREATE TABLE `budget_line` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`category` text NOT NULL,
	`item` text NOT NULL,
	`budgeted` integer NOT NULL,
	`actual` integer,
	`notes` text,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `event` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`year` integer NOT NULL,
	`name_bn` text NOT NULL,
	`name_en` text NOT NULL,
	`starts_on` text NOT NULL,
	`ends_on` text NOT NULL,
	`is_active` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `gallery_item` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text,
	`kind` text NOT NULL,
	`ref` text NOT NULL,
	`caption` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `member` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`portfolio` text,
	`family_name` text,
	`phone` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `member_email_unique` ON `member` (`email`);--> statement-breakpoint
CREATE TABLE `notice` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`pinned` integer DEFAULT false NOT NULL,
	`published_at` integer NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `procurement_item` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`item` text NOT NULL,
	`quantity` text,
	`status` text DEFAULT 'needed' NOT NULL,
	`assignee` text,
	`notes` text,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE no action
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
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `timetable_entry` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`title` text NOT NULL,
	`detail` text,
	`starts_at` text NOT NULL,
	`ends_at` text,
	`venue` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE no action
);
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
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
