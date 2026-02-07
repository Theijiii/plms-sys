<?php
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
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

require_once __DIR__ . '/db.php';

$response = [
    'success' => false,
    'message' => '',
    'permit_id' => 0,
    'applicant_id' => ''
];

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Method not allowed. Use POST.');
    }
    
    // Debug log
    error_log("=== SPECIAL PERMIT SUBMISSION START ===");
    error_log("POST data: " . print_r($_POST, true));
    error_log("FILES data: " . print_r($_FILES, true));
    
    // Generate applicant ID
    $applicant_id = 'SPBUS' . date('Y') . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
    $application_date = date('Y-m-d');
    $status = 'PENDING';
    
    // Validate required fields
    $required_fields = [
        'business_name', 'owner_first_name', 'owner_last_name',
        'contact_number', 'email_address', 'special_permit_type',
        'event_date_start', 'event_date_end', 'event_location'
    ];
    
    $missing_fields = [];
    foreach ($required_fields as $field) {
        if (!isset($_POST[$field]) || trim($_POST[$field]) === '') {
            $missing_fields[] = $field;
        }
    }
    
    if (!empty($missing_fields)) {
        throw new Exception('Missing required fields: ' . implode(', ', $missing_fields));
    }
    
    // Sanitize inputs
    $business_name = $conn->real_escape_string(trim($_POST['business_name']));
    $owner_first_name = $conn->real_escape_string(trim($_POST['owner_first_name']));
    $owner_last_name = $conn->real_escape_string(trim($_POST['owner_last_name']));
    $owner_middle_name = isset($_POST['owner_middle_name']) ? $conn->real_escape_string(trim($_POST['owner_middle_name'])) : '';
    $contact_number = $conn->real_escape_string(trim($_POST['contact_number']));
    $email_address = $conn->real_escape_string(trim($_POST['email_address']));
    $special_permit_type = $conn->real_escape_string(trim($_POST['special_permit_type']));
    $event_description = isset($_POST['event_description']) ? $conn->real_escape_string(trim($_POST['event_description'])) : '';
    $event_date_start = $conn->real_escape_string(trim($_POST['event_date_start']));
    $event_date_end = $conn->real_escape_string(trim($_POST['event_date_end']));
    $event_location = $conn->real_escape_string(trim($_POST['event_location']));
    $estimated_attendees = isset($_POST['estimated_attendees']) ? intval($_POST['estimated_attendees']) : 0;
    
    // Insert into special_permit_applications table
    $sql = "INSERT INTO special_permit_applications (
        applicant_id, application_date, status,
        business_name, owner_first_name, owner_last_name, owner_middle_name,
        contact_number, email_address,
        special_permit_type, event_description, 
        event_date_start, event_date_end, event_location, estimated_attendees,
        submission_date, last_updated
    ) VALUES (
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?,
        ?, ?,
        ?, ?, ?, ?,
        NOW(), NOW()
    )";
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception('Database prepare failed: ' . $conn->error);
    }
    
    $stmt->bind_param(
        'ssssssssssssssi',
        $applicant_id,
        $application_date,
        $status,
        $business_name,
        $owner_first_name,
        $owner_last_name,
        $owner_middle_name,
        $contact_number,
        $email_address,
        $special_permit_type,
        $event_description,
        $event_date_start,
        $event_date_end,
        $event_location,
        $estimated_attendees
    );
    
    if (!$stmt->execute()) {
        throw new Exception('Database execute failed: ' . $stmt->error);
    }
    
    $permit_id = $conn->insert_id;
    $stmt->close();
    
    error_log("Special permit created with ID: " . $permit_id);
    
    // Handle file uploads if any
    $uploadDir = __DIR__ . '/uploads/special/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    
    $fileFields = [
        'event_permit' => 'Event Permit',
        'barangay_clearance' => 'Barangay Clearance',
        'valid_id' => 'Valid ID'
    ];
    
    foreach ($fileFields as $fieldName => $docType) {
        if (isset($_FILES[$fieldName]) && $_FILES[$fieldName]['error'] === UPLOAD_ERR_OK) {
            $file = $_FILES[$fieldName];
            $fileExt = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            
            $allowedExt = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
            if (!in_array($fileExt, $allowedExt)) {
                continue;
            }
            
            if ($file['size'] > 10 * 1024 * 1024) {
                continue;
            }
            
            $fileName = 'SP_' . $applicant_id . '_' . $fieldName . '_' . time() . '.' . $fileExt;
            $filePath = $uploadDir . $fileName;
            
            if (move_uploaded_file($file['tmp_name'], $filePath)) {
                // Save to application_documents table
                $docSql = "INSERT INTO application_documents (
                    permit_id, document_type, document_name, 
                    file_path, file_type, file_size, upload_date
                ) VALUES (?, ?, ?, ?, ?, ?, NOW())";
                
                $docStmt = $conn->prepare($docSql);
                if ($docStmt) {
                    $docStmt->bind_param(
                        'issssi',
                        $permit_id,
                        $docType,
                        $file['name'],
                        $filePath,
                        $file['type'],
                        $file['size']
                    );
                    $docStmt->execute();
                    $docStmt->close();
                }
            }
        }
    }
    
    $response['success'] = true;
    $response['message'] = 'Special permit application submitted successfully!';
    $response['permit_id'] = $permit_id;
    $response['applicant_id'] = $applicant_id;
    
} catch (Exception $e) {
    error_log("EXCEPTION: " . $e->getMessage());
    $response['message'] = 'Error: ' . $e->getMessage();
}

$conn->close();
echo json_encode($response);
exit();
?>
