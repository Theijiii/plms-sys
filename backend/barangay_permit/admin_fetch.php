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

// Include DB connection
require_once __DIR__ . '/db.php';

try {
    // Get database connection
    $conn = getDBConnection();
    
    if (!$conn || $conn->connect_error) {
        throw new Exception("Failed to connect to database: " . ($conn ? $conn->connect_error : "No connection"));
    }

    // Set charset to UTF-8
    $conn->set_charset("utf8mb4");

    // Prepare the query
    $sql = "SELECT 
                permit_id,
                user_id,
                applicant_id,
                application_date,
                first_name,
                middle_name,
                last_name,
                suffix,
                birthdate,
                email,
                gender,
                civil_status,
                nationality,
                house_no,
                street,
                barangay,
                city_municipality,
                province,
                zip_code,
                purpose,
                duration,
                id_type,
                id_number,
                attachments,
                clearance_fee,
                receipt_number,
                applicant_signature,
                mobile_number,
                created_at,
                updated_at,
                status,
                comments
            FROM barangay_permit 
            ORDER BY created_at DESC";
    
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception("Failed to prepare statement: " . $conn->error);
    }

    // Execute the query
    if (!$stmt->execute()) {
        throw new Exception("Failed to execute query: " . $stmt->error);
    }

    // Get result
    $result = $stmt->get_result();
    
    if (!$result) {
        throw new Exception("Failed to get result: " . $stmt->error);
    }

    $permits = [];
    
    // Fetch all rows
    while ($row = $result->fetch_assoc()) {
        // Ensure all fields are properly formatted
        $row['permit_id'] = (int)$row['permit_id'];
        $row['user_id'] = (int)$row['user_id'];
        
        // Handle NULL values
        $row['applicant_id'] = $row['applicant_id'] ? (int)$row['applicant_id'] : null;
        $row['clearance_fee'] = $row['clearance_fee'] ? (float)$row['clearance_fee'] : 0.00;
        
        // Parse attachments JSON if exists
        if (!empty($row['attachments']) && $row['attachments'] !== 'null') {
            $attachments = json_decode($row['attachments'], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $row['attachments'] = $attachments;
            } else {
                $row['attachments'] = [];
            }
        } else {
            $row['attachments'] = [];
        }
        
        // Convert dates to ISO format
        if ($row['application_date']) {
            $row['application_date'] = date('c', strtotime($row['application_date']));
        }
        
        if ($row['birthdate']) {
            $row['birthdate'] = date('c', strtotime($row['birthdate']));
        }
        
        if ($row['created_at']) {
            $row['created_at'] = date('c', strtotime($row['created_at']));
        }
        
        if ($row['updated_at']) {
            $row['updated_at'] = date('c', strtotime($row['updated_at']));
        }
        
        // Ensure status has a default value
        if (empty($row['status'])) {
            $row['status'] = 'pending';
        }
        
        $permits[] = $row;
    }

    // Close statement and connection
    $stmt->close();
    $conn->close();

    // Return success response
    echo json_encode([
        "success" => true,
        "message" => "Permits fetched successfully",
        "data" => $permits,
        "count" => count($permits),
        "timestamp" => date('c')
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

} catch (Exception $e) {
    // Log error (you should implement proper logging)
    error_log("Error in fetch_permits.php: " . $e->getMessage());
    
    // Return error response
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Internal server error",
        "error" => $e->getMessage(),
        "timestamp" => date('c')
    ], JSON_PRETTY_PRINT);
    
    // Ensure connection is closed even on error
    if (isset($conn) && $conn) {
        $conn->close();
    }
}
?>