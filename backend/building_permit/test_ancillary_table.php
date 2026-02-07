<?php
require_once __DIR__ . '/db.php';
$conn = getDBConnection();
if (!$conn) { echo "DB connection failed\n"; exit(1); }
$result = $conn->query('DESCRIBE ancillary_permit_applications');
if ($result) {
    while ($row = $result->fetch_assoc()) {
        echo $row['Field'] . ' | ' . $row['Type'] . "\n";
    }
    echo "\nTable verified OK!\n";
} else {
    echo "Error: " . $conn->error . "\n";
}
$conn->close();
?>
