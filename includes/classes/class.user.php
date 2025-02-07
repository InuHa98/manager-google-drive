<?php


class User {

    public static $id = "";
    public static $data = array();
    public static $login = false;

    function __construct()
    {
        $this->checkLogin();
    }

    public function checkLogin($data = "")
    {
    	global $database;

    	if(isset($data['username']) && isset($data['password'])){
        	$user_name =  $data['username'];
        	$user_pass =  encodePassword($data['password']);
        } else {
        	$user_name =  isset($_COOKIE['IDuser']) ? $_COOKIE['IDuser'] : (isset($_SESSION['IDuser']) ? $_SESSION['IDuser'] : '');
        	$user_pass =  isset($_COOKIE['IDpass']) ? $_COOKIE['IDpass'] : (isset($_SESSION['IDpass']) ? $_SESSION['IDpass'] : '');
        }

        $dataUser = $database->get("core_users","*",[
        	"AND" => [
        		"name" => $user_name,
        		"password" => $user_pass
        	],
        	'LIMIT' => 1
        ]);

        if(!$dataUser)
        	return false;

        self::$id = $dataUser['id'];
        self::$data = $dataUser;
        self::$login = true;
        
        return true;
    }

	public function isLogin()
	{
		return self::$login == true ? true : false;
	}

	public function login($username = "", $password = "", $stay = false)
	{
		global $_config;
		if($this->isLogin())
			return true;

		$this->logout();
		$data = array(
					"username" => $username,
					"password" => $password
				);

		if($this->checkLogin($data) == true)
		{
			if($stay != false){
				setcookie("IDuser", $username, time()+ 3600 * 24 * 365, $_config['url']);
				setcookie("IDpass", encodePassword($password), time()+ 3600 * 24 * 365, $_config['url']);				
			} else {
				$_SESSION['IDuser'] = $username;
				$_SESSION['IDpass'] = encodePassword($password);
			}

			return true;
		}

		return false;
	}


	public function logout()
	{
		global $_config;
		if(isset($_SESSION['IDuser']))
			unset($_SESSION['IDuser']);
		if(isset($_SESSION['IDpass']))
			unset($_SESSION['IDpass']);	

		if (isset($_SERVER['HTTP_COOKIE'])) {
		    $cookies = explode(';', $_SERVER['HTTP_COOKIE']);
		    foreach($cookies as $cookie) {
		        $parts = explode('=', $cookie);
		        $name = trim($parts[0]);
		        if($name !== "PHPSESSID"){
			        setcookie($name, '', time()-1000);
			        setcookie($name, '', time()-1000, '/');		        	
		        }

		    }
		}

		return true;
	}

	public function getId()
	{
		return self::$id;
	}

	public function getName()
	{
		return isset(self::$data['name']) ? self::$data['name'] : '';
	}
	public function getEmail()
	{
		return isset(self::$data['email']) ? self::$data['email'] : '';
	}
	public function getForgot_pass_key()
	{
		return isset(self::$data['forgot_pass_key']) ? self::$data['forgot_pass_key'] : '';
	}
	public function getForgot_pass_time()
	{
		return isset(self::$data['forgot_pass_time']) ? self::$data['forgot_pass_time'] : 0;
	}
	public function getActive()
	{
		return isset(self::$data['active']) ? self::$data['active'] : 0;
	}
	public function getAdm()
	{
		return isset(self::$data['adm']) ? self::$data['adm'] : 0;
	}

	public function getLimit_drive()
	{
		return isset(self::$data['limit_drive']) ? self::$data['limit_drive'] : 0;
	}


	public function getData($key = ""){
		return $key ? (isset(self::$data[$key]) ? self::$data[$key] : null) : self::$data;
	}

	public function updateData($column = "", $data = "")
	{
		global $database;

		if(!$column || $this->isLogin() == false)
			return false;

	    if($database->update("core_users", [
	        $column => $data
	    ],[
	    	"id" => self::$id
	    ])->rowCount() > 0)
	    	return true;

		return false;
	}

}

?>