<?php
session_start([
    'cookie_lifetime' => 86400,
    'read_and_close'  => false,
]);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/vendor/autoload.php';

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
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// --------------------- INPUT ---------------------
$input = json_decode(file_get_contents("php://input"), true) ?? [];
$action = $_GET['action'] ?? '';

// --------------------- REGISTER USER ---------------------
if ($action === 'register') {
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    $firstName = $input['first_name'] ?? '';
    $lastName = $input['last_name'] ?? '';
    $phone = $input['phone'] ?? '';
    
    // Validation
    if (empty($email) || empty($password) || empty($firstName) || empty($lastName)) {
        echo json_encode(['success' => false, 'message' => 'All fields are required']);
        exit;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email format']);
        exit;
    }
    
    if (strlen($password) < 6) {
        echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
        exit;
    }
    
    try {
        // Check if email already exists
        $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            echo json_encode(['success' => false, 'message' => 'Email already registered']);
            exit;
        }
        $stmt->close();
        
        // Hash password
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        
        // Insert user
        $stmt = $conn->prepare("INSERT INTO users (email, password, role, status) VALUES (?, ?, 'user', 'pending')");
        $stmt->bind_param("ss", $email, $hashedPassword);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to create user: " . $stmt->error);
        }
        
        $userId = $stmt->insert_id;
        $stmt->close();
        
        // Create user profile
        $stmt = $conn->prepare("INSERT INTO user_profiles (user_id, first_name, last_name, phone) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("isss", $userId, $firstName, $lastName, $phone);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to create profile: " . $stmt->error);
        }
        $stmt->close();
        
        // Store email for OTP verification
        $_SESSION['register_email'] = $email;
        $_SESSION['register_user_id'] = $userId;
        
        echo json_encode([
            'success' => true,
            'message' => 'Registration successful. Please verify your email with OTP.',
            'user_id' => $userId,
            'email' => $email
        ]);
        
    } catch (Exception $e) {
        error_log("Registration error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Registration failed: ' . $e->getMessage()]);
    }
    exit;
}

// --------------------- VERIFY REGISTRATION OTP ---------------------
if ($action === 'verify_registration') {
    $email = $input['email'] ?? '';
    $otp = $input['otp'] ?? '';
    
    if (empty($email) || empty($otp)) {
        echo json_encode(['success' => false, 'message' => 'Email and OTP required']);
        exit;
    }
    
    // Check if this is a registration OTP (you'll need to modify your OTP system)
    // For now, we'll assume OTP was sent via your existing system
    
    // Activate user
    $stmt = $conn->prepare("UPDATE users SET status = 'active' WHERE email = ?");
    $stmt->bind_param("s", $email);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Email verified successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Verification failed']);
    }
    
    $stmt->close();
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid action']);
exit;