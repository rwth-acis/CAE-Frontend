<?PHP
$data = array("traces" => array(), "traceSegments" => array());
header('Access-Control-Allow-Origin: *');  
header('Content-Type: application/json');

$number = 10;
$data["traceSegments"][]=array("id"=>"newline0","tpye"=>"unprotected","length" => 1);
$traceSegments = array();
$traceSegments[]=array("id"=>"div[openTag]","type"=>"protected","length"=>15);
$traceSegments[]=array("id"=>"div[inner]","type"=>"unprotected","length"=>1);

for($i=1;$i<=$number;$i++){
    $length = strlen("".$i);
    $trace = &$data["traces"];
    $trace[]=array( "newline".$i => null );
    $trace[]=array("textarea".$i => null);
    $segments = array();
    $segments[]=array("id"=>"textarea".$i."[openTagStart]","type"=>"protected","length"=>9);
    $segments[]=array("id"=>"textarea".$i."[attributes]","type"=>"unprotected","length"=>1);
    $segments[]=array("id"=>"textarea".$i."[id]","type"=>"protected","length"=>(9+$length));
    $segments[]=array("id"=>"textarea".$i."[openTagEnd]","type"=>"protected","length"=>1);
    $segments[]=array("id"=>"textarea".$i."[inner]","type"=>"unprotected","length"=>1);
    $segments[]=array("id"=>"textarea".$i."[closeTag]","type"=>"protected","length"=>11);
    $textarea = array("id"=>"textarea".$i,"type"=>"composite","orderAble"=>true,"traceSegments" => $segments);
    $traceSegments[]=$textarea;
    $traceSegments[]=array( "id"=>"newline".($i+1), "type" => "unprotected", "length" => 1 );
}

$traceSegments[]=array("id"=>"div[closeTag]","type"=>"protected","length"=>6);
$container = array("id"=>"container1","type"=>"composite","traceSegments"=> $traceSegments);
$data["traceSegments"][]=$container;
echo json_encode($data);
?>