-- Add user_id column to liquor_permit_applications table for e-permit tracking
ALTER TABLE `liquor_permit_applications` ADD COLUMN `user_id` int(11) DEFAULT NULL AFTER `permit_type`;
ALTER TABLE `liquor_permit_applications` ADD INDEX `idx_user_id` (`user_id`);
ALTER TABLE `liquor_permit_applications` ADD INDEX `idx_business_email` (`business_email`);
