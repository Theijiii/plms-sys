<?php
session_start();
require_once __DIR__ . '/db.php';

/* =================== CORS =================== */
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
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

/* =================== PREFLIGHT =================== */
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/* =================== AUTH =================== */
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Missing or invalid authorization token'
    ]);
    exit;
}

$token = $matches[1];

/* =================== VALIDATE SESSION =================== */
$stmt = $conn->prepare("
    SELECT user_id
    FROM user_management.login_sessions
    WHERE session_token = ?
      AND expires_at > NOW()
    LIMIT 1
");

$stmt->bind_param("s", $token);
$stmt->execute();
$result = $stmt->get_result();
$session = $result->fetch_assoc();
$stmt->close();

if (!$session) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Session expired or invalid'
    ]);
    exit;
}

$userId = $session['user_id'];

/* =================== FETCH USER PROFILE =================== */
$stmt = $conn->prepare("
    SELECT 
        u.email,
        p.first_name,
        p.last_name,
        p.middle_name,
        p.suffix,
        p.birthdate,
        p.mobile_number,
        a.house_number,
        a.street,
        a.barangay,
        a.city_municipality,
        a.province,
        a.region,
        a.zip_code
    FROM user_management.users u
    INNER JOIN user_management.user_profiles p ON u.id = p.user_id
    LEFT JOIN user_management.user_addresses a ON u.id = a.user_id
    WHERE u.id = ?
    LIMIT 1
");

$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();
$profile = $result->fetch_assoc();
$stmt->close();

if (!$profile) {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'message' => 'User profile not found'
    ]);
    exit;
}

/* =================== RESPONSE =================== */
http_response_code(200);
echo json_encode([
    'success' => true,
    'data' => $profile
]);
exit;
