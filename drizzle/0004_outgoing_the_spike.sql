CREATE TABLE `work_plan_phases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`work_plan_id` int NOT NULL,
	`order` int NOT NULL DEFAULT 0,
	`title` text NOT NULL,
	`subtitle` text DEFAULT (''),
	CONSTRAINT `work_plan_phases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `work_plan_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`work_plan_phase_id` int NOT NULL,
	`order` int NOT NULL DEFAULT 0,
	`name` text NOT NULL,
	`assignee` varchar(128) DEFAULT '',
	`estimated_days` int DEFAULT 0,
	`description` text DEFAULT (''),
	CONSTRAINT `work_plan_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `work_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`project_type` varchar(64) NOT NULL DEFAULT '',
	`service_type` varchar(64) DEFAULT '',
	`description` text DEFAULT (''),
	`is_default` tinyint DEFAULT 0,
	`created_at` varchar(32) NOT NULL,
	CONSTRAINT `work_plans_id` PRIMARY KEY(`id`)
);
