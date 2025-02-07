<?php

trait Projects_Action {

	function Projects(){
		global $_config, $database, $_USER;

		$this->status = [
			2 => "<strong>Error</strong>: No project selected.",
			3 => "<strong>Error</strong>: An error occurred.Please try again in a few minutes.",
			4 => "Successful!",
			5 => "<strong>Error</strong>: Please enter project name.",
			6 => "<strong>Error</strong>: The project name cannot exceed 50 characters.",
			7 => "<strong>Error</strong>: Project name already exists. Please choose another name."
		];

		$this->titlePage = "Projects";
		$this->actionName = "Projects";
		$this->descAction = "";

		$action = isset($_POST['action']) ? $_POST['action'] : '';
		$selected = isset($_POST['selected']) ? $_POST['selected'] : [];

		$default_orderBy = 'name';
		$check_orderBy = ["name", "new", "old"];

		if(isset($_GET['limit']) && intval($_GET['limit']) > 0){
			setcookie("numPage", $_GET['limit'], time()+ 3600 * 24 * 365, _getUrl('management', 'projects'));
		}
		if(isset($_GET['orderBy']) && in_array($_GET['orderBy'], $check_orderBy)){
			setcookie("orderBy", $_GET['orderBy'], time()+ 3600 * 24 * 365, _getUrl('management', 'projects'));
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

		$where_itemCount = [
			"user_id" => $_USER->getId()
		];
		$where_itemList = [
			"user_id" => $_USER->getId(),
			"ORDER" => [
				$orderBy => $orderType
			],
			"LIMIT" => [$pageInfo['start'], $pageInfo['limit']]
		];

		$disable_paging = false;
		if($action == "search"){
			$keyword = isset($_POST['keyword']) ? $_POST['keyword'] : '';
			$type = isset($_POST['type']) ? $_POST['type'] : 'name';

			$this->descAction = "Search by `"._echo($type)."`: "._echo($keyword);

			if($keyword && in_array($type, ['name', 'note'])){
				$where_itemCount[$type."[~]"] = $keyword;
				$where_itemList[$type."[~]"] = $keyword;
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

				if($database->delete("core_projects", ["id" => $selected, "user_id" => $_USER->getId()])->rowCount() > 0){

					$listDrive = $database->select("core_drives", "id", ["project_id" => $selected, "user_id" => $_USER->getId()]);
					foreach ($listDrive as $arr) {
						$_GDrive->deletePath(pathConfig($arr['id'], $_USER->getId()));
					}
					
					$database->delete("core_drives", ["project_id" => $selected, "user_id" => $_USER->getId()]);

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
			$project_id = isset($_POST['project_id']) ? $_POST['project_id'] : '';
			$name = isset($_POST['name']) ? $_POST['name'] : '';
			$note = isset($_POST['note']) ? $_POST['note'] : '';

			if(!$project_id && isset($_POST['edit'])){
				$this->code = 2;
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
			} else if((isset($_POST['new']) && $database->has("core_projects", ["user_id" => $_USER->getId(), "name" => $name])) || (isset($_POST['edit']) && $database->has("core_projects", ["user_id" => $_USER->getId(), "name" => $name, "id[!]" => $project_id]))){
				$this->code = 7;
				$this->error = newAlertMessage([
					"type" => "error",
					"message" => $this->status(),
					"timeout" => 0
				]);
            } else {
            	if(isset($_POST['new'])){
	            	$insert = [
	            		"name" => $name,
	            		"note" => $note,
	            		"user_id" => $_USER->getId()
	            	];
	            	$exec = $database->insert("core_projects", $insert)->rowCount();
            	} else {
	            	$update = [
	            		"name" => $name,
	            		"note" => $note
	            	];
					$exec = $database->update("core_projects", $update, ["id" => $project_id, "user_id" => $_USER->getId()])->rowCount();
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


		$itemCount = $database->count("core_projects", $where_itemCount);
		$this->addData([
			"limit" => $limit,
			"orderBy" => $orderBy_default,
			"itemCount" => $itemCount,
			"itemList" => $database->select("core_projects", "*", $where_itemList),
			"itemPage" => ($itemCount > $limit) && $disable_paging == false ? splitPage($itemCount, $limit) : false
		]);

		return false;
	}


}

?>