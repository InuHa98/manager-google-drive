<?php

trait Drives_Action {

	function Drives(){
		global $_config, $database, $_USER, $_Mvc, $_GDrive;

		$this->status = [
			2 => "<strong>Error</strong>: No drive selected.",
			3 => "<strong>Error</strong>: An error occurred.Please try again in a few minutes.",
			4 => "Successful!",
			5 => "<strong>Error</strong>: Please enter drive name.",
			6 => "<strong>Error</strong>: The drive name cannot exceed 50 characters.",
			7 => "<strong>Error</strong>: Drive name already exists. Please choose another name.",
			8 => "<strong>Error</strong>: Please upload 'Service_account.json' or 'Client_secret.json'.",
			9 => "<strong>Error</strong>: Config json is invalid or Google account has not enabled Drive Api.",
			10 => "<strong>Error</strong>: Please select project to add drive.",
			11 => "<strong>Error</strong>: Has reached the limit of the drive that can be created (".$_USER->getLimit_drive()."/".$_USER->getLimit_drive().").",
			12 => "<strong>Error</strong>: Please enter Verification Code.",
			13 => "<strong>Error</strong>: Verification Code is invalid or Google account has not enabled Drive Api."
		];

		$this->titlePage = "Drives";
		$this->actionName = "Drives";
		$this->descAction = "";

		$project_id = $_Mvc->getParams(0);

		$action = isset($_POST['action']) ? $_POST['action'] : '';
		$selected = isset($_POST['selected']) ? $_POST['selected'] : [];

		$default_orderBy = 'name';
		$check_orderBy = ["name", "new", "old"];
		
		if(isset($_GET['limit']) && intval($_GET['limit']) > 0){
			setcookie("numPage", $_GET['limit'], time()+ 3600 * 24 * 365, _getUrl('management', 'drives'));
		}
		if(isset($_GET['orderBy']) && in_array($_GET['orderBy'], $check_orderBy)){
			setcookie("orderBy", $_GET['orderBy'], time()+ 3600 * 24 * 365, _getUrl('management', 'drives'));
		}


		$cookieLimit = isset($_COOKIE['numPage']) ? $_COOKIE['numPage'] : $_config['numPage'];
		$cookieOrderBy = isset($_COOKIE['orderBy']) && in_array($_COOKIE['orderBy'], $check_orderBy) ? $_COOKIE['orderBy'] : $default_orderBy;
		$limit       = isset($_GET['limit']) && intval($_GET['limit']) > 0 ? intval($_GET['limit']) : $cookieLimit;
		$orderBy     = isset($_GET['orderBy']) && in_array($_GET['orderBy'], $check_orderBy) ? $_GET['orderBy'] : $cookieOrderBy;
		$orderBy_default = $orderBy;
		$orderType = "ASC";

		if($orderBy == "new"){
			$orderBy = "id";
			$orderType = "DESC";
		}
		if($orderBy == "old"){
			$orderBy = "id";
		}

		$pageInfo  = _getPagination($limit);


		$dbJoin = [
			"[>]core_projects" => ["project_id" => "id"]
		];
		$dbColumn = [
			"core_drives.id",
			"core_drives.user_id",
			"core_drives.project_id",
			"core_drives.name",
			"core_drives.data_json",
			"core_drives.emailAddress",
			"core_drives.multiple_access",
			"core_drives.note",
			"core_drives.type",
			"core_projects.name (project_name)"
		];

		$where_itemCount = [
			"core_drives.user_id" => $_USER->getId()
		];
		$where_itemList = [
			"core_drives.user_id" => $_USER->getId(),
			"ORDER" => [
				"core_drives.".$orderBy => $orderType
			],
			"LIMIT" => [$pageInfo['start'], $pageInfo['limit']]
		];

		if($project_id){
			$where_itemList['core_drives.project_id'] = $project_id;
			$where_itemCount['core_drives.project_id'] = $project_id;
			$infoProject = $database->get("core_projects", "*", ["id" => $project_id, "user_id" => $_USER->getId()]);
			$this->descAction = "<strong>in:</strong> <i class='bx bx-layer'></i> "._echo($infoProject['name'])." (<a href='"._getUrl('management', 'drives')."'>Show All</a>)";
		}

		$disable_paging = false;
		if($action == "search"){
			$keyword = isset($_POST['keyword']) ? $_POST['keyword'] : '';
			$type = isset($_POST['type']) ? $_POST['type'] : 'name';

			$this->descAction = "Search by `"._echo($type)."`: "._echo($keyword);

			if($keyword && in_array($type, ['name', 'note', 'project'])){
				$where = $type == "project" ? "core_projects.name[~]" : "core_drives.".$type."[~]";
				$where_itemCount[$where] = $keyword;
				$where_itemList[$where] = $keyword;
				unset($where_itemList['LIMIT']);
				$disable_paging = true;		
			}
		}

		if(isset($_POST['delete'])){
			if(count($selected) < 1){
				$this->code = 2;
				$this->error = newAlertMessage([
					"type" => "warning",
					"message" => $this->status(),
					"timeout" => 0
				]);
			} else {

				if($database->delete("core_drives", ["id" => $selected, "user_id" => $_USER->getId()])->rowCount() > 0){

					foreach ($selected as $id) {
						$_GDrive->deletePath(pathConfig($id, $_USER->getId()));
					}
					
					$this->code = 4;
					$this->success = newAlertMessage([
						"type" => "success",
						"message" => $this->status(),
						"timeout" => 0
					]);
				} else {
					$this->code = 3;
					$this->error = newAlertMessage([
						"type" => "warning",
						"message" => $this->status(),
						"timeout" => 0
					]);
				}
			}

		} else if(isset($_POST['new']) || isset($_POST['edit'])){
			$drive_id = isset($_POST['drive_id']) ? $_POST['drive_id'] : '';
			$project = isset($_POST['project']) ? intval($_POST['project']) : 0;
			$name = isset($_POST['name']) ? $_POST['name'] : '';
			$type = isset($_POST['type']) ? $_POST['type'] : 'service_account';
			$code = isset($_POST['code']) ? trim($_POST['code']) : '';
			$data_json_request = isset($_POST['data_json_request']) ? preg_replace("#data\:(.*?);base64,(.*?)#si", "$2", $_POST['data_json_request']) : '';
			$note = isset($_POST['note']) ? $_POST['note'] : '';
			$multiple_access = isset($_POST['multiple_access']) ? $_POST['multiple_access'] : 'true';


			$driveInfo = isset($_POST['edit'])  ? $database->get("core_drives", "*", ["id" => $drive_id, "user_id" => $_USER->getId()]) : '';

			if(!$driveInfo && isset($_POST['edit'])){
				$this->code = 2;
				$this->error = newAlertMessage([
					"type" => "warning",
					"message" => $this->status(),
					"timeout" => 0
				]);
			} else if(isset($_POST['new']) && $_USER->getLimit_drive() !== "unlimited" && $database->count("core_drives", ["user_id" => $_USER->getId()]) >= $_USER->getLimit_drive() ){
				$this->code = 11;
				$this->error = newAlertMessage([
					"type" => "error",
					"message" => $this->status(),
					"timeout" => 0
				]);
			} else if($project < 1){
				$this->code = 10;
				$this->error = newAlertMessage([
					"type" => "error",
					"message" => $this->status(),
					"timeout" => 0
				]);
			} else if($data_json_request === ""){
				$this->code = 8;
				$this->error = newAlertMessage([
					"type" => "error",
					"message" => $this->status(),
					"timeout" => 0
				]);
			} else if(($type === "oauth" && empty($code) && isset($_POST['new'])) || (isset($_POST['edit']) && $type === "oauth" && empty($code) && base64_encode($driveInfo['data_json']) != $data_json_request)){

				$this->code = 12;
				$this->error = newAlertMessage([
					"type" => "error",
					"message" => $this->status(),
					"timeout" => 0
				]);
			} else if($name === ""){
				$this->code = 5;
				$this->error = newAlertMessage([
					"type" => "error",
					"message" => $this->status(),
					"timeout" => 0
				]);
			} else if(strlen($name) > 50){
				$this->code = 6;
				$this->error = newAlertMessage([
					"type" => "error",
					"message" => $this->status(),
					"timeout" => 0
				]);
			} else if((isset($_POST['new']) && $database->has("core_drives", ["user_id" => $_USER->getId(), "name" => $name, "project_id" => $project])) || (isset($_POST['edit']) && $database->has("core_drives", ["user_id" => $_USER->getId(), "name" => $name, "project_id" => $project, "id[!]" => $drive_id]))){
				$this->code = 7;
				$this->error = newAlertMessage([
					"type" => "error",
					"message" => $this->status(),
					"timeout" => 0
				]);
            } else {

            	if($type === "oauth"){
            		$client_secret = json_decode(base64_decode($data_json_request), true);
            		$data = render_data_oAuth($client_secret);

            		$path_save = isset($_POST['edit']) ? pathConfig($driveInfo) : "tmp_".$data['installed']['client_id'].'_'.time().'.json';

            		$_GDrive->setAuthConfig($data, [
            			"type" => "oauth",
            			"code" => $code,
            			"path" => $path_save
            		]);

            	} else {
					$service_account = json_decode(base64_decode($data_json_request), true);
					$data = render_data_serviceAccount($service_account);

					$path_save = isset($_POST['edit']) ? pathConfig($driveInfo) : "tmp_".$data['client_id'].'_'.time().'.json';

					$_GDrive->setAuthConfig($data, [
						"type" => "service_account",
            			"path" => $path_save
					]);
					    		
            	}
            	$about = $_GDrive->getAbout();

				if(!$about['access_token'] || $about['storageQuota']['limit'] === 0){
					if(isset($_POST['new'])){
						$_GDrive->deletePath($path_save);
					}
					
					$this->code = $type === "oauth" ? 13 : 9;
					$this->error = newAlertMessage([
						"type" => "error",
						"message" => $this->status(),
						"timeout" => 0
					]);

				} else {

					if(isset($_POST['new'])){
		            	$insert = [
		            		"type" => $type,
		            		"project_id" => $project,
		            		"name" => $name,
		            		"data_json" => json_encode($data, JSON_PRETTY_PRINT),
		            		"emailAddress" => $about['user']['emailAddress'],
		            		"note" => $note,
		            		"user_id" => $_USER->getId(),
		            		"time" => time(),
		            		"multiple_access" => "true",
		            		"storage_limit" => $about['storageQuota']['limit'],
		            		"storage_usage" => $about['storageQuota']['usage']
		            	];
		            	$exec = $database->insert("core_drives", $insert)->rowCount();
		            	$insert_id = $database->id();
		            	if($insert_id){
		            		$_GDrive->renamePath(pathConfig($insert_id, $_USER->getId()), $path_save);
		            	}	
					} else {
		            	$update = [
		            		"type" => $type,
		            		"project_id" => $project,
		            		"name" => $name,
		            		"data_json" => json_encode($data, JSON_PRETTY_PRINT),
		            		"emailAddress" => $about['user']['emailAddress'],
		            		"note" => $note,
		            		"time" => time(),
		            		"multiple_access" => $multiple_access,
		            		"storage_limit" => $about['storageQuota']['limit'],
		            		"storage_usage" => $about['storageQuota']['usage']
		            	];
		            	$exec = $database->update("core_drives", $update, ["id" => $drive_id, "user_id" => $_USER->getId()])->rowCount();
					}

					if($exec > 0){
						$this->code = 4;
						$this->success = newAlertMessage([
							"type" => "success",
							"message" => $this->status(),
							"timeout" => 0
						]);
					} else {
						$this->code = 3;
						$this->error = newAlertMessage([
							"type" => "warning",
							"message" => $this->status(),
							"timeout" => 0
						]);
					}

				}

            }
        }


		$itemCount = $database->count("core_drives", $dbJoin, "*", $where_itemCount);
		$this->addData([
			"limit" => $limit,
			"orderBy" => $orderBy_default,
			"itemCount" => $itemCount,
			"itemList" => $database->select("core_drives", $dbJoin, $dbColumn, $where_itemList),
			"itemPage" => ($itemCount > $limit) && $disable_paging == false ? splitPage($itemCount, $limit) : false
		]);

		return false;
	}


}

?>