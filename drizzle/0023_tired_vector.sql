CREATE TABLE `discount_requests` (
	`id` varchar(50) NOT NULL,
	`quotation_id` varchar(50) NOT NULL,
	`lead_id` int NOT NULL,
	`requested_by` varchar(100) NOT NULL,
	`discount_type_dr` enum('percentage','fixed') NOT NULL DEFAULT 'percentage',
	`discount_value` float NOT NULL,
	`original_price` float NOT NULL,
	`discounted_price` float NOT NULL,
	`reason` text,
	`status_dr` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewed_by` varchar(100),
	`review_note` text,
	`created_at` bigint NOT NULL,
	`reviewed_at` bigint,
	CONSTRAINT `discount_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `property_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`sort_order` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `property_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `service_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`sort_order` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `service_types_id` PRIMARY KEY(`id`)
);
