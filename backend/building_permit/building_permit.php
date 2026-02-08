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

// Include DB connection
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    handleBuildingPermitSubmission();
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    fetchBuildingPermits();
} else {
    jsonResponse(false, "Invalid request method", null, 405);
}

function saveUploadedFile($fileKey, $subDir) {
    if (!isset($_FILES[$fileKey]) || $_FILES[$fileKey]['error'] !== UPLOAD_ERR_OK) {
        return null;
    }

    $file = $_FILES[$fileKey];

    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'image/gif'];
    if (!in_array($file['type'], $allowedTypes)) {
        throw new Exception("Invalid file type for {$fileKey}. Allowed: JPG, PNG, PDF, GIF");
    }

    if ($file['size'] > 5 * 1024 * 1024) {
        throw new Exception("File too large for {$fileKey}. Maximum size is 5MB");
    }

    $uploadDir = __DIR__ . '/uploads/' . $subDir . '/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $safeName = $fileKey . '_' . time() . '_' . mt_rand(1000, 9999) . '.' . $extension;
    $targetPath = $uploadDir . $safeName;

    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        return 'uploads/' . $subDir . '/' . $safeName;
    }

    return null;
}

function handleBuildingPermitSubmission() {
    $conn = getDBConnection();
    if (!$conn) {
        jsonResponse(false, "Database connection failed", null, 500);
    }

    try {
        $conn->begin_transaction();

        // ===== 1. Insert into applicant table =====
        $stmt = $conn->prepare("INSERT INTO applicant 
            (last_name, first_name, middle_initial, suffix, tin, contact_no, email, citizenship, home_address, form_of_ownership, user_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        if (!$stmt) throw new Exception("Prepare applicant failed: " . $conn->error);

        $last_name = trim($_POST['last_name'] ?? '');
        $first_name = trim($_POST['first_name'] ?? '');
        $middle_initial = trim($_POST['middle_initial'] ?? '');
        $suffix = trim($_POST['suffix'] ?? '');
        $tin = !empty($_POST['tin']) ? (int)$_POST['tin'] : null;
        $contact_no = trim($_POST['contact_no'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $citizenship = trim($_POST['citizenship'] ?? '');
        $home_address = trim($_POST['home_address'] ?? '');
        $form_of_ownership = trim($_POST['form_of_ownership'] ?? '');
        $user_id = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;

        // Validate required
        if (empty($last_name) || empty($first_name) || empty($email)) {
            throw new Exception("Last name, first name, and email are required.");
        }

        $stmt->bind_param('ssssisssssi',
            $last_name, $first_name, $middle_initial, $suffix,
            $tin, $contact_no, $email, $citizenship, $home_address, $form_of_ownership, $user_id
        );

        if (!$stmt->execute()) throw new Exception("Insert applicant failed: " . $stmt->error);
        $applicant_id = $stmt->insert_id;
        $stmt->close();

        // ===== 2. Insert into application table =====
        $stmt = $conn->prepare("INSERT INTO application 
            (applicant_id, permit_group, use_of_permit, permit_action, proposed_date_of_construction, expected_date_of_completion, total_estimated_cost, prc_license, remarks) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");

        if (!$stmt) throw new Exception("Prepare application failed: " . $conn->error);

        $permit_group = trim($_POST['permit_group'] ?? '');
        $use_of_permit = trim($_POST['use_of_permit'] ?? '');
        $permit_action = trim($_POST['permit_action'] ?? '');
        $proposed_date = !empty($_POST['proposed_date_of_construction']) ? $_POST['proposed_date_of_construction'] : null;
        $expected_date = !empty($_POST['expected_date_of_completion']) ? $_POST['expected_date_of_completion'] : null;
        $total_cost = !empty($_POST['total_estimated_cost']) ? (float)$_POST['total_estimated_cost'] : 0;
        $prc_license = trim($_POST['prc_license'] ?? '');
        $remarks = trim($_POST['remarks'] ?? '');

        $stmt->bind_param('isssssdss',
            $applicant_id, $permit_group, $use_of_permit, $permit_action,
            $proposed_date, $expected_date, $total_cost, $prc_license, $remarks
        );

        if (!$stmt->execute()) throw new Exception("Insert application failed: " . $stmt->error);
        $application_id = $stmt->insert_id;
        $stmt->close();

        // ===== 3. Insert into project_site table =====
        $stmt = $conn->prepare("INSERT INTO project_site 
            (applicant_id, lot_no, blk_no, tct_no, tax_dec_no, street, barangay, city_municipality, province) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");

        if (!$stmt) throw new Exception("Prepare project_site failed: " . $conn->error);

        $lot_no = trim($_POST['lot_no'] ?? '');
        $blk_no = trim($_POST['blk_no'] ?? '');
        $tct_no = trim($_POST['tct_no'] ?? '');
        $tax_dec_no = trim($_POST['tax_dec_no'] ?? '');
        $street = trim($_POST['street'] ?? '');
        $barangay = trim($_POST['barangay'] ?? '');
        $city_municipality = trim($_POST['city_municipality'] ?? '');
        $province = trim($_POST['province'] ?? '');

        $stmt->bind_param('issssssss',
            $applicant_id, $lot_no, $blk_no, $tct_no, $tax_dec_no,
            $street, $barangay, $city_municipality, $province
        );

        if (!$stmt->execute()) throw new Exception("Insert project_site failed: " . $stmt->error);
        $site_id = $stmt->insert_id;
        $stmt->close();

        // ===== 4. Insert into occupancy_classification table =====
        $stmt = $conn->prepare("INSERT INTO occupancy_classification 
            (site_id, number_of_units, number_of_storeys, total_floor_area, lot_area) 
            VALUES (?, ?, ?, ?, ?)");

        if (!$stmt) throw new Exception("Prepare occupancy failed: " . $conn->error);

        $number_of_units = !empty($_POST['number_of_units']) ? (int)$_POST['number_of_units'] : 0;
        $number_of_storeys = !empty($_POST['number_of_storeys']) ? (int)$_POST['number_of_storeys'] : 0;
        $total_floor_area = !empty($_POST['total_floor_area']) ? (float)$_POST['total_floor_area'] : 0;
        $lot_area = !empty($_POST['lot_area']) ? (float)$_POST['lot_area'] : 0;

        $stmt->bind_param('iiidd',
            $site_id, $number_of_units, $number_of_storeys, $total_floor_area, $lot_area
        );

        if (!$stmt->execute()) throw new Exception("Insert occupancy failed: " . $stmt->error);
        $stmt->close();

        // ===== 5. Insert into project_cost table =====
        $stmt = $conn->prepare("INSERT INTO project_cost 
            (site_id, building_cost, electrical_cost, mechanical_cost, electronics_cost, plumbing_cost, other_cost, equipment_cost, proposed_start, expected_completion) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        if (!$stmt) throw new Exception("Prepare project_cost failed: " . $conn->error);

        $building_cost = !empty($_POST['building_cost']) ? (float)$_POST['building_cost'] : 0;
        $electrical_cost = !empty($_POST['electrical_cost']) ? (float)$_POST['electrical_cost'] : 0;
        $mechanical_cost = !empty($_POST['mechanical_cost']) ? (float)$_POST['mechanical_cost'] : 0;
        $electronics_cost = !empty($_POST['electronics_cost']) ? (float)$_POST['electronics_cost'] : 0;
        $plumbing_cost = !empty($_POST['plumbing_cost']) ? (float)$_POST['plumbing_cost'] : 0;
        $other_cost = !empty($_POST['other_cost']) ? (float)$_POST['other_cost'] : 0;
        $equipment_cost = !empty($_POST['equipment_cost']) ? (float)$_POST['equipment_cost'] : 0;
        $proposed_start = !empty($_POST['proposed_start']) ? $_POST['proposed_start'] : null;
        $expected_completion = !empty($_POST['expected_completion']) ? $_POST['expected_completion'] : null;

        $stmt->bind_param('idddddddss',
            $site_id, $building_cost, $electrical_cost, $mechanical_cost,
            $electronics_cost, $plumbing_cost, $other_cost, $equipment_cost,
            $proposed_start, $expected_completion
        );

        if (!$stmt->execute()) throw new Exception("Insert project_cost failed: " . $stmt->error);
        $stmt->close();

        // ===== 6. Handle signature file upload =====
        $subDir = 'application_' . $application_id;
        $signaturePath = saveUploadedFile('signature', $subDir);

        $conn->commit();

        jsonResponse(true, "Building permit application submitted successfully!", [
            'application_id' => $application_id,
            'applicant_id' => $applicant_id,
            'site_id' => $site_id,
            'signature_path' => $signaturePath
        ]);

    } catch (Exception $e) {
        $conn->rollback();
        error_log("Building Permit Error: " . $e->getMessage());
        jsonResponse(false, $e->getMessage(), null, 400);
    } finally {
        $conn->close();
    }
}

function fetchBuildingPermits() {
    $conn = getDBConnection();
    if (!$conn) {
        jsonResponse(false, "Database connection failed", null, 500);
    }

    try {
        $query = "SELECT 
            app.application_id,
            a.applicant_id,
            a.first_name, a.last_name, a.middle_initial, a.suffix,
            a.tin, a.contact_no, a.email, a.citizenship, a.home_address, a.form_of_ownership,
            app.permit_group, app.use_of_permit, app.proposed_date_of_construction,
            app.expected_date_of_completion, app.total_estimated_cost, app.remarks,
            ps.lot_no, ps.blk_no, ps.tct_no, ps.tax_dec_no,
            ps.street, ps.barangay, ps.city_municipality, ps.province,
            oc.number_of_units, oc.number_of_storeys, oc.total_floor_area, oc.lot_area,
            pc.building_cost, pc.electrical_cost, pc.mechanical_cost, pc.electronics_cost,
            pc.plumbing_cost, pc.other_cost, pc.equipment_cost, pc.proposed_start, pc.expected_completion
        FROM application app
        JOIN applicant a ON app.applicant_id = a.applicant_id
        LEFT JOIN project_site ps ON a.applicant_id = ps.applicant_id
        LEFT JOIN occupancy_classification oc ON ps.site_id = oc.site_id
        LEFT JOIN project_cost pc ON ps.site_id = pc.site_id
        ORDER BY app.application_id DESC";

        $result = $conn->query($query);
        $permits = [];

        while ($row = $result->fetch_assoc()) {
            $permits[] = $row;
        }

        jsonResponse(true, "Building permits fetched successfully", $permits);

    } catch (Exception $e) {
        error_log("Fetch Error: " . $e->getMessage());
        jsonResponse(false, $e->getMessage(), null, 500);
    } finally {
        $conn->close();
    }
}
?>
