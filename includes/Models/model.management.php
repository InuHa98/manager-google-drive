<?php

class managementModel extends MVC_model {

	use Users_Action, Projects_Action, Drives_Action;

	protected $action = array();
	protected $titlePage = "";
	protected $actionName = "";
	protected $descPage = "";

	protected $descAction = "";

	function __construct(){
		global $_config, $_USER;

		$this->setStatus([
			1 => "<strong>Error</strong>: Action file not found.",

			402 => "<strong>Error</strong>: Method Action Not found.",
			403 => "<strong>Error</strong>: Access is denied.",
			429 => "<strong>Error</strong>: An error occurred.Please try again in a few minutes.",
			200 => "Successful!"
		]);

		if(!$_USER->isLogin())// || !_isAdmin()
			_location($_config['url']);

		if(func_num_args() < 1)
			return false;

		$this->action(func_get_arg(0));

		if($this->check() != 200)
			$this->error = $this->status();
		else 
			$this->execute();
	}


	public function action($action = array()){

		if(!isset($action['name']))
			$action['name'] = '';

		if(!isset($action['path']))
			$action['path'] = '';

		if(isset($action['callback']))
			$this->callback = $action['callback'];

		return $this->action = $action;
	}


	public function check($action = "")
	{

		$action = $action ? $action : $this->action;

		if(!file_exists($action['path']))
			$this->code = 1;

		else
			$this->code = 200;


	    return $this->code;
	}


	public function execute($action = "")
	{
		$action = $action ? $action : $this->action;

		if(method_exists($this, $action['name'])){
			$method = $action['name'];
			$this->$method();
		} else {
			$this->code = 402;
			$this->error = $this->status();
		}

	}


	public function getTitlePage(){
		return $this->titlePage;
	}

	public function getDescPage(){
		return $this->descPage;
	}

	public function getDescAction(){
		return $this->descAction;
	}

	public function getActionName(){
		return $this->actionName;
	}

}


?>