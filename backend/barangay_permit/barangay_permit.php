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

// --- Database Connection ---
$targetDb = 'eplms_barangay_permit_db';
include __DIR__ . '/db.php';

if (!$conn) {
    echo json_encode(["success" => false, "message" => "Failed to connect to database"]);
    exit;
}

// Helper sanitizing function
function sanitize($str) {
    return htmlspecialchars(trim($str), ENT_QUOTES, 'UTF-8');
}

// ====== CHECK IF USER IS LOGGED IN ======
$user_id = 0;
if (isset($_SESSION['user_id'])) {
    $user_id = intval($_SESSION['user_id']);
} elseif (isset($_POST['user_id'])) {
    $user_id = intval($_POST['user_id']);
} elseif (isset($_GET['user_id'])) {
    $user_id = intval($_GET['user_id']);
}

// If no user_id found, check for user in database by email
if ($user_id === 0 && isset($_POST['email']) && !empty($_POST['email'])) {
    $email = sanitize($_POST['email']);
    $checkUser = "SELECT user_id FROM barangay_permit WHERE email = ? LIMIT 1";
    $stmtCheck = $conn->prepare($checkUser);
    $stmtCheck->bind_param("s", $email);
    $stmtCheck->execute();
    $checkResult = $stmtCheck->get_result();
    if ($row = $checkResult->fetch_assoc()) {
        $user_id = $row['user_id'];
    }
    $stmtCheck->close();
}
// ====== END USER CHECK ======

$uploadDir = __DIR__ . "/uploads/";
if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

// Allowed file extensions
$allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'];

// File inputs expected
$fileInputs = [
    "valid_id_file",
    "proof_of_residence_file",
    "receipt_file",
    "signature_file",
    "photo_fingerprint_file"
];

$uploadedFiles = [];

foreach ($fileInputs as $field) {
    if (!empty($_FILES[$field]['name'])) {

        $originalName = basename($_FILES[$field]['name']);
        $safeName = time() . "_" . preg_replace('/[^a-zA-Z0-9._-]/', '_', $originalName);
        $tmpName = $_FILES[$field]['tmp_name'];
        $targetPath = $uploadDir . $safeName;

        $ext = strtolower(pathinfo($safeName, PATHINFO_EXTENSION));
        if (!in_array($ext, $allowedExtensions)) {
            echo json_encode(["success" => false, "message" => "Invalid file type for $field"]);
            exit;
        }

        if ($_FILES[$field]['size'] > 5 * 1024 * 1024) {
            echo json_encode(["success" => false, "message" => "$field exceeds 5MB"]);
            exit;
        }

        if (!move_uploaded_file($tmpName, $targetPath)) {
            echo json_encode(["success" => false, "message" => "Failed to upload $field"]);
            exit;
        }

        $uploadedFiles[$field] = $safeName;
    } else {
        $uploadedFiles[$field] = "";
    }
}

// Process POST fields (normal form fields)
$formData = [];
foreach ($_POST as $key => $value) {
    $formData[$key] = sanitize($value);
}

// Provide defaults
$defaults = [
    'application_date' => date("Y-m-d"),
    'status' => 'pending',
    'middle_name' => '',
    'suffix' => '',
    'email' => '',
    'zip_code' => '',
    'duration' => '',
    'clearance_fee' => 0,
    'receipt_number' => '',
    'applicant_signature' => ''
];

foreach ($defaults as $key => $value) {
    if (!isset($formData[$key])) {
        $formData[$key] = $value;
    }
}

// Set user_id from logged-in user
$formData['user_id'] = $user_id;

$formData['attachments'] = json_encode($uploadedFiles, JSON_UNESCAPED_SLASHES);

// ====== GENERATE APPLICANT_ID ======
// Format: BC-YYYY-NNNNNN (e.g., BC-2026-123456)
$applicant_id = '';
$year = date('Y');
$maxAttempts = 10;

for ($attempt = 0; $attempt < $maxAttempts; $attempt++) {
    $randomNumber = str_pad(rand(100000, 999999), 6, '0', STR_PAD_LEFT);
    $applicant_id = "BC-{$year}-{$randomNumber}";
    
    $checkQuery = "SELECT applicant_id FROM barangay_permit WHERE applicant_id = ? LIMIT 1";
    $stmtCheck = $conn->prepare($checkQuery);
    $stmtCheck->bind_param("s", $applicant_id);
    $stmtCheck->execute();
    $checkResult = $stmtCheck->get_result();
    
    if ($checkResult->num_rows === 0) {
        $stmtCheck->close();
        break;
    }
    $stmtCheck->close();
}
// ====== END GENERATE APPLICANT_ID ======

if (!empty($uploadedFiles['signature_file'])) {
    $formData['applicant_signature'] = $uploadedFiles['signature_file'];
}

// Insert Query - applicant_id is included
$sql = "INSERT INTO barangay_permit SET
    user_id = ?,
    applicant_id = ?,
    application_date = ?,
    first_name = ?,
    middle_name = ?,
    last_name = ?,
    suffix = ?,
    birthdate = ?,
    mobile_number = ?,
    email = ?,
    gender = ?,
    civil_status = ?,
    nationality = ?,
    house_no = ?,
    street = ?,
    barangay = ?,
    city_municipality = ?,
    province = ?,
    zip_code = ?,
    purpose = ?,
    duration = ?,
    id_type = ?,
    id_number = ?,
    attachments = ?,
    clearance_fee = ?,
    receipt_number = ?,
    applicant_signature = ?,
    status = ?,
    comments = ?,
    created_at = NOW(),
    updated_at = NOW()";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Database error: " . $conn->error]);
    exit;
}

$stmt->bind_param(
    "issssssssssssssssssssssssdsss",
    $formData['user_id'],             // i
    $applicant_id,                    // s
    $formData['application_date'],    // s
    $formData['first_name'],          // s
    $formData['middle_name'],         // s
    $formData['last_name'],           // s
    $formData['suffix'],              // s
    $formData['birthdate'],           // s
    $formData['mobile_number'],       // s
    $formData['email'],               // s
    $formData['gender'],              // s
    $formData['civil_status'],        // s
    $formData['nationality'],         // s
    $formData['house_no'],            // s
    $formData['street'],              // s
    $formData['barangay'],            // s
    $formData['city_municipality'],   // s
    $formData['province'],            // s
    $formData['zip_code'],            // s
    $formData['purpose'],             // s
    $formData['duration'],            // s
    $formData['id_type'],             // s
    $formData['id_number'],           // s
    $formData['attachments'],         // s
    $formData['clearance_fee'],       // d
    $formData['receipt_number'],      // s
    $formData['applicant_signature'], // s
    $formData['status'],
    $formData['comments']
);

if ($stmt->execute()) {
    $permitId = $stmt->insert_id;
    $reference = "BRGY-CLR-" . date("Ymd") . "-" . str_pad($permitId, 6, "0", STR_PAD_LEFT);

    echo json_encode([
        "success" => true,
        "message" => "Barangay permit submitted successfully!",
        "permit_id" => $permitId,
        "applicant_id" => $applicant_id,
        "user_id" => $user_id,
        "reference_number" => $reference
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Failed to save application: " . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
exit;
?>