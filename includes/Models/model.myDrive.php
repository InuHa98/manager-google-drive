<?php



class myDriveModel extends MVC_model {

	function __construct(){
		global $_USER, $_config, $database, $_GDrive, $_Mvc;

		$this->setStatus([
			2 => "<strong>Error</strong>: Json config is invalid or Google account has not enabled Drive Api.",
			3 => "Drive not found.Please access <a href='"._getUrl('management', 'drives')."'>management</a> to add a new drive.",

			429 => "<strong>Error</strong>: An error occurred.Please try again in a few minutes.",
			200 => "Successfully."
		]);

		if(!$_Mvc->getAction()){
			$select = isset($_GET['drive']) ? $_GET['drive'] : (isset($_COOKIE['_curDrive']) ? $_COOKIE['_curDrive'] : 0);
		} else {
			$select = $_Mvc->getAction();
		}

		$drive = _getDrive($select);

		$about = [];
		if(!$drive && !$_Mvc->getAction()){
			$drive = $database->get("core_drives", "*", [
				"user_id" => $_USER->getId(),
				"ORDER" => [
					"name" => "ASC"
				],
				"LIMIT" => 1
			]);
		}

		if(!$drive){
			$this->code = 3;
			$this->error = $this->status();
			setcookie("_curDrive", "", 1, '/'); 
		} else {
			$_GDrive->setAuthConfig((isset($drive['data_json']) ? json_decode($drive['data_json'], true) : []), [
				"type" => $drive['type'],
				"path" => pathConfig($drive)
			]);
			$about = $_GDrive->getAbout();
			$database->update("core_drives", ["storage_limit" => $about['storageQuota']['limit'], "storage_usage" => $about['storageQuota']['usage'], "emailAddress" => $about['user']['emailAddress']], ["id" => $drive['id'], "user_id" => $_USER->getId()]);
			if(!$about['access_token'] || $about['storageQuota']['limit'] === 0){
				$this->code = 2;
				$this->error = $this->status();
			} else {
				$this->code = 200;
				setcookie("_curDrive", $drive['id'], time()+ 3600 * 24 * 365, '/');
			}			
		}

		$this->addData([
			"drive" => $drive,
			"about" => $about
		]);


	}

}



?>