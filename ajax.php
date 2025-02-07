<?php
session_write_close();
set_time_limit(0);
header('Content-type: application/json; charset=utf-8');
	
$_rootPath = dirname(__FILE__);
define('_rootPath', $_rootPath);

include $_rootPath . '/includes/global.php';

$act = isset($_GET['act']) ? trim($_GET['act']) : '';


switch ($act) {
	case 'refresh_access_token':
		$id_drive = isset($_GET['drive']) ? intval($_GET['drive']) : '';
		$drive = $database->get("core_drives", "*", [
			"id" => $id_drive,
			"user_id" => $_USER->getId()
		]);
		if(!$drive){
			echo resultJson(404, "Drive not found.", JSON_UNESCAPED_UNICODE);
		} else {
			$_GDrive->setAuthConfig((isset($drive['data_json']) ? json_decode($drive['data_json'], true) : []), [
				"type" => $drive['type'],
				"path" => pathConfig($drive),
				"refresh" => true
			]);
			$about = $_GDrive->getAbout();

			if(!$about['access_token'] || $about['storageQuota']['limit'] === 0){
				echo resultJson(401, "Json config is invalid or Google account has not enabled Drive Api.", JSON_UNESCAPED_UNICODE);
			} else {
				$database->update("core_drives", ["storage_limit" => $about['storageQuota']['limit'], "storage_usage" => $about['storageQuota']['usage'], "emailAddress" => $about['user']['emailAddress']], ["id" => $drive['id'], "user_id" => $_USER->getId()]);
				echo resultJson(200, "Successfully.", $about, JSON_UNESCAPED_UNICODE);
			}		
		}

	break;

	case 'refresh_private_share':

		if(!is_file($_config['private_share_config'])){
			echo resultJson(404, "Private json config not found.", JSON_UNESCAPED_UNICODE);
		} else {
			$_GDrive->setAuthConfig(json_decode(file_get_contents($_config['private_share_config']), true), [
				"type" => "service_account",
				"path" => $_config['private_share_path'],
				"refresh" => true
			]);
			$about = $_GDrive->getAbout();

			if(!$about['access_token'] || $about['storageQuota']['limit'] === 0){
				echo resultJson(401, "Json config is invalid or Google account has not enabled Drive Api.", JSON_UNESCAPED_UNICODE);
			} else {
				echo resultJson(200, "Successfully.", $about, JSON_UNESCAPED_UNICODE);
			}		
		}

	break;

	case 'get_storage_info':
		$limit = 5;
		$start = isset($_GET['start']) ? abs($_GET['start']) : 0;
		$usage = isset($_GET['usage']) ? intval($_GET['usage']) : 0;

		$totalDrives = $database->count("core_drives", [
            "user_id" => $_USER->getId(),
            "storage_limit[!]" => ""
        ]);

		$listDrives = $database->select("core_drives", "*", [
            "user_id" => $_USER->getId(),
            "storage_limit[!]" => "",
            "LIMIT" => [$start, $limit]
        ]);
		$total = ($totalDrives * 15) * (1024 * 1024 * 1024);
		if($listDrives){
			foreach ($listDrives as $drive) {
				$_GDrive->setAuthConfig((isset($drive['data_json']) ? json_decode($drive['data_json'], true) : []), [
					"type" => $drive['type'],
					"path" => pathConfig($drive)
				]);
				$about = $_GDrive->getAbout();
				if($about['storageQuota']['limit'] > 0){
					$usage = $usage + $about['storageQuota']['usage'];
				}
				$database->update("core_drives", ["storage_limit" => $about['storageQuota']['limit'], "storage_usage" => $about['storageQuota']['usage'], "emailAddress" => $about['user']['emailAddress']], ["id" => $drive['id'], "user_id" => $_USER->getId()]);
				usleep(250000);
			}
		}
		$result = [
			"usage" => _sizeFormat($usage),
			"rate" => (($usage / $total) * 100),
			"usage_size" => $usage,
			"next" => (($start + $limit) < $totalDrives ? ($start + $limit) : null)
		];
		echo resultJson(200, "Ok", $result, JSON_UNESCAPED_UNICODE);	

	break;

	case 'multiple_drive': 
		$type_drive = isset($_POST['type_drive']) ? [$_POST['type_drive']] : ["all"];
		$size_file = isset($_POST['size_file']) ? $_POST['size_file'] : 0;

		if(!in_array("service_account", $type_drive) && !in_array("oauth", $type_drive)){
			$type_drive = ["service_account", "oauth"];
		}

		$data = false;

		$type_drive = array_map(function($arr){
			return "'".$arr."'";
		}, $type_drive);

		if(in_array("'oauth'", $type_drive)){
			$drive_unlimited = $database->get("core_drives", "*", ["multiple_access[!]" => "false", "user_id" => $_USER->getId(), "type" => "oauth", "storage_limit" => "", "LIMIT" => 1]);	
		}

		do {

			if(isset($drive_unlimited)){
				$random_drive[0] = $drive_unlimited;
				unset($drive_unlimited);
			} else {
				$random_drive = $database->select("core_drives", "*",
					Medoo\Medoo::raw('WHERE
						<multiple_access> != \'false\' AND
						<user_id> = '.$_USER->getId().' AND
						(<storage_limit> - <storage_usage>) >= '.mysql_escape_string($size_file).' AND
						<type> IN ('.implode(",", $type_drive).') 
						LIMIT 1
					')
				);					
			}
			

			if(isset($random_drive[0])){
				$_GDrive->setAuthConfig((isset($random_drive[0]['data_json']) ? json_decode($random_drive[0]['data_json'], true) : []), [
					"type" => $random_drive[0]['type'],
					"path" => pathConfig($random_drive[0])
				]);
				$about = $_GDrive->getAbout();
				$database->update("core_drives", ["storage_limit" => $about['storageQuota']['limit'], "storage_usage" => $about['storageQuota']['usage'], "emailAddress" => $about['user']['emailAddress']], ["id" => $random_drive[0]['id'], "user_id" => $_USER->getId()]);
				if(($about['access_token'] && $about['storageQuota']['limit'] !== 0)){
					if(($about['storageQuota']['limit'] - $about['storageQuota']['usage']) >= $size_file){
						$data = [
							"drive_id" => $random_drive[0]['id'],
							"access_token" => $about['access_token'],
							"storage_free" => ($about['storageQuota']['limit'] - $about['storageQuota']['usage']),
							"emailAddress" => $about['user']['emailAddress']
						];
					}
				}					
			}

		} while ($data === false && isset($random_drive[0]));	


		if($data){
			echo resultJson(200, "Ok", $data, JSON_UNESCAPED_UNICODE);
		} else {
			echo resultJson(403, "No Drive has enough storage left.", JSON_UNESCAPED_UNICODE);
			exit;
		}

	break;

	default:
		echo resultJson(403, "Access is denied.", JSON_UNESCAPED_UNICODE);
	break;
}


?>