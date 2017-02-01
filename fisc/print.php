<?php
header('Content-Type: text/html; charset=utf-8');
session_start();
function fileWrite($fileName, $dirName, $data){
	unlink($dirName.$fileName);
	$Handle = fopen($dirName.$fileName, 'a');
	fwrite($Handle, $data);
	fclose($Handle);
}
function add_null($size, $string){
	$numnull=$size-strlen($string);
	$nullstr="";
	for($i=1;$i<=$numnull;$i++){
		$nullstr.="0";
	}
	return $nullstr.$string;
}
//ELTRADE
function eltrade($price, $name, $vat){
	$data.="0001".$name.".......".add_null(8, ((string)round($price,2)*100))."000010000"."
";
	return $data;
}

//Datecs Daisy Tremol
function DDT($price, $name, $vat, $quantity){
	$logicalNumber=1;
	$price=number_format(round($price,2),2,".","");
	$quantity=number_format(round($quantity,3),3,".","");
	$stand=1;
	$itemGroup=1;
	//$vat=1; 
	// Данъчни групи 1 - група А освободена от ДДС; 2 - група B ДДС 20%

	$data="S,$logicalNumber,______,_,__;$name;$price;$quantity;$stand;$itemGroup;$vat;0;0;
";	
	return $data;
}
// URL=print.php?iN=[брой на артикулите в касовият бон]&n_1=[име на артикул 1]&p_1=[цена на артикул 1]&q_1=[количество на артикул 1]&v_1=[номер на данъчна група на артикул 1]
// аналогично за следващ артикул

$itemNumber=(int)$_GET['iN'];
$ddt="";
$eltrade="";
for($i=1; $i<=$itemNumber; $i++){
	if(isset($_GET['v_'.$i]) && isset($_GET['p_'.$i]) && isset($_GET['n_'.$i])){
		$ddt.=DDT($_GET['p_'.$i], $_GET['n_'.$i], $_GET['v_'.$i], 1.000);
		$eltrade.=eltrade($_GET['p_'.$i], $_GET['n_'.$i], $_GET['v_'.$i], 1.000);
	}
}
$ddt.="T,1,______,_,__;";
fileWrite('daisy.inp', '', $ddt);
$eltrade.="#E1";
fileWrite('print.bon', '', $eltrade);
?>