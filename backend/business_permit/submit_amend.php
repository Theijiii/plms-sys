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


if ($conn->connect_error) {
    die(json_encode(['success' => false, 'message' => 'Database connection failed: ' . $conn->connect_error]));
}

$conn->set_charset("utf8mb4");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // ====== 1. SETUP UPLOAD DIRECTORY ======
    // Use YOUR CORRECT PATH
    $uploadDir = '/uploads/amendment_documents/';
    
    // Convert to absolute path for reliability
    $absoluteUploadDir = realpath(dirname(__FILE__) . '/' . $uploadDir);
    if (!$absoluteUploadDir) {
        // If realpath fails, create the path manually
        $absoluteUploadDir = dirname(__FILE__) . '/' . $uploadDir;
    }
    
    // Ensure it ends with slash
    $uploadDir = rtrim($uploadDir, '/') . '/';
    $absoluteUploadDir = rtrim($absoluteUploadDir, '/') . '/';
    
    error_log("Upload directory (relative): " . $uploadDir);
    error_log("Upload directory (absolute): " . $absoluteUploadDir);
    
    // Create directory if it doesn't exist
    if (!file_exists($absoluteUploadDir)) {
        error_log("Creating directory: " . $absoluteUploadDir);
        if (!mkdir($absoluteUploadDir, 0777, true)) {
            echo json_encode([
                'success' => false, 
                'message' => 'Failed to create upload directory: ' . $absoluteUploadDir
            ]);
            exit;
        }
    }
    
    // Check if directory is writable
    if (!is_writable($absoluteUploadDir)) {
        error_log("Directory is not writable: " . $absoluteUploadDir);
        if (!chmod($absoluteUploadDir, 0755)) {
            echo json_encode([
                'success' => false, 
                'message' => 'Upload directory is not writable',
                'debug' => ['upload_dir' => $absoluteUploadDir]
            ]);
            exit;
        }
    }
    
    // ====== 2. PROCESS REQUEST DATA ======
    $postData = file_get_contents('php://input');
    error_log("Raw POST data: " . $postData);
    error_log("POST array: " . print_r($_POST, true));
    error_log("FILES array: " . print_r($_FILES, true));
    
    // Check if we're receiving multipart/form-data
    if (empty($_POST) && !empty($postData)) {
        parse_str($postData, $parsedData);
        $_POST = array_merge($_POST, $parsedData);
    }

    // Get amendment_type
    $amendmentType = $_POST['amendment_type'] ?? '';
    error_log("Amendment type received: '" . $amendmentType . "'");
    
    // Validate required fields
    if (empty($amendmentType)) {
        echo json_encode([
            'success' => false, 
            'message' => 'Amendment type is required.'
        ]);
        exit;
    }

    // ====== 3. GENERATE APPLICANT ID ======
    // Format: BSAMD + YEAR + RANDOM 5 digits
    function generateApplicantId() {
        $prefix = "BSAMD";
        $year = date('Y');
        $random = str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);
        return $prefix . $year . $random;
    }
    
    $applicantId = generateApplicantId();
    error_log("Generated Applicant ID: " . $applicantId);

    // ====== 4. PREPARE AMENDMENT DATA ======
    $amendmentData = [
        'business_permit_id' => $_POST['business_permit_id'] ?? '',
        'applicant_id' => $applicantId, // Use generated ID
        'application_date' => date('Y-m-d'),
        'amendment_type' => $amendmentType,
        'business_name' => $_POST['business_name'] ?? '',
        'new_business_name' => $_POST['new_business_name'] ?? null,
        'business_type' => $_POST['business_type'] ?? '',
        'new_business_line' => $_POST['new_business_line'] ?? null,
        'new_address' => $_POST['new_address'] ?? null,
        'new_owner_name' => $_POST['new_owner_name'] ?? null,
        'contact_person' => $_POST['contact_person'] ?? '',
        'contact_number' => $_POST['contact_number'] ?? '',
        'email' => $_POST['email'] ?? null,
        'amendment_reason' => $_POST['amendment_reason'] ?? '',
        'effective_date' => $_POST['effective_date'] ?? '',
        'applicant_signature' => $_POST['applicant_signature'] ?? null,
        'declaration_agreed' => isset($_POST['declaration_agreed']) ? 1 : 0,
        'date_submitted' => $_POST['date_submitted'] ?? date('Y-m-d'),
        'date_submitted_time' => $_POST['date_submitted_time'] ?? date('H:i:s'),
        'status' => 'pending'
    ];

    // ====== 5. SAVE TO DATABASE ======
    $columns = implode(', ', array_keys($amendmentData));
    $placeholders = implode(', ', array_fill(0, count($amendmentData), '?'));
    $sql = "INSERT INTO business_amendment_applications ($columns) VALUES ($placeholders)";
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
        exit;
    }
    
    $types = str_repeat('s', count($amendmentData));
    $stmt->bind_param($types, ...array_values($amendmentData));
    
    if ($stmt->execute()) {
        $amendmentId = $stmt->insert_id;
        error_log("Insert successful. Amendment ID: " . $amendmentId . ", Applicant ID: " . $applicantId);
        
        // ====== 6. HANDLE FILE UPLOADS ======
        $fileTypes = [
            'previous_permit_file' => 'Previous Mayor\'s Permit',
            'tax_receipt_file' => 'Business Tax Receipt',
            'owner_id_file' => 'Owner Valid ID'
        ];
        
        // Add type-specific files
        $typeSpecificFiles = [];
        if ($amendmentType === 'CHANGE_BUSINESS_NAME') {
            $typeSpecificFiles = [
                'business_registration_file' => 'Updated Business Registration',
                'board_resolution_file' => 'Board Resolution',
                'registration_update_file' => 'DTI/SEC/CDA Registration'
            ];
        } elseif ($amendmentType === 'CHANGE_BUSINESS_LINE') {
            $typeSpecificFiles = [
                'business_line_registration_file' => 'Updated SEC/DTI/CDA Registration',
                'business_activity_file' => 'Business Activity Documentation'
            ];
        } elseif ($amendmentType === 'CHANGE_BUSINESS_LOCATION') {
            $typeSpecificFiles = [
                'address_proof_file' => 'Address Proof',
                'locational_clearance_file' => 'Locational Clearance',
                'address_verification_file' => 'Address Verification'
            ];
        } elseif ($amendmentType === 'CHANGE_OWNER') {
            $typeSpecificFiles = [
                'ownership_registration_file' => 'Ownership Registration',
                'ownership_support_file' => 'Ownership Support Documents'
            ];
        }
        
        $allFiles = array_merge($fileTypes, $typeSpecificFiles);
        $uploadedFiles = [];
        $filesSavedCount = 0;
        
        foreach ($allFiles as $fieldName => $docType) {
            if (isset($_FILES[$fieldName]) && $_FILES[$fieldName]['error'] === UPLOAD_ERR_OK) {
                $file = $_FILES[$fieldName];
                
                // Generate filename with applicant ID
                $originalName = basename($file['name']);
                $fileExtension = pathinfo($originalName, PATHINFO_EXTENSION);
                $baseName = pathinfo($originalName, PATHINFO_FILENAME);
                $safeBaseName = preg_replace('/[^a-zA-Z0-9._-]/', '_', $baseName);
                $fileName = $applicantId . '_' . $fieldName . '_' . time() . '_' . $safeBaseName . '.' . $fileExtension;
                $filePath = $absoluteUploadDir . $fileName;
                
                error_log("Uploading file: " . $fieldName . " to " . $filePath);
                
                if (move_uploaded_file($file['tmp_name'], $filePath)) {
                    // Verify file was saved
                    if (file_exists($filePath)) {
                        $fileSize = filesize($filePath);
                        
                        // Save relative path to database
                        $relativeFilePath = $uploadDir . $fileName;
                        
                        // Save to database
                        $docStmt = $conn->prepare("
                            INSERT INTO application_documents 
                            (permit_id, document_type, document_name, file_path, file_type, file_size, upload_date) 
                            VALUES (?, ?, ?, ?, ?, ?, NOW())
                        ");
                        
                        if ($docStmt) {
                            $docStmt->bind_param(
                                'issssi',
                                $amendmentId,
                                $docType,
                                $originalName,
                                $relativeFilePath, // Store relative path
                                $file['type'],
                                $fileSize
                            );
                            
                            if ($docStmt->execute()) {
                                $uploadedFiles[] = [
                                    'field' => $fieldName,
                                    'original_name' => $originalName,
                                    'saved_name' => $fileName,
                                    'size' => $fileSize,
                                    'relative_path' => $relativeFilePath
                                ];
                                $filesSavedCount++;
                                error_log("✓ File saved: " . $fileName . " (" . $fileSize . " bytes)");
                            }
                            $docStmt->close();
                        }
                    }
                } else {
                    error_log("Failed to move uploaded file: " . $file['tmp_name']);
                }
            }
        }
        
        // ====== 7. VERIFY FILES WERE SAVED ======
        error_log("Checking files in upload directory: " . $absoluteUploadDir);
        $savedFilesList = [];
        if ($handle = opendir($absoluteUploadDir)) {
            while (false !== ($entry = readdir($handle))) {
                if ($entry != "." && $entry != "..") {
                    $savedFilesList[] = $entry;
                }
            }
            closedir($handle);
        }
        
        // ====== 8. SEND RESPONSE ======
        echo json_encode([
            'success' => true,
            'message' => 'Amendment application submitted successfully!',
            'amendment_id' => $amendmentId,
            'applicant_id' => $applicantId,
            'files_saved' => $filesSavedCount,
            'uploaded_files' => $uploadedFiles,
            'upload_directory' => $absoluteUploadDir,
            'files_in_directory' => $savedFilesList,
            'debug_info' => [
                'upload_dir_exists' => file_exists($absoluteUploadDir) ? 'Yes' : 'No',
                'upload_dir_writable' => is_writable($absoluteUploadDir) ? 'Yes' : 'No',
                'total_files_in_dir' => count($savedFilesList)
            ]
        ]);
        
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to save amendment application: ' . $stmt->error
        ]);
    }
    
    $stmt->close();
} else {
    // FIXED LINE 279: Added missing => 
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}

$conn->close();
?>