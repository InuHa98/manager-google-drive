<?php


class Mvc {

	protected $request = "mod";

	protected $controller = "";
	protected $action = "";
	protected $params = array();
	protected $modelClassName = "";

	protected $path_controller = "template/modules";
	protected $replaceController = array();

	protected $error = ""; // 404 => đường dẫn không chính xác, 405 => module không tồn tại

	function __construct($config = array())
	{
		global $_rootPath;

		if(isset($config["request"]))
			$this->setRequest($config["request"]);

		if(isset($config["default_controller"]))
			$this->setController($config["default_controller"]);

		if(isset($config["path_controller"]))
			$this->path_controller = rtrim($config["path_controller"], "/");

		if(isset($config["replaceController"]) && is_array($config["replaceController"]))
			$this->replaceController = $config["replaceController"];

	}

	function execute(){
		global $_path;

		$arr = $this->urlProcess();


		$controller = isset($arr[0]) ? $arr[0] : '';

		if($controller && !isset($this->replaceController[$controller])){
			$this->error = 404;
			return false;
		} else {
			$this->controller = isset($this->replaceController[$controller]) ? $this->replaceController[$controller] : $this->controller;
			unset($arr[0]);
		}

		if(!file_exists($this->path_controller.'/'.$this->controller.'.php')){
			$this->error = 405;
			return false;
		}

		if(file_exists($_path.'/Models/Actions/'.$this->controller)){
			$actions = glob($_path.'/Models/Actions/'.$this->controller.'/action.*.php', GLOB_BRACE);
			if($actions)
				foreach ($actions as $action)
					require_once $action;
		}
		

		if(file_exists($_path.'/Models/model.'.$this->controller.'.php')){
			require_once $_path.'/Models/model.'.$this->controller.'.php';
			$this->modelClassName = $this->controller.'Model';
		}


		if(isset($arr[1])){
			$this->action = $arr[1];
			unset($arr[1]);
		}

		$this->params = $arr ? array_values($arr) : array();

		return $this->path_controller.'/'. $this->controller .'.php';
	}

	function setRequest($name = ""){
		if($name !== "")
			$this->request = $name;
	}

	function urlProcess(){

		$url = isset($_GET[$this->request]) ? filter_var(trim($_GET[$this->request], "/")) : '';

		if($url)
			return explode("/", $url);
	}

	function getError(){
		return $this->error;
	}

	public function getModel($data = ""){

		if(!$this->modelClassName)
			return false;

		if($data !== "")
			return new $this->modelClassName($data);

		return new $this->modelClassName;
	}


	public function setController($name = ""){
		$this->controller = $name;
	}

	public function getController(){
		return $this->controller;
	}

	public function setAction($name = ""){
		$this->action = $name;
	}

	public function getAction(){
		return $this->action;
	}

	public function setParams($data = array()){
		if(is_array($data))
			$this->params = $data;
	}

	public function getParams($key = ""){

		if($key !== "")
			return isset($this->params[$key]) ? $this->params[$key] : '';

		return $this->params;
	}

}


class MVC_model {

	protected $code = 0;
	protected $error = false;
	protected $success = false;
	protected $data = [];
	protected $status = [];

	public function status($code = "")
	{
		$code = $code ? $code : $this->code;
		$status = [];

		if($this->status)
			foreach ($this->status as $key => $value)
				$status[$key] = $value;

		if(!array_key_exists($code, $status))
			return 'Status Code không chính xác!';

		return $status[$code];
	}

	public function addData($data = "")
	{
		if($data === "")
			return false;

		$this->data = array_merge($this->data, is_array($data) ? $data : [$data]);
	}

	public function getData($key = "")
	{
		if($key !== "")
			return isset($this->data[$key]) ? $this->data[$key] : '';

		return $this->data;
	}

	public function setCode($code = "")
	{
		if($code !== "")
			return $this->code = $code;
		return false;
	}

	public function getCode()
	{
		return $this->code;
	}

	public function setError($error = ""){
		if($error !== "")
			return $this->error = $error;
		return false;
	}

	public function getError(){
		return $this->error;
	}

	public function setSuccess($success = ""){
		if($success !== "")
			return $this->success = $success;
		return false;
	}

	public function getSuccess(){
		return $this->success;
	}

	public function setStatus($status = []){
		if(is_array($status))
			return $this->status = $status;
		return false;
	}

	public function getStatus(){
		return $this->status;
	}
}



?>