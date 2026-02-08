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

// ===== BUSINESS PERMIT =====
try {
    $conn = new mysqli('localhost', 'eplms_paul', 'mypassword', 'eplms_business_permit_db');
    if (!$conn->connect_error) {
        $conn->set_charset("utf8mb4");
        $query = "SELECT * FROM business_permit_applications WHERE email_address = ? " . ($userId > 0 ? "OR user_id = ? " : "") . "ORDER BY submission_date DESC";
        $stmt = $conn->prepare($query);
        if ($stmt) {
            if ($userId > 0) {
                $stmt->bind_param("si", $userEmail, $userId);
            } else {
                $stmt->bind_param("s", $userEmail);
            }
            $stmt->execute();
            $result = $stmt->get_result();
            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    $allApplications[] = [
                        'id' => $row['permit_id'] ?? 'N/A',
                        'permitType' => 'Business Permit',
                        'application_type' => $row['permit_type'] ?? 'New',
                        'status' => $row['status'] ?? 'Pending',
                        'applicantName' => trim(($row['owner_first_name'] ?? '') . ' ' . ($row['owner_last_name'] ?? '')),
                        'businessName' => $row['business_name'] ?? 'N/A',
                        'email' => $row['email_address'] ?? '',
                        'address' => $row['home_address'] ?? 'N/A',
                        'contactNumber' => $row['contact_number'] ?? 'N/A',
                        'submittedDate' => $row['date_submitted'] ?? $row['submission_date'] ?? null,
                        'approvedDate' => $row['approved_date'] ?? null,
                        'expirationDate' => $row['validity_date'] ?? null,
                        'fees' => $row['capital_investment'] ?? '0.00',
                        'receiptNumber' => $row['official_receipt_no'] ?? 'N/A',
                        'user_id' => $row['user_id'] ?? 0,
                        'remarks' => $row['remarks'] ?? '',
                        'complianceNotes' => $row['comments'] ?? '',
                        'tin' => $row['tin'] ?? '',
                        'businessType' => $row['business_type'] ?? '',
                        'ownershipType' => $row['ownership_type'] ?? '',
                        'businessActivity' => $row['business_activity'] ?? '',
                        'numberOfEmployees' => $row['number_of_employees'] ?? '',
                        'businessArea' => $row['business_area'] ?? '',
                        'dateOfApplication' => $row['date_of_application'] ?? ''
                    ];
                }
            }
            $stmt->close();
        }
        $conn->close();
    }
} catch (Exception $e) {
    error_log("Tracker - Business permit error: " . $e->getMessage());
}

// ===== BUSINESS AMENDMENT =====
try {
    $conn = new mysqli('localhost', 'eplms_paul', 'mypassword', 'eplms_business_permit_db');
    if (!$conn->connect_error) {
        $conn->set_charset("utf8mb4");
        $query = "SELECT * FROM business_amendment_applications WHERE email = ? " . ($userId > 0 ? "OR user_id = ? " : "") . "ORDER BY date_submitted DESC";
        $stmt = $conn->prepare($query);
        if ($stmt) {
            if ($userId > 0) {
                $stmt->bind_param("si", $userEmail, $userId);
            } else {
                $stmt->bind_param("s", $userEmail);
            }
            $stmt->execute();
            $result = $stmt->get_result();
            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    $amendType = $row['amendment_type'] ?? '';
                    $amendLabel = 'Amendment';
                    switch ($amendType) {
                        case 'CHANGE_BUSINESS_NAME': $amendLabel = 'Change Business Name'; break;
                        case 'CHANGE_BUSINESS_LINE': $amendLabel = 'Change Business Line'; break;
                        case 'CHANGE_BUSINESS_LOCATION': $amendLabel = 'Change Business Location'; break;
                        case 'CHANGE_OWNER': $amendLabel = 'Change of Owner'; break;
                    }
                    $allApplications[] = [
                        'id' => $row['applicant_id'] ?? ('AMD-' . ($row['id'] ?? 'N/A')),
                        'permitType' => 'Business Permit',
                        'application_type' => 'Amendment - ' . $amendLabel,
                        'status' => ucfirst($row['status'] ?? 'Pending'),
                        'applicantName' => $row['contact_person'] ?? 'N/A',
                        'businessName' => $row['business_name'] ?? 'N/A',
                        'email' => $row['email'] ?? '',
                        'address' => $row['new_address'] ?? 'N/A',
                        'contactNumber' => $row['contact_number'] ?? 'N/A',
                        'submittedDate' => $row['date_submitted'] ?? $row['application_date'] ?? null,
                        'approvedDate' => $row['approved_date'] ?? null,
                        'expirationDate' => null,
                        'fees' => '0.00',
                        'receiptNumber' => 'N/A',
                        'user_id' => $row['user_id'] ?? 0,
                        'remarks' => $row['amendment_reason'] ?? '',
                        'complianceNotes' => '',
                        'amendmentType' => $amendLabel,
                        'newBusinessName' => $row['new_business_name'] ?? '',
                        'newAddress' => $row['new_address'] ?? ''
                    ];
                }
            }
            $stmt->close();
        }
        $conn->close();
    }
} catch (Exception $e) {
    error_log("Tracker - Business amendment error: " . $e->getMessage());
}

// ===== BARANGAY PERMIT =====
try {
    $conn = new mysqli('localhost', 'eplms_karl', 'mypassword', 'eplms_barangay_permit_db');
    if (!$conn->connect_error) {
        $conn->set_charset("utf8mb4");
        $query = "SELECT * FROM barangay_permit WHERE email = ? " . ($userId > 0 ? "OR user_id = ? " : "") . "ORDER BY created_at DESC";
        $stmt = $conn->prepare($query);
        if ($stmt) {
            if ($userId > 0) {
                $stmt->bind_param("si", $userEmail, $userId);
            } else {
                $stmt->bind_param("s", $userEmail);
            }
            $stmt->execute();
            $result = $stmt->get_result();
            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    $allApplications[] = [
                        'id' => $row['permit_id'] ?? 'N/A',
                        'permitType' => 'Barangay Permit',
                        'application_type' => 'Clearance',
                        'status' => $row['status'] ?? 'Pending',
                        'applicantName' => trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? '')),
                        'businessName' => 'N/A',
                        'email' => $row['email'] ?? '',
                        'address' => trim(($row['house_no'] ?? '') . ' ' . ($row['street'] ?? '') . ', ' . ($row['barangay'] ?? '')),
                        'contactNumber' => $row['mobile_number'] ?? 'N/A',
                        'submittedDate' => $row['created_at'] ?? $row['application_date'] ?? null,
                        'approvedDate' => $row['approved_date'] ?? null,
                        'expirationDate' => $row['expiration_date'] ?? null,
                        'fees' => $row['clearance_fee'] ?? '0.00',
                        'receiptNumber' => $row['receipt_number'] ?? 'N/A',
                        'user_id' => $row['user_id'] ?? 0,
                        'remarks' => $row['purpose'] ?? '',
                        'complianceNotes' => $row['comments'] ?? '',
                        'purpose' => $row['purpose'] ?? '',
                        'barangay' => $row['barangay'] ?? '',
                        'civilStatus' => $row['civil_status'] ?? '',
                        'birthDate' => $row['birth_date'] ?? '',
                        'gender' => $row['gender'] ?? '',
                        'nationality' => $row['nationality'] ?? ''
                    ];
                }
            }
            $stmt->close();
        }
        $conn->close();
    }
} catch (Exception $e) {
    error_log("Tracker - Barangay permit error: " . $e->getMessage());
}

// ===== BUILDING PERMIT =====
try {
    $conn = new mysqli('localhost', 'eplms_ella', 'mypassword', 'eplms_building_permit_db');
    if (!$conn->connect_error) {
        $conn->set_charset("utf8mb4");
        $query = "SELECT a.*, ap.first_name, ap.last_name, ap.middle_initial, ap.email, ap.contact_no, ap.home_address, ap.user_id 
                  FROM application a 
                  JOIN applicant ap ON a.applicant_id = ap.applicant_id 
                  WHERE ap.email = ? " . ($userId > 0 ? "OR ap.user_id = ? " : "") . "
                  ORDER BY a.application_id DESC";
        $stmt = $conn->prepare($query);
        if ($stmt) {
            if ($userId > 0) {
                $stmt->bind_param("si", $userEmail, $userId);
            } else {
                $stmt->bind_param("s", $userEmail);
            }
            $stmt->execute();
            $result = $stmt->get_result();
            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    $allApplications[] = [
                        'id' => $row['application_id'] ?? 'N/A',
                        'permitType' => 'Building Permit',
                        'application_type' => $row['permit_action'] ?? $row['permit_group'] ?? 'New',
                        'status' => $row['status'] ?? 'Pending',
                        'applicantName' => trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? '')),
                        'businessName' => $row['use_of_permit'] ?? 'N/A',
                        'email' => $row['email'] ?? '',
                        'address' => $row['home_address'] ?? 'N/A',
                        'contactNumber' => $row['contact_no'] ?? 'N/A',
                        'submittedDate' => $row['proposed_date_of_construction'] ?? null,
                        'approvedDate' => $row['approved_date'] ?? null,
                        'expirationDate' => $row['expiration_date'] ?? $row['expected_date_of_completion'] ?? null,
                        'fees' => $row['total_estimated_cost'] ?? '0.00',
                        'receiptNumber' => 'N/A',
                        'user_id' => $row['user_id'] ?? 0,
                        'remarks' => $row['remarks'] ?? '',
                        'complianceNotes' => '',
                        'middleInitial' => $row['middle_initial'] ?? '',
                        'formOfOwnership' => $row['form_of_ownership'] ?? '',
                        'useOfPermit' => $row['use_of_permit'] ?? '',
                        'numberOfStoreys' => $row['number_of_storeys'] ?? '',
                        'lotArea' => $row['lot_area'] ?? '',
                        'totalFloorArea' => $row['total_floor_area'] ?? '',
                        'lotNo' => $row['lot_no'] ?? '',
                        'blkNo' => $row['blk_no'] ?? '',
                        'tctNo' => $row['tct_no'] ?? '',
                        'taxDecNo' => $row['tax_dec_no'] ?? ''
                    ];
                }
            }
            $stmt->close();
        }
        $conn->close();
    }
} catch (Exception $e) {
    error_log("Tracker - Building permit error: " . $e->getMessage());
}

// ===== PROFESSIONAL REGISTRATION =====
try {
    $conn = new mysqli('localhost', 'eplms_ella', 'mypassword', 'eplms_building_permit_db');
    if (!$conn->connect_error) {
        $conn->set_charset("utf8mb4");
        $query = "SELECT * FROM professional_registrations WHERE email = ? " . ($userId > 0 ? "OR user_id = ? " : "") . "ORDER BY date_submitted DESC";
        $stmt = $conn->prepare($query);
        if ($stmt) {
            if ($userId > 0) {
                $stmt->bind_param("si", $userEmail, $userId);
            } else {
                $stmt->bind_param("s", $userEmail);
            }
            $stmt->execute();
            $result = $stmt->get_result();
            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    $allApplications[] = [
                        'id' => $row['registration_id'] ?? 'N/A',
                        'permitType' => 'Building Permit',
                        'application_type' => 'Professional Registration',
                        'status' => ucfirst($row['status'] ?? 'Pending'),
                        'applicantName' => trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? '')),
                        'businessName' => ($row['profession'] ?? '') . ' - ' . ($row['role_in_project'] ?? ''),
                        'email' => $row['email'] ?? '',
                        'address' => 'N/A',
                        'contactNumber' => $row['contact_number'] ?? 'N/A',
                        'submittedDate' => $row['date_submitted'] ?? null,
                        'approvedDate' => $row['approved_date'] ?? null,
                        'expirationDate' => $row['prc_expiry'] ?? null,
                        'fees' => '0.00',
                        'receiptNumber' => $row['prc_license'] ?? 'N/A',
                        'user_id' => $row['user_id'] ?? 0,
                        'remarks' => 'PRC License: ' . ($row['prc_license'] ?? 'N/A') . ' | PTR: ' . ($row['ptr_number'] ?? 'N/A'),
                        'complianceNotes' => '',
                        'profession' => $row['profession'] ?? '',
                        'roleInProject' => $row['role_in_project'] ?? '',
                        'prcLicense' => $row['prc_license'] ?? '',
                        'ptrNumber' => $row['ptr_number'] ?? ''
                    ];
                }
            }
            $stmt->close();
        }
        $conn->close();
    }
} catch (Exception $e) {
    error_log("Tracker - Professional registration error: " . $e->getMessage());
}

// ===== FRANCHISE PERMIT =====
try {
    $conn = new mysqli('localhost', 'eplms_kobe', 'mypassword', 'eplms_franchise_applications');
    if (!$conn->connect_error) {
        $conn->set_charset("utf8mb4");
        $query = "SELECT * FROM franchise_permit_applications WHERE email = ? " . ($userId > 0 ? "OR user_id = ? " : "") . "ORDER BY created_at DESC";
        $stmt = $conn->prepare($query);
        if ($stmt) {
            if ($userId > 0) {
                $stmt->bind_param("si", $userEmail, $userId);
            } else {
                $stmt->bind_param("s", $userEmail);
            }
            $stmt->execute();
            $result = $stmt->get_result();
            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    $allApplications[] = [
                        'id' => $row['application_id'] ?? 'N/A',
                        'permitType' => 'Franchise Permit',
                        'application_type' => $row['permit_type'] ?? 'New',
                        'status' => ucfirst($row['status'] ?? 'Pending'),
                        'applicantName' => trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? '')),
                        'businessName' => $row['toda_name'] ?? 'N/A',
                        'email' => $row['email'] ?? '',
                        'address' => $row['home_address'] ?? 'N/A',
                        'contactNumber' => $row['contact_number'] ?? 'N/A',
                        'submittedDate' => $row['date_submitted'] ?? $row['created_at'] ?? null,
                        'approvedDate' => $row['date_approved'] ?? null,
                        'expirationDate' => $row['expiry_date'] ?? null,
                        'fees' => '0.00',
                        'receiptNumber' => $row['franchise_fee_or'] ?? 'N/A',
                        'user_id' => $row['user_id'] ?? 0,
                        'remarks' => $row['remarks'] ?? '',
                        'complianceNotes' => $row['notes'] ?? '',
                        'permitSubtype' => $row['permit_subtype'] ?? '',
                        'operatorType' => $row['operator_type'] ?? '',
                        'plateNumber' => $row['plate_number'] ?? '',
                        'vehicleType' => $row['vehicle_type'] ?? '',
                        'todaName' => $row['toda_name'] ?? '',
                        'routeZone' => $row['route_zone'] ?? '',
                        'district' => $row['district'] ?? '',
                        'makeBrand' => $row['make_brand'] ?? '',
                        'vehicleModel' => $row['model'] ?? '',
                        'engineNumber' => $row['engine_number'] ?? '',
                        'chassisNumber' => $row['chassis_number'] ?? '',
                        'vehicleColor' => $row['color'] ?? '',
                        'birthDate' => $row['birth_date'] ?? '',
                        'citizenship' => $row['citizenship'] ?? '',
                        'idType' => $row['id_type'] ?? '',
                        'idNumber' => $row['id_number'] ?? '',
                        'barangayOfOperation' => $row['barangay_of_operation'] ?? '',
                        'yearAcquired' => $row['year_acquired'] ?? ''
                    ];
                }
            }
            $stmt->close();
        }
        $conn->close();
    }
} catch (Exception $e) {
    error_log("Tracker - Franchise permit error: " . $e->getMessage());
}

// ===== LIQUOR PERMIT =====
try {
    $conn = new mysqli('localhost', 'eplms_paul', 'mypassword', 'eplms_business_permit_db');
    if (!$conn->connect_error) {
        $conn->set_charset("utf8mb4");
        $query = "SELECT * FROM liquor_permit_applications WHERE business_email = ? " . ($userId > 0 ? "OR user_id = ? " : "") . "ORDER BY created_at DESC";
        $stmt = $conn->prepare($query);
        if ($stmt) {
            if ($userId > 0) {
                $stmt->bind_param("si", $userEmail, $userId);
            } else {
                $stmt->bind_param("s", $userEmail);
            }
            $stmt->execute();
            $result = $stmt->get_result();
            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    $appType = 'New';
                    switch ($row['application_type'] ?? 'NEW') {
                        case 'RENEWAL': $appType = 'Renewal'; break;
                        case 'AMENDMENT': $appType = 'Amendment'; break;
                        default: $appType = 'New'; break;
                    }
                    $allApplications[] = [
                        'id' => $row['applicant_id'] ?? ('LIQ-' . ($row['permit_id'] ?? 'N/A')),
                        'permitType' => 'Business Permit',
                        'application_type' => 'Liquor - ' . $appType,
                        'status' => ucfirst(strtolower($row['status'] ?? 'Pending')),
                        'applicantName' => trim(($row['owner_first_name'] ?? '') . ' ' . ($row['owner_last_name'] ?? '')),
                        'businessName' => $row['business_name'] ?? 'N/A',
                        'email' => $row['business_email'] ?? '',
                        'address' => $row['business_address'] ?? 'N/A',
                        'contactNumber' => $row['business_phone'] ?? 'N/A',
                        'submittedDate' => $row['date_submitted'] ?? $row['created_at'] ?? null,
                        'approvedDate' => null,
                        'expirationDate' => null,
                        'fees' => '0.00',
                        'receiptNumber' => 'N/A',
                        'user_id' => $row['user_id'] ?? 0,
                        'remarks' => $row['renewal_reason'] ?? $row['amendment_reason'] ?? '',
                        'complianceNotes' => '',
                        'businessType' => $row['business_type'] ?? '',
                        'liquorType' => $row['liquor_type'] ?? '',
                        'applicationType' => $row['application_type'] ?? ''
                    ];
                }
            }
            $stmt->close();
        }
        $conn->close();
    }
} catch (Exception $e) {
    error_log("Tracker - Liquor permit error: " . $e->getMessage());
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
