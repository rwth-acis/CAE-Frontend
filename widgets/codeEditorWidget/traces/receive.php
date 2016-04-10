<?php
$myFile = "testFile.txt";
file_put_contents($myFile,$_POST['json']);
echo '{ "success": true }';
?>