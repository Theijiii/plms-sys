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

// Start output buffering
ob_start();

require_once __DIR__ . '/db.php';

$uploadDir = __DIR__ . '/uploads/';
$maxFileSize = 10 * 1024 * 1024; // 10MB

// Create uploads directory if it doesn't exist
if (!file_exists($uploadDir)) {
    if (!mkdir($uploadDir, 0777, true)) {
        error_log("Failed to create upload directory: $uploadDir");
        ob_clean();
        echo json_encode([
            'success' => false,
            'message' => 'Server configuration error: Could not create upload directory.'
        ]);
        exit;
    }
}

// Database Connection check
if ($conn->connect_error) {
    ob_clean();
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $conn->connect_error
    ]);
    exit;
}

function generateUniqueFilename($originalName, $permitId, $documentType) {
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $timestamp = time();
    $random = bin2hex(random_bytes(8));
    return "{$permitId}_{$documentType}_{$timestamp}_{$random}.{$extension}";
}

function saveUploadedFile($file, $permitId, $documentType, $uploadDir) {
    global $maxFileSize;

    if (!isset($file) || $file['error'] !== UPLOAD_ERR_OK) {
        return null;
    }

    $fileExt = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'];

    if (!in_array($fileExt, $allowedExtensions)) {
        error_log("Invalid file extension for $documentType: $fileExt");
        return null;
    }

    if ($file['size'] > $maxFileSize) {
        error_log("File too large for $documentType: " . $file['size']);
        return null;
    }

    if (!is_uploaded_file($file['tmp_name'])) {
        error_log("Potential file upload attack for $documentType");
        return null;
    }

    $fileName = generateUniqueFilename($file['name'], $permitId, $documentType);
    $filePath = $uploadDir . $fileName;

    if (!move_uploaded_file($file['tmp_name'], $filePath)) {
        error_log("Failed to move uploaded file for $documentType");
        return null;
    }

    return 'uploads/' . $fileName;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Method not allowed. Use POST.');
    }

    $postData = $_POST;

    error_log("=== LIQUOR PERMIT SUBMISSION START ===");
    error_log("POST keys received: " . implode(', ', array_keys($postData)));
    error_log("FILES keys received: " . implode(', ', array_keys($_FILES)));

    // Required fields validation
    $requiredFields = [
        'business_name', 'business_address', 'business_email', 'business_phone',
        'business_type', 'business_nature',
        'owner_first_name', 'owner_last_name', 'owner_address',
        'id_type', 'id_number', 'date_of_birth', 'citizenship'
    ];

    $missingFields = [];
    foreach ($requiredFields as $field) {
        if (empty($postData[$field])) {
            $missingFields[] = $field;
        }
    }

    if (!empty($missingFields)) {
        throw new Exception("Missing required fields: " . implode(', ', $missingFields));
    }

    // Validate business_phone: must be 11 digits starting with 09
    $business_phone = $postData['business_phone'] ?? '';
    if (!preg_match('/^09\d{9}$/', $business_phone)) {
        throw new Exception("Business phone must be 11 digits starting with 09.");
    }

    // Get user_id from POST data
    $user_id = isset($postData['user_id']) ? intval($postData['user_id']) : 0;

    // Build INSERT query
    $columns = [
        'applicant_id', 'application_type', 'existing_permit_number',
        'business_name', 'business_address', 'business_email', 'business_phone',
        'business_type', 'business_nature',
        'owner_first_name', 'owner_last_name', 'owner_middle_name', 'owner_address',
        'id_type', 'id_number', 'date_of_birth', 'citizenship',
        'barangay_clearance_id',
        'renewal_reason', 'amendment_type', 'amendment_details', 'amendment_reason',
        'applicant_signature', 'declaration_agreed',
        'date_submitted', 'time_submitted',
        'status', 'permit_type'
    ];

    $values = [
        $postData['applicant_id'] ?? ('LIQ' . date('Y') . str_pad(mt_rand(1, 999), 3, '0', STR_PAD_LEFT)),
        $postData['application_type'] ?? 'NEW',
        $postData['existing_permit_number'] ?? '',
        $postData['business_name'],
        $postData['business_address'],
        $postData['business_email'],
        $postData['business_phone'],
        $postData['business_type'] ?? '',
        $postData['business_nature'] ?? '',
        $postData['owner_first_name'],
        $postData['owner_last_name'],
        $postData['owner_middle_name'] ?? '',
        $postData['owner_address'],
        $postData['id_type'] ?? '',
        $postData['id_number'] ?? '',
        $postData['date_of_birth'],
        $postData['citizenship'] ?? 'FILIPINO',
        $postData['barangay_clearance_id'] ?? '',
        $postData['renewal_reason'] ?? '',
        $postData['amendment_type'] ?? '',
        $postData['amendment_details'] ?? '',
        $postData['amendment_reason'] ?? '',
        $postData['applicant_signature'] ?? '',
        isset($postData['declaration_agreed']) ? intval($postData['declaration_agreed']) : 0,
        $postData['date_submitted'] ?? date('Y-m-d'),
        $postData['time_submitted'] ?? date('H:i:s'),
        $postData['status'] ?? 'PENDING',
        $postData['permit_type'] ?? 'LIQUOR'
    ];

    $placeholders = implode(', ', array_fill(0, count($columns), '?'));
    $types = str_repeat('s', count($columns));
    // Fix declaration_agreed to int
    $types[23] = 'i';

    $sql = "INSERT INTO liquor_permit_applications (" .
           implode(', ', $columns) . ") VALUES (" .
           $placeholders . ")";

    error_log("SQL: " . $sql);

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }

    // Bind parameters
    $bindParams = [$types];
    foreach ($values as $key => $value) {
        $bindParams[] = &$values[$key];
    }

    if (!call_user_func_array([$stmt, 'bind_param'], $bindParams)) {
        throw new Exception("Bind parameters failed");
    }

    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }

    $permit_id = $conn->insert_id;
    error_log("Liquor permit inserted. Permit ID: $permit_id");

    // Process file uploads
    $uploadedDocuments = [];
    $fileFields = [
        'barangay_clearance_id_copy' => 'BARANGAY_CLEARANCE',
        'owner_valid_id' => 'OWNER_VALID_ID',
        'renewal_permit_copy' => 'RENEWAL_PERMIT',
        'previous_permit_copy' => 'PREVIOUS_PERMIT'
    ];

    foreach ($fileFields as $fileField => $documentType) {
        if (isset($_FILES[$fileField]) && $_FILES[$fileField]['error'] === UPLOAD_ERR_OK) {
            $relativePath = saveUploadedFile($_FILES[$fileField], $permit_id, $documentType, $uploadDir);
            if ($relativePath) {
                // Update the file path column in the permit record
                $updateSql = "UPDATE liquor_permit_applications SET $fileField = ? WHERE permit_id = ?";
                $updateStmt = $conn->prepare($updateSql);
                if ($updateStmt) {
                    $updateStmt->bind_param("si", $relativePath, $permit_id);
                    $updateStmt->execute();
                    $updateStmt->close();
                }
                $uploadedDocuments[] = $documentType;
                error_log("Uploaded $documentType for permit $permit_id");
            }
        }
    }

    $stmt->close();

    ob_clean();
    echo json_encode([
        'success' => true,
        'message' => 'Liquor permit application submitted successfully!',
        'permit_id' => $permit_id,
        'applicant_id' => $values[0],
        'status' => 'PENDING',
        'documents_uploaded' => $uploadedDocuments
    ]);

} catch (Exception $e) {
    ob_clean();
    error_log("LIQUOR PERMIT EXCEPTION: " . $e->getMessage());
    error_log("Exception trace: " . $e->getTraceAsString());

    $errorMessage = $e->getMessage();
    if (strpos($errorMessage, 'SQL:') !== false) {
        $errorMessage = "Database error occurred. Please try again.";
    }

    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $errorMessage
    ]);
}

$conn->close();
exit();
?>
