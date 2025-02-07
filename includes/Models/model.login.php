<?php



class loginModel extends MVC_model {

	function __construct(){
		global $_USER, $_config, $_referer;

		$this->setStatus([
			1 => "<strong>Error</strong>: Wrong username or password.",
			2 => "<strong>Warning</strong>: The account has not been activated. Please contact the administrator to activate this account!",

			429 => "<strong>Error</strong>: An error occurred.",
			430 => "Please try again in a few minutes.",
			200 => "<strong>Success</strong>: Logged in successfully."
		]);


		if($_USER->isLogin())
			_location($_config['url']);

		$this->addData([
			"username" => isset($_POST['username']) ? $_POST['username'] : '',
			"password" => isset($_POST['password']) ? $_POST['password'] : '',
			"stayLogin" => isset($_POST['stayLogin']) ? true : false
		]);

		if(isset($_POST['login'])){
			if($_USER->login($this->data['username'], $this->data['password'], $this->data['stayLogin']) == true){
				if($_USER->getActive() > 0){
					$this->code = 200;
					$this->success = $this->status();
		        	echo newAlertMessage([
		        		"type" => "success",
		        		"message" => $this->status(),
		        		"timeout" => 2000
		        	]);
		        	_location($_config['url']);
				} else {
					$_USER->logout();
					$this->code = 2;
					$this->success = $this->status();
		        	echo newAlertMessage([
		        		"type" => "warning",
		        		"message" => $this->status(),
		        		"timeout" => 0
		        	]);
				}

				
			} else {
				$this->code = 1;
				$this->error = $this->status();
	        	echo newAlertMessage([
	        		"type" => "error",
	        		"message" => $this->status()
	        	]);
			}

		}

	}

}



?>