<?php

header('Access-Control-Allow-Origin: *');

$callback = isset($_GET['callback']) ? preg_replace('/[^a-z0-9$_]/si', '', $_GET['callback']) : false;
header('Content-Type: ' . ($callback ? 'application/javascript' : 'application/json') . ';charset=UTF-8');

$data = array('some_key' => 'some_value');

echo ($callback ? $callback . '(' : '') . json_encode($data) . ($callback ? ')' : '');
?>

