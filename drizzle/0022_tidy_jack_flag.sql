CREATE TABLE `contract_payment_schedule` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contract_id` varchar(64) NOT NULL,
	`label` varchar(128) NOT NULL,
	`percentage` float DEFAULT 0,
	`amount` float DEFAULT 0,
	`due_date` varchar(32) DEFAULT '',
	`trigger_event` varchar(128) DEFAULT '',
	`order` int NOT NULL DEFAULT 0,
	`status` varchar(32) NOT NULL DEFAULT 'pending',
	`collected_amount` float DEFAULT 0,
	`notes` text DEFAULT (''),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contract_payment_schedule_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_collections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contract_id` varchar(64) NOT NULL,
	`schedule_id` int,
	`invoice_id` varchar(64) DEFAULT '',
	`amount` float NOT NULL,
	`payment_method` varchar(32) DEFAULT 'نقدي',
	`payment_date` varchar(32) NOT NULL,
	`reference` varchar(128) DEFAULT '',
	`notes` text DEFAULT (''),
	`created_by` varchar(64) DEFAULT '',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payment_collections_id` PRIMARY KEY(`id`)
);
