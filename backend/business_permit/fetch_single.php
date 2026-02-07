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
if ($conn->connect_error) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $conn->connect_error
    ]);
    exit;
}

try {
    if (!isset($_GET['permit_id'])) {
        throw new Exception('Permit ID is required');
    }

$permit_id = $_GET['permit_id'] ?? 0;

// Use permit_id in your SQL query
$sql = "SELECT * FROM business_permit_applications WHERE permit_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $permit_id);
$stmt->execute();
    if (!$stmt->execute()) {
        throw new Exception("Failed to fetch application: " . $stmt->error);
    }

    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception("Application not found");
    }

    $application = $result->fetch_assoc();
    $stmt->close();

    // Fetch documents
    $docSql = "SELECT * FROM application_documents WHERE permit_id = ? ORDER BY document_type";
    $docStmt = $conn->prepare($docSql);
    $docStmt->bind_param("i", $permit_id);
    $docStmt->execute();
    $docResult = $docStmt->get_result();
    
    $documents = [];
    while ($doc = $docResult->fetch_assoc()) {
        $documents[] = $doc;
    }
    $docStmt->close();

    // Add documents to application data
    $application['documents'] = $documents;

    echo json_encode([
        'success' => true,
        'data' => $application
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

$conn->close();
?>