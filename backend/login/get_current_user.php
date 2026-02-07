// backend/login/get_current_user.php
<?php
session_start();
require_once '../auth/config/db.php';

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Simple token validation (replace with JWT validation if needed)
function validateToken() {
    $headers = getallheaders();
    
    if (isset($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
        if (strpos($authHeader, 'Bearer ') === 0) {
            $token = substr($authHeader, 7);
            // For now, check if token exists in localStorage (simplified)
            // In production, validate JWT token
            return !empty($token);
        }
    }
    
    // Check session as fallback
    return isset($_SESSION['user_id']) || isset($_SESSION['email']);
}

if (!validateToken()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

try {
    // Get user from session or token
    $userId = $_SESSION['user_id'] ?? null;
    $userEmail = $_SESSION['email'] ?? null;
    
    $query = "SELECT id, email, username, role, status, is_verified, 
                     last_login, created_at 
              FROM users 
              WHERE ";
    
    $params = [];
    
    if ($userId) {
        $query .= "id = ?";
        $params[] = $userId;
    } elseif ($userEmail) {
        $query .= "email = ?";
        $params[] = $userEmail;
    } else {
        // Get from request
        if (isset($_GET['user_id'])) {
            $query .= "id = ?";
            $params[] = $_GET['user_id'];
        } elseif (isset($_GET['email'])) {
            $query .= "email = ?";
            $params[] = $_GET['email'];
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'User identifier required']);
            exit;
        }
    }
    
    $stmt = $conn->prepare($query);
    $stmt->execute($params);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        // Format the response to match what frontend expects
        $response = [
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'username' => $user['username'],
                'role' => $user['role'],
                'status' => $user['status'],
                'is_verified' => (bool)$user['is_verified'],
                'last_login' => $user['last_login'],
                'created_at' => $user['created_at'],
                // Create display name
                'display_name' => $user['username'] ?: 
                    (strpos($user['email'], '.') !== false ? 
                        ucwords(str_replace('.', ' ', explode('@', $user['email'])[0])) : 
                        ucfirst(explode('@', $user['email'])[0]))
            ]
        ];
        
        echo json_encode($response);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'User not found']);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error',
        'error' => $e->getMessage()
    ]);
}
?>