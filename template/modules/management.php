<?php

$_action = $_Mvc->getAction() ? $_Mvc->getAction() : '';
$_aPath = dirname(__FILE__).'/actions/'.$_Mvc->getController().'/'.$_action.'.php';

$_model = $_Mvc->getModel([
	"name" => $_action,
	"path" => $_aPath
]);

$error = $_model->getError();
$success = $_model->getSuccess();
$codeError = $_model->getCode();

$actionName = $_model->getActionName();

$_title = $_model->getTitlePage()." - Management";
$_title_module = 'Managament';

require $_rootPath . '/template/header.php';


if(file_exists($_aPath)){

	if($_action === "users" && !_isAdmin() && !_isMod()){
		echo '<div class="callout callout-danger"><strong>Error</strong>: Access is denied.</div>';
	} else {
		if($error){
			if(is_callable($error, true)){
				echo $error;
			} else {
				echo newAlertMessage([
					"type" => "error",
					"message" => $error,
					"timeout" => 0
				]);			
			}

		}

		if($success){
			if(is_callable($success, true)){
				echo $success;
			} else {
				echo newAlertMessage([
					"type" => "success",
					"message" => $success,
					"timeout" => 0
				]);
			}
		}

		require_once $_aPath;		
	}

} else {
	echo '<div class="callout callout-danger"><strong>Error</strong>: Action module not found.</div>';
}

require $_rootPath . '/template/footer.php';
?>