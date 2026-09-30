CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text,
	`deal_id` text,
	`type` text DEFAULT 'note' NOT NULL,
	`subject` text NOT NULL,
	`body` text,
	`occurred_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`deal_id`) REFERENCES `deals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `activities_client_idx` ON `activities` (`client_id`);--> statement-breakpoint
CREATE INDEX `activities_deal_idx` ON `activities` (`deal_id`);--> statement-breakpoint
CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`company` text,
	`phone` text,
	`website` text,
	`notes` text,
	`tags` text DEFAULT '[]',
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `clients_name_idx` ON `clients` (`name`);--> statement-breakpoint
CREATE TABLE `deals` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`client_id` text NOT NULL,
	`value_cents` integer DEFAULT 0 NOT NULL,
	`stage` text DEFAULT 'lead' NOT NULL,
	`probability` integer DEFAULT 50 NOT NULL,
	`expected_close_date` integer,
	`notes` text,
	`last_activity_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `deals_client_idx` ON `deals` (`client_id`);--> statement-breakpoint
CREATE INDEX `deals_stage_idx` ON `deals` (`stage`);--> statement-breakpoint
CREATE TABLE `drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`deal_id` text NOT NULL,
	`client_id` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`provider` text DEFAULT 'mock' NOT NULL,
	`model` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewed_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`deal_id`) REFERENCES `deals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `drafts_deal_idx` ON `drafts` (`deal_id`);--> statement-breakpoint
CREATE INDEX `drafts_status_idx` ON `drafts` (`status`);--> statement-breakpoint
CREATE TABLE `followups` (
	`id` text PRIMARY KEY NOT NULL,
	`deal_id` text,
	`client_id` text,
	`title` text NOT NULL,
	`due_date` integer NOT NULL,
	`completed_at` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`deal_id`) REFERENCES `deals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `followups_due_idx` ON `followups` (`due_date`);--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`number` text NOT NULL,
	`deal_id` text,
	`client_id` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`issued_at` integer,
	`due_date` integer,
	`paid_at` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`deal_id`) REFERENCES `deals`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_number_unique` ON `invoices` (`number`);--> statement-breakpoint
CREATE INDEX `invoices_client_idx` ON `invoices` (`client_id`);