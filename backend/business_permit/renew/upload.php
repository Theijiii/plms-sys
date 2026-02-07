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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $response = [];
    
    // Create uploads directory if it doesn't exist
$uploadDir = __DIR__ . '../uploads/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    
    // Allowed file types
    $allowedTypes = [
        'image/jpeg' => 'jpg',
        'image/jpg' => 'jpg',
        'image/png' => 'png',
        'application/pdf' => 'pdf',
        'application/msword' => 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx'
    ];
    
    // Maximum file size (5MB)
    $maxFileSize = 5 * 1024 * 1024;
    
    foreach ($_FILES as $fieldName => $file) {
        if ($file['error'] === UPLOAD_ERR_OK) {
            // Check file size
            if ($file['size'] > $maxFileSize) {
                $response[$fieldName] = [
                    'success' => false,
                    'message' => 'File size exceeds 5MB limit'
                ];
                continue;
            }
            
            // Check file type
            $fileType = mime_content_type($file['tmp_name']);
            if (!array_key_exists($fileType, $allowedTypes)) {
                $response[$fieldName] = [
                    'success' => false,
                    'message' => 'Invalid file type. Allowed: JPG, PNG, PDF, DOC, DOCX'
                ];
                continue;
            }
            
            // Generate unique filename
            $extension = $allowedTypes[$fileType];
            $filename = uniqid() . '_' . preg_replace('/[^a-zA-Z0-9\.]/', '_', $file['name']);
            $filepath = $uploadDir . $filename;
            
            // Move uploaded file
            if (move_uploaded_file($file['tmp_name'], $filepath)) {
                $response[$fieldName] = [
                    'success' => true,
                    'filename' => $filename,
                    'filepath' => $filepath,
                    'original_name' => $file['name'],
                    'file_type' => $fileType,
                    'file_size' => $file['size']
                ];
            } else {
                $response[$fieldName] = [
                    'success' => false,
                    'message' => 'Failed to upload file'
                ];
            }
        } else {
            $response[$fieldName] = [
                'success' => false,
                'message' => 'Upload error: ' . $file['error']
            ];
        }
    }
    
    echo json_encode($response);
}
?>