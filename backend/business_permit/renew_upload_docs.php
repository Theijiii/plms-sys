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
require_once __DIR__ . '/db.php';
$response = ['success' => false, 'message' => ''];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_FILES['document']) && isset($_POST['permit_id']) && isset($_POST['document_type'])) {
        $permit_id = $conn->real_escape_string($_POST['permit_id']);
        $document_type = $conn->real_escape_string($_POST['document_type']);
        
        $upload_dir = '/uploads/renewals/';
        if (!file_exists($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }
        
        $file = $_FILES['document'];
        $file_name = 'REN_' . $permit_id . '_' . time() . '_' . basename($file['name']);
        $target_path = $upload_dir . $file_name;
        
        // Validate file
        $allowed_types = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
        $file_ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
        
        if (!in_array($file_ext, $allowed_types)) {
            $response['message'] = 'Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX';
        } elseif ($file['size'] > 5 * 1024 * 1024) { // 5MB limit
            $response['message'] = 'File too large. Maximum size is 5MB';
        } elseif (move_uploaded_file($file['tmp_name'], $target_path)) {
            // Save to database
            $sql = "INSERT INTO application_documents (
                        permit_id, 
                        document_type, 
                        document_name, 
                        file_path, 
                        file_type, 
                        file_size, 
                        upload_date
                    ) VALUES (?, ?, ?, ?, ?, ?, NOW())";
            
            $stmt = $conn->prepare($sql);
            $stmt->bind_param(
                'sssssi',
                $permit_id,
                $document_type,
                $file['name'],
                $target_path,
                $file['type'],
                $file['size']
            );
            
            if ($stmt->execute()) {
                $response['success'] = true;
                $response['message'] = 'Document uploaded successfully';
            } else {
                $response['message'] = 'Failed to save document record';
            }
            $stmt->close();
        } else {
            $response['message'] = 'Failed to upload file';
        }
    } else {
        $response['message'] = 'Missing required parameters';
    }
}

echo json_encode($response);
$conn->close();
?>