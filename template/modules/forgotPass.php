<?php

$_title = "Quên mật khẩu";



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
				<div class="title">Forgot Password</div>
				<?php
					if($error){
			        	echo newAlertMessage([
			        		"type" => "error",
			        		"message" => $error
			        	]);
					}

					if($success){
						if($_model->getNewPassword()){
							echo '<div class="alert_success">
									<p>Lấy lại mật khẩu thành công.</p>
									<p>UserName: <b>'.$_model->getUser()['name'].'</b></p>
									<p>New Password: <b>'.$_model->getNewPassword().'</b></p>
								</div>';
						} else {
				        	echo newAlertMessage([
				        		"type" => "success",
				        		"message" => 'Một tin nhắn chứa mật khẩu mới của bạn đã được gửi đến địa chỉ: <b>'._echo($_model->getData('email')).'</b>. Mật khẩu lấy lại tự hủy sau '.$_model->getExpired().' phút.',
				        		"timeout" => 10000
				        	]);
						}
					}
				?>
				<div class="input-box underline">
					<input type="text" placeholder="Enter Your Email" name="email" value="<?=_echo($_model->getData('email'));?>" required>
					<div class="underline"></div>
				</div>
				<div class="input-box button">
					<input type="submit" name="forgetPassword" value="Continue">
				</div>
			</form>
			<div class="option">Not a member? <a href="<?=_getUrl('register');?>">Signup now</a></div>
			<div class="option">Already have an account? <a href="<?=_getUrl('login');?>">Signin now</a></div>
		</div>
	</body>
</html>