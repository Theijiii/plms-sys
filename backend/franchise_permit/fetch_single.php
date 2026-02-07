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

try {
    // Get database connection using the function from db.php
    $conn = getDBConnection();
    
    if (!$conn || $conn->connect_error) {
        throw new Exception('Database connection failed: ' . ($conn ? $conn->connect_error : 'Could not get connection'));
    }

    // Check if application_id is provided
    if (!isset($_GET['application_id']) || empty($_GET['application_id'])) {
        throw new Exception('Application ID is required');
    }

    $application_id = $_GET['application_id'];
    
    // Debug: Log the received application_id
    error_log("Fetching application with ID: " . $application_id);

    // Fetch application details
    $sql = "SELECT * FROM franchise_permit_applications WHERE application_id = ?";
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception('Database prepare failed: ' . $conn->error);
    }
    
    $stmt->bind_param("s", $application_id);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to fetch application: " . $stmt->error);
    }

    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception("Application not found. ID: " . $application_id);
    }

    $application = $result->fetch_assoc();
    $stmt->close();

    // Build full name
    $full_name = trim(sprintf(
        "%s %s%s %s",
        $application['first_name'] ?? '',
        $application['middle_initial'] ? $application['middle_initial'] . '.' : '',
        $application['middle_initial'] ? ' ' : '',
        $application['last_name'] ?? ''
    ));
    
    // Add computed fields
    $application['full_name'] = $full_name;
    
    // Format date fields safely
    $date_fields = ['birth_date', 'date_submitted', 'lto_expiration_date'];
    foreach ($date_fields as $field) {
        if (!empty($application[$field]) && $application[$field] !== '0000-00-00' && $application[$field] !== '0000-00-00 00:00:00') {
            try {
                $date = new DateTime($application[$field]);
                $application['formatted_' . $field] = $date->format('F d, Y');
            } catch (Exception $e) {
                $application['formatted_' . $field] = $application[$field];
            }
        }
    }
    
    // Format datetime fields
    $datetime_fields = ['created_at', 'updated_at'];
    foreach ($datetime_fields as $field) {
        if (!empty($application[$field]) && $application[$field] !== '0000-00-00 00:00:00') {
            try {
                $date = new DateTime($application[$field]);
                $application['formatted_' . $field] = $date->format('F d, Y h:i A');
            } catch (Exception $e) {
                $application['formatted_' . $field] = $application[$field];
            }
        }
    }

    // Clean up null values for JSON
    foreach ($application as $key => $value) {
        if ($value === null) {
            $application[$key] = '';
        }
    }

    $response = [
        'success' => true,
        'data' => $application
    ];

    echo json_encode($response, JSON_UNESCAPED_SLASHES);

} catch (Exception $e) {
    http_response_code(500);
    $error_response = [
        'success' => false,
        'message' => 'Error: ' . $e->getMessage(),
        'debug' => [
            'application_id' => isset($application_id) ? $application_id : 'not set',
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ];
    echo json_encode($error_response);
    error_log("Error in fetch_single.php: " . $e->getMessage());
}

// Close connection if it exists
if (isset($conn)) {
    $conn->close();
}
?>