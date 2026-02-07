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
// Database Connection
require_once __DIR__ . '../db.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $permit_number = isset($_GET['permit_number']) ? $_GET['permit_number'] : '';
    
    if (empty($permit_number)) {
        echo json_encode([
            'success' => false,
            'message' => 'Permit number is required'
        ]);
        exit();
    }

    $database = new Database();
    $db = $database->getConnection();

    try {
        // Query to get existing permit information
        $query = "
            SELECT 
                permit_id,
                business_name,
                trade_name,
                business_nature,
                owner_type,
                validity_date as permit_expiry,
                status,
                barangay,
                contact_number,
                email_address
            FROM business_permit_applications 
            WHERE permit_id = :permit_number 
            OR business_name LIKE :permit_search
            ORDER BY submission_date DESC 
            LIMIT 1
        ";
        
        $stmt = $db->prepare($query);
        $searchTerm = "%" . $permit_number . "%";
        $stmt->bindParam(':permit_number', $permit_number);
        $stmt->bindParam(':permit_search', $searchTerm);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'data' => [
                    'permit_id' => $row['permit_id'],
                    'business_name' => $row['business_name'],
                    'trade_name' => $row['trade_name'],
                    'business_nature' => $row['business_nature'],
                    'owner_type' => $row['owner_type'],
                    'permit_expiry' => $row['permit_expiry'],
                    'status' => $row['status'],
                    'barangay' => $row['barangay'],
                    'contact_number' => $row['contact_number'],
                    'email_address' => $row['email_address']
                ]
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'No permit found with that number'
            ]);
        }
    } catch(PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }
}
?>