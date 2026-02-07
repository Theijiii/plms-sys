-- Add document_verification_data column to franchise_permit_applications
-- This stores JSON data from AI document verification results
ALTER TABLE `franchise_permit_applications` 
ADD COLUMN `document_verification_data` TEXT DEFAULT NULL AFTER `date_approved`;
