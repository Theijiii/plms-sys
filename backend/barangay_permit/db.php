<?php
header("Access-Control-Allow-Origin: https://e-plms.goserveph.com/git");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
define('DB_HOST', 'localhost');         // remove :3306 unless needed         // optional, for clarity
define('DB_NAME', 'eplms_barangay_permit_db');
define('DB_USER', 'eplms_karl');
define('DB_PASS', 'mypassword');

// =======================
// FILE UPLOAD CONFIG
// =======================
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
define('UPLOAD_DIR', __DIR__ . '/uploads/');

define('ALLOWED_TYPES', [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

// Create upload directories if not exist
$subFolders = ['valid-ids', 'signatures', 'receipts', 'other'];
if (!file_exists(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0777, true);
}
foreach ($subFolders as $folder) {
    if (!file_exists(UPLOAD_DIR . $folder)) {
        mkdir(UPLOAD_DIR . $folder, 0777, true);
    }
}

// =======================
// DATABASE CONNECTION
// =======================
function getDBConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

    if ($conn->connect_error) {
        error_log("Database connection failed: " . $conn->connect_error);
        header('Content-Type: application/json');
        echo json_encode([
            "success" => false,
            "message" => "Failed to connect to database: " . $conn->connect_error
        ]);
        exit;
    }

    $conn->set_charset("utf8mb4");
    return $conn;
}

// =======================
// JSON RESPONSE FUNCTION
// =======================
function sendResponse($success, $message, $data = null, $httpCode = 200) {
    http_response_code($httpCode);
    header('Content-Type: application/json; charset=utf-8');

    $response = ['success' => $success, 'message' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }

    echo json_encode($response);
    exit;
}

// =======================
// CORS HEADERS
// =======================
function setCorsHeaders() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
}

// =======================
// HANDLE PRE-FLIGHT
// =======================
function handlePreflight() {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        setCorsHeaders();
        http_response_code(200);
        exit;
    }
}

// =======================
// USAGE EXAMPLE
// =======================
// In barangay_permit.php, call:
setCorsHeaders();
handlePreflight();
$conn = getDBConnection();
