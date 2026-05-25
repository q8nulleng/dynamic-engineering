CREATE TABLE `project_briefs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` varchar(64) NOT NULL,
	`owner_name` text DEFAULT (''),
	`owner_phone` varchar(32) DEFAULT '',
	`governorate` varchar(64) DEFAULT '',
	`area` varchar(128) DEFAULT '',
	`block` varchar(32) DEFAULT '',
	`plot` varchar(32) DEFAULT '',
	`auto_number` varchar(32) DEFAULT '',
	`plot_area` varchar(32) DEFAULT '',
	`plot_shape` varchar(64) DEFAULT '',
	`north_direction` varchar(32) DEFAULT '',
	`architectural_style` varchar(64) DEFAULT '',
	`floors_count` int DEFAULT 0,
	`floors_details` text DEFAULT ('[]'),
	`sketch_data` text DEFAULT (''),
	`notes` text DEFAULT (''),
	`created_at` varchar(32) NOT NULL,
	`updated_at` varchar(32) DEFAULT '',
	CONSTRAINT `project_briefs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_meetings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` varchar(64) NOT NULL,
	`date` varchar(32) NOT NULL,
	`attendees` text DEFAULT ('[]'),
	`agreed` text DEFAULT ('[]'),
	`changes` text DEFAULT (''),
	`status` varchar(32) DEFAULT 'pending',
	`notes` text DEFAULT (''),
	`created_at` varchar(32) NOT NULL,
	CONSTRAINT `project_meetings_id` PRIMARY KEY(`id`)
);
