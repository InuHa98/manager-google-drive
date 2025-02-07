<?php


class forgotPassModel extends MVC_model {

	protected $user = array();
	protected $expired = 30; // hết hạn sau 30 phút
	protected $newPassword = "";

	function __construct(){
		global $_config, $_USER, $_Mvc;

		$this->setStatus([
			1 => "<strong>Error</strong>: Email cannot be blank.",
			2 => "<strong>Error</strong>: Email does not exist in the system.",
			3 => "<strong>Error</strong>: The password reset request does not exist.",
			4 => "<strong>Notice</strong>: The password reset request has expired.",

			429 => "<strong>Error</strong>: An error occurred.",
			430 => "Please try again in a few minutes.",
			200 => "<strong>Success</strong>: Password reset request successful."
		]);

		if($_USER->isLogin())
			_location($_config['url']);

		$this->addData([
			"email" => isset($_POST['email']) ? $_POST['email'] : ''
		]);
		
		if(isset($_POST['forgetPassword'])){


			if($this->check() != 200)
				$this->error = $this->status();
			else {

				if($this->execute())
					$this->success = true;
				else 
					$this->error = $this->status();
			}

		} else if($_Mvc->getAction()){

			if($this->checkKey($_Mvc->getAction()) != 200)
				$this->error = $this->status();
			else {

				if($this->resetPassword())
					$this->success = true;
				else 
					$this->error = $this->status();
			}

		}

	}


	public function check()
	{
		global $database;

		if(empty($this->data['email']))
			$this->code = 1;

		else if( !$user = $database->get("core_users", "*", ["email" => $this->data['email'], "LIMIT" => 1]))
			$this->code = 2;

		else
			$this->code = 200;

		if(isset($user))
			$this->user = $user;

	    return $this->code;
	}


	public function checkKey($key = ""){
		global $database;

		$this->user = $database->get("core_users", "*", ["forgot_pass_key" => $key, "LIMIT" => 1]);

		if(!$this->user)
			$this->code = 3;

		else if ($this->user['forgot_pass_time'] < time())
			$this->code = 4;

		else
			$this->code = 200;

		return $this->code;
	}

	public function resetPassword()
	{
		global $database, $_config;

		$this->newPassword = $this->generatePassword(8);

    	if($database->update("core_users", [
	        "forgot_pass_key" => "",
	        "forgot_pass_time" => 0,
	        "password" => encodePassword($this->newPassword)
	    ],[
	    	"id" => $this->user['id']
	    ])->rowCount() > 0 ){

			$mailer = new Mailer();
			$title = "Lấy lại mật khẩu thành công - ".$_config['site_name'];

			$content = '<p>Xin chào <b>'.$this->user['name'].'</b>!</p>
						<p>Chúc mừng, Bạn đã đặt lại mật khẩu thành công.<br>
						=====================================</p>
						<p>Username: <b>'.$this->user['name'].'</b><br>
						New Password: <b>'.$this->newPassword.'</b></p>
						<p>=====================================<br>
						Đây là một tin nhắn tự động.<br>
						Cảm ơn bạn đã tham gia với chúng tôi!</p>';

			$mailer->send($this->user['email'], $title, $mailer->template($content));

			return true;
	    }


		$this->code = 429;
		$this->status = $this->status(429).$this->status(430);
	    return false;


	}

	public function execute()
	{
		global $_config, $database;

		if(empty($this->data['email'])){
			$this->code = 1;
			return false;
		}

		$key = $this->randomKey($this->data['email']);
		$time = time() + $this->expired * 60;

    	if($database->update("core_users", [
	        "forgot_pass_key" => $key,
	        "forgot_pass_time" => $time
	    ],[
	    	"id" => $this->user['id']
	    ])->rowCount() > 0){
			$mailer = new Mailer();
			$title = "Lấy lại mật khẩu - ".$_config['site_name'];

			$content = '<p>Xin chào <b>'.$this->user['name'].'</b>!</p>
						<p>Gần đây, bạn đã yêu cầu để thiết lập lại mật khẩu của bạn bởi vì bạn đã quên mật khẩu của mình.</p>
						<p>Yêu cầu sẽ tự hủy sau '.$this->expired.' phút vào lúc <b>'.date('H:i d/m/Y', $time).'</b>. Vui lòng xác nhận để có thể lấy lại mật khẩu.</p>
						<a target="_blank" href="'._getUrl('forgetPasswordKey',$key).'"><button>Đặt lại mật khẩu</button></a>
						<p>Nếu bạn không yêu cầu này, xin vui lòng bỏ qua nó.<br>
						Cảm ơn bạn đã tham gia với chúng tôi!</p>';

			$footer = '<p>Nếu bạn gặp sự cố khi nhấp vào nút "Đặt lại mật khẩu", hãy sao chép và dán URL bên dưới vào trình duyệt web của bạn: <a target="_blank" href="'._getUrl('forgetPasswordKey',$key).'">'._getUrl('forgetPasswordKey',$key).'</a></p>';

			if($mailer->send($this->data['email'], $title, $mailer->template($content,["footer" => $footer]))){
				return true;
			}
	    }

		$this->code = 429;
		$this->status = $this->status(429).$this->status(430);
	    return false;
	}

	public function randomKey($email = ""){
		return md5(uniqid($email ? $email : time(), true));
	}

	public function generatePassword($length = 6) {
	    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	    $charactersLength = strlen($characters);
	    $randomString = '';
	    for ($i = 0; $i < $length; $i++) {
	        $randomString .= $characters[rand(0, $charactersLength - 1)];
	    }
	    return $randomString;
	}

	public function setExpired($int = ""){
		if(is_numeric($int) && $int > 0)
			$this->expired = $int;
	}

	public function getExpired(){
		return $this->expired;
	}

	public function getNewPassword(){
		return $this->newPassword;
	}

	public function getUser(){
		return $this->user;
	}

}



?>