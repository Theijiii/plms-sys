<?php
echo "BusinessAdmin Hash:<br>";
echo password_hash("BusinessAdmin", PASSWORD_DEFAULT);

echo "<br><br>";

echo "BarangayStaff Hash:<br>";
echo password_hash("BarangayStaff", PASSWORD_DEFAULT);

echo "<br><br>";

echo "BuildingAdmin Hash:<br>";
echo password_hash("BuildingAdmin", PASSWORD_DEFAULT);

echo "<br><br>";

echo "TransportAdmin Hash:<br>";
echo password_hash("TransportAdmin", PASSWORD_DEFAULT);

echo "<br><br>";

echo "SuperAdmin Hash:<br>";
echo password_hash("Superadmin", PASSWORD_DEFAULT);
?>
