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

// Parse parameters
$mode = isset($_GET['mode']) ? sanitize($_GET['mode']) : 'all';
$userEmail = isset($_GET['email']) ? sanitize($_GET['email']) : '';
$page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$limit = isset($_GET['limit']) ? min(100, max(10, intval($_GET['limit']))) : 20;
$filterCategory = isset($_GET['category']) ? sanitize($_GET['category']) : 'all';
$filterUser = isset($_GET['filter_user']) ? sanitize($_GET['filter_user']) : '';
$search = isset($_GET['search']) ? sanitize($_GET['search']) : '';
$dateFrom = isset($_GET['date_from']) ? sanitize($_GET['date_from']) : '';
$dateTo = isset($_GET['date_to']) ? sanitize($_GET['date_to']) : '';

if ($mode === 'user' && empty($userEmail)) {
    sendError('User email is required for user mode', 400);
}

$host = "localhost";
$allActivities = [];
$usersMap = [];

// =====================================================
// PRIMARY SOURCE: activity_logs table
// =====================================================
try {
    $conn = new mysqli($host, 'eplms_thea', 'mypassword', 'eplms_user_management');
    if (!$conn->connect_error) {
        $conn->set_charset("utf8mb4");

        $tableCheck = $conn->query("SHOW TABLES LIKE 'activity_logs'");
        if ($tableCheck && $tableCheck->num_rows > 0) {

            $conditions = [];
            $params = [];
            $types = "";

            // User filter (for user mode)
            if ($mode === 'user' && !empty($userEmail)) {
                $conditions[] = "user_email = ?";
                $params[] = $userEmail;
                $types .= "s";
            }

            // Admin filtering by specific user
            if ($mode === 'all' && !empty($filterUser)) {
                $conditions[] = "user_email = ?";
                $params[] = $filterUser;
                $types .= "s";
            }

            // Category filter
            if ($filterCategory !== 'all') {
                $conditions[] = "action_category = ?";
                $params[] = $filterCategory;
                $types .= "s";
            }

            // Search filter
            if (!empty($search)) {
                $conditions[] = "(user_name LIKE ? OR user_email LIKE ? OR description LIKE ? OR module LIKE ? OR action LIKE ?)";
                $searchTerm = "%{$search}%";
                $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm]);
                $types .= "sssss";
            }

            // Date filters
            if (!empty($dateFrom)) {
                $conditions[] = "created_at >= ?";
                $params[] = $dateFrom . " 00:00:00";
                $types .= "s";
            }
            if (!empty($dateTo)) {
                $conditions[] = "created_at <= ?";
                $params[] = $dateTo . " 23:59:59";
                $types .= "s";
            }

            $where = count($conditions) > 0 ? "WHERE " . implode(" AND ", $conditions) : "";
            $query = "SELECT * FROM activity_logs {$where} ORDER BY created_at DESC";

            $stmt = $conn->prepare($query);
            if ($stmt) {
                if (!empty($params)) {
                    $stmt->bind_param($types, ...$params);
                }
                $stmt->execute();
                $result = $stmt->get_result();

                while ($row = $result->fetch_assoc()) {
                    $meta = null;
                    if (!empty($row['metadata'])) {
                        $meta = json_decode($row['metadata'], true);
                    }

                    $allActivities[] = [
                        'id' => 'ACT-' . $row['id'],
                        'date' => $row['created_at'],
                        'user_name' => $row['user_name'] ?? '',
                        'user_email' => $row['user_email'] ?? '',
                        'user_role' => $row['user_role'] ?? 'user',
                        'action' => $row['action'] ?? '',
                        'action_category' => $row['action_category'] ?? 'system',
                        'description' => $row['description'] ?? '',
                        'module' => $row['module'] ?? '',
                        'reference_id' => $row['reference_id'] ?? '',
                        'ip_address' => $row['ip_address'] ?? '',
                        'metadata' => $meta,
                        'source' => 'activity_logs',
                    ];

                    // Track users for admin panel
                    $email = $row['user_email'] ?? '';
                    if (!empty($email)) {
                        if (!isset($usersMap[$email])) {
                            $usersMap[$email] = [
                                'email' => $email,
                                'name' => $row['user_name'] ?? '',
                                'role' => $row['user_role'] ?? 'user',
                                'activity_count' => 0,
                            ];
                        }
                        $usersMap[$email]['activity_count']++;
                        if (empty($usersMap[$email]['name']) && !empty($row['user_name'])) {
                            $usersMap[$email]['name'] = $row['user_name'];
                        }
                    }
                }
                $stmt->close();
            }
        }

        // =====================================================
        // SECONDARY SOURCE: User registrations from users table
        // =====================================================
        if ($filterCategory === 'all' || $filterCategory === 'account') {
            $regConditions = [];
            $regParams = [];
            $regTypes = "";

            if ($mode === 'user' && !empty($userEmail)) {
                $regConditions[] = "email = ?";
                $regParams[] = $userEmail;
                $regTypes .= "s";
            }
            if ($mode === 'all' && !empty($filterUser)) {
                $regConditions[] = "email = ?";
                $regParams[] = $filterUser;
                $regTypes .= "s";
            }
            if (!empty($dateFrom)) {
                $regConditions[] = "created_at >= ?";
                $regParams[] = $dateFrom . " 00:00:00";
                $regTypes .= "s";
            }
            if (!empty($dateTo)) {
                $regConditions[] = "created_at <= ?";
                $regParams[] = $dateTo . " 23:59:59";
                $regTypes .= "s";
            }

            $regWhere = count($regConditions) > 0 ? "WHERE " . implode(" AND ", $regConditions) : "";
            $regQuery = "SELECT id, first_name, last_name, email, role, created_at FROM users {$regWhere} ORDER BY created_at DESC";

            $regStmt = $conn->prepare($regQuery);
            if ($regStmt) {
                if (!empty($regParams)) {
                    $regStmt->bind_param($regTypes, ...$regParams);
                }
                $regStmt->execute();
                $regResult = $regStmt->get_result();

                while ($row = $regResult->fetch_assoc()) {
                    $regEmail = $row['email'] ?? '';
                    $regName = trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? ''));

                    // Avoid duplicates: skip if activity_logs already has a Registration entry for this user
                    $isDuplicate = false;
                    foreach ($allActivities as $existing) {
                        if ($existing['user_email'] === $regEmail && $existing['action'] === 'Registration') {
                            $isDuplicate = true;
                            break;
                        }
                    }
                    if ($isDuplicate) continue;

                    $allActivities[] = [
                        'id' => 'REG-' . ($row['id'] ?? 0),
                        'date' => $row['created_at'] ?? null,
                        'user_name' => $regName,
                        'user_email' => $regEmail,
                        'user_role' => $row['role'] ?? 'user',
                        'action' => 'Registration',
                        'action_category' => 'account',
                        'description' => "{$regName} registered a new account",
                        'module' => 'Authentication',
                        'reference_id' => '',
                        'ip_address' => '',
                        'metadata' => null,
                        'source' => 'users_table',
                    ];

                    if (!empty($regEmail) && !isset($usersMap[$regEmail])) {
                        $usersMap[$regEmail] = [
                            'email' => $regEmail,
                            'name' => $regName,
                            'role' => $row['role'] ?? 'user',
                            'activity_count' => 0,
                        ];
                    }
                    if (!empty($regEmail)) {
                        $usersMap[$regEmail]['activity_count']++;
                    }
                }
                $regStmt->close();
            }
        }

        $conn->close();
    }
} catch (Exception $e) {
    error_log("Audit Trail: User management DB error: " . $e->getMessage());
}

// =====================================================
// SECONDARY SOURCE: Permit applications from permit DBs
// =====================================================
if ($filterCategory === 'all' || $filterCategory === 'permit') {

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

    foreach ($databases as $key => $db) {
        $pConn = new mysqli($host, $db['user'], $db['pass'], $db['name']);
        if ($pConn->connect_error) {
            error_log("Audit Trail: Failed to connect to {$db['name']}: " . $pConn->connect_error);
            continue;
        }
        $pConn->set_charset("utf8mb4");

        $conditions = [];
        $params = [];
        $types = "";

        if ($mode === 'user' && !empty($userEmail)) {
            $conditions[] = "{$db['email_col']} = ?";
            $params[] = $userEmail;
            $types .= "s";
        }
        if ($mode === 'all' && !empty($filterUser)) {
            $conditions[] = "{$db['email_col']} = ?";
            $params[] = $filterUser;
            $types .= "s";
        }
        if (!empty($search)) {
            $searchConds = [];
            $searchConds[] = "CONCAT({$db['name_cols'][0]}, ' ', {$db['name_cols'][1]}) LIKE ?";
            $params[] = "%{$search}%";
            $types .= "s";
            if ($db['business_col']) {
                $searchConds[] = "{$db['business_col']} LIKE ?";
                $params[] = "%{$search}%";
                $types .= "s";
            }
            $searchConds[] = "{$db['email_col']} LIKE ?";
            $params[] = "%{$search}%";
            $types .= "s";
            $conditions[] = "(" . implode(" OR ", $searchConds) . ")";
        }
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

        $stmt = $pConn->prepare($query);
        if (!$stmt) {
            error_log("Audit Trail: Failed to prepare for {$db['name']}: " . $pConn->error);
            $pConn->close();
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
            $action = 'Permit Submission';
            $actionDesc = "Submitted a {$db['permitType']} application";
            $statusLower = strtolower($status);
            if ($statusLower === 'approved') {
                $action = 'Permit Approved';
                $actionDesc = "{$db['permitType']} application was approved";
            } elseif ($statusLower === 'rejected') {
                $action = 'Permit Rejected';
                $actionDesc = "{$db['permitType']} application was rejected";
            } elseif ($statusLower === 'for compliance' || $statusLower === 'compliance') {
                $action = 'For Compliance';
                $actionDesc = "{$db['permitType']} application requires compliance";
            } elseif ($statusLower === 'under review' || $statusLower === 'under_review') {
                $action = 'Under Review';
                $actionDesc = "{$db['permitType']} application is under review";
            }

            // Check for duplicate (activity_logs already captured this submission)
            $isDuplicate = false;
            foreach ($allActivities as $existing) {
                if ($existing['user_email'] === $email
                    && $existing['action'] === 'Permit Submission'
                    && $existing['module'] === $db['permitType']
                    && !empty($existing['reference_id'])
                    && $existing['reference_id'] == $permitId) {
                    $isDuplicate = true;
                    break;
                }
            }
            if ($isDuplicate) continue;

            $allActivities[] = [
                'id' => $formattedId,
                'date' => $date,
                'user_name' => $applicantName,
                'user_email' => $email,
                'user_role' => 'user',
                'action' => $action,
                'action_category' => 'permit',
                'description' => $actionDesc,
                'module' => $db['permitType'],
                'reference_id' => $formattedId,
                'ip_address' => '',
                'metadata' => $businessName ? ['business_name' => $businessName, 'permit_type' => $permitTypeLabel, 'status' => $status] : ['permit_type' => $permitTypeLabel, 'status' => $status],
                'source' => 'permit_db',
            ];

            if (!empty($email)) {
                if (!isset($usersMap[$email])) {
                    $usersMap[$email] = [
                        'email' => $email,
                        'name' => $applicantName,
                        'role' => 'user',
                        'activity_count' => 0,
                    ];
                }
                $usersMap[$email]['activity_count']++;
            }
        }

        $stmt->close();
        $pConn->close();
    }
}

// =====================================================
// Sort all activities by date (most recent first)
// =====================================================
usort($allActivities, function($a, $b) {
    $dateA = strtotime($a['date'] ?? '1970-01-01');
    $dateB = strtotime($b['date'] ?? '1970-01-01');
    return $dateB - $dateA;
});

// =====================================================
// Compute stats BEFORE pagination
// =====================================================
$totalActivities = count($allActivities);

// Count by category
$byCategory = [];
$byAction = [];
$uniqueEmails = [];

foreach ($allActivities as $act) {
    $cat = $act['action_category'] ?? 'system';
    $byCategory[$cat] = ($byCategory[$cat] ?? 0) + 1;

    $actionName = $act['action'] ?? 'Unknown';
    $byAction[$actionName] = ($byAction[$actionName] ?? 0) + 1;

    $em = $act['user_email'] ?? '';
    if (!empty($em)) {
        $uniqueEmails[$em] = true;
    }
}

$stats = [
    'total' => $totalActivities,
    'unique_users' => count($uniqueEmails),
    'by_category' => $byCategory,
    'by_action' => $byAction,
];

// =====================================================
// Pagination
// =====================================================
$totalPages = max(1, ceil($totalActivities / $limit));
$offset = ($page - 1) * $limit;
$paginatedActivities = array_slice($allActivities, $offset, $limit);

// Remove internal 'source' field from output
$paginatedActivities = array_map(function($a) {
    unset($a['source']);
    return $a;
}, $paginatedActivities);

// Build users list sorted by activity count (for admin panel)
$usersList = array_values($usersMap);
usort($usersList, function($a, $b) {
    return $b['activity_count'] - $a['activity_count'];
});

echo json_encode([
    'success' => true,
    'message' => 'Audit trail fetched successfully',
    'activities' => $paginatedActivities,
    'stats' => $stats,
    'users' => $usersList,
    'pagination' => [
        'current_page' => $page,
        'total_pages' => $totalPages,
        'total_items' => $totalActivities,
        'per_page' => $limit,
    ]
], JSON_UNESCAPED_UNICODE);
