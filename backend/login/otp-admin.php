<?php
session_start();
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/vendor/autoload.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

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

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

// --------------------- HELPER: SEND OTP ---------------------
function sendOtpEmail($otp, $toEmail, $purpose = 'login') {
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'eplmsgoserveph@gmail.com';
        $mail->Password = 'dqwe prrq fhbt kyiq'; // app password
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;

        $mail->setFrom('eplmsgoserveph@gmail.com', 'GoServePH');
        $mail->addAddress($toEmail);
        $mail->isHTML(true);

        $subject = ($purpose === 'register') ? 'Registration OTP Verification' : 'OTP Verification';
        $bodyPurpose = ($purpose === 'register') ? 'registration' : 'login';
        $mail->Subject = $subject;
        $mail->Body = "<h2>OTP Verification</h2><p>Your $bodyPurpose code: <strong>$otp</strong></p><p>Expires in 10 minutes.</p>";

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("OTP email error: " . $mail->ErrorInfo);
        return false;
    }
}

// --------------------- ADMIN EMAILS ---------------------
$adminDepartments = [
    'superadmin@eplms.com'     => 'super',
    'businessadmin@eplms.com'  => 'business',
    'buildingadmin@eplms.com'  => 'building',
    'barangaystaff@eplms.com'  => 'barangay',
    'transportadmin@eplms.com' => 'transport',
    'admin@eplms.com'          => 'super',
];

// --------------------- INPUT ---------------------
$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents("php://input"), true) ?? [];
$email = $input['email'] ?? '';
$purpose = $input['purpose'] ?? 'login';
$otpInput = $input['otp'] ?? '';

// --------------------- SEND OTP ---------------------
if ($action === 'send') {
    if (!$email) {
        echo json_encode(['success'=>false,'message'=>'Email required']);
        exit;
    }

    $otp = rand(100000, 999999);

    // For login: check if admin
    if ($purpose === 'login' && isset($adminDepartments[$email])) {
        $_SESSION["otp_admin_{$email}"] = $otp;
        $_SESSION["otp_admin_time_{$email}"] = time();
        $sent = sendOtpEmail($otp, $email, 'login');

        // Also send to backup email
        if ($sent && $email !== 'orilla.maaltheabalcos@gmail.com') {
            sendOtpEmail($otp, 'orilla.maaltheabalcos@gmail.com', 'login');
        }

        echo json_encode([
            'success' => $sent,
            'message' => $sent ? 'OTP sent to department email' : 'Failed to send OTP',
            'department' => $adminDepartments[$email]
        ]);
        exit;
    }

    // For registration or regular user login
    $_SESSION["otp_user_{$email}"] = $otp;
    $_SESSION["otp_user_time_{$email}"] = time();
    $sent = sendOtpEmail($otp, $email, $purpose);

    echo json_encode([
        'success' => $sent,
        'message' => $sent ? 'OTP sent to email' : 'Failed to send OTP',
    ]);
    exit;
}

// --------------------- VERIFY OTP ---------------------
if ($action === 'verify') {
    $isAdmin = isset($_SESSION["otp_admin_{$email}"]);
    $isUser = isset($_SESSION["otp_user_{$email}"]);

    if (!$isAdmin && !$isUser) {
        echo json_encode(['success'=>false,'message'=>'Request a new OTP']);
        exit;
    }

    $otpTime = $isAdmin ? $_SESSION["otp_admin_time_{$email}"] : $_SESSION["otp_user_time_{$email}"];
    if (time() - $otpTime > 600) { // 10 mins
        unset($_SESSION["otp_admin_{$email}"], $_SESSION["otp_admin_time_{$email}"]);
        unset($_SESSION["otp_user_{$email}"], $_SESSION["otp_user_time_{$email}"]);
        echo json_encode(['success'=>false,'message'=>'OTP expired']);
        exit;
    }

    $otpSession = $isAdmin ? $_SESSION["otp_admin_{$email}"] : $_SESSION["otp_user_{$email}"];
    if ($otpInput != $otpSession) {
        echo json_encode(['success'=>false,'message'=>'Invalid OTP']);
        exit;
    }

    // OTP valid → remove from session
    unset($_SESSION["otp_admin_{$email}"], $_SESSION["otp_admin_time_{$email}"]);
    unset($_SESSION["otp_user_{$email}"], $_SESSION["otp_user_time_{$email}"]);

    // For registration purpose, user might not exist yet - that's OK
    if ($purpose === 'register') {
        // Don't check if user exists during registration
        // Still generate a session token for later use after registration
        $token = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+2 hours'));
        
        // Store the token in session for later use after registration completes
        $_SESSION["registration_token_{$email}"] = $token;
        $_SESSION["registration_token_expiry_{$email}"] = $expiresAt;
        
        echo json_encode([
            'success'=>true,
            'message'=>'OTP verified successfully. You may now complete registration.',
            'role' => 'user',
            'email' => $email,
            'token' => $token, // This token can be used after registration
            'is_registration' => true // Flag to indicate this is for registration
        ]);
        exit;
    }

    // For login purpose, user must exist
    $userRes = $conn->query("SELECT id FROM users WHERE email='$email'");
    $user = $userRes ? $userRes->fetch_assoc() : null;
    
    if (!$user) {
        echo json_encode(['success'=>false,'message'=>'User not found']);
        exit;
    }

    // Generate session token for login
    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+2 hours'));
    $stmt = $conn->prepare("INSERT INTO login_sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)");
    $stmt->bind_param("iss", $user['id'], $token, $expiresAt);
    $stmt->execute();
    $stmt->close();

    // Fetch profile for name
    $profileRes = $conn->query("SELECT first_name, last_name FROM user_profiles WHERE user_id='{$user['id']}'");
    $profile = $profileRes ? $profileRes->fetch_assoc() : null;
    $name = $profile ? trim(($profile['first_name'] ?? '') . ' ' . ($profile['last_name'] ?? '')) : '';

    $role = $isAdmin ? 'admin' : 'user';
    if ($isAdmin) $_SESSION['admin_department'] = $adminDepartments[$email] ?? null;

    echo json_encode([
        'success'=>true,
        'message'=>'OTP verified successfully',
        'role' => $role,
        'email' => $email,
        'name' => $name,
        'token' => $token,
        'department' => $isAdmin ? $_SESSION['admin_department'] : null
    ]);
    exit;
}

// --------------------- INVALID ACTION ---------------------
echo json_encode(['success'=>false,'message'=>'Invalid action']);
exit;