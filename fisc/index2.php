<?php
header('Content-Type: text/html; charset=utf-8');
session_start();
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>Тест Касов бон</title>
</head>

<body>
<?php
if(isset($_POST['name'])&&isset($_POST['price'])){
	?>
    <iframe style="visibility:hidden; position:absolute;" src="http://127.0.0.1/ABC/print.php?iN=1&p_1=<?=$_POST['price']?>&n_1=<?=$_POST['name']?>&v_1=<?=$_POST['vat']?>&q_1=<?=$_POST['quantity']?>"></iframe>
    <?php
}
?>
<form action="index.php" method="post">
<table>
	<tr>
    	<td>Име на артикула</td>
        <td><input type="text" name="name" value="<?=$_POST['name']?>"/></td>
    </tr>
	<tr>
    	<td>Цена на артикула</td>
        <td><input type="text" name="price" value="<?=$_POST['price']?>" /></td>
    </tr>
	<tr>
    	<td>Данъчна група
(1 - Данъчна група А освободена от ДДС; 2 - Данъчана група Б ДДС 20%;)</td>
        <td><input type="text" name="vat" value="2"/></td>
    </tr>
    <tr>
    	<td>Количество</td>
        <td><input type="text" name="quantity" value="1" /></td>
    </tr>
    <tr>
        <td colspan="2" align="center"><input type="submit" value="TOTAL" /></td>
    </tr>
</table>
</form>
Съдържание на файла, който управлява Eltrade касови апарати
<br />
<textarea rows="5" cols="50"><?php
$myFile = "print.bon";
$fh = fopen($myFile, 'r');
$theData = fread($fh, filesize($myFile));
fclose($fh);
echo $theData;
?></textarea>
<br />
Съдържание на файла, който управлява Datecs Daisy Tremol касови апарати
<br />
<textarea rows="5" cols="50"><?php
$myFile = "daisy.inp";
$fh = fopen($myFile, 'r');
$theData = fread($fh, filesize($myFile));
fclose($fh);
echo $theData;
?></textarea>
<br />
<p>
Начина на инсталация:<br />
1. На компютъра който е вързан касовият апарат се инсталира уеб сървър apache xampp<br />
2. В c:/xampp/htdocs се поставя папката ABC с файла print.php, който създава изпълнимите файлове daisy.inp и print.bon<br />
3. Упаътване за Daisy касови апарати <a href="DPrint_bg.pdf">DPrint_bg.pdf</a> (аналогично за останалите апарати)<br />
В сайта който трябва да управлява трябва да се създава iframe който да изглежда така:<br />
<textarea cols="100" rows="5"><iframe style="visibility:hidden; position:absolute;" src="http://127.0.0.1/ABC/print.php?iN=1&p_1=[цена]&n_1=[име]&v_1=[данъчна група]&q_1=[количество]"></iframe></textarea><br />
Той се създава когато трябва да се издаде касов бон.
На кратко това е хитър начин да се избегне забавянето, ако се използва приложение. Така със зареждане на страницата, браузъра кара печатането на касовият бон и няма забавяне.
</p>
</body>
</html>