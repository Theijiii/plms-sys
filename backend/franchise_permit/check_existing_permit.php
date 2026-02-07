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
    $plate_number = strtoupper(trim($data['plate_number']));
    $renewal_type = isset($data['renewal_type']) ? trim($data['renewal_type']) : 'MTOP';
    
    // Query the database for the existing permit by application_id and plate_number
    $stmt = $conn->prepare(
        "SELECT application_id, permit_type, permit_subtype, status,
                first_name, last_name, middle_initial,
                home_address, contact_number, email,
                citizenship, birth_date, id_type, id_number,
                make_brand, model, engine_number, chassis_number,
                plate_number, year_acquired, color, vehicle_type,
                lto_or_number, lto_cr_number, lto_expiration_date,
                mv_file_number, district, route_zone,
                barangay_of_operation, toda_name, operator_type, company_name,
                date_approved, expiry_date, user_id
         FROM franchise_permit_applications
         WHERE application_id = ? AND UPPER(plate_number) = ?
         LIMIT 1"
    );
    
    if (!$stmt) {
        throw new Exception('Database query preparation failed: ' . $conn->error);
    }
    
    $stmt->bind_param("ss", $permit_id, $plate_number);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $permit = $result->fetch_assoc();
        
        $response['success'] = true;
        $response['hasExistingPermit'] = true;
        $response['application_id'] = $permit['application_id'];
        $response['permitStatus'] = $permit['status'];
        $response['isEligibleForRenewal'] = in_array(strtoupper($permit['status']), ['APPROVED', 'EXPIRED']);
        $response['message'] = 'Existing permit found.';
        
        $response['existingPermit'] = $permit;
    } else {
        $response['success'] = false;
        $response['message'] = 'No existing permit found with the provided Permit ID and Plate Number.';
    }
    
    $stmt->close();
    
} catch (Exception $e) {
    $response['success'] = false;
    $response['message'] = 'Error: ' . $e->getMessage();
    error_log("Exception: " . $e->getMessage());
}

// Output JSON
echo json_encode($response);
exit();
?>