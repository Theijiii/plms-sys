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
// Database Connection
require_once __DIR__ . '../db.php';

    // Get form data
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid form data'
        ]);
        exit();
    }
    
    $database = new Database();
    $db = $database->getConnection();
    
    try {
        // Begin transaction
        $db->beginTransaction();
        
        // First, check if permit exists
        $checkQuery = "SELECT permit_id FROM business_permit_applications WHERE permit_id = :permit_id";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(':permit_id', $data['permit_id']);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() === 0) {
            echo json_encode([
                'success' => false,
                'message' => 'Original permit not found'
            ]);
            exit();
        }
        
        // Insert renewal application
        $query = "
            INSERT INTO business_permit_applications (
                applicant_id,
                application_date,
                permit_type,
                status,
                owner_last_name,
                owner_first_name,
                owner_type,
                contact_number,
                email_address,
                home_address,
                business_name,
                trade_name,
                business_nature,
                gross_sale,
                total_employees,
                barangay,
                date_submitted,
                official_receipt_no,
                has_barangay_clearance,
                has_owner_valid_id,
                has_official_receipt,
                remarks
                official_receipt_no
            ) VALUES (
                :applicant_id,
                :application_date,
                :permit_type,
                'PENDING',
                :owner_last_name,
                :owner_first_name,
                :owner_type,
                :contact_number,
                :email_address,
                :home_address,
                :business_name,
                :trade_name,
                :business_nature,
                :gross_sale,
                :total_employees,
                :barangay,
                CURDATE(),
                :official_receipt_no,
                1,
                1,
                1,
                'RENEWAL APPLICATION'
            )
        ";
        
        $stmt = $db->prepare($query);
        
        // Bind parameters (you'll need to get these from your form)
        $applicant_id = 'USER_' . time(); // Generate applicant ID
        $stmt->bindParam(':applicant_id', $applicant_id);
        $stmt->bindParam(':application_date', $data['application_date']);
        $stmt->bindParam(':permit_type', $data['permit_type']);
        $stmt->bindParam(':owner_last_name', $data['owner_last_name']);
        $stmt->bindParam(':owner_first_name', $data['owner_first_name']);
        $stmt->bindParam(':owner_type', $data['owner_type']);
        $stmt->bindParam(':contact_number', $data['contact_number']);
        $stmt->bindParam(':email_address', $data['email_address']);
        $stmt->bindParam(':home_address', $data['home_address']);
        $stmt->bindParam(':business_name', $data['business_name']);
        $stmt->bindParam(':trade_name', $data['trade_name']);
        $stmt->bindParam(':business_nature', $data['business_nature']);
        $stmt->bindParam(':gross_sale', $data['gross_sales']);
        $stmt->bindParam(':total_employees', $data['total_employees']);
        $stmt->bindParam(':barangay', $data['barangay']);
        $stmt->bindParam(':official_receipt_no', $data['official_receipt_no']);
        
        if ($stmt->execute()) {
            $new_permit_id = $db->lastInsertId();
            
            // Insert document records
            if (isset($data['documents']) && is_array($data['documents'])) {
                $docQuery = "
                    INSERT INTO application_documents (
                        permit_id,
                        document_type,
                        document_name,
                        file_path,
                        file_type,
                        file_size,
                        is_verified
                    ) VALUES (
                        :permit_id,
                        :document_type,
                        :document_name,
                        :file_path,
                        :file_type,
                        :file_size,
                        0
                    )
                ";
                
                $docStmt = $db->prepare($docQuery);
                
                foreach ($data['documents'] as $document) {
                    $docStmt->bindParam(':permit_id', $new_permit_id);
                    $docStmt->bindParam(':document_type', $document['type']);
                    $docStmt->bindParam(':document_name', $document['name']);
                    $docStmt->bindParam(':file_path', $document['path']);
                    $docStmt->bindParam(':file_type', $document['file_type']);
                    $docStmt->bindParam(':file_size', $document['size']);
                    $docStmt->execute();
                }
            }
            
            $db->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Renewal application submitted successfully!',
                'permit_id' => $new_permit_id
            ]);
        } else {
            $db->rollBack();
            echo json_encode([
                'success' => false,
                'message' => 'Failed to submit application'
            ]);
        }
    } catch(PDOException $e) {
        $db->rollBack();
        echo json_encode([
            'success' => false,
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }
}
?>