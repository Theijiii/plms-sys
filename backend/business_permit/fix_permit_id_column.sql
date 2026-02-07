-- Fix permit_id column type mismatch
-- Change permit_id from INT AUTO_INCREMENT to VARCHAR to support custom format like 'RBUS-2026-215589'
-- Add record_id as the new AUTO_INCREMENT primary key

USE eplms_business_permit_db;

-- Step 1: Drop the primary key constraint on permit_id
ALTER TABLE `business_permit_applications` 
DROP PRIMARY KEY;

-- Step 2: Add record_id as the new AUTO_INCREMENT primary key
ALTER TABLE `business_permit_applications` 
ADD COLUMN `record_id` INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST;

-- Step 3: Modify permit_id to VARCHAR and make it unique
ALTER TABLE `business_permit_applications` 
MODIFY COLUMN `permit_id` VARCHAR(100) NOT NULL UNIQUE;

-- Step 4: Update existing records to have proper permit_id format (if any exist with numeric IDs)
UPDATE `business_permit_applications` 
SET `permit_id` = CONCAT('RBUS-', YEAR(application_date), '-', LPAD(`record_id`, 6, '0'))
WHERE `permit_id` REGEXP '^[0-9]+$';

-- Step 5: Fix application_documents table to reference record_id instead
ALTER TABLE `application_documents` 
DROP FOREIGN KEY IF EXISTS `application_documents_ibfk_1`;

-- Rename the column to match the reference
ALTER TABLE `application_documents` 
CHANGE COLUMN `permit_id` `record_id` INT(11) NOT NULL;

-- Recreate the foreign key with the correct reference
ALTER TABLE `application_documents` 
ADD CONSTRAINT `application_documents_ibfk_1` 
FOREIGN KEY (`record_id`) REFERENCES `business_permit_applications`(`record_id`) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 6: Update the view if it exists
DROP VIEW IF EXISTS `application_overview`;
CREATE VIEW `application_overview` AS
SELECT 
    `record_id`,
    `permit_id`,
    `applicant_id`,
    `application_date`,
    `permit_type`,
    `status`,
    `business_name`,
    `owner_first_name`,
    `owner_last_name`,
    `contact_number`,
    `email_address`
FROM `business_permit_applications`;
