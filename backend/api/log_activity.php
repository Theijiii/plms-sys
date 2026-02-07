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
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Only POST allowed']);
    exit;
}

$host = "localhost";
$dbUser = "eplms_thea";
$dbPass = "mypassword";
$dbName = "eplms_user_management";

$conn = new mysqli($host, $dbUser, $dbPass, $dbName);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}
$conn->set_charset("utf8mb4");

// Auto-create activity_logs table if it doesn't exist
$conn->query("CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT 0,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) DEFAULT '',
    user_role VARCHAR(50) DEFAULT 'user',
    action VARCHAR(100) NOT NULL,
    action_category VARCHAR(50) DEFAULT 'system',
    description TEXT,
    module VARCHAR(100) DEFAULT '',
    reference_id VARCHAR(100) DEFAULT '',
    ip_address VARCHAR(45) DEFAULT '',
    metadata JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_email (user_email),
    INDEX idx_action_category (action_category),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
    exit;
}

$user_id = intval($input['user_id'] ?? 0);
$user_email = trim($input['user_email'] ?? '');
$user_name = trim($input['user_name'] ?? '');
$user_role = trim($input['user_role'] ?? 'user');
$action = trim($input['action'] ?? '');
$action_category = trim($input['action_category'] ?? 'system');
$description = trim($input['description'] ?? '');
$module = trim($input['module'] ?? '');
$reference_id = trim($input['reference_id'] ?? '');
$ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
$metadata = isset($input['metadata']) ? json_encode($input['metadata']) : null;

if (empty($user_email) || empty($action)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'user_email and action are required']);
    exit;
}

$stmt = $conn->prepare("INSERT INTO activity_logs (user_id, user_email, user_name, user_role, action, action_category, description, module, reference_id, ip_address, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->bind_param("issssssssss", $user_id, $user_email, $user_name, $user_role, $action, $action_category, $description, $module, $reference_id, $ip_address, $metadata);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Activity logged', 'id' => $stmt->insert_id]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to log activity']);
}

$stmt->close();
$conn->close();
