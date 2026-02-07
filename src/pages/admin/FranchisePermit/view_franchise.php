<?php
// view_franchise.php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");

// Include database connection
require_once "../../../../../connection.php";

if (!isset($_GET['id'])) {
    echo json_encode([
        "success" => false,
        "message" => "Franchise ID is required"
    ]);
    exit;
}

$id = intval($_GET['id']);

try {
    $stmt = $conn->prepare("SELECT * FROM franchise_applications WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode([
            "success" => false,
            "message" => "Franchise not found"
        ]);
        exit;
    }

    $franchise = $result->fetch_assoc();
    echo json_encode([
        "success" => true,
        "data" => $franchise
    ]);
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error: " . $e->getMessage()
    ]);
}
?>
