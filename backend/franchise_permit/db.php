<?php
// Database connection configuration
$servername = "localhost";
$username = "eplms_kobe";
$password = "mypassword";
$dbname = "eplms_franchise_applications";

if (!function_exists('getDBConnection')) {
    function getDBConnection() {
        global $servername, $username, $password, $dbname;
        
        $conn = new mysqli($servername, $username, $password, $dbname);
        
        if ($conn->connect_error) {
            die(json_encode([
                'success' => false,
                'message' => 'Database connection failed: ' . $conn->connect_error
            ]));
        }
        
        $conn->set_charset("utf8mb4");
        return $conn;
    }
}

// Create connection for backward compatibility
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