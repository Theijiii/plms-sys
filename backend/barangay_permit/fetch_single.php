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

require_once 'db.php'; // Just needs connection to eplms_barangay_permit_db

$response = ['success' => false, 'message' => '', 'data' => null];

try {
    if (!isset($_GET['permit_id']) || empty($_GET['permit_id'])) {
        throw new Exception('Permit ID is required');
    }
    
    $permit_id = intval($_GET['permit_id']);
    
    // SIMPLIFIED: Just fetch from barangay_permit table only
    $stmt = $conn->prepare("SELECT * FROM barangay_permit WHERE permit_id = ?");
    
    $stmt->bind_param("i", $permit_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $permit = $result->fetch_assoc();
        
        // Parse attachments if they exist
        if (isset($permit['attachments']) && !empty($permit['attachments'])) {
            $attachments = json_decode($permit['attachments'], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $permit['attachments'] = $attachments;
            }
        }
        
        $response['success'] = true;
        $response['data'] = $permit;
        $response['message'] = 'Permit retrieved successfully';
    } else {
        throw new Exception('Permit not found');
    }
    
    $stmt->close();
    
} catch (Exception $e) {
    $response['message'] = $e->getMessage();
    error_log("fetch_single.php Error: " . $e->getMessage());
} finally {
    if (isset($conn)) {
        $conn->close();
    }
    echo json_encode($response);
}
?>