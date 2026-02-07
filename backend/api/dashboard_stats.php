<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = "localhost";
$user = "root";
$pass = "";

$response = [
    'success' => false,
    'business' => ['total' => 0, 'pending' => 0, 'approved' => 0, 'rejected' => 0, 'compliance' => 0, 'recent' => [], 'monthly' => [], 'weekly' => []],
    'franchise' => ['total' => 0, 'pending' => 0, 'approved' => 0, 'rejected' => 0, 'under_review' => 0, 'recent' => [], 'monthly' => [], 'weekly' => []],
    'barangay' => ['total' => 0, 'pending' => 0, 'approved' => 0, 'rejected' => 0, 'recent' => [], 'monthly' => [], 'weekly' => []],
    'building' => ['total' => 0, 'pending' => 0, 'approved' => 0, 'rejected' => 0, 'recent' => [], 'monthly' => [], 'weekly' => []]
];

// ============ BUSINESS PERMIT ============
try {
    $conn = new mysqli($host, $user, $pass, "eplms_business_permit_db");
    if (!$conn->connect_error) {
        $conn->set_charset("utf8mb4");

        // Status counts
        $result = $conn->query("SELECT status, COUNT(*) as count FROM business_permit_applications GROUP BY status");
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $response['business']['total'] += (int)$row['count'];
                $s = strtolower($row['status'] ?? '');
                if ($s === 'pending') $response['business']['pending'] = (int)$row['count'];
                elseif ($s === 'approved') $response['business']['approved'] = (int)$row['count'];
                elseif ($s === 'rejected') $response['business']['rejected'] = (int)$row['count'];
                elseif ($s === 'compliance') $response['business']['compliance'] = (int)$row['count'];
            }
        }

        // All applications
        $result = $conn->query("SELECT permit_id, owner_first_name, owner_last_name, business_name, status, permit_type, date_submitted, application_date FROM business_permit_applications ORDER BY COALESCE(date_submitted, application_date) DESC");
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $response['business']['recent'][] = [
                    'id' => 'BUS-' . str_pad($row['permit_id'], 4, '0', STR_PAD_LEFT),
                    'applicant' => trim(($row['owner_first_name'] ?? '') . ' ' . ($row['owner_last_name'] ?? '')),
                    'business_name' => $row['business_name'] ?? '',
                    'status' => ucfirst(strtolower($row['status'] ?? 'pending')),
                    'type' => $row['permit_type'] ?? 'New',
                    'date' => $row['date_submitted'] ?? $row['application_date'] ?? '',
                    'permit_type' => 'Business'
                ];
            }
        }

        // Monthly trend (last 12 months)
        $result = $conn->query("SELECT DATE_FORMAT(COALESCE(date_submitted, application_date), '%Y-%m') as month, COUNT(*) as count, SUM(CASE WHEN UPPER(status) = 'APPROVED' THEN 1 ELSE 0 END) as approved, SUM(CASE WHEN UPPER(status) = 'REJECTED' THEN 1 ELSE 0 END) as rejected FROM business_permit_applications WHERE COALESCE(date_submitted, application_date) >= DATE_SUB(NOW(), INTERVAL 12 MONTH) GROUP BY month ORDER BY month ASC");
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $response['business']['monthly'][] = $row;
            }
        }

        // Weekly trend (last 8 weeks)
        $result = $conn->query("SELECT YEARWEEK(COALESCE(date_submitted, application_date), 1) as week_num, MIN(DATE(COALESCE(date_submitted, application_date))) as week_start, COUNT(*) as count FROM business_permit_applications WHERE COALESCE(date_submitted, application_date) >= DATE_SUB(NOW(), INTERVAL 8 WEEK) GROUP BY week_num ORDER BY week_num ASC");
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $response['business']['weekly'][] = $row;
            }
        }

        $conn->close();
    }
} catch (Exception $e) {
    error_log("Dashboard - Business error: " . $e->getMessage());
}

// ============ FRANCHISE PERMIT ============
try {
    $conn = new mysqli($host, $user, $pass, "eplms_franchise_applications");
    if (!$conn->connect_error) {
        $conn->set_charset("utf8mb4");

        $result = $conn->query("SELECT status, COUNT(*) as count FROM franchise_permit_applications GROUP BY status");
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $response['franchise']['total'] += (int)$row['count'];
                $s = strtolower($row['status'] ?? '');
                if ($s === 'pending') $response['franchise']['pending'] = (int)$row['count'];
                elseif ($s === 'approved') $response['franchise']['approved'] = (int)$row['count'];
                elseif ($s === 'rejected') $response['franchise']['rejected'] = (int)$row['count'];
                elseif ($s === 'under_review') $response['franchise']['under_review'] = (int)$row['count'];
            }
        }

        $result = $conn->query("SELECT application_id, first_name, last_name, status, permit_type, date_submitted, created_at FROM franchise_permit_applications ORDER BY COALESCE(created_at, date_submitted) DESC");
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $response['franchise']['recent'][] = [
                    'id' => 'FRN-' . str_pad($row['application_id'], 4, '0', STR_PAD_LEFT),
                    'applicant' => trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? '')),
                    'business_name' => '',
                    'status' => ucfirst(strtolower($row['status'] ?? 'pending')),
                    'type' => $row['permit_type'] ?? 'New',
                    'date' => $row['created_at'] ?? $row['date_submitted'] ?? '',
                    'permit_type' => 'Franchise'
                ];
            }
        }

        $result = $conn->query("SELECT DATE_FORMAT(COALESCE(created_at, date_submitted), '%Y-%m') as month, COUNT(*) as count, SUM(CASE WHEN LOWER(status) = 'approved' THEN 1 ELSE 0 END) as approved, SUM(CASE WHEN LOWER(status) = 'rejected' THEN 1 ELSE 0 END) as rejected FROM franchise_permit_applications WHERE COALESCE(created_at, date_submitted) >= DATE_SUB(NOW(), INTERVAL 12 MONTH) GROUP BY month ORDER BY month ASC");
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $response['franchise']['monthly'][] = $row;
            }
        }

        $result = $conn->query("SELECT YEARWEEK(COALESCE(created_at, date_submitted), 1) as week_num, MIN(DATE(COALESCE(created_at, date_submitted))) as week_start, COUNT(*) as count FROM franchise_permit_applications WHERE COALESCE(created_at, date_submitted) >= DATE_SUB(NOW(), INTERVAL 8 WEEK) GROUP BY week_num ORDER BY week_num ASC");
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $response['franchise']['weekly'][] = $row;
            }
        }

        $conn->close();
    }
} catch (Exception $e) {
    error_log("Dashboard - Franchise error: " . $e->getMessage());
}

// ============ BARANGAY PERMIT ============
try {
    $conn = new mysqli($host, $user, $pass, "eplms_barangay_permit_db");
    if (!$conn->connect_error) {
        $conn->set_charset("utf8mb4");

        $result = $conn->query("SELECT status, COUNT(*) as count FROM barangay_permit GROUP BY status");
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $response['barangay']['total'] += (int)$row['count'];
                $s = strtolower($row['status'] ?? '');
                if ($s === 'pending') $response['barangay']['pending'] = (int)$row['count'];
                elseif ($s === 'approved') $response['barangay']['approved'] = (int)$row['count'];
                elseif ($s === 'rejected') $response['barangay']['rejected'] = (int)$row['count'];
            }
        }

        $result = $conn->query("SELECT permit_id, first_name, last_name, status, purpose, created_at, application_date FROM barangay_permit ORDER BY COALESCE(created_at, application_date) DESC");
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $response['barangay']['recent'][] = [
                    'id' => 'BRG-' . str_pad($row['permit_id'], 4, '0', STR_PAD_LEFT),
                    'applicant' => trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? '')),
                    'business_name' => '',
                    'status' => ucfirst(strtolower($row['status'] ?? 'pending')),
                    'type' => $row['purpose'] ?? 'Clearance',
                    'date' => $row['created_at'] ?? $row['application_date'] ?? '',
                    'permit_type' => 'Barangay'
                ];
            }
        }

        $result = $conn->query("SELECT DATE_FORMAT(COALESCE(created_at, application_date), '%Y-%m') as month, COUNT(*) as count, SUM(CASE WHEN LOWER(status) = 'approved' THEN 1 ELSE 0 END) as approved, SUM(CASE WHEN LOWER(status) = 'rejected' THEN 1 ELSE 0 END) as rejected FROM barangay_permit WHERE COALESCE(created_at, application_date) >= DATE_SUB(NOW(), INTERVAL 12 MONTH) GROUP BY month ORDER BY month ASC");
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $response['barangay']['monthly'][] = $row;
            }
        }

        $result = $conn->query("SELECT YEARWEEK(COALESCE(created_at, application_date), 1) as week_num, MIN(DATE(COALESCE(created_at, application_date))) as week_start, COUNT(*) as count FROM barangay_permit WHERE COALESCE(created_at, application_date) >= DATE_SUB(NOW(), INTERVAL 8 WEEK) GROUP BY week_num ORDER BY week_num ASC");
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $response['barangay']['weekly'][] = $row;
            }
        }

        $conn->close();
    }
} catch (Exception $e) {
    error_log("Dashboard - Barangay error: " . $e->getMessage());
}

// ============ BUILDING PERMIT ============
try {
    $conn = new mysqli($host, $user, $pass, "eplms_building_permit_system");
    if (!$conn->connect_error) {
        $conn->set_charset("utf8mb4");

        // Building permits don't have a status column in the current schema, default to pending
        $result = $conn->query("SELECT COUNT(*) as total FROM application");
        if ($result) {
            $row = $result->fetch_assoc();
            $response['building']['total'] = (int)$row['total'];
            $response['building']['pending'] = (int)$row['total']; // all default pending
        }

        // Check if status column exists
        $statusCheck = $conn->query("SHOW COLUMNS FROM application LIKE 'status'");
        $hasStatus = ($statusCheck && $statusCheck->num_rows > 0);

        if ($hasStatus) {
            $response['building']['pending'] = 0;
            $result = $conn->query("SELECT status, COUNT(*) as count FROM application GROUP BY status");
            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    $s = strtolower($row['status'] ?? '');
                    if ($s === 'pending' || $s === '') $response['building']['pending'] += (int)$row['count'];
                    elseif ($s === 'approved') $response['building']['approved'] = (int)$row['count'];
                    elseif ($s === 'rejected') $response['building']['rejected'] = (int)$row['count'];
                }
            }
        }

        $result = $conn->query("SELECT app.application_id, a.first_name, a.last_name, app.permit_group, app.proposed_date_of_construction, app.total_estimated_cost FROM application app JOIN applicant a ON app.applicant_id = a.applicant_id ORDER BY app.application_id DESC");
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $response['building']['recent'][] = [
                    'id' => 'BLD-' . str_pad($row['application_id'], 4, '0', STR_PAD_LEFT),
                    'applicant' => trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? '')),
                    'business_name' => '',
                    'status' => 'Pending',
                    'type' => $row['permit_group'] ?? 'Building',
                    'date' => $row['proposed_date_of_construction'] ?? '',
                    'permit_type' => 'Building'
                ];
            }
        }

        // Monthly - use proposed_date_of_construction as date reference
        $result = $conn->query("SELECT DATE_FORMAT(app.proposed_date_of_construction, '%Y-%m') as month, COUNT(*) as count FROM application app WHERE app.proposed_date_of_construction >= DATE_SUB(NOW(), INTERVAL 12 MONTH) AND app.proposed_date_of_construction IS NOT NULL GROUP BY month ORDER BY month ASC");
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $row['approved'] = 0;
                $row['rejected'] = 0;
                $response['building']['monthly'][] = $row;
            }
        }

        // Weekly
        $result = $conn->query("SELECT YEARWEEK(app.proposed_date_of_construction, 1) as week_num, MIN(DATE(app.proposed_date_of_construction)) as week_start, COUNT(*) as count FROM application app WHERE app.proposed_date_of_construction >= DATE_SUB(NOW(), INTERVAL 8 WEEK) AND app.proposed_date_of_construction IS NOT NULL GROUP BY week_num ORDER BY week_num ASC");
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $response['building']['weekly'][] = $row;
            }
        }

        $conn->close();
    }
} catch (Exception $e) {
    error_log("Dashboard - Building error: " . $e->getMessage());
}

$response['success'] = true;
$response['timestamp'] = date('c');

echo json_encode($response, JSON_UNESCAPED_UNICODE);
?>
