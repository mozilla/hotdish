<?php
if ($_SERVER['SERVER_NAME'] !== 'localhost') {
	die('this should only run locally!');
}
$file = date('Y-m-d-H-i-s');
$contents = $_POST['contents'];
$encodedData = str_replace(' ','+',$contents);
$decodedData = base64_decode($encodedData);
$fp = fopen('copies/'.$file.'.jpg', 'w');
fwrite($fp, $decodedData);
fclose($fp);
?>