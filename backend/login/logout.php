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

// Destroy PHP session
session_destroy();

// Clear session cookie
setcookie('PHPSESSID', '', time() - 3600, '/');

echo json_encode([
    'success' => true,
    'message' => 'Logged out successfully'
]);
?>