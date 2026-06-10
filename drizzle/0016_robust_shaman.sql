ALTER TABLE `crm_leads` ADD `referral_name` varchar(128) DEFAULT '';--> statement-breakpoint
ALTER TABLE `crm_leads` ADD `is_archived` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `crm_leads` ADD `archived_at` varchar(32) DEFAULT '';--> statement-breakpoint
ALTER TABLE `crm_leads` ADD `archived_reason` varchar(255) DEFAULT '';