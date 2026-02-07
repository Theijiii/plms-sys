-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Feb 07, 2026 at 07:21 PM
-- Server version: 10.11.14-MariaDB-ubu2204
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `eplms_building_permit_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `ancillary_permit`
--

CREATE TABLE `ancillary_permit` (
  `permit_id` int(11) NOT NULL,
  `site_id` int(11) DEFAULT NULL,
  `permit_type` varchar(50) DEFAULT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `middle_initial` varchar(10) DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `owner_address` varchar(500) DEFAULT NULL,
  `property_address` varchar(500) DEFAULT NULL,
  `building_permit_number` varchar(50) DEFAULT NULL,
  `barangay_clearance` varchar(50) DEFAULT NULL,
  `tct_or_tax_dec` varchar(50) DEFAULT NULL,
  `professional_name` varchar(200) DEFAULT NULL,
  `professional_role` varchar(100) DEFAULT NULL,
  `prc_id` varchar(50) DEFAULT NULL,
  `ptr_number` varchar(50) DEFAULT NULL,
  `prc_expiry` date DEFAULT NULL,
  `type_specific_data` longtext DEFAULT NULL,
  `project_description` text DEFAULT NULL,
  `document_plans_path` varchar(500) DEFAULT NULL,
  `document_id_path` varchar(500) DEFAULT NULL,
  `signature_file_path` varchar(500) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `approved_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ancillary_permit`
--

INSERT INTO `ancillary_permit` (`permit_id`, `site_id`, `permit_type`, `status`, `submitted_at`, `approved_at`) VALUES
(1, 7, 'Electrical Permit', 'pending', '2024-06-15 01:00:00', NULL),
(2, 8, 'Mechanical Permit', 'under review', '2024-07-20 02:30:00', NULL),
(3, 9, 'Plumbing Permit', 'pending', '2024-08-25 03:45:00', NULL),
(4, 10, 'Sanitary Permit', 'pending', '2024-09-30 06:15:00', NULL),
(5, 11, 'Electrical Permit', 'under review', '2024-10-10 08:20:00', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `applicant`
--

CREATE TABLE `applicant` (
  `applicant_id` int(11) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `middle_initial` varchar(10) DEFAULT NULL,
  `tin` bigint(20) DEFAULT NULL,
  `contact_no` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `citizenship` varchar(50) DEFAULT NULL,
  `home_address` varchar(255) DEFAULT NULL,
  `form_of_ownership` enum('Individual','Enterprise','Others') NOT NULL,
  `suffix` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `applicant`
--

INSERT INTO `applicant` (`applicant_id`, `last_name`, `first_name`, `middle_initial`, `tin`, `contact_no`, `email`, `citizenship`, `home_address`, `form_of_ownership`, `suffix`) VALUES
(1, 'sfhgfjsghjd', 'hhsgdhjs', 'fdfs', 85494, '5456478', 'aestheawesome@gmail.com', 'Argentinean', 'hgfjdf', 'Others', 'dfhgd'),
(13, 'dshjasgdkjs', 'djhajhds', 'sadjhsjdkh', 978798, '87978', 'contact.mariacriseldabalcos@gmail.com', 'Armenian', 'dhagsdasgsghjsd', 'Enterprise', NULL),
(14, 'adhdhjad', 'sjdhads', 'dsa', 9305309, '9848744', 'maria.criselda@atomic-cube.com', 'Australian', 'fgd', 'Enterprise', NULL),
(15, 'dsasd', 'hsdjdgs', 'assd', 55, '09486', 'admin@gsm.gov.ph', 'Argentinean', 'fydhgdsf', 'Enterprise', 'sadsd'),
(17, 'BASS', 'FAY', 'O', 0, '+1 (757) 238-2902', 'JUWOXINU@MAILINATOR.COM', 'ID MAGNI CULPA LIBE', 'LABORIOSAM UT DOLOR', 'Enterprise', 'ELIGENDI NEQUE LABOR'),
(19, 'LAGARDE', 'MARY GRACE', 'ORELLANIDA', 23123, '09264564654', 'kenesha.janelle.memita@adamson.edu.ph', 'Filipino', 'SITIO. LOWER ZIGZAG, DALIG CALOOCAN CITY', 'Individual', ''),
(20, 'Ramos', 'Miguel', 'A', 998877665544, '09151237890', 'miguel.ramos@email.com', 'Filipino', '321 Bonifacio St., Cebu City', 'Individual', NULL),
(21, 'Tan', 'Jennifer', 'L', 887766554433, '09234455667', 'jennifer.tan@company.com', 'Filipino-Chinese', '654 Lapu-Lapu St., Davao City', 'Enterprise', NULL),
(22, 'Aquino', 'Benigno', 'S', 776655443322, '09345566778', 'benigno.aquino@gmail.com', 'Filipino', '987 Magallanes St., Iloilo City', 'Individual', 'Jr.'),
(23, 'Mendoza', 'Patricia', 'R', 665544332211, '09456677889', 'patricia.mendoza@yahoo.com', 'Filipino', '741 Quezon Ave., Bacolod City', 'Individual', NULL),
(24, 'Sy', 'Andrew', 'C', 554433221100, '09567788990', 'andrew.sy@business.ph', 'Filipino-Chinese', '852 Roxas Blvd., Zamboanga City', 'Enterprise', NULL),
(25, 'Lavina', 'Paul', 'Enoya', 12321321321, '09915850015', 'paullav09@gmail.com', 'Filipino', 'Bahay', 'Individual', '');

-- --------------------------------------------------------

--
-- Table structure for table `application`
--

CREATE TABLE `application` (
  `application_id` int(11) NOT NULL,
  `applicant_id` int(11) NOT NULL,
  `permit_group` varchar(50) DEFAULT NULL,
  `use_of_permit` varchar(100) DEFAULT NULL,
  `permit_action` varchar(100) DEFAULT NULL,
  `simple_complex` enum('Simple','Complex') DEFAULT NULL,
  `proposed_date_of_construction` date DEFAULT NULL,
  `expected_date_of_completion` date DEFAULT NULL,
  `total_estimated_cost` decimal(15,2) DEFAULT NULL,
  `prc_license` varchar(50) DEFAULT NULL,
  `remarks` varchar(150) NOT NULL,
  `status` varchar(50) DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `application`
--

INSERT INTO `application` (`application_id`, `applicant_id`, `permit_group`, `use_of_permit`, `permit_action`, `simple_complex`, `proposed_date_of_construction`, `expected_date_of_completion`, `total_estimated_cost`, `prc_license`, `remarks`, `status`) VALUES
(1, 1, 'GROUP B: Hotel / Motel / Dormitory / Townhouse / B', 'Motel', NULL, NULL, '2025-10-24', '2025-11-08', 8574854.00, NULL, 'fhsgfhd', 'pending'),
(2, 13, 'GROUP F: Factory / Plant (Non-Explosive)', 'dsds', NULL, NULL, '2025-11-01', '2025-10-12', 758973985.00, NULL, 'sfhsj', 'pending'),
(3, 14, 'GROUP F: Factory / Plant (Non-Explosive)', 'Factory', NULL, NULL, '2025-10-01', '2025-11-08', 4390589348953.00, NULL, '487487238734', 'pending'),
(4, 15, 'GROUP D: Hospital / Home for the Aged / Government', 'hotel', NULL, NULL, '2025-10-13', '2025-10-13', 445.00, NULL, 'dfbmdf', 'pending'),
(5, 17, 'GROUP C', 'AT ET QUAS DELENITI', NULL, NULL, NULL, NULL, 0.00, '', '', 'pending'),
(6, 19, 'GROUP A: Single / Duplex / Residential R-1, R-2', 'HOTEL', NULL, NULL, '2026-02-27', '2026-02-10', 32665.00, '', 'Quia quis vel repreh', 'pending'),
(7, 20, 'GROUP A: Residential', 'Two-storey Residential House', 'New Construction', 'Simple', '2024-07-01', '2024-12-15', 2800000.00, 'PRC-2024001', 'Family residence with garage', 'pending'),
(8, 21, 'GROUP C: Commercial / Mercantile', 'Commercial Building', 'New Construction', 'Complex', '2024-08-15', '2025-06-30', 45000000.00, 'PRC-2024002', '5-storey commercial building with retail spaces', 'under review'),
(9, 22, 'GROUP A: Residential', 'Bungalow House', 'New Construction', 'Simple', '2024-09-01', '2025-02-28', 1800000.00, 'PRC-2024003', 'Retirement home with garden', 'pending'),
(10, 23, 'GROUP B: Hotel / Motel / Dormitory / Townhouse / B', 'Beach Resort', 'New Construction', 'Complex', '2024-10-01', '2025-12-31', 75000000.00, 'PRC-2024004', '20-room beach resort with restaurant', 'pending'),
(11, 24, 'GROUP E: Industrial', 'Cold Storage Facility', 'New Construction', 'Complex', '2024-11-15', '2025-09-30', 35000000.00, 'PRC-2024005', 'Cold storage for seafood products', 'under review'),
(12, 25, 'GROUP A: Single / Duplex / Residential R-1, R-2', 'GIlid', NULL, NULL, '2011-02-11', '2009-02-12', 200000.00, '', '', 'pending');

-- --------------------------------------------------------

--
-- Table structure for table `building_permit_submission`
--

CREATE TABLE `building_permit_submission` (
  `submission_id` int(11) NOT NULL,
  `building_permit_id` int(11) NOT NULL,
  `requirement_id` int(11) NOT NULL,
  `file_name` varchar(200) DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `file_type` enum('PDF','JPG','JPEG','PNG') DEFAULT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `verified` enum('Pending','Valid','Invalid') DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `files`
--

CREATE TABLE `files` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `professional_id` char(36) NOT NULL,
  `file_type` varchar(50) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `original_file_name` varchar(255) NOT NULL,
  `file_size` bigint(20) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `file_hash` varchar(64) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `verification_status` varchar(20) DEFAULT 'pending',
  `verified_by` char(36) DEFAULT NULL,
  `verified_date` timestamp NULL DEFAULT NULL,
  `verification_notes` text DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `uploaded_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `expiry_date` date DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `occupancy_classification`
--

CREATE TABLE `occupancy_classification` (
  `classification_id` int(11) NOT NULL,
  `site_id` int(11) NOT NULL,
  `number_of_units` int(11) DEFAULT NULL,
  `number_of_storeys` int(11) DEFAULT NULL,
  `total_floor_area` decimal(12,2) DEFAULT NULL,
  `lot_area` decimal(12,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `occupancy_classification`
--

INSERT INTO `occupancy_classification` (`classification_id`, `site_id`, `number_of_units`, `number_of_storeys`, `total_floor_area`, `lot_area`) VALUES
(1, 1, 54875984, 645, 454.00, 54875.00),
(2, 2, 437824, 743687423, 43.00, 432343.00),
(3, 3, 38757393, 3593853, 37856.00, 395803.00),
(4, 4, 43784, 433, 3423.00, 334.00),
(5, 5, 0, 0, 0.00, 0.00),
(6, 6, 268, 616, 6.00, 46.00),
(7, 7, 1, 2, 185.75, 350.00),
(8, 8, 12, 5, 2800.50, 1200.00),
(9, 9, 1, 1, 120.25, 250.00),
(10, 10, 20, 3, 3200.00, 5000.00),
(11, 11, 1, 2, 1800.75, 3000.00),
(12, 12, 4, 4, 16.00, 200.00);

-- --------------------------------------------------------

--
-- Table structure for table `other_requirements`
--

CREATE TABLE `other_requirements` (
  `requirement_id` int(11) NOT NULL,
  `application_id` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `copy_for` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `other_requirements`
--

INSERT INTO `other_requirements` (`requirement_id`, `application_id`, `description`, `copy_for`) VALUES
(1, 7, 'Barangay Clearance', 'Applicant'),
(2, 8, 'Environmental Compliance Certificate', 'DENR'),
(3, 9, 'Zoning Clearance', 'City Planning Office'),
(4, 10, 'Coastal Zone Management Clearance', 'DENR-EMB'),
(5, 11, 'Fire Safety Evaluation Clearance', 'Bureau of Fire Protection');

-- --------------------------------------------------------

--
-- Table structure for table `professional_registrations`
--

CREATE TABLE `professional_registrations` (
  `id` int(11) NOT NULL,
  `registration_id` varchar(20) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `middle_initial` varchar(10) DEFAULT NULL,
  `last_name` varchar(100) NOT NULL,
  `suffix` varchar(20) DEFAULT NULL,
  `birth_date` date NOT NULL,
  `contact_number` varchar(20) NOT NULL,
  `email` varchar(150) NOT NULL,
  `prc_license` varchar(50) NOT NULL,
  `prc_expiry` date NOT NULL,
  `ptr_number` varchar(50) NOT NULL,
  `tin` varchar(50) NOT NULL,
  `profession` varchar(100) NOT NULL,
  `role_in_project` varchar(100) NOT NULL,
  `prc_id_file` varchar(500) DEFAULT NULL,
  `ptr_file` varchar(500) DEFAULT NULL,
  `signature_file` varchar(500) DEFAULT NULL,
  `status` enum('pending','approved','rejected','under_review') DEFAULT 'pending',
  `remarks` text DEFAULT NULL,
  `date_submitted` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `professional_registrations`
--

INSERT INTO `professional_registrations` (`id`, `registration_id`, `user_id`, `first_name`, `middle_initial`, `last_name`, `suffix`, `birth_date`, `contact_number`, `email`, `prc_license`, `prc_expiry`, `ptr_number`, `tin`, `profession`, `role_in_project`, `prc_id_file`, `ptr_file`, `signature_file`, `status`, `remarks`, `date_submitted`, `updated_at`) VALUES
(1, 'PROF-2024-016', NULL, 'Eduardo', 'M', 'Delos Santos', NULL, '1978-03-15', '09171239876', 'eduardo.delossantos@architect.com', 'PRC-987654', '2025-12-31', 'PTR-2024-016', '998877665544', 'Architect', 'Project Architect', NULL, NULL, NULL, 'approved', 'Registered architect with 15 years experience', '2024-06-10 09:30:00', '2026-02-07 20:42:11'),
(2, 'PROF-2024-017', NULL, 'Gloria', 'A', 'Macapagal', NULL, '1982-07-22', '09223344556', 'gloria.macapagal@engineer.com', 'PRC-876543', '2025-11-30', 'PTR-2024-017', '887766554433', 'Civil Engineer', 'Structural Engineer', NULL, NULL, NULL, 'under_review', 'Structural design specialist, documents pending verification', '2024-07-05 14:20:00', '2026-02-07 20:42:11'),
(3, 'PROF-2024-018', NULL, 'Ferdinand', 'R', 'Marcos', 'Jr.', '1985-11-10', '09334455667', 'ferdinand.marcosjr@mepf.com', 'PRC-765432', '2025-10-31', 'PTR-2024-018', '776655443322', 'Mechanical Engineer', 'MEPF Consultant', NULL, NULL, NULL, 'approved', 'HVAC and plumbing systems expert', '2024-08-12 11:45:00', '2026-02-07 20:42:11'),
(4, 'PROF-2024-019', NULL, 'Corazon', 'C', 'Aquino', NULL, '1975-04-05', '09445566778', 'corazon.aquino@electrical.com', 'PRC-654321', '2025-09-30', 'PTR-2024-019', '665544332211', 'Electrical Engineer', 'Electrical Design Consultant', NULL, NULL, NULL, 'pending', 'New registration, awaiting document review', '2024-09-18 16:30:00', '2026-02-07 20:42:11'),
(5, 'PROF-2024-020', NULL, 'Rodrigo', 'D', 'Duterte', NULL, '1970-09-28', '09556677889', 'rodrigo.duterte@safety.com', 'PRC-543210', '2025-08-31', 'PTR-2024-020', '554433221100', 'Sanitary Engineer', 'Safety and Sanitation Officer', NULL, NULL, NULL, 'approved', 'Specializes in building safety codes and sanitation systems', '2024-10-22 10:15:00', '2026-02-07 20:42:11'),
(6, 'PROF-2024-021', NULL, 'Leni', 'G', 'Robredo', NULL, '1980-12-23', '09667788990', 'leni.robredo@design.com', 'PRC-432109', '2025-07-31', 'PTR-2024-021', '443322110099', 'Interior Designer', 'Interior Design Consultant', NULL, NULL, NULL, 'under_review', 'Commercial and residential interior design specialist', '2024-11-05 13:25:00', '2026-02-07 20:42:11'),
(7, 'PROF-2024-022', NULL, 'Bongbong', 'R', 'Marcos', NULL, '1973-02-14', '09778899001', 'bongbong.marcos@environment.com', 'PRC-321098', '2025-06-30', 'PTR-2024-022', '332211009988', 'Environmental Planner', 'Environmental Compliance Officer', NULL, NULL, NULL, 'approved', 'Environmental impact assessment expert', '2024-12-01 15:40:00', '2026-02-07 20:42:11'),
(8, 'PROF-2024-023', NULL, 'Sara', 'Z', 'Duterte', NULL, '1983-05-31', '09889900112', 'sara.duterte@masterplan.com', 'PRC-210987', '2025-05-31', 'PTR-2024-023', '221100998877', 'Urban Planner', 'Site Planning Consultant', NULL, NULL, NULL, 'pending', 'Urban development and zoning specialist', '2025-01-10 09:15:00', '2026-02-07 20:42:11'),
(9, 'PROF-2024-024', NULL, 'Manny', 'D', 'Pacquiao', NULL, '1979-12-17', '09990011223', 'manny.pacquiao@contractor.com', 'PRC-109876', '2025-04-30', 'PTR-2024-024', '110099887766', 'Civil Engineer', 'General Contractor', NULL, NULL, NULL, 'approved', 'Licensed contractor with Class AAA license', '2025-02-14 14:50:00', '2026-02-07 20:42:11'),
(10, 'PROF-2024-025', NULL, 'Isko', 'M', 'Moreno', NULL, '1977-08-10', '09101122334', 'isko.moreno@geotech.com', 'PRC-098765', '2025-03-31', 'PTR-2024-025', '009988776655', 'Geodetic Engineer', 'Land Surveyor', NULL, NULL, NULL, 'under_review', 'Topographic and boundary surveying specialist', '2025-03-20 11:20:00', '2026-02-07 20:42:11');

-- --------------------------------------------------------

--
-- Table structure for table `project_cost`
--

CREATE TABLE `project_cost` (
  `cost_id` int(11) NOT NULL,
  `site_id` int(11) NOT NULL,
  `building_cost` decimal(12,2) DEFAULT NULL,
  `electrical_cost` decimal(12,2) DEFAULT NULL,
  `mechanical_cost` decimal(12,2) DEFAULT NULL,
  `electronics_cost` decimal(12,2) DEFAULT NULL,
  `plumbing_cost` decimal(12,2) DEFAULT NULL,
  `other_cost` decimal(12,2) DEFAULT NULL,
  `equipment_cost` decimal(12,2) DEFAULT NULL,
  `proposed_start` date DEFAULT NULL,
  `expected_completion` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `project_cost`
--

INSERT INTO `project_cost` (`cost_id`, `site_id`, `building_cost`, `electrical_cost`, `mechanical_cost`, `electronics_cost`, `plumbing_cost`, `other_cost`, `equipment_cost`, `proposed_start`, `expected_completion`) VALUES
(1, 1, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-10-31', '2025-10-31'),
(2, 2, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-10-12', '2025-10-12'),
(3, 3, 0.00, -2.00, 0.00, 0.00, 0.00, 50934095.00, 0.00, '2025-10-25', '2025-10-10'),
(4, 4, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-11-01', '2025-10-13'),
(5, 5, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL),
(6, 6, 43.00, 70.00, 99.00, 41.00, 91.00, 72.00, 86.00, '1994-03-28', '1977-04-22'),
(7, 7, 2000000.00, 250000.00, 120000.00, 80000.00, 150000.00, 100000.00, 50000.00, '2024-07-01', '2024-12-15'),
(8, 8, 32000000.00, 3500000.00, 2500000.00, 1500000.00, 1800000.00, 2000000.00, 3000000.00, '2024-08-15', '2025-06-30'),
(9, 9, 1200000.00, 180000.00, 80000.00, 50000.00, 100000.00, 80000.00, 40000.00, '2024-09-01', '2025-02-28'),
(10, 10, 50000000.00, 6500000.00, 4500000.00, 3000000.00, 3500000.00, 4500000.00, 4000000.00, '2024-10-01', '2025-12-31'),
(11, 11, 25000000.00, 2800000.00, 2200000.00, 1500000.00, 1200000.00, 1800000.00, 2000000.00, '2024-11-15', '2025-09-30'),
(12, 12, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2022-08-09', '2024-08-10');

-- --------------------------------------------------------

--
-- Table structure for table `project_site`
--

CREATE TABLE `project_site` (
  `site_id` int(11) NOT NULL,
  `applicant_id` int(11) NOT NULL,
  `lot_no` varchar(50) DEFAULT NULL,
  `blk_no` varchar(50) DEFAULT NULL,
  `tct_no` varchar(50) DEFAULT NULL,
  `tax_dec_no` varchar(50) DEFAULT NULL,
  `street` varchar(200) DEFAULT NULL,
  `barangay` varchar(100) DEFAULT NULL,
  `city_municipality` varchar(100) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `project_site`
--

INSERT INTO `project_site` (`site_id`, `applicant_id`, `lot_no`, `blk_no`, `tct_no`, `tax_dec_no`, `street`, `barangay`, `city_municipality`, `province`) VALUES
(1, 1, '74567845', '545', '5454', '8574', 'fghsgdf', 'hdgfsfd', 'fhghjfsd', 'fhgsj'),
(2, 13, '37434', '3343', '3478423', '87428', 'shdgjassd', 'city', 'hsdgjda', 'dasdhkjsa'),
(3, 14, '950809348', '54398403854', '38758365', '8937873', 'shfgfjhsf', 'jdhfsjhfjd', 'sfjshkjsdk', 'jhakjshfsakj'),
(4, 15, '44545', '454', '423', '74863', 'dhjdg', 'city', 'dhdsghjdsg', 'dsjhdj'),
(5, 17, 'LABORE NISI OMNIS MA', 'ID HIC AD VOLUPTATEM', '', '', 'VOLUPTATEM AD QUO F', 'SIT CUM ET QUAERAT A', 'IN AUT ENIM TEMPORIB', 'BEATAE SIT ISTE QUI'),
(6, 19, '83', '34', '89', '80', 'Mollitia itaque irur', 'Aliquam deserunt ut', 'Et temporibus numqua', 'Perspiciatis ut dol'),
(7, 20, '101-A', '15', 'TCT-2024001', '2024-0001234', 'Gorordo Avenue', 'Lahug', 'Cebu City', 'Cebu'),
(8, 21, '202-B', '8', 'TCT-2024002', '2024-0002345', 'R. Magsaysay Ave', 'Bajada', 'Davao City', 'Davao del Sur'),
(9, 22, '303-C', '12', 'TCT-2024003', '2024-0003456', 'J.M. Basa Street', 'City Proper', 'Iloilo City', 'Iloilo'),
(10, 23, '404-D', '6', 'TCT-2024004', '2024-0004567', 'Lacson Street', 'Singcang', 'Bacolod City', 'Negros Occidental'),
(11, 24, '505-E', '9', 'TCT-2024005', '2024-0005678', 'Valderosa Street', 'Tetuan', 'Zamboanga City', 'Zamboanga del Sur'),
(12, 25, '12', '12', '231111', '2121311', '16', 'Holy Spirit', 'Quezon City', 'Metro Manila');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `ancillary_permit`
--
ALTER TABLE `ancillary_permit`
  ADD PRIMARY KEY (`permit_id`),
  ADD KEY `site_id` (`site_id`),
  ADD KEY `idx_ancillary_permit_type` (`permit_type`),
  ADD KEY `idx_ancillary_status` (`status`);

--
-- Indexes for table `applicant`
--
ALTER TABLE `applicant`
  ADD PRIMARY KEY (`applicant_id`);

--
-- Indexes for table `application`
--
ALTER TABLE `application`
  ADD PRIMARY KEY (`application_id`),
  ADD KEY `applicant_id` (`applicant_id`);

--
-- Indexes for table `building_permit_submission`
--
ALTER TABLE `building_permit_submission`
  ADD PRIMARY KEY (`submission_id`),
  ADD KEY `building_permit_id` (`building_permit_id`),
  ADD KEY `requirement_id` (`requirement_id`);

--
-- Indexes for table `files`
--
ALTER TABLE `files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_files_professional_id` (`professional_id`),
  ADD KEY `idx_files_file_type` (`file_type`),
  ADD KEY `idx_files_verification_status` (`verification_status`),
  ADD KEY `idx_files_uploaded_date` (`uploaded_date`),
  ADD KEY `idx_files_is_verified` (`is_verified`),
  ADD KEY `idx_files_expiry_date` (`expiry_date`);

--
-- Indexes for table `occupancy_classification`
--
ALTER TABLE `occupancy_classification`
  ADD PRIMARY KEY (`classification_id`),
  ADD KEY `site_id` (`site_id`);

--
-- Indexes for table `other_requirements`
--
ALTER TABLE `other_requirements`
  ADD PRIMARY KEY (`requirement_id`),
  ADD KEY `application_id` (`application_id`);

--
-- Indexes for table `professional_registrations`
--
ALTER TABLE `professional_registrations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `registration_id` (`registration_id`),
  ADD KEY `idx_registration_id` (`registration_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_prc_license` (`prc_license`);

--
-- Indexes for table `project_cost`
--
ALTER TABLE `project_cost`
  ADD PRIMARY KEY (`cost_id`),
  ADD KEY `site_id` (`site_id`);

--
-- Indexes for table `project_site`
--
ALTER TABLE `project_site`
  ADD PRIMARY KEY (`site_id`),
  ADD KEY `applicant_id` (`applicant_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `ancillary_permit`
--
ALTER TABLE `ancillary_permit`
  MODIFY `permit_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `applicant`
--
ALTER TABLE `applicant`
  MODIFY `applicant_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `application`
--
ALTER TABLE `application`
  MODIFY `application_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `building_permit_submission`
--
ALTER TABLE `building_permit_submission`
  MODIFY `submission_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `occupancy_classification`
--
ALTER TABLE `occupancy_classification`
  MODIFY `classification_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `other_requirements`
--
ALTER TABLE `other_requirements`
  MODIFY `requirement_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `professional_registrations`
--
ALTER TABLE `professional_registrations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `project_cost`
--
ALTER TABLE `project_cost`
  MODIFY `cost_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `project_site`
--
ALTER TABLE `project_site`
  MODIFY `site_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `ancillary_permit`
--
-- FK on site_id removed: ancillary form submissions do not require a project_site entry
-- ALTER TABLE `ancillary_permit`
--   ADD CONSTRAINT `ancillary_permit_ibfk_1` FOREIGN KEY (`site_id`) REFERENCES `project_site` (`site_id`);

--
-- Constraints for table `application`
--
ALTER TABLE `application`
  ADD CONSTRAINT `application_ibfk_1` FOREIGN KEY (`applicant_id`) REFERENCES `applicant` (`applicant_id`);

--
-- Constraints for table `building_permit_submission`
--
ALTER TABLE `building_permit_submission`
  ADD CONSTRAINT `building_permit_submission_ibfk_1` FOREIGN KEY (`building_permit_id`) REFERENCES `application` (`application_id`),
  ADD CONSTRAINT `building_permit_submission_ibfk_2` FOREIGN KEY (`requirement_id`) REFERENCES `other_requirements` (`requirement_id`);

--
-- Constraints for table `occupancy_classification`
--
ALTER TABLE `occupancy_classification`
  ADD CONSTRAINT `occupancy_classification_ibfk_1` FOREIGN KEY (`site_id`) REFERENCES `project_site` (`site_id`);

--
-- Constraints for table `other_requirements`
--
ALTER TABLE `other_requirements`
  ADD CONSTRAINT `other_requirements_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `application` (`application_id`);

--
-- Constraints for table `project_cost`
--
ALTER TABLE `project_cost`
  ADD CONSTRAINT `project_cost_ibfk_1` FOREIGN KEY (`site_id`) REFERENCES `project_site` (`site_id`);

--
-- Constraints for table `project_site`
--
ALTER TABLE `project_site`
  ADD CONSTRAINT `project_site_ibfk_1` FOREIGN KEY (`applicant_id`) REFERENCES `applicant` (`applicant_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
