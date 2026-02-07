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

$response = ['success' => false, 'message' => '', 'data' => [], 'stats' => []];

try {
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    $email = isset($_GET['email']) ? sanitize($_GET['email']) : '';
    
    if ($userId <= 0 && empty($email)) {
        throw new Exception("User ID or Email is required");
    }
    
    $conn = getDBConnection();
    if (!$conn) {
        throw new Exception("Database connection failed");
    }
        if (!empty($email)) {
        $userQuery = "SELECT id FROM users WHERE email = ?";
        $userStmt = $conn->prepare($userQuery);
        $userStmt->bind_param("s", $email);
        $userStmt->execute();
        $userResult = $userStmt->get_result();
        
        if ($userResult->num_rows > 0) {
            $userRow = $userResult->fetch_assoc();
            $userId = $userRow['id'];
        } else {
            throw new Exception("User not found with this email");
        }
        $userStmt->close();
    }
    
    // Get applications for this user
    $query = "SELECT 
                fa.application_id,
                fa.permit_type,
                fa.permit_subtype,
                fa.status,
                fa.make_brand,
                fa.model,
                fa.plate_number,
                fa.vehicle_type,
                fa.route_zone,
                fa.toda_name,
                fa.barangay_of_operation,
                fa.district,
                fa.application_date,
                fa.expiry_date,
                fa.remarks,
                fa.created_at,
                fa.updated_at,
                u.full_name,
                u.email,
                u.contact_number
              FROM franchise_permit_applications fa
              LEFT JOIN users u ON fa.user_id = u.id
              WHERE fa.user_id = ?
              ORDER BY fa.created_at DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $applications = [];
    while ($row = $result->fetch_assoc()) {
        // Format dates
        if ($row['application_date']) {
            $row['application_date_formatted'] = date('M d, Y', strtotime($row['application_date']));
        }
        if ($row['expiry_date']) {
            $row['expiry_date_formatted'] = date('M d, Y', strtotime($row['expiry_date']));
        }
        if ($row['created_at']) {
            $row['created_at_formatted'] = date('M d, Y h:i A', strtotime($row['created_at']));
        }
        if ($row['updated_at']) {
            $row['updated_at_formatted'] = date('M d, Y h:i A', strtotime($row['updated_at']));
        }
        
        // Get document count
        $docQuery = "SELECT COUNT(*) as doc_count FROM application_documents WHERE application_id = ?";
        $docStmt = $conn->prepare($docQuery);
        $docStmt->bind_param("i", $row['application_id']);
        $docStmt->execute();
        $docResult = $docStmt->get_result();
        $docRow = $docResult->fetch_assoc();
        $row['document_count'] = (int)$docRow['doc_count'];
        $docStmt->close();
        
        $row['application_id'] = (int)$row['application_id'];
        $applications[] = $row;
    }
    
    $stmt->close();
    
    // Get statistics for this user
    $statsQuery = "SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
                    SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected,
                    SUM(CASE WHEN status = 'UNDER_REVIEW' THEN 1 ELSE 0 END) as under_review,
                    SUM(CASE WHEN permit_subtype = 'MTOP' THEN 1 ELSE 0 END) as mtop,
                    SUM(CASE WHEN permit_subtype = 'FRANCHISE' THEN 1 ELSE 0 END) as franchise
                  FROM franchise_permit_applications 
                  WHERE user_id = ?";
    
    $statsStmt = $conn->prepare($statsQuery);
    $statsStmt->bind_param("i", $userId);
    $statsStmt->execute();
    $statsResult = $statsStmt->get_result();
    $stats = $statsResult->fetch_assoc();
    $statsStmt->close();
    
    // Get user info
    $userInfoQuery = "SELECT * FROM users WHERE id = ?";
    $userInfoStmt = $conn->prepare($userInfoQuery);
    $userInfoStmt->bind_param("i", $userId);
    $userInfoStmt->execute();
    $userInfoResult = $userInfoStmt->get_result();
    $userInfo = $userInfoResult->fetch_assoc();
    $userInfoStmt->close();
    
    $conn->close();
    
    $response['success'] = true;
    $response['message'] = 'Applications retrieved successfully';
    $response['data'] = $applications;
    $response['user_info'] = $userInfo;
    $response['stats'] = [
        'total' => (int)$stats['total'],
        'approved' => (int)$stats['approved'],
        'pending' => (int)$stats['pending'],
        'rejected' => (int)$stats['rejected'],
        'under_review' => (int)$stats['under_review'],
        'mtop' => (int)$stats['mtop'],
        'franchise' => (int)$stats['franchise']
    ];
    
} catch (Exception $e) {
    $response['message'] = $e->getMessage();
    error_log("get_user_application.php Error: " . $e->getMessage());
}

echo json_encode($response);
?>