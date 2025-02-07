<?php

trait Users_Action {

	function Users(){
		global $_config, $database, $_USER, $_path;

		$this->status = [
			2 => "<strong>Error</strong>: no user selected.",
			3 => "<strong>Error</strong>: An error occurred.Please try again in a few minutes.",
			4 => "Successful!",
			5 => "<strong>Error</strong>: Limit drive is number limit or \'unlimited\'.",
			6 => "<strong>Error</strong>: Re-entered password is incorrect.",
			7 => "<strong>Error</strong>: Password must be more than 4 characters."
		];

		$this->titlePage = "AdminPanel users";
		$this->actionName = "Users";
		$this->descAction = "";

		$action = isset($_POST['action']) ? $_POST['action'] : '';
		$selected = isset($_POST['selected']) ? $_POST['selected'] : [];

		$default_orderBy = 'name';
		$check_orderBy = ["name", "active", "inactive"];

		if(isset($_GET['limit']) && intval($_GET['limit']) > 0){
			setcookie("numPage", $_GET['limit'], time()+ 3600 * 24 * 365, _getUrl('management', 'users'));
		}
		if(isset($_GET['orderBy']) && in_array($_GET['orderBy'], $check_orderBy)){
			setcookie("orderBy", $_GET['orderBy'], time()+ 3600 * 24 * 365, _getUrl('management', 'users'));
		}

		$cookieLimit = isset($_COOKIE['numPage']) ? $_COOKIE['numPage'] : $_config['numPage'];
		$cookieOrderBy = isset($_COOKIE['orderBy']) && in_array($_COOKIE['orderBy'], $check_orderBy) ? $_COOKIE['orderBy'] : 'name';
		$limit       = isset($_GET['limit']) && intval($_GET['limit']) > 0 ? intval($_GET['limit']) : $cookieLimit;
		$orderBy     = isset($_GET['orderBy']) && in_array($_GET['orderBy'], $check_orderBy) ? $_GET['orderBy'] : $cookieOrderBy;
		$orderBy_default = $orderBy;
		$orderType = "ASC";

		if($orderBy == "active"){
			$orderType = "DESC";
		}
		if($orderBy == "inactive"){
			$orderBy = "active";
		}

		$pageInfo  = _getPagination($limit);

		$where_itemCount = [
			"id[!]" => $_USER->getId(),
			"adm[<]" => $_USER->getAdm()
		];
		$where_itemList = [
			"id[!]" => $_USER->getId(),
			"adm[<]" => $_USER->getAdm(),
			"ORDER" => [
				$orderBy => $orderType,
				"adm" => "DESC"
			],
			"LIMIT" => [$pageInfo['start'], $pageInfo['limit']]
		];

		$disable_paging = false;
		if($action == "search"){
			$keyword = isset($_POST['keyword']) ? $_POST['keyword'] : '';
			$type = isset($_POST['type']) ? $_POST['type'] : 'name';

			$this->descAction = "Search by `"._echo($type)."`: "._echo($keyword);

			if($keyword && in_array($type, ['email', 'name'])){
				$where_itemCount[$type."[~]"] = $keyword;
				$where_itemList[$type."[~]"] = $keyword;
				unset($where_itemList['LIMIT']);
				$disable_paging = true;		
			}
		}

		
		if(isset($_POST['approve'])){
			if(count($selected) < 1){
				$this->code = 2;
				$this->error = newAlertMessage([
					"type" => "warning",
					"message" => $this->status(),
					"timeout" => 0
				]);
			} else {
				if($database->update("core_users", ["active" => 1], ["id" => $selected, "adm[<]" => $_USER->getAdm()])->rowCount() > 0){
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

		} else if(isset($_POST['deactivate'])){
			if(count($selected) < 1){
				$this->code = 2;
				$this->error = newAlertMessage([
					"type" => "warning",
					"message" => $this->status(),
					"timeout" => 0
				]);
			} else {
				if($database->update("core_users", ["active" => 0], ["id" => $selected, "adm[<]" => $_USER->getAdm()])->rowCount() > 0){
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

		} else if(isset($_POST['delete'])){
			if(count($selected) < 1){
				$this->code = 2;
				$this->error = newAlertMessage([
					"type" => "warning",
					"message" => $this->status(),
					"timeout" => 0
				]);
			} else {

				if($database->delete("core_users", ["id" => $selected, "adm[<]" => $_USER->getAdm()])->rowCount() > 0){

					$listDrive = $database->select("core_drives", ["id", "user_id"], ["user_id" => $selected]);
					foreach ($listDrive as $arr) {
						$_GDrive->deletePath(pathConfig($arr['id'], $arr['user_id']));
						if(is_file(dirname($_path).'/images/users/'.$arr['user_id'].'.png')){
							unlink(dirname($_path).'/images/users/'.$arr['user_id'].'.png');
						}
					}
					$database->delete("core_drives", ["user_id" => $selected]);
					$database->delete("core_projects", ["user_id" => $selected]);

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

		} else if(isset($_POST['setting'])){
			$user_id = isset($_POST['user_id']) ? $_POST['user_id'] : '';
			$limit_drive = isset($_POST['limit_drive']) ? $_POST['limit_drive'] : '';
			$new_password = isset($_POST['new_password']) ? $_POST['new_password'] : '';
			$re_new_password = isset($_POST['re_new_password']) ? $_POST['re_new_password'] : '';
			$active = isset($_POST['active']) && $_POST['active'] > 0 ? 1 : 0;

			if(!$user_id){
				$this->code = 2;
				$this->error = newAlertMessage([
					"type" => "warning",
					"message" => $this->status(),
					"timeout" => 0
				]);
			} else if((!is_numeric($limit_drive) && $limit_drive !== "unlimited") || $limit_drive === ""){
				$this->code = 5;
				$this->error = newAlertMessage([
					"type" => "error",
					"message" => $this->status(),
					"timeout" => 0
				]);
			} else if(($new_password || $re_new_password) && $new_password !== $re_new_password){
				$this->code = 6;
				$this->error = newAlertMessage([
					"type" => "error",
					"message" => $this->status(),
					"timeout" => 0
				]);
            } else if(($new_password || $re_new_password) && strlen($new_password) < 4){
				$this->code = 7;
				$this->error = newAlertMessage([
					"type" => "error",
					"message" => $this->status(),
					"timeout" => 0
				]);
            } else {
            	$update = [
            		"limit_drive" => $limit_drive,
            		"active" => $active
            	];

				if($new_password){
					$update['password'] = encodePassword($new_password);
				}

				if($database->update("core_users", $update, ["id" => $user_id, "adm[<]" => $_USER->getAdm()])->rowCount() > 0){
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


		$itemCount = $database->count("core_users", $where_itemCount);
		$this->addData([
			"limit" => $limit,
			"orderBy" => $orderBy_default,
			"itemCount" => $itemCount,
			"itemList" => $database->select("core_users", "*", $where_itemList),
			"itemPage" => ($itemCount > $limit) && $disable_paging == false ? splitPage($itemCount, $limit) : false
		]);

		return false;
	}


}

?>