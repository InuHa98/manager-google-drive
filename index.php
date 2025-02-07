<?php


$_rootPath = dirname(__FILE__);
define('_rootPath', $_rootPath);

include $_rootPath . '/includes/global.php';

$_Mvc = new Mvc([
			"request" => "controller",
			"default_controller" => "myDrive",
			"path_controller" => $_rootPath.'/template/modules',
			"replaceController" => [
				"Drive" => "myDrive",
				"Login" => "login",
				"Register" => "register",
				"ForgotPassword" => "forgotPass",
				"Logout" => "logout",
				"Profile" => "profile",
				"Management" => "management",
				"Thumbnail" => "thumbnail",
				"Share" => "share",
				"Download" => "download",
				"Help" => "help"
			]
		]);

$controller = $_Mvc->execute();

if($_Mvc->getError() === 404){
	$_title = "Not found - Drive Remote";
	$_title_module = "404";
	include $_rootPath.'/template/header.php';
	include $_rootPath.'/template/404.php';
	include $_rootPath.'/template/footer.php';
	exit;
}

if($_Mvc->getError() === 405)
{
	$_title = "System Error";
	$_title_module = $_title;
	include $_rootPath . '/template/header.php';
	echo '<div class="callout callout-danger"><strong>Error</strong>: Can\'t find module ('.$_Mvc->getController().')!';
	include $_rootPath . '/template/footer.php';
	exit;
} else {

	if(!$_USER->isLogin() && !in_array($_Mvc->getController(), ["login", "register", "forgotPass", "share", "download", "thumbnail"])){
		_location(_getUrl("login"));
	}

	include $controller;
}



?>