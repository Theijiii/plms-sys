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
// Database Connection
require_once __DIR__ . '/db.php';

$response = [
    'success' => false,
    'message' => '',
    'data' => null,
    'can_renew' => false
];

try {
    // Get JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data || !isset($data['applicant_id'])) {
        throw new Exception('No permit number provided');
    }
    
    $applicant_id = trim($data['applicant_id']);
    
    if (empty($applicant_id)) {
        throw new Exception('Permit number is required');
    }
    
    // Create database connection
    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }
    $conn->set_charset("utf8mb4");
    
    // Check if permit exists and is approved/active
    $sql = "SELECT * FROM business_permit_applications 
            WHERE applicant_id = ? 
            AND status IN ('APPROVED', 'ACTIVE', 'RENEWED')
            ORDER BY application_date DESC 
            LIMIT 1";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $applicant_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception('Permit number not found or not yet approved');
    }
    
    $permit_data = $result->fetch_assoc();
    $stmt->close();
    
    // Check if permit has expired
    $today = date('Y-m-d');
    $expiry_date = $permit_data['validity_date'] ?? null;
    
    if ($expiry_date && $expiry_date < $today) {
        $permit_data['is_expired'] = true;
        $permit_data['expiry_status'] = 'EXPIRED';
    } else {
        $permit_data['is_expired'] = false;
        $permit_data['expiry_status'] = 'VALID';
    }
    
    // Check for pending renewals
    $renewal_sql = "SELECT COUNT(*) as pending_count 
                   FROM business_permit_applications 
                   WHERE applicant_id = ? 
                   AND permit_type = 'Renewal' 
                   AND status IN ('PENDING', 'PROCESSING')";
    
    $renewal_stmt = $conn->prepare($renewal_sql);
    $renewal_stmt->bind_param('s', $applicant_id);
    $renewal_stmt->execute();
    $renewal_result = $renewal_stmt->get_result();
    $renewal_data = $renewal_result->fetch_assoc();
    $renewal_stmt->close();
    
    if ($renewal_data['pending_count'] > 0) {
        throw new Exception('You already have a pending renewal application for this permit');
    }
    
    // All checks passed
    $response['success'] = true;
    $response['message'] = 'Permit validated successfully';
    $response['data'] = $permit_data;
    $response['can_renew'] = true;
    
} catch (Exception $e) {
    $response['message'] = $e->getMessage();
}

if (isset($conn) && $conn instanceof mysqli) {
    $conn->close();
}

echo json_encode($response);
?>