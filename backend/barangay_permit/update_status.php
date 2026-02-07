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

    // Get request data
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    if (!$data) {
        throw new Exception("Invalid JSON data");
    }

    // Get permit ID from URL or data
    $permitId = null;
    if (isset($_GET['id'])) {
        $permitId = intval($_GET['id']);
    } elseif (isset($data['permit_id'])) {
        $permitId = intval($data['permit_id']);
    } elseif (isset($data['id'])) {
        $permitId = intval($data['id']);
    }

    if (!$permitId) {
        throw new Exception("Permit ID is required");
    }

    // Get status and comments
    $status = isset($data['status']) ? trim($data['status']) : null;
    $comments = isset($data['comments']) ? trim($data['comments']) : null;

    // Validate status
    $validStatuses = ['pending', 'approved', 'rejected'];
    if ($status && !in_array(strtolower($status), $validStatuses)) {
        throw new Exception("Invalid status. Must be one of: " . implode(', ', $validStatuses));
    }

    // Check if comments column exists in the table
    $checkColumns = $conn->query("SHOW COLUMNS FROM barangay_permit LIKE 'comments'");
    $hasComments = $checkColumns && $checkColumns->num_rows > 0;

    // Build update query
    $updates = [];
    $params = [];
    $types = '';

    if ($status) {
        $updates[] = "status = ?";
        $params[] = strtolower($status);
        $types .= 's';
    }

    // Handle comments - append instead of overwrite
    if ($comments !== null && $hasComments) {
        // First, get existing comments
        $getQuery = "SELECT comments FROM barangay_permit WHERE permit_id = ?";
        $getStmt = $conn->prepare($getQuery);
        $getStmt->bind_param("i", $permitId);
        $getStmt->execute();
        $getStmt->bind_result($existingComments);
        $getStmt->fetch();
        $getStmt->close();
        
        // Prepare new comments with timestamp
        $timestamp = date('Y-m-d H:i:s');
        $user = isset($_SERVER['PHP_AUTH_USER']) ? $_SERVER['PHP_AUTH_USER'] : 'Admin';
        
        if (!empty($comments)) {
            if (!empty($existingComments)) {
                // Append new comment with separator
                $newComments = $existingComments . "\n\n--- " . $timestamp . " (" . $user . ") ---\n" . $comments;
            } else {
                // First comment
                $newComments = "--- " . $timestamp . " (" . $user . ") ---\n" . $comments;
            }
        } else {
            // No new comment, keep existing
            $newComments = $existingComments;
        }
        
        $updates[] = "comments = ?";
        $params[] = $newComments;
        $types .= 's';
    }

    if (empty($updates)) {
        throw new Exception("No fields to update");
    }

    // Always update updated_at
    $updates[] = "updated_at = NOW()";
    $params[] = $permitId;
    $types .= 'i';

    $sql = "UPDATE barangay_permit SET " . implode(', ', $updates) . " WHERE permit_id = ?";
    
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception("Failed to prepare statement: " . $conn->error);
    }

    // Bind parameters
    $stmt->bind_param($types, ...$params);

    // Execute the query
    if (!$stmt->execute()) {
        throw new Exception("Failed to execute query: " . $stmt->error);
    }

    // Check if any rows were affected
    if ($stmt->affected_rows === 0) {
        throw new Exception("No permit found with ID: " . $permitId);
    }

    // Close statement
    $stmt->close();
    
    // Get updated comments to return
    $getQuery = "SELECT comments FROM barangay_permit WHERE permit_id = ?";
    $getStmt = $conn->prepare($getQuery);
    $getStmt->bind_param("i", $permitId);
    $getStmt->execute();
    $getStmt->bind_result($finalComments);
    $getStmt->fetch();
    $getStmt->close();

    // Close connection
    $conn->close();

    // Return success response
    echo json_encode([
        "success" => true,
        "message" => "Permit updated successfully",
        "permit_id" => $permitId,
        "updated_fields" => array_keys(array_filter([
            'status' => $status,
            'comments' => $comments
        ], function($value) {
            return $value !== null;
        })),
        "comments_info" => [
            "total_comments" => empty($finalComments) ? 0 : substr_count($finalComments, '---'),
            "has_comments" => !empty($finalComments),
            "latest_comment" => !empty($finalComments) ? $comments : null
        ],
        "timestamp" => date('c')
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

} catch (Exception $e) {
    // Log error
    error_log("Error in update_status.php: " . $e->getMessage());
    
    // Return error response
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage(),
        "timestamp" => date('c')
    ], JSON_PRETTY_PRINT);
    
    // Ensure connection is closed even on error
    if (isset($conn) && $conn) {
        $conn->close();
    }
}
?>