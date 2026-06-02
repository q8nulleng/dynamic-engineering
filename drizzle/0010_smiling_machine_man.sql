CREATE TABLE `detailed_drawings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` varchar(64) NOT NULL,
	`phase_id` int NOT NULL,
	`drawing_type` varchar(64) NOT NULL,
	`assigned_to` varchar(128) DEFAULT '',
	`assigned_employee_id` int,
	`drawing_status` enum('pending','in_progress','completed','approved') NOT NULL DEFAULT 'pending',
	`file_url` varchar(512) DEFAULT '',
	`file_key` varchar(256) DEFAULT '',
	`notes` text DEFAULT (''),
	`requested_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `detailed_drawings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `municipality_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` varchar(64) NOT NULL,
	`phase_id` int NOT NULL,
	`submitted_at` varchar(32) DEFAULT '',
	`submitted_by` varchar(128) DEFAULT '',
	`reference_number` varchar(64) DEFAULT '',
	`license_received_at` varchar(32) DEFAULT '',
	`license_number` varchar(64) DEFAULT '',
	`license_file_url` varchar(512) DEFAULT '',
	`approved_plan_url` varchar(512) DEFAULT '',
	`notes` text DEFAULT (''),
	`muni_status` enum('not_submitted','submitted','license_received') NOT NULL DEFAULT 'not_submitted',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `municipality_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supervision_visits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` varchar(64) NOT NULL,
	`phase_id` int NOT NULL,
	`visit_date` varchar(32) NOT NULL,
	`visit_number` int NOT NULL DEFAULT 1,
	`construction_stage` varchar(128) NOT NULL,
	`engineer_name` varchar(128) DEFAULT '',
	`contractor_name` varchar(128) DEFAULT '',
	`owner_name` varchar(128) DEFAULT '',
	`location` varchar(256) DEFAULT '',
	`license_number` varchar(64) DEFAULT '',
	`general_notes` text DEFAULT (''),
	`checklist_data` text NOT NULL DEFAULT ('{}'),
	`photo_urls` text DEFAULT ('[]'),
	`visit_status` enum('draft','completed','approved') NOT NULL DEFAULT 'draft',
	`pdf_url` varchar(512) DEFAULT '',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supervision_visits_id` PRIMARY KEY(`id`)
);
