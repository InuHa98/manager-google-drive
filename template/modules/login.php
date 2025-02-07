<?php

$_title = "Đăng nhập";


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


		?>
		<div class="container">
			<form method="POST">
				<div class="title">Login</div>
				<div class="input-box underline">
					<input type="text" placeholder="Enter Your Username" name="username" required>
					<div class="underline"></div>
				</div>
				<div class="input-box">
					<input type="password" placeholder="Enter Your Password" name="password" required>
					<div class="underline"></div>
				</div>
				<div class="option_div">
					<div class="check_box">
						<input type="checkbox" name="stayLogin">
						<span>Remember me</span>
					</div>
					<div class="forget_div">
						<a href="<?=_getUrl('forgotPass');?>">Forgot password?</a>
					</div>
				</div>
				<div class="input-box button">
					<input type="submit" name="login" value="Continue">
				</div>
			</form>
			<div class="option">Not a member? <a href="<?=_getUrl('register');?>">Signup now</a></div>
		</div>
	</body>
</html>