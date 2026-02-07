<?php
session_start();
require_once __DIR__ . '/../../db.php';

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");

// Get token from header
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';
$token = str_replace('Bearer ', '', $authHeader);

if (!$token) {
    echo json_encode(['success' => false, 'message' => 'No token provided']);
    exit;
}

// Verify token in database
$stmt = $conn->prepare("SELECT ls.*, u.email, u.role FROM login_sessions ls 
                        JOIN users u ON ls.user_id = u.id 
                        WHERE ls.session_token = ? AND ls.expires_at > NOW()");
$stmt->bind_param("s", $token);
$stmt->execute();
$result = $stmt->get_result();
$session = $result->fetch_assoc();

if (!$session) {
    echo json_encode(['success' => false, 'message' => 'Invalid or expired token']);
    exit;
}

// Check if user is admin (based on your admin emails list)
$adminDepartments = [
    'superadmin@eplms.com'     => 'super',
    'businessadmin@eplms.com'  => 'business',
    'buildingadmin@eplms.com'  => 'building',
    'barangaystaff@eplms.com'  => 'barangay',
    'transportadmin@eplms.com' => 'transport',
    'admin@eplms.com'          => 'super',
];

$isAdmin = isset($adminDepartments[$session['email']]);
$department = $isAdmin ? $adminDepartments[$session['email']] : null;
$role = $isAdmin ? 'admin' : 'user';

// Fetch profile for name
$profileRes = $conn->query("SELECT first_name, last_name FROM user_profiles WHERE user_id='{$session['user_id']}'");
$profile = $profileRes ? $profileRes->fetch_assoc() : null;
$name = $profile ? trim(($profile['first_name'] ?? '') . ' ' . ($profile['last_name'] ?? '')) : '';

echo json_encode([
    'success' => true,
    'user_id' => $session['user_id'],
    'email' => $session['email'],
    'role' => $role,
    'department' => $department,
    'name' => $name,
    'isAdmin' => $isAdmin
]);

$stmt->close();