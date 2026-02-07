<?php
session_start();

$allowedOrigins = [
    'http://localhost',
    'https://e-plms.goserveph.com',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
} else {
    header("Access-Control-Allow-Origin: https://e-plms.goserveph.com");
}
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);
// Database Connection
require_once __DIR__ . '/db.php';

/// Initialize response
$response = [
    'success' => false,
    'message' => '',
    'hasExistingMTOP' => false,
    'mtopStatus' => null,
    'application_id' => null,
    'permitDetails' => null
];

try {
    
    // Get the raw POST data
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('No data received');
    }
    
    $permit_subtype = isset($input['permit_subtype']) ? trim($input['permit_subtype']) : '';
    
    if (empty($permit_subtype)) {
        throw new Exception('Permit subtype is required');
    }
    
    if ($permit_subtype === 'FRANCHISE') {
        // For Franchise validation: check by application_id and plate_number
        $application_id = isset($input['application_id']) ? trim($input['application_id']) : '';
        $plate_number = isset($input['plate_number']) ? trim($input['plate_number']) : '';
        
        if (empty($application_id) || empty($plate_number)) {
            throw new Exception('Application ID and Plate Number are required');
        }
        
        $stmt = $conn->prepare("
            SELECT * FROM franchise_permit_applications 
            WHERE application_id = ? 
            AND plate_number = ? 
            AND permit_subtype = 'MTOP'
        ");
        
        if (!$stmt) {
            throw new Exception('SQL Prepare failed: ' . $conn->error);
        }
        
        $stmt->bind_param("ss", $application_id, $plate_number);
        
    } else {
        // For MTOP validation: check by id_number and plate_number
        $id_number = isset($input['id_number']) ? trim($input['id_number']) : '';
        $plate_number = isset($input['plate_number']) ? trim($input['plate_number']) : '';
        
        if (empty($id_number) || empty($plate_number)) {
            throw new Exception('ID Number and Plate Number are required');
        }
        
        // Prepare statement - CASE SENSITIVE exact match
        $stmt = $conn->prepare("
            SELECT * FROM franchise_permit_applications 
            WHERE id_number = ? 
            AND plate_number = ? 
            AND permit_subtype = 'MTOP'
        ");
        
        if (!$stmt) {
            throw new Exception('SQL Prepare failed: ' . $conn->error);
        }
        
        $stmt->bind_param("ss", $id_number, $plate_number);
    }
    
    // Execute query
    if (!$stmt->execute()) {
        throw new Exception('Execute failed: ' . $stmt->error);
    }
    
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $permit = $result->fetch_assoc();
        
        $response['success'] = true;
        $response['hasExistingMTOP'] = true;
        $response['mtopStatus'] = isset($permit['status']) ? $permit['status'] : null;
        $response['application_id'] = isset($permit['application_id']) ? $permit['application_id'] : null;
        
        // Check if status is approved (case-insensitive check)
// Check if status is approved (case-insensitive check)
$isApproved = isset($permit['status']) && strtolower($permit['status']) === 'approved';

$response['permitDetails'] = [
    'application_id' => $permit['application_id'] ?? '',
    'first_name' => $permit['first_name'] ?? '',
    'last_name' => $permit['last_name'] ?? '',
    'middle_initial' => $permit['middle_initial'] ?? '',
    'home_address' => $permit['home_address'] ?? '',
    'contact_number' => $permit['contact_number'] ?? '',
    'email' => $permit['email'] ?? '',
    'citizenship' => $permit['citizenship'] ?? '',
    'birth_date' => $permit['birth_date'] ?? '',
    'id_type' => $permit['id_type'] ?? '',
    'id_number' => $permit['id_number'] ?? '',
    'operator_type' => $permit['operator_type'] ?? '',
    'make_brand' => $permit['make_brand'] ?? '',
    'model' => $permit['model'] ?? '',
    'engine_number' => $permit['engine_number'] ?? '',
    'chassis_number' => $permit['chassis_number'] ?? '',
    'plate_number' => $permit['plate_number'] ?? '',
    'year_acquired' => $permit['year_acquired'] ?? '',
    'color' => $permit['color'] ?? '',
    'vehicle_type' => $permit['vehicle_type'] ?? '',
    'lto_or_number' => $permit['lto_or_number'] ?? '',
    'lto_cr_number' => $permit['lto_cr_number'] ?? '',
    'lto_expiration_date' => $permit['lto_expiration_date'] ?? '',
    'mv_file_number' => $permit['mv_file_number'] ?? '',
    'district' => $permit['district'] ?? '',
    'route_zone' => $permit['route_zone'] ?? '',
    'toda_name' => $permit['toda_name'] ?? '',
    'barangay_of_operation' => $permit['barangay_of_operation'] ?? '',
    'status' => $permit['status'] ?? '',
    'is_approved' => $isApproved,
    'created_at' => $permit['created_at'] ?? ''
];
        $response['message'] = 'MTOP permit found. Status: ' . ($permit['status'] ?? 'Unknown');
        
    } else {
        $response['success'] = true;
        $response['hasExistingMTOP'] = false;
        $response['message'] = 'No MTOP permit found with the provided details';
    }
    
    $stmt->close();
    
} catch (Exception $e) {
    $response['success'] = false;
    $response['message'] = 'Error: ' . $e->getMessage();
}

if (isset($conn) && $conn) {
    $conn->close();
}

// Output JSON response
echo json_encode($response);
exit();
?>
