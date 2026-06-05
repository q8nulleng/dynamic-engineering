CREATE TABLE `employee_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` int NOT NULL,
	`type` varchar(64) NOT NULL,
	`title` varchar(256) NOT NULL,
	`body` text DEFAULT (''),
	`related_id` int,
	`is_read` tinyint NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `employee_notifications_id` PRIMARY KEY(`id`)
);
