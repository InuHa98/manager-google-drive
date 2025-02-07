<?php

ignore_user_abort(true);
set_time_limit(0);

$drive = $_Mvc->getAction();
$size = $_Mvc->getParams(0);
$id = $_Mvc->getParams(1);

if(!is_numeric($drive)){
	$drive = 0;
	$size = $_Mvc->getAction();
	$id = $_Mvc->getParams(0);
}

if(!$id){
	header("HTTP/1.1 404 Not Found");
	exit('Error: Id file not found.');
}

if(!preg_match("#^([0-9wWhHsSpPcC-]+)$#si", $size)){
	$size = "s0";
}

if($drive === 0){
	$service_account = file_exists($_config['private_share_config']) ? json_decode(file_get_contents($_config['private_share_config']), true) : [];

	if(!$service_account){
		header("HTTP/1.1 400 Bad Request");
		exit('Error: Access is denied');
	}
	

	$_GDrive->setAuthConfig(render_data_serviceAccount($service_account), [
		"type" => "service_account",
		"scopes" => ["https://www.googleapis.com/auth/drive.readonly"],
		"path" => $_config['private_share_path']
	]);

} else {
	$drive = _getDrive($drive);
	if(!$drive){
		header("HTTP/1.1 400 Bad Request");
		exit('Error: Access is denied');
	}

	$_GDrive->setAuthConfig((isset($drive['data_json']) ? json_decode($drive['data_json'], true) : []), [
		"type" => $drive['type'],
		"path" => pathConfig($drive)
	]);
}


$file = $_GDrive->getFile($id);

if(!$file){
	header("HTTP/1.1 403 Forbidden");
	exit('Error: File not found.');
}

if(!preg_match("#googleusercontent#si", $file['thumbnailLink'])){
	header('Location: '._changeSizeIconLink($file['iconLink']), 128);
	exit;
}

$thumbnailLink = _changeSizeThumbnailLink($file['thumbnailLink'], $size);

if($file['canCopy']){
	header('Location: '.$thumbnailLink);
} else {

	ob_end_clean();
	session_write_close();

	header('X-Accel-Buffering: no');
	header('Content-Encoding: none');
	header('Content-Type: image/png');
	//header('Content-length: '.$file['size']);
	header('Content-Disposition: inline; filename="'.$file['name'].'.png"');
	header('Cache-Control: private, max-age='.(time() + 2628000).', no-transform');
	header('Expires: '.gmdate('D, d M Y H:i:s \G\M\T', time() + 2628000));
	header('Pragma: public');
	header('Content-Transfer-Encoding: binary');
	header('Connection: close');

	$http = $_GDrive->http_authorize();


	$response = $http->request('GET', $thumbnailLink);
	echo $response->getBody()->getContents();
    ob_clean();
    flush();

	if(ob_get_length())
		ob_end_clean();
	exit;
}

?>