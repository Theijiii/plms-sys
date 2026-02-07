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
    echo json_encode(['success' => false, 'message' => $message, 'activities' => []]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Invalid request method. Only GET is allowed.', 405);
}

$mode = isset($_GET['mode']) ? sanitize($_GET['mode']) : 'all';
$userEmail = isset($_GET['email']) ? sanitize($_GET['email']) : '';
$page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$limit = isset($_GET['limit']) ? min(100, max(10, intval($_GET['limit']))) : 20;
$filterType = isset($_GET['type']) ? sanitize($_GET['type']) : 'all';
$filterStatus = isset($_GET['status']) ? sanitize($_GET['status']) : 'all';
$search = isset($_GET['search']) ? sanitize($_GET['search']) : '';
$dateFrom = isset($_GET['date_from']) ? sanitize($_GET['date_from']) : '';
$dateTo = isset($_GET['date_to']) ? sanitize($_GET['date_to']) : '';

// If mode is 'user', email is required
if ($mode === 'user' && empty($userEmail)) {
    sendError('User email is required for user mode', 400);
}

$host = "localhost";

$databases = [
    'business' => [
        'user' => 'eplms_paul',
        'pass' => 'mypassword',
        'name' => 'eplms_business_permit_db',
        'table' => 'business_permit_applications',
        'permitType' => 'Business Permit',
        'id_col' => 'permit_id',
        'prefix' => 'BUS',
        'name_cols' => ['owner_first_name', 'owner_last_name'],
        'business_col' => 'business_name',
        'email_col' => 'email',
        'status_col' => 'status',
        'date_col' => 'date_submitted',
        'alt_date_col' => 'application_date',
        'type_col' => 'permit_type'
    ],
    'barangay' => [
        'user' => 'eplms_karl',
        'pass' => 'mypassword',
        'name' => 'eplms_barangay_permit_db',
        'table' => 'barangay_permit',
        'permitType' => 'Barangay Permit',
        'id_col' => 'permit_id',
        'prefix' => 'BRG',
        'name_cols' => ['first_name', 'last_name'],
        'business_col' => null,
        'email_col' => 'email',
        'status_col' => 'status',
        'date_col' => 'created_at',
        'alt_date_col' => 'application_date',
        'type_col' => 'purpose'
    ],
    'franchise' => [
        'user' => 'eplms_kobe',
        'pass' => 'mypassword',
        'name' => 'eplms_franchise_applications',
        'table' => 'franchise_permit_applications',
        'permitType' => 'Franchise Permit',
        'id_col' => 'application_id',
        'prefix' => 'FRN',
        'name_cols' => ['first_name', 'last_name'],
        'business_col' => null,
        'email_col' => 'email',
        'status_col' => 'status',
        'date_col' => 'date_submitted',
        'alt_date_col' => 'created_at',
        'type_col' => 'permit_type'
    ]
];

$allActivities = [];

foreach ($databases as $key => $db) {
    // Apply permit type filter
    if ($filterType !== 'all' && $filterType !== $key) {
        continue;
    }

    $conn = new mysqli($host, $db['user'], $db['pass'], $db['name']);
    if ($conn->connect_error) {
        error_log("Audit Trail: Failed to connect to {$db['name']}: " . $conn->connect_error);
        continue;
    }
    $conn->set_charset("utf8mb4");

    // Build query
    $conditions = [];
    $params = [];
    $types = "";

    // User filter
    if ($mode === 'user' && !empty($userEmail)) {
        $conditions[] = "{$db['email_col']} = ?";
        $params[] = $userEmail;
        $types .= "s";
    }

    // Status filter
    if ($filterStatus !== 'all') {
        $conditions[] = "LOWER({$db['status_col']}) = LOWER(?)";
        $params[] = $filterStatus;
        $types .= "s";
    }

    // Search filter
    if (!empty($search)) {
        $searchConditions = [];
        $searchConditions[] = "CONCAT({$db['name_cols'][0]}, ' ', {$db['name_cols'][1]}) LIKE ?";
        $params[] = "%{$search}%";
        $types .= "s";

        if ($db['business_col']) {
            $searchConditions[] = "{$db['business_col']} LIKE ?";
            $params[] = "%{$search}%";
            $types .= "s";
        }

        $searchConditions[] = "{$db['email_col']} LIKE ?";
        $params[] = "%{$search}%";
        $types .= "s";

        $conditions[] = "(" . implode(" OR ", $searchConditions) . ")";
    }

    // Date filters
    if (!empty($dateFrom)) {
        $conditions[] = "COALESCE({$db['date_col']}, {$db['alt_date_col']}) >= ?";
        $params[] = $dateFrom;
        $types .= "s";
    }
    if (!empty($dateTo)) {
        $conditions[] = "COALESCE({$db['date_col']}, {$db['alt_date_col']}) <= ?";
        $params[] = $dateTo . " 23:59:59";
        $types .= "s";
    }

    $where = count($conditions) > 0 ? "WHERE " . implode(" AND ", $conditions) : "";

    $query = "SELECT * FROM {$db['table']} {$where} ORDER BY COALESCE({$db['date_col']}, {$db['alt_date_col']}) DESC";

    $stmt = $conn->prepare($query);
    if (!$stmt) {
        error_log("Audit Trail: Failed to prepare for {$db['name']}: " . $conn->error);
        $conn->close();
        continue;
    }

    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }

    $stmt->execute();
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $permitId = $row[$db['id_col']] ?? 0;
        $formattedId = $db['prefix'] . '-' . str_pad($permitId, 4, '0', STR_PAD_LEFT);
        $applicantName = trim(($row[$db['name_cols'][0]] ?? '') . ' ' . ($row[$db['name_cols'][1]] ?? ''));
        $businessName = $db['business_col'] ? ($row[$db['business_col']] ?? '') : '';
        $status = $row[$db['status_col']] ?? 'Pending';
        $date = $row[$db['date_col']] ?? $row[$db['alt_date_col']] ?? null;
        $email = $row[$db['email_col']] ?? '';
        $permitTypeLabel = $row[$db['type_col']] ?? 'New';

        // Determine action based on status
        $action = 'Submitted';
        $actionDescription = "submitted a {$db['permitType']} application";
        if (strtolower($status) === 'approved') {
            $action = 'Approved';
            $actionDescription = "{$db['permitType']} application was approved";
        } elseif (strtolower($status) === 'rejected') {
            $action = 'Rejected';
            $actionDescription = "{$db['permitType']} application was rejected";
        } elseif (strtolower($status) === 'for compliance' || strtolower($status) === 'compliance') {
            $action = 'For Compliance';
            $actionDescription = "{$db['permitType']} application requires compliance";
        } elseif (strtolower($status) === 'under review' || strtolower($status) === 'under_review') {
            $action = 'Under Review';
            $actionDescription = "{$db['permitType']} application is under review";
        } elseif (strtolower($status) === 'pending') {
            $action = 'Submitted';
            $actionDescription = "submitted a {$db['permitType']} application";
        }

        $allActivities[] = [
            'id' => $formattedId,
            'permit_id' => $permitId,
            'permit_type' => $db['permitType'],
            'permit_category' => $key,
            'application_type' => $permitTypeLabel,
            'applicant_name' => $applicantName,
            'business_name' => $businessName,
            'email' => $email,
            'status' => ucfirst(strtolower($status)),
            'action' => $action,
            'action_description' => $actionDescription,
            'date' => $date,
            'remarks' => $row['remarks'] ?? '',
        ];
    }

    $stmt->close();
    $conn->close();
}

// Also fetch user login activities from user management DB
try {
    $userConn = new mysqli($host, 'eplms_thea', 'mypassword', 'eplms_user_management');
    if (!$userConn->connect_error) {
        $userConn->set_charset("utf8mb4");

        // Check if login_logs table exists
        $tableCheck = $userConn->query("SHOW TABLES LIKE 'login_logs'");
        if ($tableCheck && $tableCheck->num_rows > 0) {
            $loginQuery = "SELECT * FROM login_logs";
            $loginConditions = [];
            $loginParams = [];
            $loginTypes = "";

            if ($mode === 'user' && !empty($userEmail)) {
                $loginConditions[] = "email = ?";
                $loginParams[] = $userEmail;
                $loginTypes .= "s";
            }

            if (count($loginConditions) > 0) {
                $loginQuery .= " WHERE " . implode(" AND ", $loginConditions);
            }
            $loginQuery .= " ORDER BY login_time DESC LIMIT 100";

            $loginStmt = $userConn->prepare($loginQuery);
            if ($loginStmt) {
                if (!empty($loginParams)) {
                    $loginStmt->bind_param($loginTypes, ...$loginParams);
                }
                $loginStmt->execute();
                $loginResult = $loginStmt->get_result();
                while ($row = $loginResult->fetch_assoc()) {
                    $allActivities[] = [
                        'id' => 'LOGIN-' . ($row['id'] ?? 0),
                        'permit_id' => null,
                        'permit_type' => 'System',
                        'permit_category' => 'system',
                        'application_type' => 'Login',
                        'applicant_name' => $row['name'] ?? $row['email'] ?? '',
                        'business_name' => '',
                        'email' => $row['email'] ?? '',
                        'status' => $row['status'] ?? 'Success',
                        'action' => 'Login',
                        'action_description' => 'User logged into the system',
                        'date' => $row['login_time'] ?? null,
                        'remarks' => $row['ip_address'] ?? '',
                    ];
                }
                $loginStmt->close();
            }
        }

        // Check if registration data exists - fetch from users table
        if ($mode === 'all' || $filterType === 'all' || $filterType === 'system') {
            $regQuery = "SELECT id, first_name, last_name, email, created_at FROM users";
            $regConditions = [];
            $regParams = [];
            $regTypes = "";

            if ($mode === 'user' && !empty($userEmail)) {
                $regConditions[] = "email = ?";
                $regParams[] = $userEmail;
                $regTypes .= "s";
            }
            if (!empty($dateFrom)) {
                $regConditions[] = "created_at >= ?";
                $regParams[] = $dateFrom;
                $regTypes .= "s";
            }
            if (!empty($dateTo)) {
                $regConditions[] = "created_at <= ?";
                $regParams[] = $dateTo . " 23:59:59";
                $regTypes .= "s";
            }

            if (count($regConditions) > 0) {
                $regQuery .= " WHERE " . implode(" AND ", $regConditions);
            }
            $regQuery .= " ORDER BY created_at DESC";

            $regStmt = $userConn->prepare($regQuery);
            if ($regStmt) {
                if (!empty($regParams)) {
                    $regStmt->bind_param($regTypes, ...$regParams);
                }
                $regStmt->execute();
                $regResult = $regStmt->get_result();
                while ($row = $regResult->fetch_assoc()) {
                    $allActivities[] = [
                        'id' => 'REG-' . ($row['id'] ?? 0),
                        'permit_id' => null,
                        'permit_type' => 'System',
                        'permit_category' => 'system',
                        'application_type' => 'Registration',
                        'applicant_name' => trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? '')),
                        'business_name' => '',
                        'email' => $row['email'] ?? '',
                        'status' => 'Completed',
                        'action' => 'Registration',
                        'action_description' => 'User registered an account',
                        'date' => $row['created_at'] ?? null,
                        'remarks' => '',
                    ];
                }
                $regStmt->close();
            }
        }

        $userConn->close();
    }
} catch (Exception $e) {
    error_log("Audit Trail: User management DB error: " . $e->getMessage());
}

// Sort all activities by date (most recent first)
usort($allActivities, function($a, $b) {
    $dateA = strtotime($a['date'] ?? '1970-01-01');
    $dateB = strtotime($b['date'] ?? '1970-01-01');
    return $dateB - $dateA;
});

// Pagination
$totalActivities = count($allActivities);
$totalPages = ceil($totalActivities / $limit);
$offset = ($page - 1) * $limit;
$paginatedActivities = array_slice($allActivities, $offset, $limit);

// Statistics
$stats = [
    'total' => $totalActivities,
    'submitted' => count(array_filter($allActivities, fn($a) => $a['action'] === 'Submitted')),
    'approved' => count(array_filter($allActivities, fn($a) => $a['action'] === 'Approved')),
    'rejected' => count(array_filter($allActivities, fn($a) => $a['action'] === 'Rejected')),
    'compliance' => count(array_filter($allActivities, fn($a) => $a['action'] === 'For Compliance')),
    'by_type' => [
        'business' => count(array_filter($allActivities, fn($a) => $a['permit_category'] === 'business')),
        'barangay' => count(array_filter($allActivities, fn($a) => $a['permit_category'] === 'barangay')),
        'franchise' => count(array_filter($allActivities, fn($a) => $a['permit_category'] === 'franchise')),
        'system' => count(array_filter($allActivities, fn($a) => $a['permit_category'] === 'system')),
    ]
];

echo json_encode([
    'success' => true,
    'message' => 'Audit trail fetched successfully',
    'activities' => $paginatedActivities,
    'stats' => $stats,
    'pagination' => [
        'current_page' => $page,
        'total_pages' => $totalPages,
        'total_items' => $totalActivities,
        'per_page' => $limit,
    ]
], JSON_UNESCAPED_UNICODE);
