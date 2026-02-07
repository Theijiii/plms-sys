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

function saveDocumentFile($conn, $permitId, $fileField, $documentType, $uploadDir) {
    global $maxFileSize;
    
    if (!isset($_FILES[$fileField]) || $_FILES[$fileField]['error'] !== UPLOAD_ERR_OK) {
        error_log("No file uploaded or upload error for $fileField");
        return false;
    }
    
    $file = $_FILES[$fileField];
    
    // Debug log
    error_log("Processing $documentType:");
    error_log("  - Original name: " . $file['name']);
    error_log("  - Browser MIME type: " . $file['type']);
    error_log("  - Size: " . $file['size']);
    
    // Get file extension
    $fileExt = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    error_log("  - Extension: $fileExt");
    
    // Allowed extensions
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'];
    $allowedMimeTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/jpg',
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    // Check file extension
    if (!in_array($fileExt, $allowedExtensions)) {
        $errorMsg = "Invalid file extension for $documentType. Allowed: " . implode(', ', $allowedExtensions);
        error_log("  - ERROR: $errorMsg");
        return false;
    }
    
    // Check MIME type using finfo
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $actualMimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    error_log("  - Actual MIME type: $actualMimeType");
    
    // Limit MIME type length to 100 characters
    $fileType = substr($actualMimeType, 0, 100);
    
    if (!in_array($actualMimeType, $allowedMimeTypes)) {
        $errorMsg = "Invalid file type for $documentType. Got: $actualMimeType";
        error_log("  - WARNING: $errorMsg");
        // For now, allow but log warning
    }
    
    // Validate file size
    if ($file['size'] > $maxFileSize) {
        $errorMsg = "File $documentType is too large. Maximum size: 10MB";
        error_log("  - ERROR: $errorMsg");
        return false;
    }
    
    // Validate file is actually uploaded
    if (!is_uploaded_file($file['tmp_name'])) {
        $errorMsg = "Potential file upload attack for $documentType";
        error_log("  - ERROR: $errorMsg");
        return false;
    }
    
    // Generate unique filename
    $fileName = generateUniqueFilename($file['name'], $permitId, $documentType);
    $filePath = $uploadDir . $fileName;
    
    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $filePath)) {
        error_log("Failed to move uploaded file: $fileField to $filePath");
        if (!is_writable($uploadDir)) {
            error_log("Upload directory is not writable: $uploadDir");
        }
        return false;
    }
    
    error_log("  - Saved to: $filePath");
    
    // Prepare document data for insertion
    $docName = substr($file['name'], 0, 255); // Limit to 255 chars for document_name
    $docType = $documentType;
    $relativePath = 'uploads/' . $fileName;
    $fileSize = $file['size'];
    
    // Insert into application_documents table
    $docSql = "INSERT INTO application_documents 
               (permit_id, document_type, document_name, file_path, file_type, file_size) 
               VALUES (?, ?, ?, ?, ?, ?)";
    
    $docStmt = $conn->prepare($docSql);
    if (!$docStmt) {
        error_log("Failed to prepare document statement: " . $conn->error);
        return false;
    }
    
    $docStmt->bind_param("issssi", $permitId, $docType, $docName, $relativePath, $fileType, $fileSize);
    
    if (!$docStmt->execute()) {
        error_log("Failed to insert document record: " . $docStmt->error);
        $docStmt->close();
        return false;
    }
    
    $docId = $conn->insert_id;
    error_log("  - Document saved to DB with ID: $docId");
    
    $docStmt->close();
    return true;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Method not allowed. Use POST.');
    }
    
    // Get POST data
    $postData = $_POST;
    
    // Debug log
    error_log("=== BUSINESS PERMIT SUBMISSION START ===");
    error_log("POST keys received: " . implode(', ', array_keys($postData)));
    error_log("FILES keys received: " . implode(', ', array_keys($_FILES)));
    
    // Generate applicant ID
    $applicant_id = 'BUS' . date('Y') . str_pad(mt_rand(1, 999), 3, '0', STR_PAD_LEFT);
    $application_date = date('Y-m-d');
    $status = 'PENDING';
    
    // Map form fields to database columns
    $fieldMap = [
        // Personal Information
        'last_name' => ['db' => 'owner_last_name', 'type' => 's'],
        'first_name' => ['db' => 'owner_first_name', 'type' => 's'],
        'middle_name' => ['db' => 'owner_middle_name', 'type' => 's'],
        'owner_type' => ['db' => 'owner_type', 'type' => 's'],
        'citizenship' => ['db' => 'citizenship', 'type' => 's'],
        'corp_filipino_percent' => ['db' => 'corp_filipino_percent', 'type' => 'd'],
        'corp_foreign_percent' => ['db' => 'corp_foreign_percent', 'type' => 'd'],
        'date_of_birth' => ['db' => 'date_of_birth', 'type' => 's'],
        'contact_number' => ['db' => 'contact_number', 'type' => 's'],
        'email_address' => ['db' => 'email_address', 'type' => 's'],
        'home_address' => ['db' => 'home_address', 'type' => 's'],
        'valid_id_type' => ['db' => 'valid_id_type', 'type' => 's'],
        'valid_id_number' => ['db' => 'valid_id_number', 'type' => 's'],
        
        // Business Information
        'business_name' => ['db' => 'business_name', 'type' => 's'],
        'trade_name' => ['db' => 'trade_name', 'type' => 's'],
        'business_nature' => ['db' => 'business_nature', 'type' => 's'],
        'building_type' => ['db' => 'building_type', 'type' => 's'],
        'capital_investment' => ['db' => 'capital_investment', 'type' => 'd'],
        
        // Business Address
        'house_bldg_no' => ['db' => 'house_bldg_no', 'type' => 's'],
        'building_name' => ['db' => 'building_name', 'type' => 's'],
        'block_no' => ['db' => 'block_no', 'type' => 's'],
        'lot_no' => ['db' => 'lot_no', 'type' => 's'],
        'street' => ['db' => 'street', 'type' => 's'],
        'subdivision' => ['db' => 'subdivision', 'type' => 's'],
        'province' => ['db' => 'province', 'type' => 's'],
        'city_municipality' => ['db' => 'city_municipality', 'type' => 's'],
        'barangay' => ['db' => 'barangay', 'type' => 's'],
        'zip_code' => ['db' => 'zip_code', 'type' => 's'],
        'district' => ['db' => 'district', 'type' => 's'],
        
        // Operations
        'zoning_permit_id' => ['db' => 'zoning_permit_id', 'type' => 's'],
        'sanitation_permit_id' => ['db' => 'sanitation_permit_id', 'type' => 's'],
        'business_area' => ['db' => 'business_area', 'type' => 'd'],
        'total_floor_area' => ['db' => 'total_floor_area', 'type' => 'd'],
        'operation_time_from' => ['db' => 'operation_time_from', 'type' => 's'],
        'operation_time_to' => ['db' => 'operation_time_to', 'type' => 's'],
        'operation_type' => ['db' => 'operation_type', 'type' => 's'],
        'total_employees' => ['db' => 'total_employees', 'type' => 'i'],
        'male_employees' => ['db' => 'male_employees', 'type' => 'i'],
        'female_employees' => ['db' => 'female_employees', 'type' => 'i'],
        'employees_in_qc' => ['db' => 'employees_in_qc', 'type' => 'i'],
        'delivery_van_truck' => ['db' => 'delivery_van_truck', 'type' => 'i'],
        'delivery_motorcycle' => ['db' => 'delivery_motorcycle', 'type' => 'i'],
        'barangay_clearance_id' => ['db' => 'barangay_clearance_id', 'type' => 's'],
        
        // Declaration
        'owner_type_declaration' => ['db' => 'owner_type_declaration', 'type' => 's'],
        'owner_representative_name' => ['db' => 'owner_representative_name', 'type' => 's'],
        'date_submitted' => ['db' => 'date_submitted', 'type' => 's'],
        
        // Boolean flags for document attachments
        'has_barangay_clearance' => ['db' => 'has_barangay_clearance', 'type' => 'i'],
        'has_bir_certificate' => ['db' => 'has_bir_certificate', 'type' => 'i'],
        'has_lease_or_title' => ['db' => 'has_lease_or_title', 'type' => 'i'],
        'has_fsic' => ['db' => 'has_fsic', 'type' => 'i'],
        'has_owner_valid_id' => ['db' => 'has_owner_valid_id', 'type' => 'i'],
        'has_id_picture' => ['db' => 'has_id_picture', 'type' => 'i'],
        'has_official_receipt' => ['db' => 'has_official_receipt', 'type' => 'i'],
        'has_owner_scanned_id' => ['db' => 'has_owner_scanned_id', 'type' => 'i'],
        'has_dti_registration' => ['db' => 'has_dti_registration', 'type' => 'i'],
        'has_sec_registration' => ['db' => 'has_sec_registration', 'type' => 'i'],
        'has_representative_scanned_id' => ['db' => 'has_representative_scanned_id', 'type' => 'i'],
    ];
    
    // Required fields validation
    $requiredFields = [
        'first_name', 'last_name', 'owner_type', 'citizenship',
        'date_of_birth', 'contact_number', 'email_address', 'home_address',
        'valid_id_type', 'valid_id_number', 'business_name', 'business_nature',
        'building_type', 'capital_investment', 'house_bldg_no', 'street',
        'barangay', 'zoning_permit_id', 'business_area',
        'total_floor_area', 'operation_time_from', 'operation_time_to',
        'operation_type', 'total_employees', 'owner_representative_name',
        'date_submitted'
    ];
    
    $missingFields = [];
    foreach ($requiredFields as $field) {
        if (empty($postData[$field])) {
            $missingFields[] = $field;
        }
    }
    
    // Check sanitation_permit_id ONLY for health-related businesses
    $healthBusinesses = [
        'Health / Clinic / Pharmacy',
        'Restaurant / Eatery / Food Service',
        'Catering Services',
        'Bakery / Pastry / Cake Shop',
        'Water Refilling Station'
    ];
    $business_nature = $postData['business_nature'] ?? '';
    if (in_array($business_nature, $healthBusinesses) && empty($postData['sanitation_permit_id'])) {
        $missingFields[] = 'sanitation_permit_id (required for health-related businesses)';
    }
    
    // Check representative_scanned_id ONLY if representative is selected
    // owner_scanned_id is deprecated and no longer used
    if (isset($postData['owner_type_declaration']) && $postData['owner_type_declaration'] === 'Representative') {
        if (!isset($_FILES['representative_scanned_id']) || $_FILES['representative_scanned_id']['error'] !== UPLOAD_ERR_OK) {
            $missingFields[] = 'representative_scanned_id';
        }
    }
    
    if (!empty($missingFields)) {
        throw new Exception("Missing required fields: " . implode(', ', $missingFields));
    }
    
    // Build the SQL dynamically
    $columns = ['applicant_id', 'application_date', 'permit_type', 'status'];
    $placeholders = ['?', '?', '?', '?'];
    $values = [$applicant_id, $application_date, ($postData['permit_type'] ?? 'NEW'), $status];
    $types = 'ssss';
    
    // Add fields that exist in POST data
    foreach ($fieldMap as $formField => $config) {
        if (isset($postData[$formField]) && $postData[$formField] !== '') {
            $columns[] = $config['db'];
            $placeholders[] = '?';
            $values[] = $postData[$formField];
            $types .= $config['type'];
        }
    }
    
    // Add default values for required database fields
    $defaultValues = [
        'gross_sale' => '0.00',
        'official_receipt_no' => 'N/A'
    ];
    
    foreach ($defaultValues as $field => $value) {
        $columns[] = $field;
        $placeholders[] = '?';
        $values[] = $value;
        $types .= 's';
    }
    
    // Add barangay_clearance_status
    $barangayClearanceStatus = !empty($postData['barangay_clearance_id']) ? 'ID_PROVIDED' : 'PENDING';
    $columns[] = 'barangay_clearance_status';
    $placeholders[] = '?';
    $values[] = $barangayClearanceStatus;
    $types .= 's';
    
    // Debug: Log what we're inserting
    error_log("Columns to insert (" . count($columns) . "): " . implode(', ', $columns));
    error_log("Values count: " . count($values));
    error_log("Type string length: " . strlen($types));
    error_log("Values: " . print_r($values, true));
    
    // Build SQL
    $sql = "INSERT INTO business_permit_applications (" . 
           implode(', ', $columns) . ") VALUES (" . 
           implode(', ', $placeholders) . ")";
    
    error_log("SQL Query: " . $sql);
    
    // Prepare statement
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error . " | SQL: " . $sql);
    }
    
    // === FIXED BINDING SECTION ===
    // Bind parameters safely with proper references
    if (!empty($values)) {
        // Build array with type string first, then references to all values
        $bindParams = [$types];
        foreach ($values as $key => $value) {
            $bindParams[] = &$values[$key];
        }
        
        // Use call_user_func_array to call bind_param with references
        if (!call_user_func_array([$stmt, 'bind_param'], $bindParams)) {
            throw new Exception("Bind parameters failed");
        }
    }
    
    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }
    
    $permit_id = $conn->insert_id;
    
    error_log("Application inserted successfully. Permit ID: $permit_id");
    
    // Map file fields to document types
    $fileDocumentMap = [
        'bir_certificate' => 'BIR_CERTIFICATE',
        'lease_or_title' => 'LEASE_TITLE',
        'fsic' => 'FSIC',
        'owner_valid_id' => 'OWNER_VALID_ID',
        'id_picture' => 'ID_PICTURE',
        'official_receipt_file' => 'OFFICIAL_RECEIPT',
        'dti_registration' => 'DTI_REGISTRATION',
        'sec_registration' => 'SEC_REGISTRATION',
        'owner_scanned_id' => 'OWNER_SCANNED_ID',
        'representative_scanned_id' => 'REPRESENTATIVE_SCANNED_ID'
    ];
    
    // Process file uploads and save to documents table
    $uploadedDocuments = [];
    foreach ($fileDocumentMap as $fileField => $documentType) {
        if (isset($_FILES[$fileField]) && $_FILES[$fileField]['error'] === UPLOAD_ERR_OK) {
            if (saveDocumentFile($conn, $permit_id, $fileField, $documentType, $uploadDir)) {
                $uploadedDocuments[] = $documentType;
                error_log("Successfully uploaded and saved document: $documentType");
            }
        }
    }
    
    // Handle barangay clearance separately if needed
    if (isset($_FILES['barangay_clearance']) && $_FILES['barangay_clearance']['error'] === UPLOAD_ERR_OK) {
        if (saveDocumentFile($conn, $permit_id, 'barangay_clearance', 'BARANGAY_CLEARANCE', $uploadDir)) {
            $uploadedDocuments[] = 'BARANGAY_CLEARANCE';
        }
    }
    
    $stmt->close();
    
    // application_overview is a VIEW on business_permit_applications,
    // so no separate INSERT is needed — the view auto-reflects the data.
    
    ob_clean();
    echo json_encode([
        'success' => true,
        'message' => 'Business permit application submitted successfully!',
        'permit_id' => $permit_id,
        'applicant_id' => $applicant_id,
        'status' => $status,
        'documents_uploaded' => $uploadedDocuments,
        'debug' => [
            'columns_inserted' => count($columns),
            'values_inserted' => count($values),
            'documents_count' => count($uploadedDocuments)
        ]
    ]);
    
} catch (Exception $e) {
    ob_clean();
    error_log("EXCEPTION: " . $e->getMessage());
    error_log("Exception trace: " . $e->getTraceAsString());
    
    // Clean error response
    $errorMessage = $e->getMessage();
    // Don't expose full SQL in production
    if (strpos($errorMessage, 'SQL:') !== false) {
        $errorMessage = "Database error occurred. Please try again.";
    }
    
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $errorMessage
        // Remove trace from production
        // 'trace' => $e->getTraceAsString()
    ]);
}

$conn->close();
exit();
?>