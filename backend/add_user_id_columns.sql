-- =====================================================
-- Migration: Add user_id columns to permit tables
-- Run this on each respective database to enable
-- tracking applications by the user who submitted them.
-- =====================================================

-- ===== 1. BUSINESS PERMIT DATABASE (eplms_business_permit_db) =====
-- Run on: eplms_business_permit_db
ALTER TABLE `business_permit_applications` 
ADD COLUMN `user_id` INT(11) DEFAULT 0 AFTER `validity_date`;

ALTER TABLE `business_permit_applications` 
ADD INDEX `idx_user_id` (`user_id`);

-- Also add user_id to amendment and special tables if they exist
ALTER TABLE `business_amendment_applications` 
ADD COLUMN `user_id` INT(11) DEFAULT 0;

ALTER TABLE `business_amendment_applications` 
ADD INDEX `idx_user_id` (`user_id`);

ALTER TABLE `special_permit_applications` 
ADD COLUMN `user_id` INT(11) DEFAULT 0;

ALTER TABLE `special_permit_applications` 
ADD INDEX `idx_user_id` (`user_id`);

-- ===== 2. BUILDING PERMIT DATABASE (eplms_building_permit_db) =====
-- Run on: eplms_building_permit_db
ALTER TABLE `applicant` 
ADD COLUMN `user_id` INT(11) DEFAULT 0 AFTER `suffix`;

ALTER TABLE `applicant` 
ADD INDEX `idx_user_id` (`user_id`);
