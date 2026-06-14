CREATE TABLE `governorate_areas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`governorate` varchar(128) NOT NULL,
	`area` varchar(128) NOT NULL,
	`sort_order` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `governorate_areas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `crm_leads` ADD `parcel_number` varchar(32) DEFAULT '';