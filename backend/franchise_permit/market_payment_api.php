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
    $conn = getConnection();
    
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
    
    $stmt->execute([
        $data['reference_id'],
        $data['payment_id'],
        $data['receipt_number'],
        $data['amount'],
        $data['purpose'],
        $data['payment_method'] ?? 'online',
        $data['payment_status'] ?? 'paid',
        $data['phone'] ?? null,
        $data['paid_at'] ?? date('Y-m-d H:i:s')
    ]);
    
    $payment_id = $conn->lastInsertId();
    
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
        WHERE mtop_application_id = ? 
           OR id_number = ?
        ORDER BY date_submitted DESC 
        LIMIT 1
    ");
    
    $updateSuccess = $updateStmt->execute([
        $data['payment_status'] ?? 'paid',
        $data['payment_method'] ?? 'online',
        $data['payment_id'],
        $data['receipt_number'],
        $data['reference_id'],
        $data['reference_id'] // Fallback to use as ID number
    ]);
    
    // If not found, try Method 2: Using plate number from purpose field
    if (!$updateSuccess || $updateStmt->rowCount() === 0) {
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
            
            $updateStmt2->execute([
                $data['payment_status'] ?? 'paid',
                $data['payment_method'] ?? 'online',
                $data['payment_id'],
                $data['receipt_number'],
                $plate_number
            ]);
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
    
} catch (PDOException $e) {
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