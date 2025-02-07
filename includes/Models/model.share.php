<?php



class shareModel extends MVC_model {

	function __construct(){
		global $_USER, $_config, $database, $_GDrive, $_Mvc;

		$this->setStatus([
			2 => "<strong>Error</strong>: Service_account.json is invalid or Google account has not enabled Drive Api.",
			3 => "Drive not found.Please access <a href='"._getUrl('management', 'drives')."'>management</a> to add a new drive.",

			429 => "<strong>Error</strong>: An error occurred.Please try again in a few minutes.",
			200 => "Successfully."
		]);

		$service_account = file_exists($_config['private_share_config']) ? json_decode(file_get_contents($_config['private_share_config']), true) : [];

		$data = render_data_serviceAccount($service_account);

		$_GDrive->setAuthConfig($data, [
			"type" => "service_account",
			"scopes" => ["https://www.googleapis.com/auth/drive.readonly"],
			"path" => $_config['private_share_path']
		]);
		$about = $_GDrive->getAbout();
		
		$this->addData([
			"type" => $_Mvc->getAction(),
			"about" => $about
		]);


	}

}



?>