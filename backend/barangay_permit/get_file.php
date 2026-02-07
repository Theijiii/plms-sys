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


$filename = $_GET['filename'] ?? '';
if (!$filename) {
    http_response_code(400);
    echo "Filename required";
    exit;
}

// Sanitize filename
$filename = basename($filename);

// Try different possible locations
$locations = [
    __DIR__ . '/../uploads/',           // ../uploads/
    __DIR__ . '/uploads/',              // ./uploads/
    __DIR__ . '/../../uploads/',        // ../../uploads/
    $_SERVER['DOCUMENT_ROOT'] . '/plms-latest/uploads/', // Absolute path
    $_SERVER['DOCUMENT_ROOT'] . '/uploads/',
];

foreach ($locations as $location) {
    $filepath = $location . $filename;
    if (file_exists($filepath)) {
        // Get MIME type
        $mime = mime_content_type($filepath);
        header("Content-Type: $mime");
        readfile($filepath);
        exit;
    }
}

// If file not found, return a placeholder
http_response_code(404);
header("Content-Type: image/svg+xml");
echo '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="300" fill="#f0f0f0"/>
  <text x="200" y="150" text-anchor="middle" font-family="Arial" font-size="16" fill="#666">File: ' . htmlspecialchars($filename) . '</text>
  <text x="200" y="180" text-anchor="middle" font-family="Arial" font-size="14" fill="#999">Not found in uploads directory</text>
</svg>';
?>