<?php
session_start();

$allowedOrigins = [
    'http://localhost',
    'https://e-plms.goserveph.com/',
    'urbanplanning.goserveph.com',
    'https://urbanplanning.goserveph.com'
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


// If db.php doesn't create $pdo automatically, create it
if (!isset($pdo) || !$pdo) {
    try {
        // Check what your db.php actually contains
        // If it has a getConnection() function, use that
        if (function_exists('getConnection')) {
            $pdo = getConnection();
        } 
        // If it defines connection variables, create PDO manually
        else if (defined('DB_HOST') && defined('DB_NAME') && defined('DB_USER') && defined('DB_PASS')) {
            $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } else {
            // Try to include db.php again with output buffering
            ob_start();
            include __DIR__ . '/db.php';
            $output = ob_get_clean();
            
            // If still no $pdo, create a minimal connection
            $pdo = new PDO("mysql:host=localhost;dbname=plms_db;charset=utf8mb4", "root", "");
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        }
    } catch (PDOException $e) {
        error_log("Database connection error: " . $e->getMessage());
        echo json_encode([
            "success" => false,
            "error" => "Database connection failed",
            "message" => $e->getMessage()
        ]);
        exit();
    }
}

$ref = $_GET['reference_id'] ?? null;

if (!$ref) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Missing reference_id"]);
    exit();
}

try {
    $stmt = $pdo->prepare("
      SELECT payment_status, receipt_number, paid_at, payment_id, amount
      FROM market_payments
      WHERE reference_id = ?
      ORDER BY paid_at DESC
      LIMIT 1
    ");
    $stmt->execute([$ref]);
    
    $data = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($data) {
        echo json_encode([
            "success" => true,
            "payment_status" => $data['payment_status'] ?? 'pending',
            "paid_at" => $data['paid_at'] ?? null,
            "payment_id" => $data['payment_id'] ?? null,
            "receipt_number" => $data['receipt_number'] ?? null,
            "amount" => $data['amount'] ?? null
        ]);
    } else {
        echo json_encode([
            "success" => true,
            "payment_status" => "pending",
            "message" => "Payment not found yet"
        ]);
    }
    
} catch (PDOException $e) {
    error_log("Payment status error: " . $e->getMessage());
    echo json_encode([
        "success" => false,
        "error" => "Database error",
        "message" => $e->getMessage()
    ]);
}