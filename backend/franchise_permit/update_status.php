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

try {
    // Get database connection
    $conn = getDBConnection();
    
    if (!$conn || $conn->connect_error) {
        throw new Exception('Database connection failed: ' . ($conn ? $conn->connect_error : 'Could not get connection'));
    }

    $input = file_get_contents('php://input');
    error_log("Received input: " . $input);
    
    $data = json_decode($input, true);
    
    if (!$data) {
        throw new Exception('Invalid JSON data');
    }
    
    if (!isset($data['application_id'])) {
        throw new Exception('Application ID is required');
    }
    
    $application_id = $data['application_id'];
    $status = isset($data['status']) ? $conn->real_escape_string($data['status']) : null;
    $remarks = isset($data['remarks']) ? trim($conn->real_escape_string($data['remarks'])) : null;
    $updated_by = isset($data['updated_by']) ? $conn->real_escape_string($data['updated_by']) : 'Admin';

    // Check if application exists
    $check_sql = "SELECT remarks, status FROM franchise_permit_applications WHERE application_id = ?";
    $check_stmt = $conn->prepare($check_sql);
    
    if (!$check_stmt) {
        throw new Exception('Database prepare failed: ' . $conn->error);
    }
    
    $check_stmt->bind_param("s", $application_id);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();
    
    if ($check_result->num_rows === 0) {
        throw new Exception('Application not found: ' . $application_id);
    }
    
    $current_data = $check_result->fetch_assoc();
    $check_stmt->close();

    // Prepare update
    $update_fields = [];
    $params = [];
    $types = "";

    if ($status !== null) {
        $update_fields[] = "status = ?";
        $params[] = $status;
        $types .= "s";
    }

    if ($remarks !== null && $remarks !== '') {
        $timestamp = date('M d, Y h:i:s A');
        $formatted_remark = "--- {$timestamp} ({$updated_by}) ---\n" . $remarks . "\n\n";
        
        $new_remarks = $formatted_remark;
        if (!empty($current_data['remarks'])) {
            $new_remarks = $formatted_remark . $current_data['remarks'];
        }
        
        $update_fields[] = "remarks = ?";
        $params[] = $new_remarks;
        $types .= "s";
    }

    if (empty($update_fields)) {
        throw new Exception('No data to update');
    }

    // Add application_id to params
    $params[] = $application_id;
    $types .= "s";

    // Build SQL
    $sql = "UPDATE franchise_permit_applications SET " . implode(", ", $update_fields) . " WHERE application_id = ?";
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception('Failed to prepare update statement: ' . $conn->error);
    }
    
    $stmt->bind_param($types, ...$params);

    if ($stmt->execute()) {
        // Get updated record
        $select_sql = "SELECT application_id, status, remarks, updated_at FROM franchise_permit_applications WHERE application_id = ?";
        $select_stmt = $conn->prepare($select_sql);
        $select_stmt->bind_param("s", $application_id);
        $select_stmt->execute();
        $result = $select_stmt->get_result();
        $updated_record = $result->fetch_assoc();
        $select_stmt->close();
        
        $response = [
            'success' => true,
            'message' => 'Permit updated successfully',
            'data' => [
                'application_id' => $updated_record['application_id'],
                'status' => $updated_record['status'],
                'remarks' => $updated_record['remarks'],
                'updated_at' => $updated_record['updated_at']
            ]
        ];
        
        echo json_encode($response);
    } else {
        throw new Exception('Failed to update: ' . $stmt->error);
    }
    
    $stmt->close();
    $conn->close();

} catch (Exception $e) {
    http_response_code(500);
    $error_response = [
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ];
    echo json_encode($error_response);
    error_log("Error in update_status.php: " . $e->getMessage());
}
?>