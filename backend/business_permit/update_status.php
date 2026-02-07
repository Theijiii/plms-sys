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
require_once __DIR__ . '/db.php';

if ($conn->connect_error) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $conn->connect_error
    ]);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Method not allowed. Use POST.');
    }

    // Get input data
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['permit_id'])) {
        throw new Exception('Permit ID is required');
    }

    $permit_id = intval($input['permit_id']);
    $status = isset($input['status']) ? strtoupper($input['status']) : null;
    $comments = isset($input['comments']) ? trim($input['comments']) : '';

    // Start building update query
    $updates = [];
    $params = [];
    $types = "";

    if ($status && in_array($status, ['PENDING', 'APPROVED', 'REJECTED', 'COMPLIANCE', 'UNDER_REVIEW', 'DOCUMENT_VERIFICATION', 'PAYMENT_VERIFICATION', 'FOR_MANAGER_APPROVAL', 'READY_FOR_RELEASE', 'SITE_INSPECTION_SCHEDULED', 'PERMIT_PROCESSING', 'PRINTING_PROCESSING', 'FIELD_INSPECTION_SCHEDULED'])) {
        $updates[] = "status = ?";
        $params[] = $status;
        $types .= "s";
    }

    if (!empty($comments)) {
        // Get existing comments
        $existingSql = "SELECT comments FROM business_permit_applications WHERE permit_id = ?";
        $existingStmt = $conn->prepare($existingSql);
        $existingStmt->bind_param("i", $permit_id);
        $existingStmt->execute();
        $existingResult = $existingStmt->get_result();
        
        if ($existingRow = $existingResult->fetch_assoc()) {
            $existingComments = $existingRow['comments'] ?? '';
            
            // Create timestamp
            $timestamp = date('Y-m-d H:i:s');
            $formattedTimestamp = date('M d, Y h:i A', strtotime($timestamp));
            
            // Format new comment block
            $newCommentBlock = "--- $formattedTimestamp ---\n$comments\n";
            
            // Prepend new comment to existing ones
            $updatedComments = $newCommentBlock . $existingComments;
            
            $updates[] = "comments = ?";
            $params[] = $updatedComments;
            $types .= "s";
        }
        $existingStmt->close();
    }

    if (empty($updates)) {
        throw new Exception('No updates provided');
    }

    // Add permit_id to params
    $params[] = $permit_id;
    $types .= "i";

    // Build final update query
    $sql = "UPDATE business_permit_applications SET " . implode(', ', $updates) . " WHERE permit_id = ?";
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }

    $stmt->bind_param($types, ...$params);

    if (!$stmt->execute()) {
        throw new Exception("Update failed: " . $stmt->error);
    }

    // Get updated record
    $selectSql = "SELECT * FROM business_permit_applications WHERE permit_id = ?";
    $selectStmt = $conn->prepare($selectSql);
    $selectStmt->bind_param("i", $permit_id);
    $selectStmt->execute();
    $updatedRecord = $selectStmt->get_result()->fetch_assoc();
    $selectStmt->close();

    echo json_encode([
        'success' => true,
        'message' => 'Application updated successfully',
        'data' => $updatedRecord
    ]);

    $stmt->close();

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

$conn->close();
?>