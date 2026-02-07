<?php
error_reporting(0);
ini_set('display_errors', '0');
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
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Only GET method allowed']);
    exit;
}

$issuedPermits = [];
$now = date('Y-m-d H:i:s');

// ===== BUSINESS PERMIT =====
try {
    $conn = new mysqli('localhost', 'eplms_paul', 'mypassword', 'eplms_business_permit_db');
    if (!$conn->connect_error) {
        $conn->set_charset("utf8mb4");
        $query = "SELECT 
                    permit_id,
                    applicant_id,
                    owner_first_name,
                    owner_last_name,
                    owner_middle_name,
                    business_name,
                    trade_name,
                    email_address,
                    contact_number,
                    home_address,
                    permit_type,
                    status,
                    date_submitted,
                    application_date,
                    approved_date,
                    validity_date,
                    capital_investment
                  FROM business_permit_applications 
                  WHERE UPPER(status) = 'APPROVED'
                  ORDER BY approved_date DESC, date_submitted DESC";
        
        $result = $conn->query($query);
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $approvedDate = $row['approved_date'] ?? $row['application_date'] ?? $row['date_submitted'] ?? null;
                $expirationDate = $row['validity_date'] ?? null;
                
                if (!$expirationDate && $approvedDate) {
                    $expirationDate = date('Y-m-d', strtotime($approvedDate . ' +1 year'));
                }
                
                $isExpired = false;
                if ($expirationDate) {
                    $isExpired = strtotime($expirationDate) < strtotime($now);
                }
                
                $issuedPermits[] = [
                    'id' => $row['permit_id'] ?? 'N/A',
                    'applicant_id' => $row['applicant_id'] ?? '',
                    'permitCategory' => 'Business Permit',
                    'permitType' => $row['permit_type'] ?? 'New',
                    'applicantName' => trim(($row['owner_first_name'] ?? '') . ' ' . ($row['owner_middle_name'] ?? '') . ' ' . ($row['owner_last_name'] ?? '')),
                    'businessName' => $row['business_name'] ?? $row['trade_name'] ?? 'N/A',
                    'email' => $row['email_address'] ?? '',
                    'contactNumber' => $row['contact_number'] ?? 'N/A',
                    'address' => $row['home_address'] ?? 'N/A',
                    'approvedDate' => $approvedDate,
                    'expirationDate' => $expirationDate,
                    'isExpired' => $isExpired,
                    'daysUntilExpiry' => $expirationDate ? (int)round((strtotime($expirationDate) - strtotime($now)) / 86400) : null,
                    'investment' => $row['capital_investment'] ?? '0.00'
                ];
            }
        }
        $conn->close();
    }
} catch (Exception $e) {
    error_log("Issued Permits - Business permit error: " . $e->getMessage());
}

// ===== BARANGAY PERMIT =====
try {
    $conn = new mysqli('localhost', 'eplms_karl', 'mypassword', 'eplms_barangay_permit_db');
    if (!$conn->connect_error) {
        $conn->set_charset("utf8mb4");
        $query = "SELECT 
                    permit_id,
                    first_name,
                    last_name,
                    middle_name,
                    email,
                    mobile_number,
                    house_no,
                    street,
                    barangay,
                    purpose,
                    status,
                    created_at,
                    updated_at,
                    approved_date,
                    expiration_date
                  FROM barangay_permit 
                  WHERE LOWER(status) = 'approved'
                  ORDER BY updated_at DESC, created_at DESC";
        
        $result = $conn->query($query);
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $approvedDate = $row['approved_date'] ?? $row['updated_at'] ?? $row['created_at'] ?? null;
                $expirationDate = $row['expiration_date'] ?? null;
                
                if (!$expirationDate && $approvedDate) {
                    $expirationDate = date('Y-m-d', strtotime($approvedDate . ' +1 year'));
                }
                
                $isExpired = false;
                if ($expirationDate) {
                    $isExpired = strtotime($expirationDate) < strtotime($now);
                }
                
                $issuedPermits[] = [
                    'id' => $row['permit_id'] ?? 'N/A',
                    'applicant_id' => '',
                    'permitCategory' => 'Barangay Permit',
                    'permitType' => 'Clearance',
                    'applicantName' => trim(($row['first_name'] ?? '') . ' ' . ($row['middle_name'] ?? '') . ' ' . ($row['last_name'] ?? '')),
                    'businessName' => $row['purpose'] ?? 'N/A',
                    'email' => $row['email'] ?? '',
                    'contactNumber' => $row['mobile_number'] ?? 'N/A',
                    'address' => trim(($row['house_no'] ?? '') . ' ' . ($row['street'] ?? '') . ', ' . ($row['barangay'] ?? '')),
                    'approvedDate' => $approvedDate,
                    'expirationDate' => $expirationDate,
                    'isExpired' => $isExpired,
                    'daysUntilExpiry' => $expirationDate ? (int)round((strtotime($expirationDate) - strtotime($now)) / 86400) : null,
                    'investment' => '0.00'
                ];
            }
        }
        $conn->close();
    }
} catch (Exception $e) {
    error_log("Issued Permits - Barangay permit error: " . $e->getMessage());
}

// ===== BUILDING PERMIT =====
try {
    $conn = new mysqli('localhost', 'eplms_ella', 'mypassword', 'eplms_building_permit_db');
    if (!$conn->connect_error) {
        $conn->set_charset("utf8mb4");
        $query = "SELECT 
                    a.application_id,
                    a.status,
                    a.permit_action,
                    a.permit_group,
                    a.use_of_permit,
                    a.total_estimated_cost,
                    a.proposed_date_of_construction,
                    a.expected_date_of_completion,
                    a.updated_at,
                    a.approved_date,
                    a.expiration_date,
                    ap.first_name,
                    ap.last_name,
                    ap.middle_initial,
                    ap.email,
                    ap.contact_no,
                    ap.home_address
                  FROM application a 
                  JOIN applicant ap ON a.applicant_id = ap.applicant_id 
                  WHERE UPPER(a.status) = 'APPROVED'
                  ORDER BY a.updated_at DESC, a.application_id DESC";
        
        $result = $conn->query($query);
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $approvedDate = $row['approved_date'] ?? $row['updated_at'] ?? $row['proposed_date_of_construction'] ?? null;
                $expirationDate = $row['expiration_date'] ?? null;
                
                if (!$expirationDate && $approvedDate) {
                    $expirationDate = date('Y-m-d', strtotime($approvedDate . ' +1 year'));
                }
                
                $isExpired = false;
                if ($expirationDate) {
                    $isExpired = strtotime($expirationDate) < strtotime($now);
                }
                
                $issuedPermits[] = [
                    'id' => $row['application_id'] ?? 'N/A',
                    'applicant_id' => '',
                    'permitCategory' => 'Building Permit',
                    'permitType' => $row['permit_action'] ?? $row['permit_group'] ?? 'New',
                    'applicantName' => trim(($row['first_name'] ?? '') . ' ' . ($row['middle_initial'] ?? '') . ' ' . ($row['last_name'] ?? '')),
                    'businessName' => $row['use_of_permit'] ?? 'N/A',
                    'email' => $row['email'] ?? '',
                    'contactNumber' => $row['contact_no'] ?? 'N/A',
                    'address' => $row['home_address'] ?? 'N/A',
                    'approvedDate' => $approvedDate,
                    'expirationDate' => $expirationDate,
                    'isExpired' => $isExpired,
                    'daysUntilExpiry' => $expirationDate ? (int)round((strtotime($expirationDate) - strtotime($now)) / 86400) : null,
                    'investment' => $row['total_estimated_cost'] ?? '0.00'
                ];
            }
        }
        $conn->close();
    }
} catch (Exception $e) {
    error_log("Issued Permits - Building permit error: " . $e->getMessage());
}

// ===== FRANCHISE PERMIT =====
try {
    $conn = new mysqli('localhost', 'eplms_kobe', 'mypassword', 'eplms_franchise_applications');
    if (!$conn->connect_error) {
        $conn->set_charset("utf8mb4");
        $query = "SELECT 
                    application_id,
                    first_name,
                    last_name,
                    middle_name,
                    email,
                    contact_number,
                    home_address,
                    toda_name,
                    permit_type,
                    permit_subtype,
                    status,
                    date_submitted,
                    date_approved,
                    expiry_date,
                    created_at
                  FROM franchise_permit_applications 
                  WHERE LOWER(status) = 'approved'
                  ORDER BY date_approved DESC, created_at DESC";
        
        $result = $conn->query($query);
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $approvedDate = $row['date_approved'] ?? $row['created_at'] ?? $row['date_submitted'] ?? null;
                $expirationDate = $row['expiry_date'] ?? null;
                
                if (!$expirationDate && $approvedDate) {
                    $expirationDate = date('Y-m-d', strtotime($approvedDate . ' +1 year'));
                }
                
                $isExpired = false;
                if ($expirationDate) {
                    $isExpired = strtotime($expirationDate) < strtotime($now);
                }
                
                $issuedPermits[] = [
                    'id' => $row['application_id'] ?? 'N/A',
                    'applicant_id' => '',
                    'permitCategory' => 'Franchise Permit',
                    'permitType' => ($row['permit_subtype'] ?? '') . ' - ' . ($row['permit_type'] ?? 'New'),
                    'applicantName' => trim(($row['first_name'] ?? '') . ' ' . ($row['middle_name'] ?? '') . ' ' . ($row['last_name'] ?? '')),
                    'businessName' => $row['toda_name'] ?? 'N/A',
                    'email' => $row['email'] ?? '',
                    'contactNumber' => $row['contact_number'] ?? 'N/A',
                    'address' => $row['home_address'] ?? 'N/A',
                    'approvedDate' => $approvedDate,
                    'expirationDate' => $expirationDate,
                    'isExpired' => $isExpired,
                    'daysUntilExpiry' => $expirationDate ? (int)round((strtotime($expirationDate) - strtotime($now)) / 86400) : null,
                    'investment' => '0.00'
                ];
            }
        }
        $conn->close();
    }
} catch (Exception $e) {
    error_log("Issued Permits - Franchise permit error: " . $e->getMessage());
}

// Calculate summary stats
$totalIssued = count($issuedPermits);
$totalExpired = count(array_filter($issuedPermits, fn($p) => $p['isExpired']));
$totalActive = $totalIssued - $totalExpired;
$expiringSoon = count(array_filter($issuedPermits, fn($p) => !$p['isExpired'] && $p['daysUntilExpiry'] !== null && $p['daysUntilExpiry'] <= 30 && $p['daysUntilExpiry'] >= 0));

// Sort by expiration date (soonest first)
usort($issuedPermits, function($a, $b) {
    $dateA = strtotime($a['expirationDate'] ?? '2099-12-31');
    $dateB = strtotime($b['expirationDate'] ?? '2099-12-31');
    return $dateA - $dateB;
});

echo json_encode([
    'success' => true,
    'message' => 'Issued permits fetched successfully',
    'permits' => $issuedPermits,
    'stats' => [
        'totalIssued' => $totalIssued,
        'totalActive' => $totalActive,
        'totalExpired' => $totalExpired,
        'expiringSoon' => $expiringSoon
    ]
], JSON_UNESCAPED_UNICODE);
