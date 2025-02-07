<?php



class profileModel extends MVC_model {

	function __construct(){
		global $_USER, $_config, $_path, $database;

		$this->setStatus([
			1 => "<strong>Error</strong>: Invalid image format.",
			2 => "<strong>Success</strong>: Change avatar successfully.",
			3 => "<strong>Notice</strong>: No information to change.",
			4 => "<strong>Error</strong>: Invalid email format.",
			5 => "<strong>Error</strong>: Email already exists in the system.",
			6 => "<strong>Error</strong>: Authentication password is incorrect.",
			7 => "<strong>Error</strong>: Password must be more than 4 characters.",
			8 => "<strong>Error</strong>: Re-entered password is incorrect.",


			429 => "<strong>Error</strong>: An error occurred during upload..",
			430 => "Please try again in a few minutes.",
			200 => "<strong>Success</strong>: Save changes successfully."
		]);


		$this->addData([
			"data_avatar" => isset($_POST['data_avatar']) ? preg_replace("#data\:(.*?);base64,(.*?)#si", "$2", $_POST['data_avatar']) : '',

			"email" => isset($_POST['email']) ? trim($_POST['email']) : $_USER->getEmail(),
			"password" => isset($_POST['password']) ? trim($_POST['password']) : '',
			"new_password" => isset($_POST['new_password']) ? trim($_POST['new_password']) : '',
			"re_new_password" => isset($_POST['re_new_password']) ? trim($_POST['re_new_password']) : ''
		]);


		if(isset($_POST['change_avatar'])){

			if($this->data['data_avatar']){
				$avatar = base64_decode($this->data['data_avatar']);
				$finfo = finfo_open();
				$mime_type = finfo_buffer($finfo, $avatar, FILEINFO_MIME_TYPE);
				finfo_close($finfo);
				$extensions = ['image/jpg', 'image/jpe', 'image/jpeg', 'image/jfif', 'image/png', 'image/bmp', 'image/dib', 'image/gif'];
				if(!in_array($mime_type, $extensions)){
					$this->code = 1;
					$this->error = $this->status();
		        	echo newAlertMessage([
		        		"type" => "error",
		        		"message" => $this->status()
		        	]);
		    	} else {
					if(!file_exists(dirname($_path).'/images')){
					    mkdir(dirname($_path).'/images', 0755);
					}
					if(!file_exists(dirname($_path).'/images/users')){
					    mkdir(dirname($_path).'/images/users', 0755);
					}
					if(file_put_contents(dirname($_path).'/images/users/'.$_USER->getId().'.png', $avatar)){
						$this->code = 2;
						$this->success = $this->status();
			        	echo newAlertMessage([
			        		"type" => "success",
			        		"message" => $this->status()
			        	]);
					} else {
						$this->code = 429;
						$this->error = $this->status(429).$this->status(430);
			        	echo newAlertMessage([
			        		"type" => "warning",
			        		"message" => $this->status(429),
			        		"change" => [
			        			"message" => $this->status(430),
			        			"timeout" => 3000
			        		]
			        	]);
					}
		    	}
			}
		}

		if(isset($_POST['edit_profile'])){
			if($this->data['email'] != $_USER->getEmail() || $this->data['new_password'] || $this->data['re_new_password']){
				if($this->data['email'] != $_USER->getEmail() && !filter_var($this->data['email'], FILTER_VALIDATE_EMAIL)){
					$this->code = 4;
					$this->error = $this->status();
		        	echo newAlertMessage([
		        		"type" => "error",
		        		"message" => $this->status()
		        	]);
				} else if($this->data['email'] != $_USER->getEmail() && $database->has("core_users",["email" => $this->data['email'], "id[!]" => $_USER->getId()])){
					$this->code = 5;
					$this->error = $this->status();
		        	echo newAlertMessage([
		        		"type" => "warning",
		        		"message" => $this->status()
		        	]);
				} else if($database->has("core_users",["password[!]" => encodePassword($this->data['password']), "id" => $_USER->getId()])){
					$this->code = 6;
					$this->error = $this->status();
		        	echo newAlertMessage([
		        		"type" => "error",
		        		"message" => $this->status()
		        	]);

				} else if (($this->data['new_password'] || $this->data['re_new_password']) && mb_strlen($this->data['new_password']) < 4){
					$this->code = 7;
					$this->error = $this->status();
		        	echo newAlertMessage([
		        		"type" => "error",
		        		"message" => $this->status()
		        	]);
				} else if(($this->data['new_password'] || $this->data['re_new_password']) && $this->data['new_password'] != $this->data['re_new_password']){
					$this->code = 8;
					$this->error = $this->status();
		        	echo newAlertMessage([
		        		"type" => "error",
		        		"message" => $this->status()
		        	]);
				} else {
					$dataUpdate = [
						"email" => $this->data['email']
					];
					if($this->data['new_password']){
						$dataUpdate['password'] = encodePassword($this->data['new_password']);
					}

					if($database->update("core_users", $dataUpdate, ["id" => $_USER->getId()])->rowCount() > 0){
						$this->code = 200;
						$this->success = $this->status();
			        	echo newAlertMessage([
			        		"type" => "success",
			        		"message" => $this->status()
			        	]);
					} else {
						$this->code = 429;
						$this->error = $this->status(429).$this->status(430);
			        	echo newAlertMessage([
			        		"type" => "warning",
			        		"message" => $this->status(429),
			        		"change" => [
			        			"message" => $this->status(430),
			        			"timeout" => 3000
			        		]
			        	]);
					}
				}

			} else {
				$this->code = 3;
				$this->error = $this->status();
	        	echo newAlertMessage([
	        		"type" => "warning",
	        		"message" => $this->status()
	        	]);
			}
		}




	}

}



?>