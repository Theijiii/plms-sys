<?php
session_start();

// Allowed origins for CORS
$allowedOrigins = [
    'http://localhost',
    'https://e-plms.goserveph.com/',
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
    // Optional filters (e.g., status)
    $status = $_GET['status'] ?? null;
    $permit_type = $_GET['permit_type'] ?? null;

    $sql = "SELECT * FROM business_permit_applications";
    $conditions = [];
    $params = [];
    $types = '';

    if ($status) {
        $conditions[] = "status = ?";
        $params[] = $status;
        $types .= 's';
    }

    if ($permit_type) {
        $conditions[] = "permit_type = ?";
        $params[] = $permit_type;
        $types .= 's';
    }

    if ($conditions) {
        $sql .= " WHERE " . implode(" AND ", $conditions);
    }

    $stmt = $conn->prepare($sql);

    if ($params) {
        $stmt->bind_param($types, ...$params);
    }

    $stmt->execute();
    $result = $stmt->get_result();

    $applications = [];
    while ($row = $result->fetch_assoc()) {
        // Fetch documents per application
        $docSql = "SELECT * FROM application_documents WHERE permit_id = ? ORDER BY document_type";
        $docStmt = $conn->prepare($docSql);
        $docStmt->bind_param("i", $row['permit_id']);
        $docStmt->execute();
        $docResult = $docStmt->get_result();

        $documents = [];
        while ($doc = $docResult->fetch_assoc()) {
            $documents[] = $doc;
        }
        $docStmt->close();

        $row['documents'] = $documents;
        $applications[] = $row;
    }

    $stmt->close();

    echo json_encode([
        'success' => true,
        'data' => $applications
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
