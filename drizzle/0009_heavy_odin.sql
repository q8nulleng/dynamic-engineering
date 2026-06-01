CREATE TABLE `employee_sessions` (
	`id` varchar(128) NOT NULL,
	`employee_id` int NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `employee_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` varchar(320) NOT NULL,
	`password_hash` text NOT NULL,
	`emp_role` enum('admin','accountant','architect','secretary','structural','draftsman','facade_designer') NOT NULL DEFAULT 'draftsman',
	`specialty` varchar(128) DEFAULT '',
	`is_active` tinyint NOT NULL DEFAULT 1,
	`last_login` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_email_unique` UNIQUE(`email`)
);
