CREATE TABLE `appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lead_id` varchar(64),
	`client_id` varchar(64),
	`client_name` text NOT NULL,
	`date` varchar(32) NOT NULL,
	`time` varchar(16) NOT NULL DEFAULT '',
	`reason` varchar(128) NOT NULL DEFAULT '',
	`notes` text DEFAULT (''),
	`status` varchar(32) NOT NULL DEFAULT 'scheduled',
	`created_at` varchar(32) NOT NULL,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
