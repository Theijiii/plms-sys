<?php
error_reporting(0);
ini_set('display_errors', '0');
session_start();

$allowedOrigins = [
    'http://localhost:5173',
    'http://localhost',
    'https://e-plms.goserveph.com'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
} else {
    header("Access-Control-Allow-Origin: https://e-plms.goserveph.com");
}
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Only POST method allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
    exit;
}

$permitId = $input['permit_id'] ?? null;
$permitCategory = $input['permit_category'] ?? null;
$approvedDate = $input['approved_date'] ?? date('Y-m-d');
$expirationDate = $input['expiration_date'] ?? date('Y-m-d', strtotime($approvedDate . ' +1 year'));

if (!$permitId || !$permitCategory) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'permit_id and permit_category are required']);
    exit;
}

try {
    switch ($permitCategory) {
        case 'Business Permit':
            $conn = new mysqli('localhost', 'eplms_paul', 'mypassword', 'eplms_business_permit_db');
            if ($conn->connect_error) throw new Exception('DB connection failed: ' . $conn->connect_error);
            $conn->set_charset("utf8mb4");

            // Ensure columns exist
            $conn->query("ALTER TABLE business_permit_applications ADD COLUMN IF NOT EXISTS approved_date DATE NULL");
            $conn->query("ALTER TABLE business_permit_applications ADD COLUMN IF NOT EXISTS validity_date DATE NULL");

            $stmt = $conn->prepare("UPDATE business_permit_applications SET approved_date = ?, validity_date = ? WHERE permit_id = ?");
            $stmt->bind_param("ssi", $approvedDate, $expirationDate, $permitId);

            if (!$stmt->execute()) throw new Exception('Update failed: ' . $stmt->error);
            if ($stmt->affected_rows === 0) throw new Exception('No permit found with ID: ' . $permitId);

            $stmt->close();
            $conn->close();
            break;

        case 'Barangay Permit':
            $conn = new mysqli('localhost', 'eplms_karl', 'mypassword', 'eplms_barangay_permit_db');
            if ($conn->connect_error) throw new Exception('DB connection failed: ' . $conn->connect_error);
            $conn->set_charset("utf8mb4");

            // Ensure columns exist
            $conn->query("ALTER TABLE barangay_permit ADD COLUMN IF NOT EXISTS approved_date DATE NULL");
            $conn->query("ALTER TABLE barangay_permit ADD COLUMN IF NOT EXISTS expiration_date DATE NULL");

            $stmt = $conn->prepare("UPDATE barangay_permit SET approved_date = ?, expiration_date = ? WHERE permit_id = ?");
            $stmt->bind_param("ssi", $approvedDate, $expirationDate, $permitId);

            if (!$stmt->execute()) throw new Exception('Update failed: ' . $stmt->error);
            if ($stmt->affected_rows === 0) throw new Exception('No permit found with ID: ' . $permitId);

            $stmt->close();
            $conn->close();
            break;

        case 'Building Permit':
            $conn = new mysqli('localhost', 'eplms_ella', 'mypassword', 'eplms_building_permit_db');
            if ($conn->connect_error) throw new Exception('DB connection failed: ' . $conn->connect_error);
            $conn->set_charset("utf8mb4");

            // Ensure columns exist
            $conn->query("ALTER TABLE application ADD COLUMN IF NOT EXISTS approved_date DATE NULL");
            $conn->query("ALTER TABLE application ADD COLUMN IF NOT EXISTS expiration_date DATE NULL");

            $stmt = $conn->prepare("UPDATE application SET approved_date = ?, expiration_date = ? WHERE application_id = ?");
            $stmt->bind_param("ssi", $approvedDate, $expirationDate, $permitId);

            if (!$stmt->execute()) throw new Exception('Update failed: ' . $stmt->error);
            if ($stmt->affected_rows === 0) throw new Exception('No permit found with ID: ' . $permitId);

            $stmt->close();
            $conn->close();
            break;

        case 'Franchise Permit':
            $conn = new mysqli('localhost', 'eplms_kobe', 'mypassword', 'eplms_franchise_applications');
            if ($conn->connect_error) throw new Exception('DB connection failed: ' . $conn->connect_error);
            $conn->set_charset("utf8mb4");

            // Ensure columns exist
            $conn->query("ALTER TABLE franchise_permit_applications ADD COLUMN IF NOT EXISTS date_approved DATE NULL");
            $conn->query("ALTER TABLE franchise_permit_applications ADD COLUMN IF NOT EXISTS expiry_date DATE NULL");

            $stmt = $conn->prepare("UPDATE franchise_permit_applications SET date_approved = ?, expiry_date = ? WHERE application_id = ?");
            $stmt->bind_param("ssi", $approvedDate, $expirationDate, $permitId);

            if (!$stmt->execute()) throw new Exception('Update failed: ' . $stmt->error);
            if ($stmt->affected_rows === 0) throw new Exception('No permit found with ID: ' . $permitId);

            $stmt->close();
            $conn->close();
            break;

        default:
            throw new Exception('Unknown permit category: ' . $permitCategory);
    }

    echo json_encode([
        'success' => true,
        'message' => 'Expiration date updated successfully',
        'data' => [
            'permit_id' => $permitId,
            'permit_category' => $permitCategory,
            'approved_date' => $approvedDate,
            'expiration_date' => $expirationDate
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
    error_log("update_expiration.php error: " . $e->getMessage());
}
