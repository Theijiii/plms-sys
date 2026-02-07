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

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

function sanitize($str) {
    return htmlspecialchars(trim($str), ENT_QUOTES, 'UTF-8');
}

function sendError($message, $code = 400) {
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'message' => $message,
        'applications' => []
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Invalid request method. Only GET is allowed.', 405);
}

$userEmail = isset($_GET['email']) ? sanitize($_GET['email']) : '';
$userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

if (empty($userEmail)) {
    sendError('User email is required', 400);
}

$allApplications = [];

// Database credentials for each permit type
$databases = [
    'business' => [
        'host' => 'localhost',
        'user' => 'eplms_paul',
        'pass' => 'mypassword',
        'name' => 'eplms_business_permit_db',
        'table' => 'business_permit',
        'permitType' => 'Business Permit'
    ],
    'barangay' => [
        'host' => 'localhost',
        'user' => 'eplms_karl',
        'pass' => 'mypassword',
        'name' => 'eplms_barangay_permit_db',
        'table' => 'barangay_permit',
        'permitType' => 'Barangay Permit'
    ],
    'building' => [
        'host' => 'localhost',
        'user' => 'eplms_ella',
        'pass' => 'mypassword',
        'name' => 'eplms_building_permit_db',
        'table' => 'building_permit',
        'permitType' => 'Building Permit'
    ],
    'franchise' => [
        'host' => 'localhost',
        'user' => 'eplms_kobe',
        'pass' => 'mypassword',
        'name' => 'eplms_franchise_applications',
        'table' => 'franchise_application',
        'permitType' => 'Franchise Permit'
    ]
];

// Fetch applications from each database
foreach ($databases as $key => $db) {
    $conn = new mysqli($db['host'], $db['user'], $db['pass'], $db['name']);
    
    if ($conn->connect_error) {
        error_log("Failed to connect to {$db['name']}: " . $conn->connect_error);
        continue;
    }
    
    $conn->set_charset("utf8mb4");
    
    // Build query with user filtering - CRITICAL: Filter by email AND optionally user_id
    $query = "SELECT * FROM {$db['table']} WHERE email = ?";
    $params = [$userEmail];
    $types = "s";
    
    // Add user_id filter if available for extra security
    if ($userId > 0) {
        $query .= " AND user_id = ?";
        $params[] = $userId;
        $types .= "i";
    }
    
    $query .= " ORDER BY submitted_date DESC";
    
    $stmt = $conn->prepare($query);
    
    if (!$stmt) {
        error_log("Failed to prepare statement for {$db['name']}: " . $conn->error);
        $conn->close();
        continue;
    }
    
    // Bind parameters dynamically
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        // Normalize the data structure for consistent frontend display
        $application = [
            'id' => $row['id'] ?? $row['permit_id'] ?? 'N/A',
            'permitType' => $db['permitType'],
            'application_type' => $row['application_type'] ?? $row['permit_type'] ?? 'New',
            'status' => $row['status'] ?? 'Pending',
            'applicantName' => $row['applicant_name'] ?? $row['owner_name'] ?? $row['first_name'] . ' ' . ($row['last_name'] ?? ''),
            'businessName' => $row['business_name'] ?? $row['establishment_name'] ?? 'N/A',
            'email' => $row['email'] ?? '',
            'address' => $row['address'] ?? $row['business_address'] ?? $row['location'] ?? 'N/A',
            'contactNumber' => $row['contact_number'] ?? $row['phone'] ?? 'N/A',
            'submittedDate' => $row['submitted_date'] ?? $row['date_submitted'] ?? $row['created_at'] ?? null,
            'approvedDate' => $row['approved_date'] ?? $row['date_approved'] ?? null,
            'expirationDate' => $row['expiration_date'] ?? $row['valid_until'] ?? null,
            'fees' => $row['fees'] ?? $row['total_fees'] ?? '0.00',
            'receiptNumber' => $row['receipt_number'] ?? $row['or_number'] ?? 'N/A',
            'user_id' => $row['user_id'] ?? 0,
            'remarks' => $row['remarks'] ?? '',
            'compliance_notes' => $row['compliance_notes'] ?? ''
        ];
        
        $allApplications[] = $application;
    }
    
    $stmt->close();
    $conn->close();
}

// Sort all applications by submitted date (most recent first)
usort($allApplications, function($a, $b) {
    $dateA = strtotime($a['submittedDate'] ?? '1970-01-01');
    $dateB = strtotime($b['submittedDate'] ?? '1970-01-01');
    return $dateB - $dateA;
});

echo json_encode([
    'success' => true,
    'message' => 'Applications fetched successfully',
    'applications' => $allApplications,
    'total' => count($allApplications),
    'user_email' => $userEmail,
    'user_id' => $userId
], JSON_UNESCAPED_UNICODE);
