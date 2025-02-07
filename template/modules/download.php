<?php

ignore_user_abort(true);
set_time_limit(0);

$chunkSize = 3; // mb

$drive = $_Mvc->getAction();
$id = $_Mvc->getParams(0);


if(!is_numeric($drive)){
	$drive = 0;
	$id = $_Mvc->getAction();
}

if(!$id){
	header("HTTP/1.1 404 Not Found");
	exit('Error: Id file not found.');
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


if($file['canCopy'] && $file['size'] < (100 * 1024 * 1024) && array_key_exists("anyoneWithLink", $file['permissions'])){
	header('Location: '.$file['webContentLink']);
} else {

	session_write_close();
	ob_get_clean();

	header('X-Accel-Buffering: no');
	header('Content-Encoding: none');
	header('Content-Type: '.$file['mimeType']);
	header('Content-Disposition: inline; filename="'.$file['name'].'"');
	header('Cache-Control: private, max-age=0');
	header('Pragma: no-cache');


	$chunkSizeBytes = $chunkSize * 1024 * 1024;

	try {

		$http = $_GDrive->http_authorize();

		if($file['size'] > $chunkSizeBytes){

			$size = $file['size'];
			$start = 0; // Start byte
			$end = $size - 1; // End byte

			header("Accept-Ranges: 0-".$file['size']);
			if (isset($_SERVER['HTTP_RANGE'])) {
			    $c_start = $start;
			    $c_end = $end;
			    list(, $range) = explode('=', $_SERVER['HTTP_RANGE'], 2);
			    if (strpos($range, ',') !== false) {
			        header('HTTP/1.1 416 Requested Range Not Satisfiable');
			        header("Content-Range: bytes ".$start."-".$end."/".$size);
			        exit;
			    }

			    if ($range == '-') {
			        $c_start = $size - substr($range, 1);
			    }else{
			        $range = explode('-', $range);
			        $c_start = $range[0];
			        $c_end = (isset($range[1]) && is_numeric($range[1])) ? $range[1] : $size;
			    }
			    $c_end = ($c_end > $end) ? $end : $c_end;

			    if ($c_start > $c_end || $c_start > $size - 1 || $c_end >= $size) {
			        header('HTTP/1.1 416 Requested Range Not Satisfiable');
			        header("Content-Range: bytes ".$start."-".$end."/".$size);
			        exit;
			    }
			    $start = $c_start;
			    $end = $c_end;
			    $length = $end - $start + 1;

			    header('HTTP/1.1 206 Partial Content');
			}
			header("Content-Range: bytes ".$start."-".$end."/".$size);
			header("Content-Length: ".$length);
    		header('Content-Transfer-Encoding: chunked');
    		header('Connection: close');

			while ($start < $file['size'] && connection_status() == CONNECTION_NORMAL) {
			    $chunkEnd = $start + $chunkSizeBytes;
			    if($chunkEnd > $file['size']){
			    	$chunkEnd = $file['size'];
			    }
			    $response = $http->request('GET',sprintf('/drive/v3/files/%s', $file['id']), [
			    	'query' => [
			    		'alt' => 'media',
			    		'acknowledgeAbuse' => $file['canCopy'] ? 'false' : 'true'
			    	],
			    	'headers' => [
			    		'Range' => sprintf('bytes=%s-%s', $start, $chunkEnd)
			    	]
			    ]);
			    $start = $chunkEnd + 1;
				echo $response->getBody()->getContents();
			}				
		} else {
			header('Content-length: '.$file['size']);
    		header('Content-Transfer-Encoding: binary');
    		header('Connection: close');
			$response = $http->request('GET',sprintf('/drive/v3/files/%s', $file['id']),array('query' => array('alt' => 'media','acknowledgeAbuse'=> $file['canCopy']?'false':'true')));
			echo $response->getBody()->getContents();
		}
    	ob_clean();
    	flush();
		return true;

	} catch(Exception $e){
		return $e->getMessage();
	}		

	if(ob_get_length())
		ob_end_clean();
}

?>