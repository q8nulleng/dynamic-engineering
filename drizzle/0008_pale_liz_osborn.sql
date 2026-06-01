CREATE TABLE `phase_meta` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` varchar(64) NOT NULL,
	`phase_key` varchar(64) NOT NULL,
	`data` text DEFAULT ('{}'),
	`updated_at` varchar(32) DEFAULT '',
	CONSTRAINT `phase_meta_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `projects` ADD `notes_updated_at` bigint;