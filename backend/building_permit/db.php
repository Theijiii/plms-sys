<?php
header("Access-Control-Allow-Origin: https://e-plms.goserveph.com/git");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

define('DB_HOST', 'localhost');
define('DB_USER', 'eplms_ella');
define('DB_PASS', 'mypassword');
define('DB_NAME', 'eplms_building_permit_db');

function getDBConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_error) {
        error_log("Connection failed: " . $conn->connect_error);
        return null;
    }
    
    $conn->set_charset("utf8mb4");
    return $conn;
}

function jsonResponse($success, $message, $data = null, $httpCode = 200) {
    http_response_code($httpCode);
    header('Content-Type: application/json; charset=utf-8');
    $response = ['success' => $success, 'message' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}
?>
