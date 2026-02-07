<?php
header("Access-Control-Allow-Origin: https://e-plms.goserveph.com/git");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
$servername = "localhost";
$username = "eplms_paul";
$password = "mypassword";
$dbname = "eplms_business_permit_db";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die(json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $conn->connect_error
    ]));
}

// Set charset to UTF-8
$conn->set_charset("utf8mb4");
?>