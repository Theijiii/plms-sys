<?php
session_start();

$allowedOrigins = [
    'http://localhost',
    'https://e-plms.goserveph.com/',
    'urbanplanning.goserveph.com',
    'https://urbanplanning.goserveph.com'
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
// Log for debugging
error_log("Check existing permit called at: " . date('Y-m-d H:i:s'));
error_log("Request method: " . $_SERVER['REQUEST_METHOD']);

// Initialize response
$response = [
    'success' => false,
    'message' => '',
    'hasExistingPermit' => false,
    'permitStatus' => null,
    'application_id' => null,
    'existingPermit' => null,
    'isEligibleForRenewal' => false
];

try {
    // Get raw POST data
    $input = file_get_contents('php://input');
    error_log("Raw input: " . $input);
    
    if (empty($input)) {
        // Try to get from POST array
        if (!empty($_POST)) {
            $input = json_encode($_POST);
        } else {
            throw new Exception('No data received');
        }
    }
    
    $data = json_decode($input, true);
    error_log("Decoded data: " . print_r($data, true));
    
    if (!$data) {
        throw new Exception('Invalid JSON data');
    }
    
    // Check required fields
    if (empty($data['permit_id'])) {
        throw new Exception('Permit ID is required');
    }
    
    if (empty($data['plate_number'])) {
        throw new Exception('Plate number is required');
    }
    
    $permit_id = trim($data['permit_id']);
    $plate_number = trim($data['plate_number']);
    $renewal_type = isset($data['renewal_type']) ? trim($data['renewal_type']) : 'MTOP';
    
    // For testing - simulate a response
    $response['success'] = true;
    $response['hasExistingPermit'] = true;
    $response['application_id'] = $permit_id;
    $response['permitStatus'] = 'APPROVED';
    $response['isEligibleForRenewal'] = true;
    $response['message'] = 'Test permit found. This is a simulated response.';
    
    // Simulate permit data
    $response['existingPermit'] = [
        'application_id' => $permit_id,
        'permit_subtype' => $renewal_type === 'MTOP' ? 'MTOP' : 'FRANCHISE',
        'first_name' => 'John',
        'last_name' => 'Doe',
        'plate_number' => $plate_number,
        'status' => 'APPROVED',
        'date_approved' => '2024-01-15',
        'expiry_date' => date('Y-m-d', strtotime('+30 days')),
        'make_brand' => 'Honda',
        'model' => 'Wave 125',
        'color' => 'Red'
    ];
    
} catch (Exception $e) {
    $response['success'] = false;
    $response['message'] = 'Error: ' . $e->getMessage();
    error_log("Exception: " . $e->getMessage());
}

// Output JSON
echo json_encode($response);
exit();
?>