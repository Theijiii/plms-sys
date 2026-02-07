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

$data = json_decode(file_get_contents("php://input"), true);

$id_number = $data['id_number'] ?? '';
$plate_number = $data['plate_number'] ?? '';
$mtop_application_id = $data['mtop_application_id'] ?? '';
$permit_subtype = $data['permit_subtype'] ?? '';
$current_application_id = $data['current_application_id'] ?? '';

if (empty($permit_subtype)) {
    echo json_encode([
        'success' => false,
        'message' => 'Missing permit type'
    ]);
    exit;
}

try {
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $sql = "";
    $params = [];
    
    if ($permit_subtype === 'FRANCHISE' && !empty($mtop_application_id)) {
        // Check for Franchise duplicates using MTOP application ID
        $sql = "SELECT application_id, status, date_submitted, remarks, first_name, last_name, plate_number 
                FROM franchise_permit_applications 
                WHERE mtop_application_id = :mtop_app_id 
                AND permit_subtype = 'FRANCHISE' 
                AND status NOT IN ('EXPIRED', 'REJECTED', 'CANCELLED')
                ORDER BY date_submitted DESC 
                LIMIT 1";
        $params[':mtop_app_id'] = $mtop_application_id;
    } else if (!empty($id_number) && !empty($plate_number)) {
        // Check for duplicates using ID number and plate number
        $sql = "SELECT application_id, status, date_submitted, remarks, first_name, last_name, plate_number, permit_subtype 
                FROM franchise_permit_applications 
                WHERE id_number = :id_number 
                AND plate_number = :plate_number 
                AND permit_subtype = :permit_subtype 
                AND status NOT IN ('EXPIRED', 'REJECTED', 'CANCELLED')
                ORDER BY date_submitted DESC 
                LIMIT 1";
        $params[':id_number'] = $id_number;
        $params[':plate_number'] = $plate_number;
        $params[':permit_subtype'] = $permit_subtype;
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Insufficient data for duplicate check'
        ]);
        exit;
    }
    
    $stmt = $conn->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $duplicate = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Format the message based on application type
        $applicantName = $duplicate['first_name'] . ' ' . $duplicate['last_name'];
        $message = "Duplicate {$permit_subtype} application found for ";
        
        if ($permit_subtype === 'FRANCHISE' && !empty($mtop_application_id)) {
            $message .= "MTOP ID: {$mtop_application_id}. ";
        } else {
            $message .= "vehicle with plate: {$duplicate['plate_number']}. ";
        }
        
        $message .= "Existing Application ID: {$duplicate['application_id']}, Status: {$duplicate['status']}, ";
        $message .= "Applicant: {$applicantName}, Submitted: {$duplicate['date_submitted']}";
        
        echo json_encode([
            'success' => true,
            'hasDuplicate' => true,
            'message' => $message,
            'duplicate_id' => $duplicate['application_id'],
            'status' => $duplicate['status'],
            'duplicateDetails' => $duplicate
        ]);
    } else {
        // Also check if this person already has a MTOP when applying for Franchise
        if ($permit_subtype === 'FRANCHISE' && !empty($id_number) && !empty($plate_number)) {
            $checkMtopSql = "SELECT application_id, status FROM franchise_permit_applications 
                           WHERE id_number = :id_number 
                           AND plate_number = :plate_number 
                           AND permit_subtype = 'MTOP' 
                           AND status = 'APPROVED'
                           LIMIT 1";
            $stmt2 = $conn->prepare($checkMtopSql);
            $stmt2->bindParam(':id_number', $id_number);
            $stmt2->bindParam(':plate_number', $plate_number);
            $stmt2->execute();
            
            if ($stmt2->rowCount() > 0) {
                $mtop = $stmt2->fetch(PDO::FETCH_ASSOC);
                echo json_encode([
                    'success' => true,
                    'hasDuplicate' => false,
                    'hasExistingMTOP' => true,
                    'mtop_id' => $mtop['application_id'],
                    'message' => 'Valid MTOP found for franchise application',
                    'duplicateDetails' => null
                ]);
            } else {
                echo json_encode([
                    'success' => true,
                    'hasDuplicate' => false,
                    'hasExistingMTOP' => false,
                    'message' => 'No duplicate applications found'
                ]);
            }
        } else {
            echo json_encode([
                'success' => true,
                'hasDuplicate' => false,
                'message' => 'No duplicate applications found'
            ]);
        }
    }
    
} catch(PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>