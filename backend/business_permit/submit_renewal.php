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


$response = [
    'success' => false,
    'message' => '',
    'permit_id' => 0,
    'applicant_id' => '',
    'record_id' => 0
];

try {
    // Check action type
    $action = isset($_POST['action']) ? trim($_POST['action']) : '';
    if ($action !== 'submit_business_renewal') {
        throw new Exception('Invalid action. Expected: submit_business_renewal, got: ' . $action);
    }
    
    // Debug: Log all POST data
    error_log("POST data received: " . print_r($_POST, true));
    error_log("FILES data received: " . print_r($_FILES, true));
    
    // Create database connection
    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }
    $conn->set_charset("utf8mb4");
    
    // Start transaction
    $conn->begin_transaction();
    
    // Get owner information for applicant ID generation
    $owner_first_name = isset($_POST['owner_first_name']) ? $conn->real_escape_string(trim($_POST['owner_first_name'])) : '';
    $owner_last_name = isset($_POST['owner_last_name']) ? $conn->real_escape_string(trim($_POST['owner_last_name'])) : '';
    
    if (empty($owner_first_name) || empty($owner_last_name)) {
        throw new Exception('Owner first name and last name are required.');
    }
    
    // ==================== APPLICANT ID GENERATION ====================
    function generateApplicantID($conn, $first_name, $last_name) {
        // Generate unique applicant ID: APP-YYMMDD-LASTNAMEINITIALS-RANDOM
        $date_part = date('ymd');
        
        // Get initials from last name (first 3 characters)
        $lastname_clean = preg_replace('/[^A-Za-z]/', '', $last_name);
        $lastname_initials = substr(strtoupper($lastname_clean), 0, 3);
        if (strlen($lastname_initials) < 3) {
            $lastname_initials = str_pad($lastname_initials, 3, 'X', STR_PAD_RIGHT);
        }
        
        // Get first initial
        $first_initial = substr(strtoupper(preg_replace('/[^A-Za-z]/', '', $first_name)), 0, 1);
        if (empty($first_initial)) {
            $first_initial = 'X';
        }
        
        $initials = $lastname_initials . $first_initial;
        
        // Generate random part
        $random_part = strtoupper(substr(uniqid(), -4));
        
        $applicant_id = "APP-{$date_part}-{$initials}-{$random_part}";
        
        return $applicant_id;
    }
    
    // Generate applicant ID
    $applicant_id = generateApplicantID($conn, $owner_first_name, $owner_last_name);
    error_log("Generated applicant ID: " . $applicant_id);
    
    // ==================== PERMIT ID GENERATION ====================
    function generatePermitID($conn) {
        // Generate format: RBUS-YEAR-XXXXXX
        $year = date('Y'); // Get current year (e.g., 2024)
        
        // Generate 6-digit random number
        $random_number = str_pad(mt_rand(1, 999999), 6, '0', STR_PAD_LEFT);
        
        $permit_id = "RBUS-{$year}-{$random_number}";
        
        // Check if this permit_id already exists in the database
        $check_sql = "SELECT COUNT(*) as count FROM business_permit_applications WHERE permit_id = ?";
        $check_stmt = $conn->prepare($check_sql);
        if ($check_stmt) {
            $check_stmt->bind_param('s', $permit_id);
            $check_stmt->execute();
            $check_result = $check_stmt->get_result();
            $check_row = $check_result->fetch_assoc();
            $check_stmt->close();
            
            // If exists, generate a new one
            if ($check_row['count'] > 0) {
                // Generate new random number
                $random_number = str_pad(mt_rand(1, 999999), 6, '0', STR_PAD_LEFT);
                $permit_id = "RBUS-{$year}-{$random_number}";
            }
        }
        
        return $permit_id;
    }
    
    // Generate permit ID (custom ID, not auto-increment)
    $custom_permit_id = generatePermitID($conn);
    error_log("Generated permit ID: " . $custom_permit_id);
    
    // Validate required fields
    $required_fields = [
        'business_name', 'owner_last_name', 'owner_first_name',
        'contact_number', 'email_address', 'home_address',
        'house_bldg_no', 'street', 'barangay',
        'official_receipt_no'
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
    
    // Prepare data with proper sanitization
    $application_date = date('Y-m-d');
    $permit_type = 'Renewal';
    $status = 'PENDING';
    $date_submitted = isset($_POST['date_submitted']) ? $conn->real_escape_string(trim($_POST['date_submitted'])) : date('Y-m-d');
    
    // Owner information
    $owner_last_name = $conn->real_escape_string(trim($_POST['owner_last_name']));
    $owner_first_name = $conn->real_escape_string(trim($_POST['owner_first_name']));
    $owner_middle_name = isset($_POST['owner_middle_name']) ? $conn->real_escape_string(trim($_POST['owner_middle_name'])) : '';
    $owner_type = isset($_POST['owner_type']) ? $conn->real_escape_string(trim($_POST['owner_type'])) : 'Individual';
    $citizenship = isset($_POST['citizenship']) ? $conn->real_escape_string(trim($_POST['citizenship'])) : 'Filipino';
    $contact_number = $conn->real_escape_string(trim($_POST['contact_number']));
    $email_address = $conn->real_escape_string(trim($_POST['email_address']));
    $home_address = $conn->real_escape_string(trim($_POST['home_address']));
    $valid_id_type = isset($_POST['valid_id_type']) ? $conn->real_escape_string(trim($_POST['valid_id_type'])) : 'Passport';
    $valid_id_number = isset($_POST['valid_id_number']) ? $conn->real_escape_string(trim($_POST['valid_id_number'])) : '';
    
    // Business information
    $business_name = $conn->real_escape_string(trim($_POST['business_name']));
    $trade_name = isset($_POST['trade_name']) ? $conn->real_escape_string(trim($_POST['trade_name'])) : '';
    $business_nature = isset($_POST['business_nature']) ? $conn->real_escape_string(trim($_POST['business_nature'])) : '';
    $building_type = isset($_POST['building_type']) ? $conn->real_escape_string(trim($_POST['building_type'])) : 'Commercial';
    
    // Financial information
    $gross_sale = isset($_POST['gross_sale']) ? $conn->real_escape_string(trim($_POST['gross_sale'])) : '0';
    $capital_investment = isset($_POST['capital_investment']) ? floatval($_POST['capital_investment']) : 0.00;
    
    // Business address
    $house_bldg_no = $conn->real_escape_string(trim($_POST['house_bldg_no']));
    $street = $conn->real_escape_string(trim($_POST['street']));
    $barangay = $conn->real_escape_string(trim($_POST['barangay']));
    $city_municipality = isset($_POST['city_municipality']) ? $conn->real_escape_string(trim($_POST['city_municipality'])) : 'Caloocan City';
    $province = isset($_POST['province']) ? $conn->real_escape_string(trim($_POST['province'])) : 'Metro Manila';
    $zip_code = isset($_POST['zip_code']) ? $conn->real_escape_string(trim($_POST['zip_code'])) : '';
    $business_area = isset($_POST['business_area']) ? floatval($_POST['business_area']) : 0.00;
    $total_floor_area = isset($_POST['total_floor_area']) ? floatval($_POST['total_floor_area']) : 0.00;
    
    // Employee information
    $total_employees = isset($_POST['total_employees']) ? intval($_POST['total_employees']) : 0;
    $male_employees = isset($_POST['male_employees']) ? intval($_POST['male_employees']) : 0;
    $female_employees = isset($_POST['female_employees']) ? intval($_POST['female_employees']) : 0;
    
    // Document references
    $barangay_clearance_id = isset($_POST['barangay_clearance_id']) ? $conn->real_escape_string(trim($_POST['barangay_clearance_id'])) : '';
    $official_receipt_no = $conn->real_escape_string(trim($_POST['official_receipt_no']));
    
    // Document flags with defaults
    $has_barangay_clearance = isset($_POST['has_barangay_clearance']) && $_POST['has_barangay_clearance'] == '1' ? 1 : 0;
    $has_owner_valid_id = isset($_POST['has_owner_valid_id']) && $_POST['has_owner_valid_id'] == '1' ? 1 : 0;
    $has_official_receipt = isset($_POST['has_official_receipt']) && $_POST['has_official_receipt'] == '1' ? 1 : 0;
    $has_fsic = isset($_POST['has_fsic']) && $_POST['has_fsic'] == '1' ? 1 : 0;
    
    // Owner type declaration
    $owner_type_declaration = isset($_POST['owner_type_declaration']) ? $conn->real_escape_string(trim($_POST['owner_type_declaration'])) : 'Business Owner';
    
    // Insert into business_permit_applications table - NOTE: using custom permit_id
    $sql = "INSERT INTO business_permit_applications (
        permit_id, applicant_id, application_date, permit_type, status,
        submission_date, last_updated, 
        owner_last_name, owner_first_name, owner_middle_name, owner_type, 
        citizenship, contact_number, email_address, home_address,
        valid_id_type, valid_id_number,
        business_name, trade_name, business_nature, building_type,
        capital_investment, gross_sale,
        house_bldg_no, street, barangay, city_municipality, province, zip_code,
        business_area, total_floor_area,
        total_employees, male_employees, female_employees,
        barangay_clearance_id, official_receipt_no,
        date_submitted, has_barangay_clearance, has_owner_valid_id,
        has_official_receipt, has_fsic, owner_type_declaration
    ) VALUES (
        ?, ?, ?, ?, ?,
        NOW(), NOW(),
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?, ?, ?
    )";
    
    error_log("SQL: " . $sql);
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception('Database prepare failed: ' . $conn->error);
    }
    
    // Bind parameters - ADDED permit_id as first parameter
    $stmt->bind_param(
        'ssssssssssssssssssssdsssssssddiiisssiiii',
        $custom_permit_id,  // Custom generated permit ID
        $applicant_id,
        $application_date,
        $permit_type,
        $status,
        $owner_last_name,
        $owner_first_name,
        $owner_middle_name,
        $owner_type,
        $citizenship,
        $contact_number,
        $email_address,
        $home_address,
        $valid_id_type,
        $valid_id_number,
        $business_name,
        $trade_name,
        $business_nature,
        $building_type,
        $capital_investment,
        $gross_sale,
        $house_bldg_no,
        $street,
        $barangay,
        $city_municipality,
        $province,
        $zip_code,
        $business_area,
        $total_floor_area,
        $total_employees,
        $male_employees,
        $female_employees,
        $barangay_clearance_id,
        $official_receipt_no,
        $date_submitted,
        $has_barangay_clearance,
        $has_owner_valid_id,
        $has_official_receipt,
        $has_fsic,
        $owner_type_declaration
    );
    
    if (!$stmt->execute()) {
        throw new Exception('Database execute failed: ' . $stmt->error);
    }
    
    // Get the auto-generated ID (record_id)
    $new_record_id = $stmt->insert_id;
    $stmt->close();
    
    error_log("New permit created with ID: " . $custom_permit_id . " (Record ID: " . $new_record_id . ")");
    
    // Handle file uploads
    if (!empty($_FILES)) {
        $upload_dir = __DIR__ . '/../uploads/renewals/';
        
        // Create directory if needed
        if (!file_exists($upload_dir)) {
            if (!mkdir($upload_dir, 0777, true)) {
                error_log('Failed to create upload directory: ' . $upload_dir);
            }
        }
        
        // Define file fields mapping
        $file_fields = [
            'barangay_clearance_file' => 'Barangay Clearance',
            'owner_valid_id_file' => 'Owner Valid ID',
            'official_receipt_file' => 'Official Receipt',
            'business_tax_receipt' => 'Business Tax Receipt',
            'fire_safety_certificate' => 'Fire Safety Certificate',
            'sanitation_permit' => 'Sanitation Permit'
        ];
        
        foreach ($file_fields as $fieldName => $document_type) {
            if (isset($_FILES[$fieldName]) && $_FILES[$fieldName]['error'] === UPLOAD_ERR_OK) {
                $fileData = $_FILES[$fieldName];
                error_log("Processing file: " . $fieldName . " - " . $fileData['name']);
                
                $original_name = basename($fileData['name']);
                $file_ext = strtolower(pathinfo($original_name, PATHINFO_EXTENSION));
                
                // Validate file type
                $allowed_types = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
                if (!in_array($file_ext, $allowed_types)) {
                    error_log("Invalid file type: " . $file_ext);
                    continue;
                }
                
                if ($fileData['size'] > 10 * 1024 * 1024) {
                    error_log("File too large: " . $fileData['size']);
                    continue;
                }
                
                // Generate safe filename
                $safe_filename = preg_replace('/[^a-zA-Z0-9._-]/', '_', $original_name);
                $new_filename = 'REN_' . $custom_permit_id . '_' . $fieldName . '_' . time() . '.' . $file_ext;
                $target_path = $upload_dir . $new_filename;
                
                if (move_uploaded_file($fileData['tmp_name'], $target_path)) {
                    error_log("File uploaded successfully: " . $target_path);
                    
                    // Save to application_documents table - using record_id for foreign key
                    $doc_sql = "INSERT INTO application_documents (
                        record_id, document_type, document_name, 
                        file_path, file_type, file_size, upload_date
                    ) VALUES (?, ?, ?, ?, ?, ?, NOW())";
                    
                    $doc_stmt = $conn->prepare($doc_sql);
                    if ($doc_stmt) {
                        $doc_stmt->bind_param(
                            'issssi',
                            $new_record_id,  // Use the record_id for foreign key reference
                            $document_type,
                            $original_name,
                            $target_path,
                            $fileData['type'],
                            $fileData['size']
                        );
                        
                        if (!$doc_stmt->execute()) {
                            error_log('Failed to save document record: ' . $doc_stmt->error);
                        } else {
                            error_log("Document saved to database");
                        }
                        $doc_stmt->close();
                    }
                } else {
                    error_log("Failed to move uploaded file");
                }
            }
        }
    } else {
        error_log("No files were uploaded");
    }
    
    // Handle signature if uploaded as file
    if (isset($_FILES['applicant_signature']) && $_FILES['applicant_signature']['error'] === UPLOAD_ERR_OK) {
        $signatureData = $_FILES['applicant_signature'];
        $original_name = basename($signatureData['name']);
        $file_ext = strtolower(pathinfo($original_name, PATHINFO_EXTENSION));
        
        if (in_array($file_ext, ['jpg', 'jpeg', 'png', 'gif'])) {
            $upload_dir = __DIR__ . '/../uploads/signatures/';
            if (!file_exists($upload_dir)) {
                mkdir($upload_dir, 0777, true);
            }
            
            $new_filename = 'SIG_' . $custom_permit_id . '_' . time() . '.' . $file_ext;
            $target_path = $upload_dir . $new_filename;
            
            if (move_uploaded_file($signatureData['tmp_name'], $target_path)) {
                // Save signature document record
                $sig_sql = "INSERT INTO application_documents (
                    record_id, document_type, document_name, 
                    file_path, file_type, file_size, upload_date
                ) VALUES (?, 'Applicant Signature', ?, ?, ?, ?, NOW())";
                
                $sig_stmt = $conn->prepare($sig_sql);
                if ($sig_stmt) {
                    $sig_stmt->bind_param(
                        'isssi',
                        $new_record_id,  // Use the record_id for foreign key reference
                        $original_name,
                        $target_path,
                        $signatureData['type'],
                        $signatureData['size']
                    );
                    $sig_stmt->execute();
                    $sig_stmt->close();
                }
            }
        }
    }
    
    // Commit transaction
    $conn->commit();
    
    $response['success'] = true;
    $response['message'] = 'Business permit renewal submitted successfully!';
    $response['permit_id'] = $custom_permit_id;  // Return the custom permit ID
    $response['applicant_id'] = $applicant_id;
    $response['record_id'] = $new_record_id;  // Return the auto-generated record ID
    
} catch (Exception $e) {
    // Rollback on error
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->rollback();
    }
    
    $response['message'] = 'Error: ' . $e->getMessage();
    error_log("Renewal submission error: " . $e->getMessage());
}

// Close connection
if (isset($conn) && $conn instanceof mysqli) {
    $conn->close();
}

echo json_encode($response, JSON_UNESCAPED_UNICODE);
?>