ALTER TABLE `crm_leads` ADD `civil_card_url` text DEFAULT ('');--> statement-breakpoint
ALTER TABLE `crm_leads` ADD `signed_contract_url` text DEFAULT ('');--> statement-breakpoint
ALTER TABLE `crm_leads` ADD `contract_signing_status` varchar(32) DEFAULT 'مسودة';