<?php

$_title = "Đăng kí mới";

?>
<!DOCTYPE html>
<html lang="en" dir="ltr">
	<head>
		<meta charset="UTF-8">
    	<title><?=$_title.' - '.$_config['site_name'];?></title>
   		<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
		<link rel="stylesheet" type="text/css" href="<?=$_config['url'];?>/assets/styles/font-awesome/css/all.css" />
		<link rel="stylesheet" type="text/css" href="<?=$_config['url'];?>/assets/styles/login.css?t=<?=$_version;?>" />
		<link rel="icon" type="image/x-icon" href="<?=$_config['url'];?>/favico.ico">
		<link rel="shortcut icon" type="image/x-icon" href="<?=$_config['url'];?>/favico.ico">
	</head>
	<body>
		<script type="text/javascript" src="<?=$_config['url'];?>/assets/scripts/jquery-3.4.1.min.js?v=<?=$_version;?>"></script>
	    <link rel="stylesheet" href="<?=$_config['url'];?>/assets/styles/nice-toast-js.css?v=<?=$_version;?>">
	    <script type="text/javascript" src="<?=$_config['url'];?>/assets/scripts/nice-toast-js.js"></script>
	    <?php 

			$_model = $_Mvc->getModel();
			$error = $_model->getError();
			$success = $_model->getSuccess();

		?>
		<div class="container">
			<form method="POST">
				<div class="title">Register</div>
				<?php
					if($error){
			        	echo newAlertMessage([
			        		"type" => "error",
			        		"message" => $error,
			        		"timeout" => 0
			        	]);
			        }
					if($success){
			        	echo newAlertMessage([
			        		"type" => "success",
			        		"message" => 'Sign up successfully! Click on <a href="'._getUrl('login').'">Here</a> to go to the login page.',
			        		"timeout" => 0
			        	]);
					}
				?>
				<div class="input-box underline">
					<input type="text" placeholder="Enter Your Username" name="username" required>
					<div class="underline"></div>
				</div>
				<div class="input-box">
					<input type="password" placeholder="Enter Your Password" name="password" required>
					<div class="underline"></div>
				</div>
				<div class="input-box">
					<input type="password" placeholder="Enter Your rePassword" name="rePassword" required>
					<div class="underline"></div>
				</div>
				<div class="input-box">
					<input type="email" placeholder="Enter Your Email" name="email" required>
					<div class="underline"></div>
				</div>
				<div class="input-box button">
					<input type="submit" name="register" value="Signup Now">
				</div>
			</form>
			<div class="option">Already have an account? <a href="<?=_getUrl('login');?>">Signin now</a></div>
		</div>
	</body>
</html>