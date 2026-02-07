<?php
session_start();

// CORS Configuration
$allowedOrigins = [
    'http://localhost',
    'https://e-plms.goserveph.com',
    'https://urbanplanning.goserveph.com'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
} else {
    // Fallback to one of the allowed origins
    header("Access-Control-Allow-Origin: https://e-plms.goserveph.com");
}

header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database Connection
require_once __DIR__ . '/db.php';

$response = ['success' => false, 'message' => '', 'data' => [], 'stats' => []];

try {
    // Validate and sanitize pagination parameters
    $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 15;
    
    // Ensure page and limit are positive integers
    $page = max(1, $page);
    $limit = max(1, min(100, $limit)); // Limit to max 100 per page
    
    $offset = ($page - 1) * $limit;
    
    // Build base query
    $query = "SELECT SQL_CALC_FOUND_ROWS 
                fa.application_id,
                fa.permit_type,
                fa.permit_subtype,
                fa.operator_type,
                fa.status,
                fa.first_name,
                fa.last_name,
                fa.middle_initial,
                fa.contact_number,
                fa.email,
                fa.home_address,
                fa.citizenship,
                fa.birth_date,
                fa.id_type,
                fa.id_number,
                fa.make_brand,
                fa.model,
                fa.engine_number,
                fa.chassis_number,
                fa.plate_number,
                fa.year_acquired,
                fa.color,
                fa.vehicle_type,
                fa.lto_or_number,
                fa.lto_cr_number,
                fa.lto_expiration_date,
                fa.mv_file_number,
                fa.district,
                fa.route_zone,
                fa.toda_name,
                fa.barangay_of_operation,
                fa.franchise_fee_or,
                fa.sticker_id_fee_or,
                fa.inspection_fee_or,
                fa.applicant_signature,
                fa.date_submitted,
                fa.barangay_captain_signature,
                fa.remarks,
                fa.notes,
                fa.user_id,
                fa.created_at,
                fa.document_verification_data
              FROM franchise_permit_applications fa
              WHERE 1=1";
    
    $params = [];
    $types = "";
    
    // Filter by status
    if (!empty($_GET['status']) && $_GET['status'] !== 'all') {
        $status = trim($_GET['status']);
        $query .= " AND fa.status = ?";
        $params[] = $status;
        $types .= "s";
    }
    
    // Filter by permit type
    if (!empty($_GET['permit_type']) && $_GET['permit_type'] !== 'all') {
        $permitType = trim($_GET['permit_type']);
        $query .= " AND fa.permit_type = ?";
        $params[] = $permitType;
        $types .= "s";
    }
    
    // Filter by permit subtype
    if (!empty($_GET['permit_subtype']) && $_GET['permit_subtype'] !== 'all') {
        $permitSubtype = trim($_GET['permit_subtype']);
        $query .= " AND fa.permit_subtype = ?";
        $params[] = $permitSubtype;
        $types .= "s";
    }
    
    // Search filter
    if (!empty($_GET['search'])) {
        $searchTerm = "%" . trim($_GET['search']) . "%";
        $query .= " AND (
            fa.plate_number LIKE ? OR 
            fa.first_name LIKE ? OR 
            fa.last_name LIKE ? OR 
            fa.email LIKE ? OR 
            fa.contact_number LIKE ? OR 
            fa.engine_number LIKE ? OR 
            fa.application_id LIKE ?
        )";
        
        // Add the same search term 7 times for each LIKE condition
        for ($i = 0; $i < 7; $i++) {
            $params[] = $searchTerm;
            $types .= "s";
        }
    }
    
    // Filter by date range
    if (!empty($_GET['start_date']) && !empty($_GET['end_date'])) {
        $startDate = trim($_GET['start_date']);
        $endDate = trim($_GET['end_date']);
        
        // Validate date format (YYYY-MM-DD)
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $startDate) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $endDate)) {
            $query .= " AND DATE(fa.date_submitted) BETWEEN ? AND ?";
            $params[] = $startDate;
            $params[] = $endDate;
            $types .= "ss";
        }
    }
    
    // Add ordering and pagination
    $query .= " ORDER BY fa.created_at DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    $types .= "ii";
    
    // Prepare and execute query
    if (!$stmt = $conn->prepare($query)) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    // Bind parameters if any
    if ($params) {
        $stmt->bind_param($types, ...$params);
    }
    
    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }
    
    $result = $stmt->get_result();
    
    $applications = [];
    while ($row = $result->fetch_assoc()) {
        // Format name
        $middle = !empty($row['middle_initial']) ? $row['middle_initial'] . '. ' : '';
        $row['full_name'] = trim($row['first_name'] . ' ' . $middle . $row['last_name']);
        
        // application_id is already in TP20240001 format (VARCHAR)
        $row['display_id'] = $row['application_id'];
        
        // Format dates
        $row['created_at_formatted'] = !empty($row['created_at']) ? 
            date('M d, Y h:i A', strtotime($row['created_at'])) : '';
        
        $row['birth_date_formatted'] = !empty($row['birth_date']) ? 
            date('M d, Y', strtotime($row['birth_date'])) : '';
        
        $row['lto_expiration_date_formatted'] = !empty($row['lto_expiration_date']) ? 
            date('M d, Y', strtotime($row['lto_expiration_date'])) : '';
        
        $row['date_submitted_formatted'] = !empty($row['date_submitted']) ? 
            date('M d, Y', strtotime($row['date_submitted'])) : '';
        
        // Calculate age from birth date
        if (!empty($row['birth_date'])) {
            $birthDate = new DateTime($row['birth_date']);
            $today = new DateTime();
            $row['age'] = $birthDate->diff($today)->y;
        } else {
            $row['age'] = null;
        }
        
        // Convert numeric fields
        $row['user_id'] = (int)$row['user_id'];
        $row['year_acquired'] = (int)$row['year_acquired'];
        
        $applications[] = $row;
    }
    
    $stmt->close();
    
    // Get total count
    $totalResult = $conn->query("SELECT FOUND_ROWS() as total");
    if (!$totalResult) {
        throw new Exception("Failed to get total count: " . $conn->error);
    }
    
    $totalRow = $totalResult->fetch_assoc();
    $total = $totalRow['total'];
    
    // Get statistics
    $statsQuery = "SELECT 
                    COUNT(*) as total_applications,
                    SUM(CASE WHEN permit_subtype = 'MTOP' THEN 1 ELSE 0 END) as total_mtop,
                    SUM(CASE WHEN permit_subtype = 'FRANCHISE' THEN 1 ELSE 0 END) as total_franchise,
                    SUM(CASE WHEN permit_type = 'NEW' THEN 1 ELSE 0 END) as total_new,
                    SUM(CASE WHEN permit_type = 'RENEWAL' THEN 1 ELSE 0 END) as total_renewal,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                    SUM(CASE WHEN status = 'under_review' THEN 1 ELSE 0 END) as under_review
                  FROM franchise_permit_applications";
    
    $statsResult = $conn->query($statsQuery);
    $stats = $statsResult ? $statsResult->fetch_assoc() : [];
    
    $conn->close();
    
    $response['success'] = true;
    $response['message'] = 'Applications fetched successfully';
    $response['data'] = $applications;
    $response['stats'] = [
        'total' => (int)$total,
        'page' => $page,
        'limit' => $limit,
        'pages' => ceil($total / $limit),
        'overall' => [
            'total' => (int)($stats['total_applications'] ?? 0),
            'mtop' => (int)($stats['total_mtop'] ?? 0),
            'franchise' => (int)($stats['total_franchise'] ?? 0),
            'new' => (int)($stats['total_new'] ?? 0),
            'renewal' => (int)($stats['total_renewal'] ?? 0),
            'pending' => (int)($stats['pending'] ?? 0),
            'approved' => (int)($stats['approved'] ?? 0),
            'rejected' => (int)($stats['rejected'] ?? 0),
            'under_review' => (int)($stats['under_review'] ?? 0)
        ]
    ];
    
} catch (Exception $e) {
    $response['message'] = $e->getMessage();
    error_log("Error in admin_fetch.php: " . $e->getMessage());
    
    // Close connection if still open
    if (isset($conn) && $conn) {
        $conn->close();
    }
}

// Output JSON response
echo json_encode($response, JSON_UNESCAPED_UNICODE);
?>