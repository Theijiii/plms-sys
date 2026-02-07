<?php
session_start();

$allowedOrigins = [
    'http://localhost:5173',
    'http://localhost',
    'https://e-plms.goserveph.com'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
} else {
    header("Access-Control-Allow-Origin: https://e-plms.goserveph.com");
}
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

ob_start();

require_once __DIR__ . '/db.php';

if ($conn->connect_error) {
    ob_clean();
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $conn->connect_error
    ]);
    exit;
}

try {
    $permit_number = $_GET['permit_number'] ?? '';

    if (empty($permit_number)) {
        throw new Exception('Permit number is required.');
    }

    // Search by permit_id or applicant_id
    $sql = "SELECT * FROM liquor_permit_applications WHERE permit_id = ? OR applicant_id = ? LIMIT 1";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }

    $stmt->bind_param("ss", $permit_number, $permit_number);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $data = $result->fetch_assoc();
        ob_clean();
        echo json_encode([
            'success' => true,
            'data' => $data
        ]);
    } else {
        ob_clean();
        echo json_encode([
            'success' => false,
            'message' => 'Liquor permit not found.'
        ]);
    }

    $stmt->close();

} catch (Exception $e) {
    ob_clean();
    error_log("LIQUOR PERMIT CHECK ERROR: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

$conn->close();
exit();
?>
