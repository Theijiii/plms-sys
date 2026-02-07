-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Feb 07, 2026 at 09:28 AM
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
-- Database: `eplms_barangay_permit_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `application_logs`
--

CREATE TABLE `application_logs` (
  `log_id` int(11) NOT NULL,
  `permit_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `action` varchar(50) NOT NULL,
  `timestamp` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `barangay_permit`
--

CREATE TABLE `barangay_permit` (
  `permit_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `applicant_id` varchar(50) DEFAULT NULL,
  `application_date` date DEFAULT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `suffix` varchar(20) DEFAULT NULL,
  `birthdate` date DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `civil_status` varchar(20) DEFAULT NULL,
  `nationality` varchar(50) DEFAULT NULL,
  `house_no` varchar(50) DEFAULT NULL,
  `street` varchar(150) DEFAULT NULL,
  `barangay` varchar(100) DEFAULT NULL,
  `city_municipality` varchar(100) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `zip_code` varchar(20) DEFAULT NULL,
  `purpose` varchar(255) DEFAULT NULL,
  `duration` varchar(50) DEFAULT NULL,
  `id_type` varchar(255) DEFAULT NULL,
  `id_number` varchar(50) DEFAULT NULL,
  `attachments` varchar(500) DEFAULT NULL,
  `clearance_fee` decimal(12,2) DEFAULT NULL,
  `receipt_number` varchar(50) DEFAULT NULL,
  `applicant_signature` varchar(255) DEFAULT NULL,
  `mobile_number` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` varchar(50) DEFAULT NULL,
  `comments` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `barangay_permit`
--

INSERT INTO `barangay_permit` (`permit_id`, `user_id`, `applicant_id`, `application_date`, `first_name`, `middle_name`, `last_name`, `suffix`, `birthdate`, `email`, `gender`, `civil_status`, `nationality`, `house_no`, `street`, `barangay`, `city_municipality`, `province`, `zip_code`, `purpose`, `duration`, `id_type`, `id_number`, `attachments`, `clearance_fee`, `receipt_number`, `applicant_signature`, `mobile_number`, `created_at`, `updated_at`, `status`, `comments`) VALUES
(2029, 0, NULL, '2026-01-13', 'Rigel', 'Evan Estrada', 'Horton', 'Est eos delectus', '1979-06-01', 'fobupuxad@mailinator.com', 'Other', 'Widowed', 'Saudi', 'Doloribus dolores qu', 'Officia qui dolore e', 'Consequuntur dolore', 'Aspernatur ut quae a', 'Qui qui quo cupidata', '45449', 'For financial assistance or aid', '', 'Solo Parent ID', '922', '{\"valid_id_file\":\"1768324683_IMG20251101170434.jpg\",\"proof_of_residence_file\":\"\",\"receipt_file\":\"\",\"signature_file\":\"1768324683_DUYGE.jpg\",\"photo_fingerprint_file\":\"\"}', 0.00, '0', '1768324683_DUYGE.jpg', '936', '2026-01-13 17:18:03', '2026-01-15 15:33:06', 'pending', '--- 2026-01-15 16:33:06 (Admin) ---\n--- Jan 15, 2026, 11:33:06 PM ---\nDAS'),
(2030, 0, NULL, '2026-01-13', 'Hasad', 'Alfreda Whitehead', 'Schneider', 'Nihil facilis ullamc', '2001-01-30', 'namy@mailinator.com', 'Other', 'Married', 'Cypriot', 'Laborum cum dignissi', 'Autem anim repudiand', 'Et ullamco ullam pla', 'Eum anim architecto', 'Dolor obcaecati nisi', '32477', 'For business name registration', '', 'Senior Citizen ID', '174', '{\"valid_id_file\":\"1768324844_OJT_EVALUATION_SHEET.docx\",\"proof_of_residence_file\":\"\",\"receipt_file\":\"\",\"signature_file\":\"1768324844_OJT_RECOMMENDATION.docx\",\"photo_fingerprint_file\":\"\"}', 0.00, '0', '1768324844_OJT_RECOMMENDATION.docx', '278', '2026-01-13 17:20:44', '2026-01-13 17:20:44', 'pending', NULL),
(2031, 0, NULL, '2026-01-13', 'Zahir', 'Abra Spencer', 'Smith', 'Obcaecati autem expl', '2019-06-05', 'zyzyfygo@mailinator.com', 'Male', 'Widowed', 'Greek', 'Unde illo aut dolore', 'Doloremque rem aliqu', 'Magni et aperiam par', 'Recusandae Unde est', 'Aut ab labore et nis', '22124', 'For medical assistance application', '', 'PhilHealth ID', '22', '{\"valid_id_file\":\"1768325395_OJT_PRACTICUM_2_DAILY_NARRATIVE_REPORT.docx\",\"proof_of_residence_file\":\"\",\"receipt_file\":\"\",\"signature_file\":\"1768325395_IMG20251101170430.jpg\",\"photo_fingerprint_file\":\"\"}', 0.00, '0', '1768325395_IMG20251101170430.jpg', '431', '2026-01-13 17:29:55', '2026-01-15 12:51:03', 'pending', '--- 2026-01-15 13:51:03 (Admin) ---\n--- Jan 15, 2026, 08:51:03 PM ---\nczd'),
(2032, 0, NULL, '2026-01-13', 'Mason', 'Kimberly Gilmore', 'Bridges', 'Voluptatem non ex no', '2019-09-27', 'depoqutac@mailinator.com', 'Other', 'Single', 'Ukrainian', 'Beatae provident de', 'Sit nihil dolore mod', 'Adipisicing maxime s', 'Possimus aperiam om', 'Non velit facere ist', '44218', 'For employment abroad (POEA / OFW)', '', 'Tax Identification Number (TIN) ID', '779', '{\"valid_id_file\":\"1768325472_OJT_ACCEPTANCE_LETTER.docx\",\"proof_of_residence_file\":\"\",\"receipt_file\":\"\",\"signature_file\":\"1768325472_OJT_EVALUATION_SHEET.docx\",\"photo_fingerprint_file\":\"\"}', 0.00, '0', '1768325472_OJT_EVALUATION_SHEET.docx', '178', '2026-01-13 17:31:12', '2026-01-13 17:31:12', 'pending', NULL),
(2035, 0, '-1002', '2026-01-16', 'Leo', 'Karly Wallace', 'Fitzgerald', 'Deserunt error anim', '2004-11-16', 'nibuvowi@mailinator.com', 'Female', 'Widowed', 'Liechtensteiner', 'Consectetur quam vit', 'Cupidatat consectetu', 'Officia est ullamco', 'Sit laudantium volu', 'Soluta labore eu et', '79862', 'For relocation / change of business address', '', 'Voter&#039;s ID or COMELEC Voter&#039;s Certificate', '393', '{\"valid_id_file\":\"1768568584_Screenshot_2025-11-21_at_11.36.36_AM.png\",\"proof_of_residence_file\":\"\",\"receipt_file\":\"\",\"signature_file\":\"1768568584_Navy_and_White_Modern_Attorney_Law_Logo__2_.png\",\"photo_fingerprint_file\":\"\"}', 0.00, '0', '1768568584_Navy_and_White_Modern_Attorney_Law_Logo__2_.png', '614', '2026-01-16 13:03:04', '2026-01-16 13:03:04', 'pending', NULL),
(2036, 0, '-1003', '2026-01-17', 'Brennan', 'Kirsten Burch', 'Rowe', 'Tempore qui necessi', '2004-11-06', 'casuzy@mailinator.com', 'Other', 'Widowed', 'Mexican', 'Aliqua Occaecat eni', 'Quis ipsam ea archit', 'Qui distinctio Sint', 'Voluptatibus vitae n', 'Nam quos esse totam', '23561', 'For DTI / SEC business registration', '', 'Philippine National ID (PhilSys ID)', '401', '{\"valid_id_file\":\"1768654831_ChatGPT_Image_Jan_7__2026__06_39_16_PM.png\",\"proof_of_residence_file\":\"\",\"receipt_file\":\"\",\"signature_file\":\"1768654831_Navy_and_White_Modern_Attorney_Law_Logo__2_.png\",\"photo_fingerprint_file\":\"\"}', 0.00, '0', '1768654831_Navy_and_White_Modern_Attorney_Law_Logo__2_.png', '747', '2026-01-17 13:00:31', '2026-01-17 13:00:31', 'pending', NULL),
(2037, 22, '22', '2026-01-18', 'Kim', 'Paki Chavez', 'Strong', 'Nihil iure sit duci', '1973-11-03', 'hubisityx@mailinator.com', 'Female', 'Single', 'Bolivian', 'Irure ipsum proident', 'Voluptates aut labor', 'Earum optio obcaeca', 'Deserunt blanditiis', 'Doloremque occaecat', '21241', 'For new business permit application', '', 'Firearms License ID', '319', '{\"valid_id_file\":\"1768737929_Navy_and_White_Modern_Attorney_Law_Logo__2_.png\",\"proof_of_residence_file\":\"1768737929_Navy_and_White_Modern_Attorney_Law_Logo__2_.png\",\"receipt_file\":\"1768737929_Navy_and_White_Modern_Attorney_Law_Logo__2_.png\",\"signature_file\":\"1768737929_Navy_and_White_Modern_Attorney_Law_Logo__2_.png\",\"photo_fingerprint_file\":\"1768737929_Navy_and_White_Modern_Attorney_Law_Logo__2_.png\"}', 0.00, '0', '1768737929_Navy_and_White_Modern_Attorney_Law_Logo__2_.png', '471', '2026-01-18 12:05:29', '2026-01-18 12:05:29', 'pending', NULL),
(2038, 0, '-1004', '2026-01-29', 'Vivien', 'Kathleen Odonnell', 'Baxter', 'Et incidunt volupta', '1975-09-21', 'nipifub@mailinator.com', 'Other', 'Widowed', 'Pakistani', 'Qui id et ut laboris', 'Est similique dicta', 'Ipsum et veritatis', 'Omnis culpa consequa', 'Deserunt qui explica', '41625', 'For government employment', '', 'School ID', '94', '{\"valid_id_file\":\"1769695820_619326178_922009486912342_1808096109152717264_n.jpg\",\"proof_of_residence_file\":\"1769695820_619326178_922009486912342_1808096109152717264_n.jpg\",\"receipt_file\":\"1769695820_616708860_2021505621726720_8145252092097000523_n.jpg\",\"signature_file\":\"1769695820_619326178_922009486912342_1808096109152717264_n.jpg\",\"photo_fingerprint_file\":\"1769695820_619326178_922009486912342_1808096109152717264_n.jpg\"}', 0.00, '0', '1769695820_619326178_922009486912342_1808096109152717264_n.jpg', '152', '2026-01-29 14:10:20', '2026-01-29 14:10:20', 'pending', NULL),
(2039, 23, '23', '2026-02-02', 'Karl Louise', 'Garin', 'Alegro', '', '2004-03-01', 'mangkim372@gmail.com', 'Male', 'Single', 'Filipino', '1235', '123123', '176-B', 'Caloocan City', 'Metro Manila', '1428', 'For residency verification', '', 'Philippine National ID (PhilSys ID)', '22015312', '{\"valid_id_file\":\"1770044630_Untitled61_20241129224452_2.PNG\",\"proof_of_residence_file\":\"1770044630____9_.jpeg\",\"receipt_file\":\"1770044630_Noli_me.jpeg\",\"signature_file\":\"1770044630_noli_me_tangere.jpeg\",\"photo_fingerprint_file\":\"1770044630_Untitled59_20241129210748.PNG\"}', 0.00, '0', '1770044630_noli_me_tangere.jpeg', '09668116899', '2026-02-02 15:03:50', '2026-02-06 11:47:48', 'approved', NULL),
(2040, 0, 'BC-2026-678188', '2026-02-04', 'MARICEL', '', 'BALCOS', 'Nihil ipsum quae Nam', '1979-05-01', 'nipyj@mailinator.com', 'Male', 'Widowed', 'Equatorial Guinean', 'Quia illum nihil su', 'Quaerat eveniet bla', 'Voluptatem aut quo', 'Rem voluptatem ad qu', 'Voluptatem hic disti', '72567', 'For residency verification', '', 'SSS ID', '33-4053933-5', '{\"valid_id_file\":\"1770214085_CORRECT__2_.jpg\",\"proof_of_residence_file\":\"1770214085_CORRECT__2_.jpg\",\"receipt_file\":\"1770214085_CORRECT.jpg\",\"signature_file\":\"1770214085_BLURRED.jpg\",\"photo_fingerprint_file\":\"\"}', 0.00, '0', '1770214085_BLURRED.jpg', '119', '2026-02-04 14:08:05', '2026-02-04 14:08:05', 'pending', NULL),
(2041, 0, 'BC-2026-678188', '2026-02-04', 'MARICEL', '', 'BALCOS', 'Nihil ipsum quae Nam', '1979-05-01', 'nipyj@mailinator.com', 'Male', 'Widowed', 'Equatorial Guinean', 'Quia illum nihil su', 'Quaerat eveniet bla', 'Voluptatem aut quo', 'Rem voluptatem ad qu', 'Voluptatem hic disti', '72567', 'For residency verification', '', 'SSS ID', '33-4053933-5', '{\"valid_id_file\":\"1770214085_CORRECT__2_.jpg\",\"proof_of_residence_file\":\"1770214085_CORRECT__2_.jpg\",\"receipt_file\":\"1770214085_CORRECT.jpg\",\"signature_file\":\"1770214085_BLURRED.jpg\",\"photo_fingerprint_file\":\"\"}', 0.00, '0', '1770214085_BLURRED.jpg', '09243256451', '2026-02-04 14:08:05', '2026-02-07 00:00:31', 'approved', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `permit_logs`
--

CREATE TABLE `permit_logs` (
  `log_id` int(11) NOT NULL,
  `permit_id` int(11) NOT NULL,
  `status` varchar(50) NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `uploaded_files`
--

CREATE TABLE `uploaded_files` (
  `file_id` int(11) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `file_type` varchar(100) NOT NULL,
  `file_size` int(11) NOT NULL,
  `permit_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `upload_date` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `application_logs`
--
ALTER TABLE `application_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `idx_permit_id` (`permit_id`);

--
-- Indexes for table `barangay_permit`
--
ALTER TABLE `barangay_permit`
  ADD PRIMARY KEY (`permit_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `permit_logs`
--
ALTER TABLE `permit_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `idx_permit_id` (`permit_id`);

--
-- Indexes for table `uploaded_files`
--
ALTER TABLE `uploaded_files`
  ADD PRIMARY KEY (`file_id`),
  ADD KEY `idx_permit_id` (`permit_id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `application_logs`
--
ALTER TABLE `application_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `barangay_permit`
--
ALTER TABLE `barangay_permit`
  MODIFY `permit_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2042;

--
-- AUTO_INCREMENT for table `permit_logs`
--
ALTER TABLE `permit_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `uploaded_files`
--
ALTER TABLE `uploaded_files`
  MODIFY `file_id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
