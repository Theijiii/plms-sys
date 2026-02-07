<?php

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


require_once '../config/database.php';
require_once '../middleware/auth.php';

$auth = new Auth();
$user_id = $auth->validateToken();

if (!$user_id) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->user_id) || $data->user_id != $user_id) {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Forbidden"]);
    exit();
}

try {
    $query = "SELECT 
                p.permit_id,
                p.permit_type,
                p.application_type,
                p.business_name,
                p.owner_name,
                p.business_address,
                p.contact_number,
                p.status,
                p.fees,
                p.requirements,
                p.created_at,
                p.reviewed_at,
                p.approved_at,
                p.rejected_at,
                p.status_updated_at,
                p.compliance_notes,
                p.rejection_reason
              FROM permits p
              WHERE p.user_id = ?
              ORDER BY p.created_at DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $applications = [];
    while ($row = $result->fetch_assoc()) {
        $applications[] = $row;
    }
    
    echo json_encode([
        "success" => true,
        "applications" => $applications
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
?>