<?php



class registerModel extends MVC_model {

	function __construct(){
		global $_config, $_USER;

		$this->setStatus([
			1 => "<strong>Error</strong>: The username cannot be left blank.",
			2 => "<strong>Error</strong>: Username already exists.",
			3 => "<strong>Error</strong>: Username must be greater than 2 and less than 25 characters.",
			4 => "<strong>Error</strong>: Invalid username format.",
			5 => "<strong>Error</strong>: Password must be at least 4 characters.",
			6 => "<strong>Error</strong>: Re-entered password is incorrect.",
			7 => "<strong>Error</strong>: Invalid email format.",
			8 => "<strong>Error</strong>: Email already exists in the system.",

			429 => "<strong>Error</strong>: An error occurred.Please try again in a few minutes.",
			200 => "<strong>Success</strong>: successful registration."
		]);

		if($_USER->isLogin())
			_location($_config['url']);

		$this->addData([
			"username" => isset($_POST['username']) ? trim($_POST['username']) : '',
			"name" => isset($_POST['username']) ? trim($_POST['username']) : '',
	        "password" => isset($_POST['password']) ? trim($_POST['password']) : '',
	        "rePassword" => isset($_POST['rePassword']) ? trim($_POST['rePassword']) : '',
	        "email" => isset($_POST['email']) ? trim($_POST['email']) : '',
	        "forgot_pass_key" => '',
	        "forgot_pass_time" => 0
	    ]);

		if(isset($_POST['register'])){

			if($this->check() != 200)
				$this->error = $this->status();
			else {

				if($this->execute())
					$this->success = true;
				else 
					$this->error = $this->status();
			}


		}

	}

	public function check($data = "")
	{
		global $database;

		if(empty($this->data['name']))
			$this->code = 1;
		else if($database->has("core_users",["name" => $this->data['name']]))
			$this->code = 2;
		else if(mb_strlen($this->data['name']) < 2 || mb_strlen($this->data['name']) > 25)
			$this->code = 3;
		else if(preg_match('/[^\da-z\-\@\*\(\)\?\!\~\_\=\[\]]+/', $this->data['name']))
			$this->code = 4;
		else if (mb_strlen($this->data['password']) < 4)
			$this->code = 5;
		else if($this->data['password'] != $this->data['rePassword'])
			$this->code = 6;
		else if(!filter_var($this->data['email'], FILTER_VALIDATE_EMAIL))
			$this->code= 7;
		else if($database->has("core_users",["email" => $this->data['email']]))
			$this->code = 8;
		else
			$this->code = 200;

	    return $this->code;
	}


	public function execute()
	{
		global $database, $_USER, $_config;

		if($_USER->isLogin() || !is_array($this->data)){
			$this->code = 429;
			return false;
		}

	    if($database->insert("core_users", [
	        "name" => $this->data['name'],
	        "password" => encodePassword($this->data['password']),
	        "email" => isset($this->data['email']) ? $this->data['email'] : '',
	        "forgot_pass_key" => isset($this->data['forgot_pass_key']) ? $this->data['forgot_pass_key'] : '',
	        "forgot_pass_time" => isset($this->data['forgot_pass_time']) ? $this->data['forgot_pass_time'] : 0,
	        "active" => 0,
	        "adm" => 0,
	        "limit_drive" => $_config['default_limit_drive']
	    ])->rowCount() > 0) {
	    	return $database->id();
	    }

	    $this->code = 429;
	    return false;
	}

}



?>