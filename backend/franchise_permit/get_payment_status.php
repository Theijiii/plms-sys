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


$ref = $_GET['reference_id'] ?? null;

if (!$ref) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Missing reference_id"]);
    exit();
}

try {
    $conn = getDBConnection();
    
    $stmt = $conn->prepare("
      SELECT payment_status, receipt_number, paid_at, payment_id, amount
      FROM market_payments
      WHERE reference_id = ?
      ORDER BY paid_at DESC
      LIMIT 1
    ");
    $stmt->bind_param("s", $ref);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $data = $result->fetch_assoc();
    
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
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    error_log("Payment status error: " . $e->getMessage());
    echo json_encode([
        "success" => false,
        "error" => "Database error",
        "message" => $e->getMessage()
    ]);
}