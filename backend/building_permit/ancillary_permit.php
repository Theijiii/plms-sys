<?php
session_start();


$allowedOrigins = [
    'http://localhost',
    'https://e-plms.goserveph.com/'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
} else {
    header("Access-Control-Allow-Origin: https://e-plms.goserveph.com/");
}
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

// Include DB connection
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    handleAncillaryPermitSubmission();
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    fetchAncillaryPermits();
} else {
    jsonResponse(false, "Invalid request method", null, 405);
}

function saveUploadedFile($fileKey, $subDir) {
    if (!isset($_FILES[$fileKey]) || $_FILES[$fileKey]['error'] !== UPLOAD_ERR_OK) {
        return null;
    }

    $file = $_FILES[$fileKey];

    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'image/gif'];
    if (!in_array($file['type'], $allowedTypes)) {
        throw new Exception("Invalid file type for {$fileKey}. Allowed: JPG, PNG, PDF, GIF");
    }

    if ($file['size'] > 5 * 1024 * 1024) {
        throw new Exception("File too large for {$fileKey}. Maximum size is 5MB");
    }

    $uploadDir = __DIR__ . '/uploads/' . $subDir . '/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $safeName = $fileKey . '_' . time() . '_' . mt_rand(1000, 9999) . '.' . $extension;
    $targetPath = $uploadDir . $safeName;

    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        return 'uploads/' . $subDir . '/' . $safeName;
    }

    return null;
}

function handleAncillaryPermitSubmission() {
    $conn = getDBConnection();
    if (!$conn) {
        jsonResponse(false, "Database connection failed", null, 500);
    }

    try {
        // Validate permit_type
        $validTypes = ['demolition', 'electrical', 'electronics', 'excavation', 'fencing', 'mechanical', 'occupancy', 'plumbing', 'signage'];
        $permit_type = strtolower(trim($_POST['permit_type'] ?? ''));
        if (!in_array($permit_type, $validTypes)) {
            throw new Exception("Invalid permit type: {$permit_type}");
        }

        // Common applicant fields
        $first_name = trim($_POST['first_name'] ?? '');
        $last_name = trim($_POST['last_name'] ?? '');
        $middle_initial = trim($_POST['middle_initial'] ?? '');
        $contact_number = trim($_POST['contact_number'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $owner_address = trim($_POST['owner_address'] ?? '');
        $property_address = trim($_POST['property_address'] ?? '');
        $building_permit_number = trim($_POST['building_permit_number'] ?? '');
        $barangay_clearance = trim($_POST['barangay_clearance'] ?? '');
        $tct_or_tax_dec = trim($_POST['tct_or_tax_dec'] ?? '');

        // Validate required common fields
        if (empty($first_name) || empty($last_name)) {
            throw new Exception("First name and last name are required.");
        }
        if (empty($contact_number)) {
            throw new Exception("Contact number is required.");
        }
        if (empty($email)) {
            throw new Exception("Email is required.");
        }
        if (empty($owner_address) || empty($property_address)) {
            throw new Exception("Owner address and property address are required.");
        }

        // Professional fields
        $professional_name = trim($_POST['professional_name'] ?? '');
        $professional_role = trim($_POST['professional_role'] ?? '');
        $prc_id = trim($_POST['prc_id'] ?? '');
        $ptr_number = trim($_POST['ptr_number'] ?? '');
        $prc_expiry = $_POST['prc_expiry'] ?? null;

        if (empty($professional_name) || empty($prc_id) || empty($ptr_number)) {
            throw new Exception("Professional name, PRC ID, and PTR number are required.");
        }

        // User ID for tracking
        $user_id = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;

        // Check if user_id column exists in the table
        $hasUserIdColumn = false;
        $checkCol = $conn->query("SHOW COLUMNS FROM `ancillary_permit` LIKE 'user_id'");
        if ($checkCol && $checkCol->num_rows > 0) {
            $hasUserIdColumn = true;
        }

        // Type-specific data (JSON)
        $type_specific_data = $_POST['type_specific_data'] ?? '{}';

        // Project description
        $project_description = trim($_POST['project_description'] ?? '');

        // Handle file uploads
        $subDir = 'ancillary_' . $permit_type . '_' . time();
        $document_plans_path = saveUploadedFile('document_plans', $subDir);
        $document_id_path = saveUploadedFile('document_id', $subDir);
        $signature_file_path = saveUploadedFile('signature_file', $subDir);

        // Insert into database
        $columns = 'permit_type, first_name, last_name, middle_initial, contact_number, email, 
             owner_address, property_address, building_permit_number, barangay_clearance, 
             tct_or_tax_dec, professional_name, professional_role, 
             prc_id, ptr_number, prc_expiry, type_specific_data, project_description,
             document_plans_path, document_id_path, signature_file_path';
        $placeholders = '?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?';
        $types = 'sssssssssssssssssssss';
        $params = [
            $permit_type, $first_name, $last_name, $middle_initial, $contact_number, $email,
            $owner_address, $property_address, $building_permit_number, $barangay_clearance,
            $tct_or_tax_dec, $professional_name, $professional_role,
            $prc_id, $ptr_number, $prc_expiry, $type_specific_data, $project_description,
            $document_plans_path, $document_id_path, $signature_file_path
        ];

        if ($hasUserIdColumn) {
            $columns .= ', user_id';
            $placeholders .= ', ?';
            $types .= 'i';
            $params[] = $user_id;
        }

        $stmt = $conn->prepare("INSERT INTO ancillary_permit ({$columns}) VALUES ({$placeholders})");

        if (!$stmt) throw new Exception("Prepare failed: " . $conn->error);

        $stmt->bind_param($types, ...$params);

        if (!$stmt->execute()) throw new Exception("Insert failed: " . $stmt->error);

        $permit_id = $stmt->insert_id;
        $stmt->close();
        $conn->close();

        jsonResponse(true, "Ancillary permit application submitted successfully!", [
            'permit_id' => $permit_id,
            'permit_type' => $permit_type,
            'document_plans_path' => $document_plans_path,
            'document_id_path' => $document_id_path,
            'signature_file_path' => $signature_file_path
        ]);

    } catch (Exception $e) {
        error_log("Ancillary Permit Error: " . $e->getMessage());
        jsonResponse(false, $e->getMessage(), null, 400);
    }
}

function fetchAncillaryPermits() {
    $conn = getDBConnection();
    if (!$conn) {
        jsonResponse(false, "Database connection failed", null, 500);
    }

    try {
        $where = "1=1";
        $params = [];
        $types = "";

        // Filter by permit_type
        if (!empty($_GET['permit_type'])) {
            $where .= " AND permit_type = ?";
            $params[] = $_GET['permit_type'];
            $types .= "s";
        }

        // Filter by status
        if (!empty($_GET['status'])) {
            $where .= " AND status = ?";
            $params[] = $_GET['status'];
            $types .= "s";
        }

        $query = "SELECT * FROM ancillary_permit WHERE {$where} ORDER BY submitted_at DESC";

        if (!empty($params)) {
            $stmt = $conn->prepare($query);
            $stmt->bind_param($types, ...$params);
            $stmt->execute();
            $result = $stmt->get_result();
        } else {
            $result = $conn->query($query);
        }

        $permits = [];
        while ($row = $result->fetch_assoc()) {
            // Decode JSON type_specific_data
            if (!empty($row['type_specific_data'])) {
                $row['type_specific_data'] = json_decode($row['type_specific_data'], true);
            }
            $permits[] = $row;
        }

        jsonResponse(true, "Ancillary permits fetched successfully", $permits);

    } catch (Exception $e) {
        error_log("Fetch Ancillary Error: " . $e->getMessage());
        jsonResponse(false, $e->getMessage(), null, 500);
    } finally {
        $conn->close();
    }
}
?>
