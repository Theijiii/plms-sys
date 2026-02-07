<?php
// document.php

// ===== CONFIG =====
$UPLOAD_DIR = realpath(__DIR__ . '/uploads'); // adjust path if needed

// ===== VALIDATION =====
if (!isset($_GET['file'])) {
    http_response_code(400);
    exit(json_encode(["error" => "File parameter is required"]));
}

// Prevent directory traversal
$filename = basename($_GET['file']);
$filePath = $UPLOAD_DIR . DIRECTORY_SEPARATOR . $filename;

// Check file existence
if (!file_exists($filePath) || !is_file($filePath)) {
    http_response_code(404);
    exit(json_encode(["error" => "File not found"]));
}

// ===== MIME TYPE =====
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $filePath);
finfo_close($finfo);

// ===== VIEW OR DOWNLOAD =====
// ?mode=view  → open in browser
// ?mode=download → force download
$mode = $_GET['mode'] ?? 'view';

header('Content-Type: ' . $mimeType);
header('Content-Length: ' . filesize($filePath));

if ($mode === 'download') {
    header('Content-Disposition: attachment; filename="' . $filename . '"');
} else {
    header('Content-Disposition: inline; filename="' . $filename . '"');
}

header('Cache-Control: private, max-age=0');
header('Pragma: public');
header('Expires: 0');

// ===== OUTPUT FILE =====
ob_clean();
flush();
readfile($filePath);
exit;
