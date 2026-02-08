-- Migration: Alter ancillary_permit table to support full form submissions
-- Run this on your EXISTING eplms_building_permit_db database
-- This adds all columns needed by ancillary_permit.php

-- 1. Drop the FK constraint on site_id (ancillary form submissions don't need a project_site entry)
ALTER TABLE `ancillary_permit` DROP FOREIGN KEY `ancillary_permit_ibfk_1`;

-- 2. Make site_id nullable (existing rows keep their values, new form submissions won't have one)
ALTER TABLE `ancillary_permit` MODIFY `site_id` int(11) DEFAULT NULL;

-- 3. Add all columns needed by the ancillary permit form
ALTER TABLE `ancillary_permit`
  ADD COLUMN `first_name` varchar(100) DEFAULT NULL AFTER `permit_type`,
  ADD COLUMN `last_name` varchar(100) DEFAULT NULL AFTER `first_name`,
  ADD COLUMN `middle_initial` varchar(10) DEFAULT NULL AFTER `last_name`,
  ADD COLUMN `contact_number` varchar(20) DEFAULT NULL AFTER `middle_initial`,
  ADD COLUMN `email` varchar(150) DEFAULT NULL AFTER `contact_number`,
  ADD COLUMN `owner_address` varchar(500) DEFAULT NULL AFTER `email`,
  ADD COLUMN `property_address` varchar(500) DEFAULT NULL AFTER `owner_address`,
  ADD COLUMN `building_permit_number` varchar(50) DEFAULT NULL AFTER `property_address`,
  ADD COLUMN `barangay_clearance` varchar(50) DEFAULT NULL AFTER `building_permit_number`,
  ADD COLUMN `tct_or_tax_dec` varchar(50) DEFAULT NULL AFTER `barangay_clearance`,
  ADD COLUMN `professional_name` varchar(200) DEFAULT NULL AFTER `tct_or_tax_dec`,
  ADD COLUMN `professional_role` varchar(100) DEFAULT NULL AFTER `professional_name`,
  ADD COLUMN `prc_id` varchar(50) DEFAULT NULL AFTER `professional_role`,
  ADD COLUMN `ptr_number` varchar(50) DEFAULT NULL AFTER `prc_id`,
  ADD COLUMN `prc_expiry` date DEFAULT NULL AFTER `ptr_number`,
  ADD COLUMN `type_specific_data` longtext DEFAULT NULL AFTER `prc_expiry`,
  ADD COLUMN `project_description` text DEFAULT NULL AFTER `type_specific_data`,
  ADD COLUMN `document_plans_path` varchar(500) DEFAULT NULL AFTER `project_description`,
  ADD COLUMN `document_id_path` varchar(500) DEFAULT NULL AFTER `document_plans_path`,
  ADD COLUMN `signature_file_path` varchar(500) DEFAULT NULL AFTER `document_id_path`;

-- 4. Add user_id column for tracking applications by user
ALTER TABLE `ancillary_permit`
  ADD COLUMN `user_id` int(11) DEFAULT 0 AFTER `signature_file_path`;

-- 5. Add indexes for common queries
ALTER TABLE `ancillary_permit`
  ADD KEY `idx_ancillary_permit_type` (`permit_type`),
  ADD KEY `idx_ancillary_status` (`status`),
  ADD KEY `idx_ancillary_user_id` (`user_id`);
