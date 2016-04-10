<?php
header('Access-Control-Allow-Origin: *');  
header('Content-Type: text/plain');
$number=10;
echo "\n";
echo "<div id='test'>\n";
for($i=1;$i<=$number;$i++){
    echo "<textarea id='test".$i."'>\n";
    echo "</textarea>\n";
}
echo "</div>";