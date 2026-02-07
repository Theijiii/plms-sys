-- Create special_permit_applications table
CREATE TABLE IF NOT EXISTS `special_permit_applications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `applicant_id` varchar(50) NOT NULL,
  `application_date` date NOT NULL,
  `status` varchar(50) DEFAULT 'PENDING',
  
  -- Business/Applicant Information
  `business_name` varchar(255) NOT NULL,
  `owner_first_name` varchar(100) NOT NULL,
  `owner_last_name` varchar(100) NOT NULL,
  `owner_middle_name` varchar(100) DEFAULT NULL,
  `contact_number` varchar(20) NOT NULL,
  `email_address` varchar(100) NOT NULL,
  
  -- Special Permit Details
  `special_permit_type` varchar(100) NOT NULL COMMENT 'Type: Event, Temporary, Seasonal, etc.',
  `event_description` text,
  `event_date_start` date NOT NULL,
  `event_date_end` date NOT NULL,
  `event_location` varchar(255) NOT NULL,
  `estimated_attendees` int(11) DEFAULT 0,
  
  -- System Fields
  `submission_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `last_updated` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `approved_date` datetime DEFAULT NULL,
  `remarks` text,
  
  PRIMARY KEY (`id`),
  KEY `applicant_id` (`applicant_id`),
  KEY `status` (`status`),
  KEY `application_date` (`application_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
