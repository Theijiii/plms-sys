<?php
session_start();

// --------------------- Include DB Connection ---------------------
require_once __DIR__ . '/db.php'; // Make sure db.php defines $conn as PDO

// --------------------- CORS ---------------------
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
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// --------------------- Session Check ---------------------
if (!isset($_SESSION['user_id']) && !isset($_SESSION['admin_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized access. Please login first.',
        'data' => null
    ]);
    exit;
}

// --------------------- Action Handling ---------------------
$action = $_GET['action'] ?? '';

if ($action === 'get') {
    try {
        // Determine user type and ID
        if (isset($_SESSION['user_id'])) {
            $userId = intval($_SESSION['user_id']);
            $userType = 'user';
        } elseif (isset($_SESSION['admin_id'])) {
            $userId = intval($_SESSION['admin_id']);
            $userType = 'admin';
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'User ID not found in session',
                'data' => null
            ]);
            exit;
        }

        // Query to get user profile using mysqli
        if ($userType === 'user') {
            // Join users, user_profiles, and user_addresses tables
            $query = "SELECT 
                u.id as user_id,
                u.email,
                p.first_name, 
                p.last_name,
                p.middle_name,
                p.suffix,
                p.mobile_number,
                p.birthdate,
                a.house_number,
                a.street,
                a.barangay,
                a.city_municipality,
                a.province,
                a.region,
                a.zip_code,
                u.status,
                u.created_at
                FROM users u
                LEFT JOIN user_profiles p ON u.id = p.user_id
                LEFT JOIN user_addresses a ON u.id = a.user_id
                WHERE u.id = '$userId'";
        } else {
            // Admin profile query
            $query = "SELECT 
                u.id as user_id,
                u.email,
                p.first_name, 
                p.last_name, 
                p.middle_name,
                p.suffix,
                p.mobile_number,
                NULL as birthdate,
                NULL as house_number,
                NULL as street,
                NULL as barangay,
                NULL as city_municipality,
                NULL as province,
                NULL as region,
                NULL as zip_code,
                u.status,
                u.created_at
                FROM users u
                LEFT JOIN user_profiles p ON u.id = p.user_id
                WHERE u.id = '$userId'";
        }

        $result = $conn->query($query);
        
        if ($result && $result->num_rows > 0) {
            $user = $result->fetch_assoc();
            echo json_encode([
                'success' => true,
                'message' => 'Profile retrieved successfully',
                'data' => $user
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'User profile not found',
                'data' => null
            ]);
        }

    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Database error: ' . $e->getMessage(),
            'data' => null
        ]);
    }
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid action',
        'data' => null
    ]);
}
?>
