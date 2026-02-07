-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Feb 07, 2026 at 09:27 AM
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
-- Database: `eplms_franchise_applications`
--

-- --------------------------------------------------------

--
-- Table structure for table `franchise_permit_applications`
--

CREATE TABLE `franchise_permit_applications` (
  `application_id` varchar(20) NOT NULL,
  `permit_type` varchar(50) DEFAULT 'NEW',
  `permit_subtype` varchar(50) DEFAULT 'FRANCHISE',
  `status` varchar(50) DEFAULT 'pending',
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `middle_initial` varchar(10) DEFAULT NULL,
  `home_address` varchar(255) DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `citizenship` varchar(100) DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `id_type` varchar(50) NOT NULL,
  `id_number` varchar(50) NOT NULL,
  `id_picture` varchar(255) DEFAULT NULL,
  `make_brand` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  `engine_number` varchar(50) NOT NULL,
  `chassis_number` varchar(50) NOT NULL,
  `plate_number` varchar(20) NOT NULL,
  `year_acquired` year(4) NOT NULL,
  `color` varchar(50) NOT NULL,
  `vehicle_type` varchar(50) NOT NULL,
  `lto_or_number` varchar(50) NOT NULL,
  `lto_cr_number` varchar(50) NOT NULL,
  `lto_expiration_date` date NOT NULL,
  `mv_file_number` varchar(50) DEFAULT NULL,
  `district` varchar(100) NOT NULL,
  `route_zone` varchar(255) NOT NULL,
  `toda_name` varchar(255) NOT NULL,
  `barangay_of_operation` varchar(255) NOT NULL,
  `operator_type` varchar(50) DEFAULT NULL,
  `proof_of_residency` varchar(255) DEFAULT NULL,
  `toda_president_cert` varchar(255) DEFAULT NULL,
  `barangay_clearance` varchar(255) DEFAULT NULL,
  `toda_endorsement` varchar(255) DEFAULT NULL,
  `lto_or_cr` varchar(255) DEFAULT NULL,
  `insurance_certificate` varchar(255) DEFAULT NULL,
  `drivers_license` varchar(255) DEFAULT NULL,
  `emission_test` varchar(255) DEFAULT NULL,
  `official_receipt` varchar(255) DEFAULT NULL,
  `nbi_clearance` varchar(255) DEFAULT NULL,
  `medical_certificate` varchar(255) DEFAULT NULL,
  `affidavit_of_ownership` varchar(255) DEFAULT NULL,
  `tricycle_body_number_picture` varchar(255) DEFAULT NULL,
  `barangay_clearance_checked` tinyint(1) DEFAULT 0,
  `toda_endorsement_checked` tinyint(1) DEFAULT 0,
  `lto_or_cr_checked` tinyint(1) DEFAULT 0,
  `insurance_certificate_checked` tinyint(1) DEFAULT 0,
  `drivers_license_checked` tinyint(1) DEFAULT 0,
  `emission_test_checked` tinyint(1) DEFAULT 0,
  `id_picture_checked` tinyint(1) DEFAULT 0,
  `proof_of_residency_checked` tinyint(1) DEFAULT 0,
  `affidavit_of_ownership_checked` tinyint(1) DEFAULT 0,
  `police_clearance_checked` tinyint(1) DEFAULT 0,
  `official_receipt_checked` tinyint(1) DEFAULT 0,
  `tricycle_body_number_picture_checked` tinyint(1) DEFAULT 0,
  `nbi_clearance_checked` tinyint(1) DEFAULT 0,
  `medical_certificate_checked` tinyint(1) DEFAULT 0,
  `franchise_fee_checked` tinyint(1) DEFAULT 0,
  `sticker_id_fee_checked` tinyint(1) DEFAULT 0,
  `inspection_fee_checked` tinyint(1) DEFAULT 0,
  `franchise_fee_or` varchar(50) DEFAULT NULL,
  `sticker_id_fee_or` varchar(50) DEFAULT NULL,
  `inspection_fee_or` varchar(50) DEFAULT NULL,
  `franchise_fee_receipt` varchar(255) DEFAULT NULL,
  `sticker_id_fee_receipt` varchar(255) DEFAULT NULL,
  `inspection_fee_receipt` varchar(255) DEFAULT NULL,
  `applicant_signature` varchar(255) NOT NULL,
  `date_submitted` date NOT NULL,
  `barangay_captain_signature` varchar(255) NOT NULL,
  `remarks` text DEFAULT NULL,
  `notes` varchar(500) DEFAULT NULL,
  `attachments` text DEFAULT NULL,
  `file_attachments` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `user_id` int(11) DEFAULT NULL,
  `police_clearance` varchar(255) DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `mtop_reference_id` varchar(50) DEFAULT NULL,
  `is_renewal` tinyint(1) DEFAULT 0,
  `original_permit_id` varchar(50) DEFAULT NULL,
  `renewal_type` varchar(20) DEFAULT 'MTOP',
  `expiry_date` date DEFAULT NULL,
  `date_approved` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `franchise_permit_applications`
--

INSERT INTO `franchise_permit_applications` (`application_id`, `permit_type`, `permit_subtype`, `status`, `first_name`, `last_name`, `middle_initial`, `home_address`, `contact_number`, `email`, `citizenship`, `birth_date`, `id_type`, `id_number`, `id_picture`, `make_brand`, `model`, `engine_number`, `chassis_number`, `plate_number`, `year_acquired`, `color`, `vehicle_type`, `lto_or_number`, `lto_cr_number`, `lto_expiration_date`, `mv_file_number`, `district`, `route_zone`, `toda_name`, `barangay_of_operation`, `operator_type`, `proof_of_residency`, `toda_president_cert`, `barangay_clearance`, `toda_endorsement`, `lto_or_cr`, `insurance_certificate`, `drivers_license`, `emission_test`, `official_receipt`, `nbi_clearance`, `medical_certificate`, `affidavit_of_ownership`, `tricycle_body_number_picture`, `barangay_clearance_checked`, `toda_endorsement_checked`, `lto_or_cr_checked`, `insurance_certificate_checked`, `drivers_license_checked`, `emission_test_checked`, `id_picture_checked`, `proof_of_residency_checked`, `affidavit_of_ownership_checked`, `police_clearance_checked`, `official_receipt_checked`, `tricycle_body_number_picture_checked`, `nbi_clearance_checked`, `medical_certificate_checked`, `franchise_fee_checked`, `sticker_id_fee_checked`, `inspection_fee_checked`, `franchise_fee_or`, `sticker_id_fee_or`, `inspection_fee_or`, `franchise_fee_receipt`, `sticker_id_fee_receipt`, `inspection_fee_receipt`, `applicant_signature`, `date_submitted`, `barangay_captain_signature`, `remarks`, `notes`, `attachments`, `file_attachments`, `created_at`, `updated_at`, `user_id`, `police_clearance`, `company_name`, `mtop_reference_id`, `is_renewal`, `original_permit_id`, `renewal_type`, `expiry_date`, `date_approved`) VALUES
('TP20260001', 'NEW', 'MTOP', 'Approved', 'Elton', 'Tran', 'F', 'Incidunt autem aliq', '09181553181', 'dore@mailinator.com', 'Cameroonian', '2023-01-14', 'Postal ID', '255', NULL, 'Et perferendis quaer', 'Consequatur Exercit', '369', '683', 'ABC1234', '2009', 'Commodi vel tempore', 'Motorcycle', '322', '390', '2028-06-07', '664', 'Consequatur Totam n', 'Hic dolores possimus', '', 'Et eius magna quasi ', 'Corporation', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '', '887878', '', NULL, NULL, NULL, 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/4QC8RXhpZgAASUkqAAgAAAAGABIBAwABAAAAAQAAABoBBQABAAAAVgAAABsBBQABAAAAXgAAACgBAwABAAAAAgAAABMCAwABAAAAAQAAAGmHBAABAAAAZgAAAAAAAABgAAAAAQAAAGAAAAABAAAABgAAkAcABAAAADAyMTABkQcABAAAAAECAwAAoAcABAAAADAxMDABoAMA', '2017-08-02', '', 'Aliquid do temporibu', 'Aperiam et voluptas ', NULL, NULL, '2026-01-24 10:57:24', '2026-01-24 23:31:58', 0, NULL, NULL, NULL, 0, NULL, 'MTOP', NULL, NULL),
('TP20260002', 'NEW', 'FRANCHISE', 'pending', 'Sandra', 'Romero', 'E', 'Dicta eveniet repud', '09146377837', 'jedyxus@mailinator.com', 'Colombian', '2024-04-06', 'Passport', '602', '', 'Rem esse ut distinc', 'Repellendus Commodi', '256', '376', 'ABC1234', '1974', 'Duis qui facilis eos', 'Tricycle', '548', '916', '2033-07-13', '977', 'Maiores explicabo N', 'Recusandae Fugiat ', 'Sage Pittman', 'Sit aliquam sit qu', 'TODA Member', '566517755_1351248763176804_4096827475780098687_n_1769249304_69749a1828728.jpg', '', 'FRANCHISE_APPLICATIONS_1769249304_69749a1828eda.png', 'frieren_beyond_3840x2160_22999_1769249304_69749a182f3ce.jpg', 'FRANCHISE_APPLICATIONS__1__1769249304_69749a18294b5.jpg', '', '', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 're', '', '', '41ae03de_57e8_426e_a9ac_b7feb8bc0a28_1769249304_69749a182fb5f.jpg', '', '', 'signature_1769249304_69749a18303df.png', '1971-06-06', '', 'Non non dolor non el', 'Dolor est ut veniam', NULL, NULL, '2026-01-24 11:08:24', '2026-01-24 23:31:35', 0, '', 'Mercado Monroe Trading', 'TP20260001', 0, NULL, 'MTOP', NULL, NULL),
('TP20260003', 'NEW', 'MTOP', 'Approved', 'Lars', 'George', 'D', 'Aut voluptate dignis', '09146879325', 'hymepidiv@mailinator.com', 'Pakistani', '1977-08-19', 'UMID', '84038474', '', 'Autem quos natus sae', 'Explicabo Molestias', '995124536271', '12345678912345678', 'SBS4376', '2006', 'Soluta consequatur a', 'Tricycle', '95935362', '50332367', '2045-08-18', '829', 'Ea ullam fugit eos', 'Quia voluptatem sus', '', 'Neque eos sit simili', 'TODA Member', 'viber_image_2026_01_22_08_44_41_630_1769274514_6974fc92dda89.jpg', '', 'FRANCHISE_APPLICATIONS_1769274514_6974fc92ddf52.png', '', 'Untitled_design__7__1769274514_6974fc92de421.jpg', '', '', '', '', 'frieren_beyond_3840x2160_22999_1769274514_6974fc92de7cc.jpg', 'frieren_beyond_3840x2160_22999_1769274514_6974fc92df1a4.jpg', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, '4545', '', '', 'FRANCHISE_APPLICATIONS_1769274514_6974fc92df61a.png', '', '', 'signature_1769274514_6974fc92dfbef.png', '1990-03-26', '', '--- Jan 25, 2026 09:15:55 AM (Admin) ---\ndassds\n\n--- Jan 25, 2026 09:15:49 AM (Admin) ---\ndsghghds\n\nRecusandae Laudanti', 'Id esse adipisci ad', NULL, NULL, '2026-01-24 18:08:34', '2026-01-25 16:15:55', 0, 'FRANCHISE_APPLICATIONS__1__1769274514_6974fc92dede6.jpg', '', NULL, 0, NULL, 'MTOP', NULL, NULL),
('TP20260004', 'NEW', 'FRANCHISE', 'pending', 'Lars', 'George', 'D', 'Aut voluptate dignis', '09146879325', 'hymepidiv@mailinator.com', 'Pakistani', '1977-08-19', 'UMID', '84038474', '', 'Autem quos natus sae', 'Explicabo Molestias', '995124536271', '12345678912345678', 'SBS4376', '2006', 'Soluta consequatur a', 'Other', '95935362', '50332367', '2045-08-18', '829', 'Ea ullam fugit eos', 'Quia voluptatem sus', 'Bagumbong TODA', 'Neque eos sit simili', 'TODA Member', 'FRANCHISE_APPLICATIONS_1769275687_697501272c81c.jpg', 'FRANCHISE_APPLICATIONS__1__1769275687_6975012732483.jpg', 'FRANCHISE_APPLICATIONS__1__1769275687_697501272cd0f.jpg', 'frieren_beyond_3840x2160_22999_1769275687_6975012731fde.jpg', 'FRANCHISE_APPLICATIONS_1769275687_69750127315fd.png', '', '', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, '6473', '', '', 'FRANCHISE_APPLICATIONS_1769275687_69750127329b1.png', '', '', 'signature_1769275687_69750127345b8.png', '1985-01-07', '', 'Eius molestiae eius ', 'Quo enim odio quisqu', NULL, NULL, '2026-01-24 18:28:07', '2026-01-25 01:28:07', 0, '', 'Reese Skinner Traders', 'TP20260003', 0, NULL, 'MTOP', NULL, NULL),
('TP20260005', 'NEW', 'FRANCHISE', 'pending', 'Lars', 'George', 'D', 'Aut voluptate dignis', '09146879325', 'hymepidiv@mailinator.com', 'Pakistani', '1977-08-19', 'UMID', '84038474', '', 'Autem quos natus sae', 'Explicabo Molestias', '995124536271', '12345678912345678', 'SBS4376', '2006', 'Soluta consequatur a', 'Tricycle', '95935362', '50332367', '2045-08-18', '829', 'Ea ullam fugit eos', 'Quia voluptatem sus', 'Vanna Ware', 'Neque eos sit simili', 'TODA Member', 'FRANCHISE_APPLICATIONS__1__1769320206_6975af0e235b9.jpg', '', 'FRANCHISE_APPLICATIONS__1__1769320206_6975af0e23e6f.jpg', 'FRANCHISE_APPLICATIONS_1769320206_6975af0e24e7d.jpg', 'FRANCHISE_APPLICATIONS__1__1769320206_6975af0e24846.jpg', '', '', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, '', 'dwewe', '', '', 'frieren_beyond_3840x2160_22999_1769320206_6975af0e25415.jpg', '', 'signature_1769320206_6975af0e25d23.png', '1994-09-22', '', 'Voluptatem adipisci ', 'Autem amet et volup', NULL, NULL, '2026-01-25 06:50:06', '2026-01-25 13:50:06', 0, '', 'Hendricks and Ball Traders', 'TP20260003', 0, NULL, 'MTOP', NULL, NULL),
('TP20260019', 'NEW', 'FRANCHISE', 'pending', 'Lars', 'George', 'D', 'Aut voluptate dignis', '09146879325', 'hymepidiv@mailinator.com', 'Pakistani', '1977-08-19', 'UMID', '84038474', '', 'Autem quos natus sae', 'Explicabo Molestias', '995124536271', '12345678912345678', 'SBS4376', '2006', 'Soluta consequatur a', 'Tricycle', '95935362', '50332367', '2045-08-18', '829', 'Ea ullam fugit eos', 'Quia voluptatem sus', 'Wayne Schroeder', 'Neque eos sit simili', 'TODA Member', 'FRANCHISE_APPLICATIONS__1__1769350735_6976264f650a9.jpg', '', 'FRANCHISE_APPLICATIONS__1__1769350735_6976264f65ae9.jpg', 'FRANCHISE_APPLICATIONS__1__1769350735_6976264f670e1.jpg', 'FRANCHISE_APPLICATIONS__1__1769350735_6976264f6650c.jpg', '', '', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, '', '', '73865873', '', '', 'viber_image_2026_01_22_08_44_41_630_1769350735_6976264f67ac7.jpg', 'signature_1769350735_6976264f6b24b.png', '2021-03-04', '', 'Ab temporibus volupt', 'Exercitationem est o', NULL, NULL, '2026-01-25 15:18:55', '2026-01-25 22:18:55', NULL, '', 'Valentine Lyons Trading', 'TP20260003', 0, NULL, 'MTOP', NULL, NULL),
('TP20260020', 'RENEWAL', 'FRANCHISE', 'pending', '', '', '', '', '', '', 'Filipino', NULL, '', '', '', '', '', '', '', '', '2026', '', 'Tricycle', '', '', '2027-01-25', '', '', '', '', '', '', '', '', 'FRANCHISE_APPLICATIONS__1__1769351276_6976286c4b183.jpg', '', '', '', '', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, '', '', '', '', '', '', 'signature_1769351276_6976286c4b89f.png', '2002-09-05', '', 'Facilis dolores dolo', '', NULL, NULL, '2026-01-25 15:27:56', '2026-01-25 22:27:56', NULL, '', '', NULL, 0, NULL, 'MTOP', NULL, NULL),
('TP20260021', 'RENEWAL', 'FRANCHISE', 'pending', 'Lars', 'George', 'D', 'Aut voluptate dignis', '09146879325', 'hymepidiv@mailinator.com', 'Pakistani', '1977-08-19', 'UMID', '84038474', '', 'Autem quos natus sae', 'Explicabo Molestias', '995124536271', '12345678912345678', 'SBS4376', '2006', 'Soluta consequatur a', 'Tricycle', '95935362', '50332367', '2045-08-18', '829', 'Ea ullam fugit eos', 'Quia voluptatem sus', 'Sopoline Trujillo', 'Neque eos sit simili', 'TODA Member', 'viber_image_2026_01_22_08_44_41_630_1769353943_697632d7442a3.jpg', '', 'viber_image_2026_01_22_08_44_41_630_1769353943_697632d744956.jpg', 'Untitled_design__7__1769353943_697632d745564.jpg', 'frieren_beyond_3840x2160_22999_1769353943_697632d7450dd.jpg', '', '', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, '', '56453543654', '', '', 'viber_image_2026_01_22_08_44_41_630_1769353943_697632d745bd2.jpg', '', 'signature_1769353943_697632d7463e9.png', '2016-08-25', '', 'Quia provident cill', 'Delectus magna proi', NULL, NULL, '2026-01-25 16:12:23', '2026-01-25 23:12:23', NULL, '', 'Justice and Edwards LLC', 'TP20260003', 0, NULL, 'MTOP', NULL, NULL),
('TP20260022', 'NEW', 'FRANCHISE', 'pending', 'Lars', 'George', 'D', 'Aut voluptate dignis', '09146879325', 'hymepidiv@mailinator.com', 'Pakistani', '1977-08-19', 'UMID', '84038474', '', 'Autem quos natus sae', 'Explicabo Molestias', '995124536271', '12345678912345678', 'SBS4376', '2006', 'Soluta consequatur a', 'Tricycle', '95935362', '50332367', '2045-08-18', '829', 'Ea ullam fugit eos', 'Quia voluptatem sus', 'Stephanie Chaney', 'Neque eos sit simili', 'TODA Member', 'FRANCHISE_APPLICATIONS_1769354667_697635ab3f249.png', '', 'Untitled_design__7__1769354667_697635ab3f7d8.jpg', 'viber_image_2026_01_22_08_44_41_630_1769354667_697635ab400a9.jpg', 'viber_image_2026_01_22_08_44_41_630_1769354667_697635ab3fd1f.jpg', '', '', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, '', '367264', '', '', 'viber_image_2026_01_22_08_44_41_630_1769354667_697635ab406d1.jpg', '', 'signature_1769354667_697635ab40d9a.png', '1973-10-08', '', '--- Jan 26, 2026 04:23:39 AM (Admin) ---\nsaghjgad\n\n--- Jan 26, 2026 04:23:34 AM (Admin) ---\nmali yan bobo ka ba\n\nVitae id aliqua Ut ', 'Ab ut error deserunt', NULL, NULL, '2026-01-25 16:24:27', '2026-01-26 11:23:39', NULL, '', 'Keller Scott LLC', 'TP20260003', 0, NULL, 'MTOP', NULL, NULL),
('TP20260023', 'RENEWAL', 'FRANCHISE', 'pending', 'Lars', 'George', 'D', 'Aut voluptate dignis', '09146879325', 'hymepidiv@mailinator.com', 'Pakistani', '1977-08-19', 'UMID', '84038474', '', 'Autem quos natus sae', 'Explicabo Molestias', '995124536271', '12345678912345678', 'SBS4376', '2006', 'Soluta consequatur a', 'Tricycle', '95935362', '50332367', '2045-08-18', '829', 'Ea ullam fugit eos', 'Quia voluptatem sus', 'Aaron Reid', 'Neque eos sit simili', 'TODA Member', 'Untitled_design__7__1769355643_6976397b5f3a4.jpg', '', 'FRANCHISE_APPLICATIONS__1__1769355643_6976397b5fbd5.jpg', 'FRANCHISE_APPLICATIONS__1__1769355643_6976397b6100d.jpg', 'FRANCHISE_APPLICATIONS__1__1769355643_6976397b6091b.jpg', '', '', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, '', '', '67153', '', '', 'viber_image_2026_01_22_08_44_41_630_1769355643_6976397b61675.jpg', 'signature_1769355643_6976397b662ae.png', '2016-12-06', '', 'Sequi aspernatur dig', 'Quo mollitia tenetur', NULL, NULL, '2026-01-25 16:40:43', '2026-01-25 23:40:43', NULL, '', 'Abbott and Holt LLC', 'TP20260003', 0, NULL, 'MTOP', NULL, NULL),
('TP20260024', 'RENEWAL', 'FRANCHISE', 'pending', 'John', 'Doe', 'H', 'Amet rem qui aut ex', '09197436782', 'tego@mailinator.com', 'North Korean', '2021-08-28', 'Voter\'s ID', '285', '', 'Honda', 'Wave 125', '577632165365', '93831235165236125', 'SBS4376', '2009', 'Red', 'Motorcycle', '62352165', '63637126', '2026-07-16', '18731231313211232213212132132', 'Nobis facilis except', 'Numquam omnis beatae', 'Hannah Wilkins', 'Fugiat in facilis c', 'Transport Cooperative', '', '', 'FRANCHISE_APPLICATIONS__1__1769396351_6976d87fa07b9.jpg', '', '', '', '', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, '', '', '', '', '', '', 'signature_1769396351_6976d87fa15c4.png', '2006-09-26', '', 'Quidem architecto et', '', NULL, NULL, '2026-01-26 03:59:11', '2026-01-26 10:59:11', NULL, '', 'Kelly Schroeder Co', NULL, 0, NULL, 'MTOP', NULL, NULL),
('TP20260025', 'RENEWAL', 'FRANCHISE', 'pending', 'John', 'Doe', 'A', 'Voluptates praesenti', '09119565176', 'bugynuq@mailinator.com', 'Croatian', '1987-10-20', 'Driver\'s License', '892', '', 'Honda', 'Wave 125', '543458387874', '64075843758748534', 'SBS4376', '1998', 'Red', 'Motorcycle', '43954653', '34535457', '2051-02-06', '804347657634764368743645345454', 'Illum dolores eu vo', 'Maiores aperiam quos', 'Ronan Jefferson', 'Duis eos error enim ', 'TODA Member', '', '', '619326178_922009486912342_1808096109152717264_n_1769708057_697b9a192faf7.jpg', '', '', '', '', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, '', '', '', '', '', '', 'signature_1769708057_697b9a1930285.png', '1998-09-14', '', 'Et aliqua Enim reru', '', NULL, NULL, '2026-01-29 18:34:17', '2026-01-30 01:34:17', NULL, '', 'Barnes and Golden Co', NULL, 0, NULL, 'MTOP', NULL, NULL),
('TP20260026', 'RENEWAL', 'FRANCHISE', 'pending', 'John', 'Doe', 'M', 'Unde quo natus ea is', '09171857899', 'focuji@mailinator.com', 'Bolivian', '1998-05-30', 'UMID', '407', '', 'Honda', 'Wave 125', '229547376535', '48847678365786845', 'SBS4376', '1997', 'Red', 'Tricycle', '54553537', '47654658', '2064-02-13', '691543465736564', 'Ipsam quis duis in a', 'Pariatur Quas cillu', 'Ezekiel Gibbs', 'Quam nobis sed autem', 'Corporation', '', '', '', '', '', '', '', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, '', '', '46837634', '', '', '618078593_1437193254677564_1081743295419140914_n_1769716725_697bbbf535e55.jpg', 'signature_1769716725_697bbbf53a7c7.png', '2002-09-18', '', 'Ut vitae molestiae q', '', NULL, NULL, '2026-01-29 20:58:45', '2026-01-30 03:58:45', NULL, '', 'Joyce and Koch Inc', NULL, 0, NULL, 'MTOP', NULL, NULL),
('TP20260027', 'NEW', 'FRANCHISE', 'pending', 'Lars', 'George', 'D', 'Aut voluptate dignis', '09146879325', 'hymepidiv@mailinator.com', 'Pakistani', '1977-08-19', 'UMID', '84038474', '', 'Autem quos natus sae', 'Explicabo Molestias', '995124536271', '12345678912345678', 'SBS4376', '2006', 'Soluta consequatur a', 'Tricycle', '95935362', '50332367', '2045-08-18', '829', 'Ea ullam fugit eos', 'Quia voluptatem sus', 'Bagumbong TODA', 'Neque eos sit simili', 'TODA Member', 'White_and_Green_Modern_Quotes_Desktop_Wallpaper__3__1769941661_697f2a9d08be2.jpg', 'White_and_Green_Modern_Quotes_Desktop_Wallpaper__3__1769941661_697f2a9d09c38.jpg', '', 'White_and_Green_Modern_Quotes_Desktop_Wallpaper__3__1769941661_697f2a9d097c8.jpg', 'White_and_Green_Modern_Quotes_Desktop_Wallpaper__2__1769941661_697f2a9d09214.jpg', '', '', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, '45345', '', '', 'White_and_Green_Modern_Quotes_Desktop_Wallpaper__1__1769941661_697f2a9d09fba.jpg', '', '', 'signature_1769941661_697f2a9d0a40b.png', '1986-03-20', '', 'Voluptatem qui rerum', 'Repellendus Ex pari', NULL, NULL, '2026-02-01 11:27:41', '2026-02-01 18:27:41', NULL, '', 'Atkins Yates Co', 'TP20260003', 0, NULL, 'MTOP', NULL, NULL),
('TP20260028', 'NEW', 'FRANCHISE', 'pending', 'Lars', 'George', 'D', 'Aut voluptate dignis', '09146879325', 'hymepidiv@mailinator.com', 'Pakistani', '1977-08-19', 'UMID', '84038474', '', 'Autem quos natus sae', 'Explicabo Molestias', '995124536271', '12345678912345678', 'SBS4376', '2006', 'Soluta consequatur a', 'Tricycle', '95935362', '50332367', '2045-08-18', '829', 'Ea ullam fugit eos', 'Quia voluptatem sus', 'Bagong Barrio TODA', 'Neque eos sit simili', 'TODA Member', 'White_and_Green_Modern_Quotes_Desktop_Wallpaper__1__1769951161_697f4fb936c3d.jpg', 'White_and_Green_Modern_Quotes_Desktop_Wallpaper_1769951161_697f4fb93d0e1.jpg', 'White_and_Green_Modern_Quotes_Desktop_Wallpaper__3__1769951161_697f4fb937170.jpg', 'White_and_Green_Modern_Quotes_Desktop_Wallpaper__2__1769951161_697f4fb93ca6a.jpg', 'White_and_Green_Modern_Quotes_Desktop_Wallpaper__2__1769951161_697f4fb93c39a.jpg', '', '', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, '453444345', '43534', '', 'White_and_Green_Modern_Quotes_Desktop_Wallpaper__1__1769951161_697f4fb93d74a.jpg', 'White_and_Green_Modern_Quotes_Desktop_Wallpaper_1769951161_697f4fb93dfbc.jpg', '', 'signature_1769951161_697f4fb93e68e.png', '0045-04-05', '', '4545', '434543', NULL, NULL, '2026-02-01 14:06:01', '2026-02-01 21:06:01', NULL, '', 'Vasra Transportation', 'TP20260003', 0, NULL, 'MTOP', NULL, NULL),
('TP20260029', 'NEW', 'FRANCHISE', 'pending', 'Lars', 'George', 'D', 'Aut voluptate dignis', '09146879325', 'hymepidiv@mailinator.com', 'Pakistani', '1977-08-19', 'UMID', '84038474', '', 'Autem quos natus sae', 'Explicabo Molestias', '995124536271', '12345678912345678', 'SBS4376', '2006', 'Soluta consequatur a', 'Tricycle', '95935362', '50332367', '2045-08-18', '829', 'Ea ullam fugit eos', 'Quia voluptatem sus', 'Camarin East TODA', 'Neque eos sit simili', 'TODA Member', 'White_and_Green_Modern_Quotes_Desktop_Wallpaper__2__1769953326_697f582ed34d9.jpg', '', '', 'White_and_Green_Modern_Quotes_Desktop_Wallpaper_1769953326_697f582ed3bbf.jpg', 'White_and_Green_Modern_Quotes_Desktop_Wallpaper_1769953326_697f582ed3820.jpg', '', '', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, '', '', '', '', '', '', 'signature_1769953326_697f582ed4289.png', '0088-08-08', '', '', '', NULL, NULL, '2026-02-01 14:42:06', '2026-02-01 21:42:06', NULL, '', 'Atkins Yates Co', 'TP20260003', 0, NULL, 'MTOP', NULL, NULL),
('TP20260030', 'RENEWAL', 'FRANCHISE', 'pending', 'John', 'Doe', 'C', 'Dolor ex est magna u', '09152512449', 'soqotiby@mailinator.com', 'Jordanian', '2018-12-01', 'Postal ID', '594', '', 'Honda', 'Wave 125', '765324356376', '32434444445354345', 'SBS4376', '2002', 'Red', 'Motorcycle', '96835747', '90232346', '2039-12-12', '535', 'Tempor debitis autem', 'Harum Nam numquam do', 'Kadeem Berger', 'Non velit cillum et', 'Individual Operator', '', '', '', '', '', '', '', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, '', '', '', '', '', '', 'signature_1769956893_697f661d307a9.png', '0000-00-00', '', 'E3647364', '', NULL, NULL, '2026-02-01 15:41:33', '2026-02-01 22:41:33', NULL, '', 'Byers and Bird LLC', NULL, 0, NULL, 'MTOP', NULL, NULL),
('TP20260031', 'RENEWAL', 'FRANCHISE', 'pending', 'John', 'Doe', 'D', 'Alias excepturi aut ', '09118518143', 'deqisudub@mailinator.com', 'Northern Irish', '1980-06-22', 'Driver\'s License', '457', '', 'Honda', 'Wave 125', '950157157157', '65157157157157157', 'SBS4376', '2003', 'Red', 'Tricycle', '49415715', '15715715', '2028-11-16', '829157157157', 'Doloribus ex tempori', 'Tempora labore exped', 'Germaine Serrano', 'Occaecat ad quaerat ', 'TODA Member', '', '', '', '', '', '', '', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, '', '', '', '', '', '', 'signature_1769962782_697f7d1edf079.png', '1984-05-25', '', 'Maxime dolor ut quis', '', NULL, NULL, '2026-02-01 17:19:42', '2026-02-02 00:19:42', NULL, '', 'Mcclure and Gordon Co', NULL, 0, NULL, 'MTOP', NULL, NULL),
('TP20260032', 'RENEWAL', 'FRANCHISE', 'pending', 'John', 'Doe', 'C', 'Iste nulla pariatur', '09179920262', 'gazajuk@mailinator.com', 'Belarusian', '1971-03-24', 'Passport', '299', '', 'Honda', 'Wave 125', '412474474474', '47447447447447447', 'SBS4376', '2015', 'Red', 'Tricycle', '26947447', '90247447', '2033-12-28', '413474474474', 'Sit aliquam enim ea', 'Non ut qui incidunt', 'Heather Sellers', 'Sapiente magna repud', 'Individual Operator', '', '', '', '', '', '', '', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, '', '', '', '', '', '', 'signature_1769964722_697f84b2a7d13.png', '2026-02-01', '', '45454', '', NULL, NULL, '2026-02-01 17:52:02', '2026-02-02 00:52:02', NULL, '', 'Mathis and Hickman Associates', NULL, 0, NULL, 'MTOP', NULL, NULL),
('TP20260033', 'RENEWAL', 'FRANCHISE', 'pending', 'John', 'Doe', 'C', 'Magna excepturi ut n', '09133585694', 'jasepig@mailinator.com', 'Tanzanian', '2009-07-21', 'Postal ID', '139', '', 'Honda', 'Wave 125', '437485436546', '43748543654674867', 'SBS4376', '2003', 'Red', 'Pedicabs', '43748543', '43748543', '2026-03-05', '43748543654674867', '37432847', '43748543654674867', 'Barangay 170 TODA', 'Bagong Barrio', 'Corporation', '', '', '', '', '', '', '', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, '', '', '', '', '', '', 'signature_1770029304_698080f873121.png', '2026-02-02', '', 'r343', '', NULL, NULL, '2026-02-02 11:48:24', '2026-02-02 18:48:24', NULL, '', '46236423', NULL, 0, NULL, 'MTOP', NULL, NULL),
('TP20260034', 'RENEWAL', 'FRANCHISE', 'pending', 'John', 'Doe', 'A', 'Reprehenderit aut si', '09196391898', 'cokyh@mailinator.com', 'Venezuelan', '1978-09-10', 'National ID', '553', '', 'Honda', 'Wave 125', '919153153153', '15315315315315315', 'SBS4376', '1991', 'Red', 'Tricycle', '18915315', '76115315', '2030-12-12', '578153153153153153153', 'Necessitatibus ullam', 'Quis dignissimos ape', 'Yeo Baldwin', 'Ducimus incidunt e', 'TODA Member', '', '', '', '', '', '', '', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, '', '', '', '', '', '', 'signature_1770039943_6980aa87d49ae.png', '2026-02-02', '', 'hjhahjskah', '', NULL, NULL, '2026-02-02 14:45:43', '2026-02-02 21:45:43', NULL, '', 'Estes and Potter Trading', NULL, 0, NULL, 'MTOP', NULL, NULL),
('TP20260035', 'RENEWAL', 'FRANCHISE', 'pending', 'John', 'Doe', 'Q', 'Delectus voluptates', '09150792949', 'safin@mailinator.com', 'Solomon Islander', '1986-11-16', 'Voter\'s ID', '397', '', 'Honda', 'Wave 125', '475473874874', '47387487483473874', 'SBS4376', '2003', 'Red', 'Motorcycle', '18147387', '47387487', '2030-12-12', '324', 'Consequat Ratione f', 'Consectetur dicta s', 'Vernon Gonzales', 'Quos eos eos accus', 'Corporation', '', '', '', '', '', '', '', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, '', '', '', '', '', '', 'signature_1770134760_69821ce8d93dc.png', '2026-02-03', '', '', '', NULL, NULL, '2026-02-03 17:06:00', '2026-02-04 00:06:00', NULL, '', 'Gilmore and Cummings LLC', NULL, 0, NULL, 'MTOP', NULL, NULL),
('TP20260036', 'RENEWAL', 'FRANCHISE', 'pending', 'John', 'Doe', 'P', 'Veniam minima accus', '09179639718', 'nulorekody@mailinator.com', 'Eritrean', '2015-05-04', 'Driver\'s License', '959', '', 'Honda', 'Wave 125', '837853758738', '83785375873873827', 'SBS4376', '2003', 'Red', 'Motorcycle', '83785375', '83785375', '2030-02-17', '83785375873873827', '83785375873873827', '83785375873873827', '83785375873873827', '83785375873873827', 'Individual Operator', '', '', '', '', '', '', '', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, '', '', '', '', '', '', 'signature_1770252777_6983e9e9c250d.png', '2026-02-05', '', '', '', NULL, NULL, '2026-02-05 01:52:57', '2026-02-05 08:52:57', NULL, '', '83785375873873827', NULL, 0, NULL, 'MTOP', NULL, NULL),
('TP20260037', 'NEW', 'FRANCHISE', 'pending', 'Lars', 'George', 'D', 'Aut voluptate dignis', '09146879325', 'hymepidiv@mailinator.com', 'Pakistani', '1977-08-19', 'UMID', '84038474', '', 'Autem quos natus sae', 'Explicabo Molestias', '995124536271', '12345678912345678', 'SBS4376', '2006', 'Soluta consequatur a', 'Tricycle', '95935362', '50332367', '2045-08-18', '829', 'Ea ullam fugit eos', 'Quia voluptatem sus', 'Camarin East TODA', 'Neque eos sit simili', 'TODA Member', 'businessmayor_permit_1770259203_69840303c82d9.jpg', 'dti_1770259203_69840303ca241.jpg', '', 'businessmayor_permit_1770259203_69840303c9f20.jpg', 'businessmayor_permit_1770259203_69840303c8cd4.jpg', '', 'businessmayor_permit_1770259203_69840303c97f3.jpg', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, '', '', '', '', '', '', 'signature_1770259203_69840303ca68a.png', '2026-03-09', '', '', '', NULL, NULL, '2026-02-05 03:40:03', '2026-02-05 10:40:03', NULL, '', 'Atkins Yates Co', 'TP20260003', 0, NULL, 'MTOP', NULL, NULL),
('TP20260038', 'NEW', 'FRANCHISE', 'pending', 'Lars', 'George', 'D', 'Aut voluptate dignis', '09146879325', 'hymepidiv@mailinator.com', 'Pakistani', '1977-08-19', 'UMID', '84038474', '', 'Autem quos natus sae', 'Explicabo Molestias', '995124536271', '12345678912345678', 'SBS4376', '2006', 'Soluta consequatur a', 'Tricycle', '95935362', '50332367', '2045-08-18', '829', 'Ea ullam fugit eos', 'Quia voluptatem sus', 'Barangay 176 TODA', 'Neque eos sit simili', 'TODA Member', 'sanitation_1770267182_6984222e89a4e.jpg', 'dti_1770267182_6984222e8c08b.jpg', '', 'dti_1770267182_6984222e8b8bf.jpg', 'dti_1770267182_6984222e89fb6.jpg', '', 'bir_1770267182_6984222e8a4f4.jpg', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, '', '', '', '', '', '', 'signature_1770267182_6984222e8c72b.png', '2026-02-03', '', '', '', NULL, NULL, '2026-02-05 05:53:02', '2026-02-05 12:53:02', NULL, '', 'Atkins Yates Co', 'TP20260003', 0, NULL, 'MTOP', NULL, NULL),
('TP20260039', 'RENEWAL', 'FRANCHISE', 'pending', 'John', 'Doe', 'C', 'Tenetur laborum Tem', '09113912962', 'goko@mailinator.com', 'Tanzanian', '2007-05-29', 'Postal ID', '515', '', 'Honda', 'Wave 125', '295814814814', '81481481481481481', 'SBS4376', '1980', 'Red', 'Pedicabs', '24081481', '52281481', '2030-12-12', '889814814814814814814814814', 'Reiciendis consequat', 'Est minima voluptate', 'Lilah Velez', 'Minima molestias ut ', 'Transport Cooperative', '', '', '', '', '', '', 'dti_1770267529_698423892d71e.jpg', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, '', '', '', '', '', '', 'signature_1770267529_698423892e7f7.png', '2026-02-05', '', '', '', NULL, NULL, '2026-02-05 05:58:49', '2026-02-05 12:58:49', NULL, '', 'Randolph Hayden Trading', NULL, 0, NULL, 'MTOP', NULL, NULL),
('TP20260040', 'RENEWAL', 'FRANCHISE', 'pending', 'John', 'Doe', 'A', 'Dolore ut id invent', '09188193691', 'nisov@mailinator.com', 'Laotian', '1981-08-10', 'Passport', '140', '', 'Honda', 'Wave 125', '641236127623', '23612762361276246', 'SBS4376', '1977', 'Red', 'E-Tricycle', '56632454', '69234547', '2030-12-12', '678', 'Occaecat est sequi q', 'Ex aliqua Earum rep', 'Linus Baldwin', 'Optio eius obcaecat', 'Transport Cooperative', '', '', '', '', '', '', 'businessmayor_permit_1770279843_698453a3efb68.jpg', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, '', '', '', '', '', '', 'signature_1770279843_698453a3f1de6.png', '2026-02-05', '', '', '', NULL, NULL, '2026-02-05 09:24:03', '2026-02-05 16:24:03', NULL, '', 'Travis Horton Plc', NULL, 0, NULL, 'MTOP', NULL, NULL),
('TP20260041', 'RENEWAL', 'FRANCHISE', 'pending', 'John', 'Doe', 'E', 'Aliquip eos velit s', '09156972354', 'hahybun@mailinator.com', 'Panamanian', '1983-06-23', 'National ID', '607', '', 'Honda', 'Wave 125', '978432746743', '48343274674327467', 'SBS4376', '1991', 'Red', 'E-Tricycle', '98543274', '87143274', '3030-12-12', '810', 'Voluptatem eveniet ', 'Labore quasi quaerat', 'Scott Horn', 'Minus sint iusto ius', 'TODA Member', '', '', '', '', '', '', 'businessmayor_permit_1770280024_6984545837f11.jpg', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, '', '', '', '', '', '', 'signature_1770280024_6984545838b1b.png', '2026-02-05', '', '', '', NULL, NULL, '2026-02-05 09:27:04', '2026-02-05 16:27:04', NULL, '', 'Greene Day Plc', NULL, 0, NULL, 'MTOP', NULL, NULL),
('TP20260042', 'RENEWAL', 'FRANCHISE', 'pending', 'John', 'Doe', 'T', 'Optio vitae volupta', '09146192223', 'rubyruloz@mailinator.com', 'North Korean', '2021-02-24', 'Passport', '168', '', 'Honda', 'Wave 125', '349743263726', '74326372647743263', 'SBS4376', '1989', 'Red', 'Tricycle', '80743263', '61674326', '2030-12-12', '445', 'Qui deserunt sit qui', 'Natus mollitia inven', 'Alana Whitney', 'Dignissimos id fugia', 'TODA Member', '', '', '', '', '', '', 'driverslicense_1770280602_6984569a0625a.jpg', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, '', '', '', '', '', '', 'signature_1770280602_6984569a0a3fa.png', '2026-02-05', '', '', '', NULL, NULL, '2026-02-05 09:36:42', '2026-02-05 16:36:42', NULL, '', 'Ewing Nunez Plc', NULL, 0, NULL, 'MTOP', NULL, NULL),
('TP20260043', 'NEW', 'FRANCHISE', 'pending', 'Lars', 'George', 'D', 'Aut voluptate dignis', '09146879325', 'hymepidiv@mailinator.com', 'Pakistani', '1977-08-19', 'UMID', '84038474', '', 'Autem quos natus sae', 'Explicabo Molestias', '995124536271', '12345678912345678', 'SBS4376', '2006', 'Soluta consequatur a', 'Tricycle', '95935362', '50332367', '2045-08-18', '829', 'Ea ullam fugit eos', 'Quia voluptatem sus', 'Camarin East TODA', 'Neque eos sit simili', 'TODA Member', 'sanitation_1770291856_69848290a0e55.jpg', 'bir_1770291856_69848290a4f9e.jpg', '', 'dti_1770291856_69848290a44a7.jpg', 'bir_1770291856_69848290a1fdb.jpg', '', 'businessmayor_permit_1770291856_69848290a2fd9.jpg', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, '', '', '', '', '', '', 'signature_1770291856_69848290a6152.png', '2026-02-09', '', '', '', NULL, NULL, '2026-02-05 12:44:16', '2026-02-05 19:44:16', NULL, '', 'Atkins Yates Co', 'TP20260003', 0, NULL, 'MTOP', NULL, NULL),
('TP20260044', 'NEW', 'FRANCHISE', 'pending', 'Lars', 'George', 'D', 'Aut voluptate dignis', '09146879325', 'hymepidiv@mailinator.com', 'Pakistani', '1977-08-19', 'UMID', '84038474', '', 'Autem quos natus sae', 'Explicabo Molestias', '995124536271', '12345678912345678', 'SBS4376', '2006', 'Soluta consequatur a', 'Tricycle', '95935362', '50332367', '2045-08-18', '829', 'Ea ullam fugit eos', 'Quia voluptatem sus', 'Phase 8 TODA', 'Neque eos sit simili', 'TODA Member', 'bir_1770296246_698493b603f0c.jpg', 'businessmayor_permit_1770296246_698493b60804a.jpg', '', 'bir_1770296246_698493b607c6c.jpg', 'incorrect_1770296246_698493b6043a3.jpg', '', 'dti_1770296246_698493b6077a6.jpg', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, '', '', '', '', '', '', 'signature_1770296246_698493b608a7e.png', '2026-02-09', '', '', '', NULL, NULL, '2026-02-05 13:57:26', '2026-02-05 20:57:26', NULL, '', 'Atkins Yates Co', 'TP20260003', 0, NULL, 'MTOP', NULL, NULL),
('TP20260045', 'NEW', 'FRANCHISE', 'pending', 'Lars', 'George', 'D', 'Aut voluptate dignis', '09146879325', 'hymepidiv@mailinator.com', 'Pakistani', '1977-08-19', 'UMID', '84038474', '', 'Autem quos natus sae', 'Explicabo Molestias', '995124536271', '12345678912345678', 'SBS4376', '2006', 'Soluta consequatur a', 'Tricycle', '95935362', '50332367', '2045-08-18', '829', 'Ea ullam fugit eos', 'Quia voluptatem sus', 'Pangarap TODA', 'Neque eos sit simili', 'TODA Member', 'fsic_1770297608_69849908820a4.jpg', 'national_id_1770297608_698499088322c.jpg', '', 'sanitation_1770297608_6984990882e32.jpg', 'incorrect_1770297608_6984990882471.jpg', '', 'dti_1770297608_6984990882789.jpg', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, '', '', '', '', '', '', 'signature_1770297608_6984990883611.png', '2026-02-05', '', '', '', NULL, NULL, '2026-02-05 14:20:08', '2026-02-05 21:20:08', NULL, '', 'Atkins Yates Co', 'TP20260003', 0, NULL, 'MTOP', NULL, NULL),
('TP20260046', 'NEW', 'FRANCHISE', 'pending', 'Lars', 'George', 'D', 'Aut voluptate dignis', '09146879325', 'hymepidiv@mailinator.com', 'Pakistani', '1977-08-19', 'UMID', '84038474', '', 'Autem quos natus sae', 'Explicabo Molestias', '995124536271', '12345678912345678', 'SBS4376', '2006', 'Soluta consequatur a', 'Tricycle', '95935362', '50332367', '2045-08-18', '829', 'Ea ullam fugit eos', 'Quia voluptatem sus', 'Bagumbong TODA', 'Neque eos sit simili', 'TODA Member', 'bir_1770298597_69849ce5b15c8.jpg', 'businessmayor_permit_1770298597_69849ce5b33e1.jpg', '', 'businessmayor_permit_1770298597_69849ce5b2e5d.jpg', 'incorrect_1770298597_69849ce5b21a8.jpg', '', 'incorrect_1770298597_69849ce5b277d.jpg', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, '', '', '', '', '', '', 'signature_1770298597_69849ce5b3a66.png', '2026-02-05', '', '', '', NULL, NULL, '2026-02-05 14:36:37', '2026-02-05 21:36:37', NULL, '', 'Atkins Yates Co', 'TP20260003', 0, NULL, 'MTOP', NULL, NULL),
('TP20260047', 'NEW', 'FRANCHISE', 'pending', 'Lars', 'George', 'D', 'Aut voluptate dignis', '09146879325', 'hymepidiv@mailinator.com', 'Pakistani', '1977-08-19', 'UMID', '84038474', '', 'Autem quos natus sae', 'Explicabo Molestias', '995124536271', '12345678912345678', 'SBS4376', '2006', 'Soluta consequatur a', 'Tricycle', '95935362', '50332367', '2045-08-18', '829', 'Ea ullam fugit eos', 'Quia voluptatem sus', 'Barangay 188 TODA', 'Neque eos sit simili', 'TODA Member', 'incorrect_1770299488_6984a060d530c.jpg', 'bir_1770299488_6984a060d6751.jpg', '', 'businessmayor_permit_1770299488_6984a060d6257.jpg', 'dti_1770299488_6984a060d57c3.jpg', '', 'businessmayor_permit_1770299488_6984a060d5b35.jpg', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, '', '', '', '', '', '', 'signature_1770299488_6984a060d6b37.png', '2026-02-05', '', '', '', NULL, NULL, '2026-02-05 14:51:28', '2026-02-05 21:51:28', NULL, '', 'Atkins Yates Co', 'TP20260003', 0, NULL, 'MTOP', NULL, NULL),
('TP20260048', 'NEW', 'MTOP', 'APPROVED', 'Mary Grace', 'Lagarde', 'O', 'Quis et tempore inv', '09121637865', 'marygracelagarde@gmail.com', 'Filipino', '2000-05-22', 'Driver\'s License', 'N01-23-013846', '', 'Toyota', 'Vios 1.3 E MT', '2NZFEX12345', 'JTDJT9230A0123456', 'DOG1234', '2009', 'Red', 'Tricycle', '12345678', '87654321', '2030-07-18', '878', 'District 3', 'Pangarap TODA – Pangarap Village – Quirino Highway – Zabarte', '', 'Barangay 134', 'TODA Member', 'businessmayor_permit_1770306603_6984bc2b7c974.jpg', '', '', '', 'dti_1770306603_6984bc2b7cf5a.jpg', '', 'driverslicense_1770306603_6984bc2b7d423.jpg', '', '', 'businessmayor_permit_1770306603_6984bc2b7d95b.jpg', 'fsic_1770306603_6984bc2b7e27e.jpg', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, '', '', '', '', '', '', 'signature_1770306603_6984bc2b7ee9e.png', '2026-02-05', '', '--- Feb 05, 2026 06:28:05 PM (Admin) ---\nyweqew\n\n', '', NULL, NULL, '2026-02-05 16:50:03', '2026-02-06 01:28:05', NULL, 'bir_1770306603_6984bc2b7df3d.jpg', '', NULL, 0, NULL, 'MTOP', NULL, NULL),
('TP20260049', 'RENEWAL', 'FRANCHISE', 'pending', 'Mary Grace', 'Lagarde', 'O', 'Quis et tempore inv', '09121637865', 'marygracelagarde@gmail.com', 'Filipino', '2000-05-22', 'Driver\'s License', 'N01-23-013846', '', 'Toyota', 'Vios 1.3 E MT', '2NZFEX12345', 'JTDJT9230A0123456', 'DOG1234', '2009', 'Red', 'Tricycle', '12345678', '87654321', '2030-07-18', '878', 'District 3', 'Pangarap TODA – Pangarap Village – Quirino Highway – Zabarte', 'Barangay 170 TODA', 'Barangay 134', 'TODA Member', '', '', '', '', '', '', 'driverslicense_1770311694_6984d00ee2829.jpg', '', '', '', '', NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, '', '', '', '', '', '', 'signature_1770311694_6984d00ee3b3d.png', '2026-02-05', '', '', '', NULL, NULL, '2026-02-05 18:14:54', '2026-02-06 01:14:54', NULL, '', 'Jordan Plaines', NULL, 0, NULL, 'MTOP', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `franchise_status_history`
--

CREATE TABLE `franchise_status_history` (
  `history_id` int(11) NOT NULL,
  `application_id` int(11) NOT NULL,
  `status` varchar(50) NOT NULL,
  `remarks` text DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `franchise_uploaded_files`
--

CREATE TABLE `franchise_uploaded_files` (
  `file_id` int(11) NOT NULL,
  `application_id` int(11) NOT NULL,
  `file_type` varchar(50) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `market_payments`
--

CREATE TABLE `market_payments` (
  `id` int(11) NOT NULL,
  `reference_id` varchar(50) NOT NULL,
  `payment_id` varchar(50) NOT NULL,
  `receipt_number` varchar(50) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `purpose` varchar(255) NOT NULL,
  `client_system` varchar(50) NOT NULL DEFAULT 'market',
  `payment_method` varchar(30) NOT NULL,
  `payment_status` enum('paid','pending','failed','cancelled') NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `paid_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `middle_initial` varchar(10) DEFAULT NULL,
  `home_address` text NOT NULL,
  `contact_number` varchar(20) NOT NULL,
  `email` varchar(255) NOT NULL,
  `citizenship` varchar(100) NOT NULL DEFAULT 'Filipino',
  `birth_date` date DEFAULT NULL,
  `id_type` varchar(50) DEFAULT NULL,
  `id_number` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `franchise_permit_applications`
--
ALTER TABLE `franchise_permit_applications`
  ADD UNIQUE KEY `application_id` (`application_id`),
  ADD KEY `idx_renewal` (`is_renewal`,`original_permit_id`);

--
-- Indexes for table `franchise_status_history`
--
ALTER TABLE `franchise_status_history`
  ADD PRIMARY KEY (`history_id`),
  ADD KEY `idx_application_id` (`application_id`);

--
-- Indexes for table `franchise_uploaded_files`
--
ALTER TABLE `franchise_uploaded_files`
  ADD PRIMARY KEY (`file_id`),
  ADD KEY `idx_application_id` (`application_id`);

--
-- Indexes for table `market_payments`
--
ALTER TABLE `market_payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_payment_id` (`payment_id`),
  ADD UNIQUE KEY `uq_receipt_number` (`receipt_number`),
  ADD KEY `idx_reference_id` (`reference_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `franchise_status_history`
--
ALTER TABLE `franchise_status_history`
  MODIFY `history_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `franchise_uploaded_files`
--
ALTER TABLE `franchise_uploaded_files`
  MODIFY `file_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `market_payments`
--
ALTER TABLE `market_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
