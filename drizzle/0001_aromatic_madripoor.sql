CREATE TABLE `clients` (
	`id` varchar(64) NOT NULL,
	`name` text NOT NULL,
	`phone` varchar(32) NOT NULL DEFAULT '',
	`phone2` varchar(32) DEFAULT '',
	`civil_id` varchar(32) DEFAULT '',
	`email` varchar(320) DEFAULT '',
	`type` varchar(32) NOT NULL DEFAULT 'individual',
	`governorate` varchar(64) DEFAULT '',
	`area` varchar(128) DEFAULT '',
	`block` varchar(32) DEFAULT '',
	`plot` varchar(32) DEFAULT '',
	`parcel_area` float DEFAULT 0,
	`parcel_shape` varchar(64) DEFAULT '',
	`parcel_facing` varchar(64) DEFAULT '',
	`ownership_doc` varchar(128) DEFAULT '',
	`ownership_date` varchar(32) DEFAULT '',
	`spouse_name` varchar(128) DEFAULT '',
	`spouse_civil_id` varchar(32) DEFAULT '',
	`status` varchar(32) NOT NULL DEFAULT 'active',
	`rating` int DEFAULT 5,
	`notes` text,
	`created_at` varchar(32) NOT NULL,
	`project_type` varchar(64) DEFAULT '',
	`service_type` varchar(64) DEFAULT '',
	`project_summary` text,
	`lead_id` varchar(64) DEFAULT '',
	`total_contracts_value` float DEFAULT 0,
	`total_paid` float DEFAULT 0,
	`total_remaining` float DEFAULT 0,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contract_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`building_type` varchar(64) NOT NULL DEFAULT '',
	`service_type` varchar(64) NOT NULL DEFAULT '',
	`scope_of_work` text,
	`terms` text,
	`party1_obligations` text,
	`party2_obligations` text,
	`payment_schedule` text,
	`duration` varchar(64) DEFAULT '',
	`notes` text,
	`created_at` varchar(32) NOT NULL,
	`is_default` tinyint DEFAULT 0,
	CONSTRAINT `contract_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contracts` (
	`id` varchar(64) NOT NULL,
	`quotation_id` varchar(64),
	`project_id` varchar(64),
	`client_id` varchar(64),
	`client` text NOT NULL,
	`template` varchar(128) DEFAULT '',
	`type` varchar(64) DEFAULT '',
	`service` varchar(64) DEFAULT '',
	`package` varchar(128) DEFAULT '',
	`status` varchar(32) NOT NULL DEFAULT 'مسودة',
	`date` varchar(32) NOT NULL,
	`amount` varchar(32) DEFAULT '0',
	`civil_id` varchar(32) DEFAULT '',
	`area` varchar(128) DEFAULT '',
	`block` varchar(32) DEFAULT '',
	`plot` varchar(32) DEFAULT '',
	`lead_id` varchar(64) DEFAULT '',
	`template_type` varchar(64) DEFAULT '',
	`terms_text` text,
	`signing_date` varchar(32) DEFAULT '',
	`signed_file_url` text,
	CONSTRAINT `contracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_leads` (
	`id` varchar(64) NOT NULL,
	`name` text NOT NULL,
	`phone` varchar(32) DEFAULT '',
	`type` varchar(64) DEFAULT '',
	`source` varchar(64) DEFAULT '',
	`service_type` varchar(64) DEFAULT '',
	`governorate` varchar(64) DEFAULT '',
	`area` varchar(128) DEFAULT '',
	`likely_contract` varchar(64) DEFAULT '',
	`expected_revenue` varchar(32) DEFAULT '0',
	`probability` int DEFAULT 10,
	`priority` int DEFAULT 0,
	`expected_closing` varchar(32) DEFAULT '',
	`notes` text,
	`stage` varchar(64) DEFAULT 'استفسار جديد',
	`tags` text,
	`quotations` int DEFAULT 0,
	`date` varchar(32) NOT NULL,
	`civil_id` varchar(32) DEFAULT '',
	`plot_number` varchar(32) DEFAULT '',
	`land_area` float DEFAULT 0,
	`assigned_to` varchar(64) DEFAULT '',
	CONSTRAINT `crm_leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` varchar(64),
	`project_id` varchar(64),
	`name` text NOT NULL,
	`category` varchar(64) DEFAULT '',
	`status` varchar(32) NOT NULL DEFAULT 'pending',
	`file_name` varchar(256) DEFAULT '',
	`file_size` varchar(32) DEFAULT '',
	`uploaded_at` varchar(32) DEFAULT '',
	`url` text,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoice_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoice_id` varchar(64) NOT NULL,
	`product` text NOT NULL,
	`description` text,
	`quantity` float DEFAULT 1,
	`price` float DEFAULT 0,
	`tax_percent` float DEFAULT 15,
	`total` float DEFAULT 0,
	CONSTRAINT `invoice_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` varchar(64) NOT NULL,
	`project_id` varchar(64),
	`client_id` varchar(64),
	`client` text NOT NULL,
	`project` text,
	`status` varchar(32) NOT NULL DEFAULT 'مسودة',
	`date` varchar(32) NOT NULL,
	`due_date` varchar(32) DEFAULT '',
	`subtotal` float DEFAULT 0,
	`tax_rate` float DEFAULT 15,
	`tax_amount` float DEFAULT 0,
	`total` float DEFAULT 0,
	`notes` text,
	`contract_id` varchar(64),
	`payment_type` varchar(32) DEFAULT 'other',
	`payment_method` varchar(32) DEFAULT '',
	`invoice_number` varchar(64) DEFAULT '',
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `phases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` varchar(64) NOT NULL,
	`order` int NOT NULL DEFAULT 0,
	`title` text NOT NULL,
	`subtitle` text,
	CONSTRAINT `phases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` varchar(64) NOT NULL,
	`name` text NOT NULL,
	`client_id` varchar(64),
	`client` text NOT NULL,
	`type` varchar(64) NOT NULL DEFAULT 'سكن خاص',
	`service_type` varchar(64) NOT NULL DEFAULT 'بناء جديد',
	`area` varchar(128) DEFAULT '',
	`quotation` varchar(64) DEFAULT '',
	`progress` int NOT NULL DEFAULT 0,
	`current_phase` int NOT NULL DEFAULT 0,
	`created_at` varchar(32) NOT NULL,
	`contract_id` varchar(64) DEFAULT '',
	`lead_id` varchar(64) DEFAULT '',
	`status` varchar(32) DEFAULT 'جديد',
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quotations` (
	`id` varchar(64) NOT NULL,
	`client_id` varchar(64),
	`client` text NOT NULL,
	`type` varchar(64) NOT NULL DEFAULT 'سكن خاص',
	`service` varchar(64) NOT NULL DEFAULT 'بناء جديد',
	`package` varchar(128) DEFAULT '',
	`amount` varchar(32) DEFAULT '0',
	`status` varchar(32) NOT NULL DEFAULT 'مسودة',
	`date` varchar(32) NOT NULL,
	`civil_id` varchar(32) DEFAULT '',
	`governorate` varchar(64) DEFAULT '',
	`area` varchar(128) DEFAULT '',
	`land_area` varchar(32) DEFAULT '',
	`block` varchar(32) DEFAULT '',
	`suburb` varchar(64) DEFAULT '',
	`plot` varchar(32) DEFAULT '',
	`survey_plan` varchar(128) DEFAULT '',
	`project_id` varchar(64),
	`lead_id` varchar(64) DEFAULT '',
	`validity_days` int DEFAULT 30,
	`expiry_date` varchar(32) DEFAULT '',
	CONSTRAINT `quotations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phase_id` int NOT NULL,
	`name` text NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'pending',
	`assignee` varchar(128) DEFAULT '',
	`description` text,
	`priority` int DEFAULT 0,
	`deadline` varchar(32) DEFAULT '',
	`order` int NOT NULL DEFAULT 0,
	`depends_on` int DEFAULT 0,
	`auto_created` tinyint DEFAULT 0,
	`estimated_days` int DEFAULT 0,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
