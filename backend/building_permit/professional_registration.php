<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error_log.txt');

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    handleRegistration();
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    fetchRegistrations();
} else {
    jsonResponse(false, "Invalid request method", null, 405);
}

function generateRegistrationId($conn) {
    $currentYear = date('Y');
    $prefix = "PR{$currentYear}";
    
    $sql = "SELECT registration_id FROM professional_registrations 
            WHERE registration_id LIKE '{$prefix}%' 
            ORDER BY registration_id DESC LIMIT 1";
    
    $result = $conn->query($sql);
    
    if ($result && $result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $lastId = $row['registration_id'];
        $numericPart = (int) substr($lastId, strlen($prefix));
        $nextNumber = $numericPart + 1;
    } else {
        $nextNumber = 1;
    }
    
    return $prefix . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
}

function saveUploadedFile($fileKey, $registrationId) {
    if (!isset($_FILES[$fileKey]) || $_FILES[$fileKey]['error'] !== UPLOAD_ERR_OK) {
        return null;
    }
    
    $file = $_FILES[$fileKey];
    
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'image/gif'];
    if (!in_array($file['type'], $allowedTypes)) {
        throw new Exception("Invalid file type for {$fileKey}. Allowed: JPG, PNG, PDF, GIF");
    }
    
    if ($file['size'] > 5 * 1024 * 1024) {
        throw new Exception("File too large for {$fileKey}. Maximum size is 5MB");
    }
    
    $uploadDir = __DIR__ . '/uploads/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    
    $appDir = $uploadDir . $registrationId . '/';
    if (!file_exists($appDir)) {
        mkdir($appDir, 0777, true);
    }
    
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $safeName = $fileKey . '_' . time() . '.' . $extension;
    $targetPath = $appDir . $safeName;
    
    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        return 'uploads/' . $registrationId . '/' . $safeName;
    }
    
    return null;
}

function handleRegistration() {
    $conn = getDBConnection();
    if (!$conn) {
        jsonResponse(false, "Database connection failed", null, 500);
    }
    
    try {
        $conn->begin_transaction();
        
        $registrationId = generateRegistrationId($conn);
        
        // Validate required fields
        $required = ['first_name', 'last_name', 'birth_date', 'contact_number', 'email', 
                     'prc_license', 'prc_expiry', 'ptr_number', 'tin', 'profession', 'role'];
        
        foreach ($required as $field) {
            if (empty($_POST[$field])) {
                throw new Exception("Missing required field: " . str_replace('_', ' ', $field));
            }
        }
        
        // Sanitize inputs
        $first_name = trim($_POST['first_name']);
        $middle_initial = trim($_POST['middle_initial'] ?? '');
        $last_name = trim($_POST['last_name']);
        $suffix = trim($_POST['suffix'] ?? '');
        $birth_date = $_POST['birth_date'];
        $contact_number = trim($_POST['contact_number']);
        $email = trim($_POST['email']);
        $prc_license = trim($_POST['prc_license']);
        $prc_expiry = $_POST['prc_expiry'];
        $ptr_number = trim($_POST['ptr_number']);
        $tin = trim($_POST['tin']);
        $profession = trim($_POST['profession']);
        $role = trim($_POST['role']);
        $user_id = !empty($_POST['user_id']) ? (int)$_POST['user_id'] : null;
        
        // Handle file uploads
        $prc_id_path = saveUploadedFile('prc_id_file', $registrationId);
        $ptr_path = saveUploadedFile('ptr_file', $registrationId);
        $signature_path = saveUploadedFile('signature_file', $registrationId);
        
        // Validate required files
        if (!$prc_id_path) throw new Exception("PRC ID file is required");
        if (!$ptr_path) throw new Exception("PTR file is required");
        if (!$signature_path) throw new Exception("Signature file is required");
        
        // Insert into database
        $stmt = $conn->prepare("INSERT INTO professional_registrations 
            (registration_id, user_id, first_name, middle_initial, last_name, suffix, 
             birth_date, contact_number, email, prc_license, prc_expiry, ptr_number, 
             tin, profession, role_in_project, prc_id_file, ptr_file, signature_file, 
             status, date_submitted)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())");
        
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
        
        $stmt->bind_param(
            'sissssssssssssssss',
            $registrationId,
            $user_id,
            $first_name,
            $middle_initial,
            $last_name,
            $suffix,
            $birth_date,
            $contact_number,
            $email,
            $prc_license,
            $prc_expiry,
            $ptr_number,
            $tin,
            $profession,
            $role,
            $prc_id_path,
            $ptr_path,
            $signature_path
        );
        
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }
        
        $stmt->close();
        $conn->commit();
        
        jsonResponse(true, "Professional registration submitted successfully!", [
            'registration_id' => $registrationId,
            'status' => 'pending'
        ]);
        
    } catch (Exception $e) {
        $conn->rollback();
        error_log("Professional Registration Error: " . $e->getMessage());
        jsonResponse(false, $e->getMessage(), null, 400);
    } finally {
        $conn->close();
    }
}

function fetchRegistrations() {
    $conn = getDBConnection();
    if (!$conn) {
        jsonResponse(false, "Database connection failed", null, 500);
    }
    
    try {
        $query = "SELECT * FROM professional_registrations ORDER BY date_submitted DESC";
        
        if (!empty($_GET['user_id'])) {
            $query = "SELECT * FROM professional_registrations WHERE user_id = ? ORDER BY date_submitted DESC";
            $stmt = $conn->prepare($query);
            $userId = (int)$_GET['user_id'];
            $stmt->bind_param('i', $userId);
            $stmt->execute();
            $result = $stmt->get_result();
        } else {
            $result = $conn->query($query);
        }
        
        $registrations = [];
        while ($row = $result->fetch_assoc()) {
            $registrations[] = $row;
        }
        
        jsonResponse(true, "Registrations fetched successfully", $registrations);
        
    } catch (Exception $e) {
        error_log("Fetch Error: " . $e->getMessage());
        jsonResponse(false, $e->getMessage(), null, 500);
    } finally {
        $conn->close();
    }
}
?>
