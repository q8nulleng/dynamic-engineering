ALTER TABLE `supervision_visits` ADD `contractor_phone` varchar(32) DEFAULT '';--> statement-breakpoint
ALTER TABLE `supervision_visits` ADD `stage_key` varchar(64) DEFAULT '';--> statement-breakpoint
ALTER TABLE `supervision_visits` ADD `item_notes` text DEFAULT ('{}');--> statement-breakpoint
ALTER TABLE `supervision_visits` ADD `visit_status_v2` enum('draft','in_progress','completed','approved') DEFAULT 'in_progress' NOT NULL;