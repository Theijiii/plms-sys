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

if ($conn->connect_error) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $conn->connect_error
    ]);
    exit;
}
 
try {
    // Get filter parameters
    $status = $_GET['status'] ?? null;
    $search = $_GET['search'] ?? '';
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
    $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
    $sort_by = $_GET['sort_by'] ?? 'application_date';
    $sort_order = $_GET['sort_order'] ?? 'DESC';
 
    // Validate sort parameters
    $allowed_sort_columns = ['application_date', 'owner_last_name', 'business_name', 'capital_investment', 'total_employees', 'status'];
    $sort_by = in_array($sort_by, $allowed_sort_columns) ? $sort_by : 'application_date';
    $sort_order = strtoupper($sort_order) === 'ASC' ? 'ASC' : 'DESC';
 
    // Build base query - FIXED: Removed bp. prefix since we're not using table alias
    $sql = "SELECT 
                business_permit_applications.permit_id,
                business_permit_applications.applicant_id,
                business_permit_applications.application_date,
                business_permit_applications.permit_type,
                business_permit_applications.status,
                business_permit_applications.owner_last_name,
                business_permit_applications.owner_first_name,
                business_permit_applications.owner_middle_name,
                business_permit_applications.owner_type,
                business_permit_applications.citizenship,
                business_permit_applications.date_of_birth,
                business_permit_applications.contact_number,
                business_permit_applications.email_address,
                business_permit_applications.home_address,
                business_permit_applications.valid_id_type,
                business_permit_applications.valid_id_number,
                business_permit_applications.business_name,
                business_permit_applications.trade_name,
                business_permit_applications.business_nature,
                business_permit_applications.building_type,
                business_permit_applications.capital_investment,
                business_permit_applications.province,
                business_permit_applications.city_municipality,
                business_permit_applications.barangay,
                business_permit_applications.zip_code,
                business_permit_applications.district,
                business_permit_applications.barangay_clearance_id,
                business_permit_applications.barangay_clearance_status,
                business_permit_applications.business_area,
                business_permit_applications.total_floor_area,
                business_permit_applications.operation_time_from,
                business_permit_applications.operation_time_to,
                business_permit_applications.operation_type,
                business_permit_applications.total_employees,
                business_permit_applications.male_employees,
                business_permit_applications.female_employees,
                business_permit_applications.employees_in_qc,
                business_permit_applications.delivery_van_truck,
                business_permit_applications.delivery_motorcycle,
                business_permit_applications.comments,
                business_permit_applications.date_submitted,
                business_permit_applications.has_barangay_clearance,
                business_permit_applications.has_bir_certificate,
                business_permit_applications.has_lease_or_title,
                business_permit_applications.has_fsic,
                business_permit_applications.has_owner_valid_id,
                business_permit_applications.has_id_picture,
                business_permit_applications.has_official_receipt,
                business_permit_applications.has_owner_scanned_id,
                business_permit_applications.has_dti_registration,
                business_permit_applications.has_sec_registration,
                business_permit_applications.has_representative_scanned_id
            FROM business_permit_applications
            WHERE 1=1";
 
    $params = [];
    $types = "";
 
    // Apply status filter
    if ($status && $status !== 'all') {
        $sql .= " AND business_permit_applications.status = ?";
        $params[] = $status;
        $types .= "s";
    }
 
    // Apply search filter
    if (!empty($search)) {
        $sql .= " AND (
            business_permit_applications.applicant_id LIKE ? OR 
            business_permit_applications.owner_last_name LIKE ? OR 
            business_permit_applications.owner_first_name LIKE ? OR 
            business_permit_applications.business_name LIKE ? OR 
            business_permit_applications.trade_name LIKE ? OR 
            business_permit_applications.email_address LIKE ? OR 
            business_permit_applications.contact_number LIKE ?
        )";
        $searchTerm = "%$search%";
        for ($i = 0; $i < 7; $i++) {
            $params[] = $searchTerm;
            $types .= "s";
        }
    }
 
    // Order and limit
    $sql .= " ORDER BY $sort_by $sort_order LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    $types .= "ii";
 
    // Prepare and execute
    $stmt = $conn->prepare($sql);
    if ($params) {
        $stmt->bind_param($types, ...$params);
    }
 
    if (!$stmt->execute()) {
        throw new Exception("Failed to fetch applications: " . $stmt->error);
    }
 
    $result = $stmt->get_result();
    $applications = [];
 
    while ($row = $result->fetch_assoc()) {
        // Get documents for this application
        $docStmt = $conn->prepare("
            SELECT document_type, document_name, file_path, file_type, file_size 
            FROM application_documents 
            WHERE permit_id = ? 
            ORDER BY document_type
        ");
        $docStmt->bind_param("i", $row['permit_id']);
        $docStmt->execute();
        $docResult = $docStmt->get_result();
 
        $documents = [];
        while ($doc = $docResult->fetch_assoc()) {
            $documents[] = $doc;
        }
        $docStmt->close();
 
        // Count documents
        $docCountStmt = $conn->prepare("
            SELECT COUNT(*) as count 
            FROM application_documents 
            WHERE permit_id = ?
        ");
        $docCountStmt->bind_param("i", $row['permit_id']);
        $docCountStmt->execute();
        $docCountResult = $docCountStmt->get_result();
        $docCount = $docCountResult->fetch_assoc()['count'];
        $docCountStmt->close();
 
        $applications[] = [
            ...$row,
            'documents' => $documents,
            'document_count' => $docCount,
            'full_name' => trim($row['owner_last_name'] . ', ' . $row['owner_first_name'] . ' ' . ($row['owner_middle_name'] ?? '')),
            'business_address' => trim(
                ($row['house_bldg_no'] ?? '') . ' ' .
                ($row['street'] ?? '') . ', ' .
                ($row['barangay'] ?? '') . ', ' .
                ($row['city_municipality'] ?? '') . ', ' .
                ($row['province'] ?? '') . ' ' .
                ($row['zip_code'] ?? '')
            )
        ];
    }
 
    $stmt->close();
 
    // Get counts for different statuses
    $countSql = "SELECT 
                    status,
                    COUNT(*) as count
                FROM business_permit_applications 
                GROUP BY status";
    $countResult = $conn->query($countSql);
 
    $counts = [
        'total' => 0,
        'pending' => 0,
        'approved' => 0,
        'rejected' => 0,
        'compliance' => 0
    ];
 

    while ($countRow = $countResult->fetch_assoc()) {
        $counts['total'] += $countRow['count'];
        switch (strtoupper($countRow['status'])) {
            case 'PENDING':
                $counts['pending'] = $countRow['count'];
                break;
            case 'APPROVED':
                $counts['approved'] = $countRow['count'];
                break;
            case 'REJECTED':
                $counts['rejected'] = $countRow['count'];
                break;
            case 'COMPLIANCE':
                $counts['compliance'] = $countRow['count'];
                break;
        }
    }

    echo json_encode([
        'success' => true,
        'data' => $applications,
        'counts' => $counts,
        'pagination' => [
            'total' => $counts['total'],
            'limit' => $limit,
            'offset' => $offset
        ]
    ]);

} catch (Exception $e) {
    error_log("Error in admin_fetch.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

$conn->close();
?>