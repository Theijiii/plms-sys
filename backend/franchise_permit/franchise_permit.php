<?php
session_start();

$allowedOrigins = [
    'http://localhost',
    'https://e-plms.goserveph.com/',

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

// Route handling based on request
$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$is_payment_endpoint = strpos($request_uri, 'payment') !== false || 
                       (isset($_GET['action']) && $_GET['action'] === 'payment');

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $is_payment_endpoint) {
    handlePayment();
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    handleApplication();
} else {
    jsonResponse(false, "Invalid request method");
}

function generateApplicationId($conn) {
    $currentYear = date('Y');
    
    $sql = "SELECT application_id FROM franchise_permit_applications 
            WHERE application_id LIKE 'TP{$currentYear}%' 
            ORDER BY application_id DESC LIMIT 1";
    
    $result = $conn->query($sql);
    
    if ($result && $result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $lastId = $row['application_id'];
        $numericPart = (int) substr($lastId, 6);
        $nextNumber = $numericPart + 1;
    } else {
        $nextNumber = 1;
    }
    
    $formattedNumber = str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    return "TP{$currentYear}{$formattedNumber}";
}

function saveUploadedFile($fileKey, $applicationId) {
    if (!isset($_FILES[$fileKey]) || $_FILES[$fileKey]['error'] !== UPLOAD_ERR_OK) {
        return null;
    }
    
    $file = $_FILES[$fileKey];
    
    // Validate file type
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'image/gif'];
    if (!in_array($file['type'], $allowedTypes)) {
        return null;
    }
    
    // Validate file size (max 5MB)
    if ($file['size'] > 5 * 1024 * 1024) {
        return null;
    }
    
    // Create uploads directory if it doesn't exist
    $uploadDir = __DIR__ . '/uploads/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    
    // Create application-specific directory
    $appDir = $uploadDir . $applicationId . '/';
    if (!file_exists($appDir)) {
        mkdir($appDir, 0777, true);
    }
    
    // Generate unique filename
    $fileExt = pathinfo($file['name'], PATHINFO_EXTENSION);
    $safeFileName = preg_replace('/[^a-zA-Z0-9]/', '_', pathinfo($file['name'], PATHINFO_FILENAME));
    $uniqueFileName = $safeFileName . '_' . time() . '_' . uniqid() . '.' . $fileExt;
    $filePath = $appDir . $uniqueFileName;
    
    if (move_uploaded_file($file['tmp_name'], $filePath)) {
        return $uniqueFileName;
    }
    
    return null;
}

function jsonResponse($success, $message, $data = null) {
    ob_clean();
    http_response_code($success ? 200 : 400);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit();
}

function handleApplication() {
    try {
        $conn = getDBConnection();
        if (!$conn) {
            jsonResponse(false, "Database connection failed");
        }
        
        // Generate application_id
        $applicationId = generateApplicationId($conn);
        
        // List of file fields to process
        $fileFields = [
            'proof_of_residency',
            'barangay_clearance',
            'lto_or_cr',
            'insurance_certificate',
            'drivers_license',
            'emission_test',
            'id_picture',
            'official_receipt',
            'nbi_clearance',
            'police_clearance',
            'medical_certificate',
            'toda_endorsement',
            'toda_president_cert',
            'franchise_fee_receipt',
            'sticker_id_fee_receipt',
            'inspection_fee_receipt'
        ];
        
        // Save uploaded files
        $filePaths = [];
        foreach ($fileFields as $field) {
            $savedFileName = saveUploadedFile($field, $applicationId);
            if ($savedFileName) {
                $filePaths[$field] = $savedFileName;
            } else {
                $filePaths[$field] = '';
            }
        }
        
        // Handle signature (base64 image)
        $signatureFileName = '';
        if (!empty($_POST['applicant_signature']) && strpos($_POST['applicant_signature'], 'data:image') === 0) {
            $signatureData = $_POST['applicant_signature'];
            
            // Extract base64 data
            list($type, $data) = explode(';', $signatureData);
            list(, $data) = explode(',', $data);
            $signatureImage = base64_decode($data);
            
            // Create uploads directory if it doesn't exist
            $uploadDir = __DIR__ . '/uploads/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            
            // Create application-specific directory
            $appDir = $uploadDir . $applicationId . '/';
            if (!file_exists($appDir)) {
                mkdir($appDir, 0777, true);
            }
            
            // Save signature as PNG
            $signatureFileName = 'signature_' . time() . '_' . uniqid() . '.png';
            $signaturePath = $appDir . $signatureFileName;
            
            if (file_put_contents($signaturePath, $signatureImage)) {
                $filePaths['applicant_signature'] = $signatureFileName;
            } else {
                $filePaths['applicant_signature'] = '';
            }
        } else {
            $filePaths['applicant_signature'] = '';
        }
        
        // Prepare data for insertion
        $data = [
            'application_id' => $applicationId,
            'permit_type' => $_POST['permit_type'] ?? 'NEW',
            'permit_subtype' => $_POST['permit_subtype'] ?? 'FRANCHISE',
            'operator_type' => $_POST['operator_type'] ?? '',
            'status' => 'pending',
            'first_name' => $_POST['first_name'] ?? '',
            'last_name' => $_POST['last_name'] ?? '',
            'middle_initial' => $_POST['middle_initial'] ?? '',
            'home_address' => $_POST['home_address'] ?? '',
            'contact_number' => $_POST['contact_number'] ?? '',
            'email' => $_POST['email'] ?? '',
            'citizenship' => $_POST['citizenship'] ?? 'Filipino',
            'birth_date' => !empty($_POST['birth_date']) ? $_POST['birth_date'] : null,
            'id_type' => $_POST['id_type'] ?? '',
            'id_number' => $_POST['id_number'] ?? '',
            'make_brand' => $_POST['make_brand'] ?? '',
            'model' => $_POST['model'] ?? '',
            'engine_number' => $_POST['engine_number'] ?? '',
            'chassis_number' => $_POST['chassis_number'] ?? '',
            'plate_number' => $_POST['plate_number'] ?? '',
            'year_acquired' => $_POST['year_acquired'] ?? date('Y'),
            'color' => $_POST['color'] ?? '',
            'vehicle_type' => $_POST['vehicle_type'] ?? 'Tricycle',
            'lto_or_number' => $_POST['lto_or_number'] ?? '',
            'lto_cr_number' => $_POST['lto_cr_number'] ?? '',
            'lto_expiration_date' => !empty($_POST['lto_expiration_date']) ? $_POST['lto_expiration_date'] : null,
            'mv_file_number' => $_POST['mv_file_number'] ?? '',
            'district' => $_POST['district'] ?? '',
            'route_zone' => $_POST['route_zone'] ?? '',
            'toda_name' => $_POST['toda_name'] ?? '',
            'barangay_of_operation' => $_POST['barangay_of_operation'] ?? '',
            'company_name' => $_POST['company_name'] ?? '',
            'franchise_fee_or' => $_POST['franchise_fee_or'] ?? '',
            'sticker_id_fee_or' => $_POST['sticker_id_fee_or'] ?? '',
            'inspection_fee_or' => $_POST['inspection_fee_or'] ?? '',
            'applicant_signature' => $filePaths['applicant_signature'],
            'date_submitted' => !empty($_POST['date_submitted']) ? $_POST['date_submitted'] : date('Y-m-d'),
            'barangay_captain_signature' => $_POST['barangay_captain_signature'] ?? '',
            'remarks' => $_POST['remarks'] ?? '',
            'notes' => $_POST['notes'] ?? '',
            'created_at' => date('Y-m-d H:i:s'),
            // File paths
            'proof_of_residency' => $filePaths['proof_of_residency'],
            'barangay_clearance' => $filePaths['barangay_clearance'],
            'lto_or_cr' => $filePaths['lto_or_cr'],
            'insurance_certificate' => $filePaths['insurance_certificate'],
            'drivers_license' => $filePaths['drivers_license'],
            'emission_test' => $filePaths['emission_test'],
            'id_picture' => $filePaths['id_picture'],
            'official_receipt' => $filePaths['official_receipt'],
            'nbi_clearance' => $filePaths['nbi_clearance'],
            'police_clearance' => $filePaths['police_clearance'],
            'medical_certificate' => $filePaths['medical_certificate'],
            'toda_endorsement' => $filePaths['toda_endorsement'],
            'toda_president_cert' => $filePaths['toda_president_cert'],
            'franchise_fee_receipt' => $filePaths['franchise_fee_receipt'],
            'sticker_id_fee_receipt' => $filePaths['sticker_id_fee_receipt'],
            'inspection_fee_receipt' => $filePaths['inspection_fee_receipt']
        ];
        
        // Add MTOP reference for franchise applications
        if (!empty($_POST['mtop_reference_id'])) {
            $data['mtop_reference_id'] = $_POST['mtop_reference_id'];
        }
        
        // Add checkbox values
        $checkboxFields = [
            'franchise_fee_checked' => 'franchise_fee_checked',
            'sticker_id_fee_checked' => 'sticker_id_fee_checked',
            'inspection_fee_checked' => 'inspection_fee_checked'
        ];
        
        foreach ($checkboxFields as $key => $value) {
            $data[$key] = isset($_POST[$key]) ? 1 : 0;
        }
        
        // Find user_id
        $userId = null;
        $email = $_POST['email'] ?? '';
        if (!empty($email)) {
            $checkUser = $conn->prepare("SELECT user_id FROM users WHERE email = ?");
            if ($checkUser) {
                $checkUser->bind_param("s", $email);
                $checkUser->execute();
                $userResult = $checkUser->get_result();
                
                if ($userResult->num_rows > 0) {
                    $userRow = $userResult->fetch_assoc();
                    $userId = $userRow['user_id'];
                }
                $checkUser->close();
            }
        }
        
        $data['user_id'] = $userId;
        
        // Build SQL query
        $columns = implode(', ', array_keys($data));
        $placeholders = implode(', ', array_fill(0, count($data), '?'));
        
        $sql = "INSERT INTO franchise_permit_applications ($columns) VALUES ($placeholders)";
        
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
        
        // Build types and values
        $types = '';
        $values = [];
        foreach ($data as $key => $value) {
            if ($value === null) {
                $types .= 's';
                $values[] = null;
            } elseif ($key === 'user_id') {
                $types .= 'i';
                $values[] = $value;
            } elseif (in_array($key, ['franchise_fee_checked', 'sticker_id_fee_checked', 'inspection_fee_checked'])) {
                $types .= 'i';
                $values[] = $value;
            } else {
                $types .= 's';
                $values[] = $value;
            }
        }
        
        // Bind parameters
        $stmt->bind_param($types, ...$values);
        
        if ($stmt->execute()) {
            $dbId = $conn->insert_id;
            
            jsonResponse(true, "Application submitted successfully", [
                'id' => $dbId,
                'application_id' => $applicationId,
                'application_number' => $applicationId,
                'permit_type' => $data['permit_type'],
                'permit_subtype' => $data['permit_subtype'],
                'status' => 'pending',
                'files_saved' => array_filter($filePaths, function($path) {
                    return !empty($path);
                })
            ]);
        } else {
            throw new Exception("Execute failed: " . $stmt->error);
        }
        
        $stmt->close();
        $conn->close();
        
    } catch (Exception $e) {
        error_log("Application Error: " . $e->getMessage());
        jsonResponse(false, "Error: " . $e->getMessage());
    }
}

function handlePayment() {
    // Log incoming request
    file_put_contents(__DIR__ . '/payment_debug.txt', 
        "[" . date('Y-m-d H:i:s') . "] " . file_get_contents('php://input') . "\n", 
        FILE_APPEND
    );
    
    $raw = file_get_contents("php://input");
    $data = json_decode($raw, true);
    
    if (!$data) {
        // Try form data
        $data = $_POST;
    }
    
    file_put_contents(__DIR__ . '/payment_received.txt', 
        print_r($data, true) . "\n", 
        FILE_APPEND
    );
    
    // Check required fields
    $required = ['reference_id', 'payment_id', 'receipt_number', 'amount', 'purpose'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            http_response_code(422);
            echo json_encode(["error" => "Missing field: $field", "received" => $data]);
            exit;
        }
    }
    
    // Extract application info from purpose field
    $purpose = $data['purpose'];
    $application_type = '';
    $plate_number = '';
    
    // Parse purpose field to get application details
    // Format: "MTOP Application - ABC1234" or "Franchise Application - XYZ5678"
    if (preg_match('/(MTOP|Franchise).*Application.*-.*([A-Z]{3}\d{4})/i', $purpose, $matches)) {
        $application_type = strtoupper($matches[1]);
        $plate_number = strtoupper($matches[2]);
    }
    
    try {
        $conn = getDBConnection();
        
        // 1. Save to market_payments table
        $stmt = $conn->prepare("
            INSERT INTO market_payments (
                reference_id, 
                payment_id, 
                receipt_number, 
                amount, 
                purpose,
                client_system, 
                payment_method, 
                payment_status,
                phone,
                paid_at
            ) VALUES (?, ?, ?, ?, ?, 'franchise', ?, ?, ?, ?)
        ");
        
        $stmt->bind_param(
            "sssdsssss",
            $data['reference_id'],
            $data['payment_id'],
            $data['receipt_number'],
            $data['amount'],
            $data['purpose'],
            $data['payment_method'] ?? 'online',
            $data['payment_status'] ?? 'paid',
            $data['phone'] ?? null,
            $data['paid_at'] ?? date('Y-m-d H:i:s')
        );
        
        $stmt->execute();
        $payment_id = $conn->insert_id;
        
        // 2. Update franchise application based on reference_id or plate number
        // Try to find the application using multiple methods
        
        // Method 1: Using reference_id (application ID)
        $updateStmt = $conn->prepare("
            UPDATE franchise_permit_applications 
            SET payment_status = ?,
                payment_date = NOW(),
                payment_method = ?,
                transaction_id = ?,
                receipt_number = ?
            WHERE mtop_reference_id = ? 
               OR application_id = ?
               OR id_number = ?
            ORDER BY date_submitted DESC 
            LIMIT 1
        ");
        
        $payment_status = $data['payment_status'] ?? 'paid';
        $payment_method = $data['payment_method'] ?? 'online';
        $payment_id_field = $data['payment_id'];
        $receipt_number = $data['receipt_number'];
        $reference_id = $data['reference_id'];
        
        $updateStmt->bind_param(
            "sssssss",
            $payment_status,
            $payment_method,
            $payment_id_field,
            $receipt_number,
            $reference_id,
            $reference_id,
            $reference_id
        );
        
        $updateStmt->execute();
        
        // If not found, try Method 2: Using plate number from purpose field
        if ($updateStmt->affected_rows === 0) {
            if (!empty($plate_number)) {
                $updateStmt2 = $conn->prepare("
                    UPDATE franchise_permit_applications 
                    SET payment_status = ?,
                        payment_date = NOW(),
                        payment_method = ?,
                        transaction_id = ?,
                        receipt_number = ?
                    WHERE plate_number = ?
                    ORDER BY date_submitted DESC 
                    LIMIT 1
                ");
                
                $updateStmt2->bind_param(
                    "sssss",
                    $payment_status,
                    $payment_method,
                    $payment_id_field,
                    $receipt_number,
                    $plate_number
                );
                
                $updateStmt2->execute();
            }
        }
        
        // 3. Log success
        file_put_contents(__DIR__ . '/payment_success.txt', 
            "[" . date('Y-m-d H:i:s') . "] Payment recorded - " . 
            "Ref: {$data['reference_id']}, " .
            "Payment ID: {$data['payment_id']}, " .
            "Amount: {$data['amount']}\n", 
            FILE_APPEND
        );
        
        echo json_encode([
            "success" => true,
            "message" => "Payment recorded successfully",
            "payment_id" => $payment_id,
            "application_updated" => true
        ]);
        
        $stmt->close();
        if (isset($updateStmt)) $updateStmt->close();
        if (isset($updateStmt2)) $updateStmt2->close();
        $conn->close();
        
    } catch (Exception $e) {
        error_log("Payment API Error: " . $e->getMessage());
        file_put_contents(__DIR__ . '/payment_error.txt', 
            "[" . date('Y-m-d H:i:s') . "] " . $e->getMessage() . "\n" . 
            "Data: " . print_r($data, true) . "\n", 
            FILE_APPEND
        );
        
        http_response_code(500);
        echo json_encode([
            "error" => "Database error",
            "message" => $e->getMessage()
        ]);
    }
}

ob_end_flush();
?>