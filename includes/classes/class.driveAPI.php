<?php

class GoogleDriveAPI
{
	protected $expires_time = 2500;
	protected $AuthConfig = [];
	protected $client;
	protected $service;
	protected $path;
	protected $scopes = [
		'https://www.googleapis.com/auth/drive'
	];
	protected $type = "service_account"; //default type
	protected $code = "";
	protected $refresh = false;

	const DIR_TOKENS = "/accessTokens";
	protected $accessToken = "";
	protected $arrayToken = [];
	protected $configAccessToken = "";

	function __construct(){
		global $_path;

		if(!function_exists('Google_Client')){
			include $_path.'/vendor/autoload.php';
			$this->client = new Google_Client();
			$this->scopes = [Google\Service\Drive::DRIVE];
		}

		if(!file_exists(dirname(__FILE__).self::DIR_TOKENS)){
			mkdir(dirname(__FILE__).self::DIR_TOKENS, 0700);
		}

	}

	function setAuthConfig($config = [], $options = [], $access_token = ""){

		if(isset($options['type'])){
			$this->type = $options['type'];
		}

		if(isset($options['code'])){
			$this->code = $options['code'];
		}

		if(isset($options['refresh'])){
			$this->refresh = $options['refresh'];
		}

		if(isset($options['scopes'])){
			$this->scopes = $options['scopes'];
		}

		if(isset($options['path'])){
			$this->path = dirname(__FILE__).self::DIR_TOKENS.'/'.$options['path'];
		}

		if(isset($access_token)){
			$this->configAccessToken = $access_token;
			$this->arrayToken = $access_token;
			if(isset($this->arrayToken['access_token'])){
				$this->accessToken = $this->arrayToken['access_token'];
			}
		}


		if($config){
			$this->AuthConfig = $config;
			try {
				$this->service = new Google_Service_Drive($this->getClient());
			} catch(Exception $error){
			} catch(Error $error){
				
			}
			
		}
	}

	function getClient(){
		
		if($this->AuthConfig){
			$this->client->setAuthConfig($this->AuthConfig);
		} else {
			$this->client->useApplicationDefaultCredentials();
		}

		$this->client->setScopes($this->scopes);
		$this->client->setAccessType('offline');
		$this->client->setPrompt('force');

		if(!$this->path){
			if($this->type === "oauth"){
				$this->path = isset($this->AuthConfig['installed']['client_id']) ? dirname(__FILE__).self::DIR_TOKENS.'/oauth_'.$this->AuthConfig['installed']['client_id'].'.json' : '';
			} else {
				$this->path = isset($this->AuthConfig['client_email']) ? dirname(__FILE__).self::DIR_TOKENS.'/service_account_'.$this->AuthConfig['client_email'].'.json' : '';
			}
		}

		if($this->code && $this->type === "oauth"){
            $this->arrayToken = $this->client->fetchAccessTokenWithAuthCode($this->code);
            if(!array_key_exists("error", $this->arrayToken)){
            	$this->client->setAccessToken($this->arrayToken);
				$this->arrayToken['created'] = time();
		        file_put_contents($this->path, json_encode($this->arrayToken));
            }
		}

		$this->getAccessToken();

	    return $this->client;
	}

	function rawAccessToken(){
		return $this->arrayToken;
	}

	function getAccessTokenReadOnly(){

		$this->client->setScopes([
			"https://www.googleapis.com/auth/drive.readonly"
		]);

		if($this->type === "oauth"){
			$this->client->fetchAccessTokenWithRefreshToken($this->client->getRefreshToken());
		} else {
			$this->client->fetchAccessTokenWithAssertion();
		}
		
		$results = $this->client->getAccessToken();
		if(isset($results['access_token'])){
			$results['created'] = time();
		}
		return $results;
	}

	function setAccessToken(){

		if($this->type === "oauth"){
			$this->client->setAccessToken(json_decode(file_get_contents($this->path), true));
			if($this->client->isAccessTokenExpired() || $this->refresh === true){
		        if ($this->client->getRefreshToken()) {
		            $this->arrayToken = $this->client->fetchAccessTokenWithRefreshToken($this->client->getRefreshToken());
		            if(!array_key_exists("error", $this->arrayToken)){
		            	$this->client->setAccessToken($this->arrayToken);
		            }
		        }
			}
		} else {
			$this->client->fetchAccessTokenWithAssertion();
			$this->arrayToken = $this->client->getAccessToken();			
		}

		if(isset($this->arrayToken['access_token'])){
			$this->accessToken = $this->arrayToken['access_token'];
			$this->arrayToken['created'] = time();
		}

    	if($this->accessToken && !array_key_exists("error", $this->arrayToken)){
        	file_put_contents($this->path, json_encode($this->arrayToken));
        	return $this->arrayToken; 		
    	}

    	return false;
	}

	function getAccessToken(){

		if(!$this->path){
			return false;
		}

		if($this->configAccessToken && $this->type === "oauth"){
			$this->client->setAccessToken($this->configAccessToken);
			if($this->client->isAccessTokenExpired()){
		        if ($this->client->getRefreshToken()) {
		            $this->arrayToken = $this->client->fetchAccessTokenWithRefreshToken($this->client->getRefreshToken());
		            if(!array_key_exists("error", $this->arrayToken)){
		            	$this->client->setAccessToken($this->arrayToken);
		            }
		        }
			}
			return $this->client->getAccessToken();
		}
		
		if(!file_exists($this->path)){
			$token = $this->setAccessToken();
		} else {

			$token = json_decode(file_get_contents($this->path), true);

			$error = false;
			$this->arrayToken = $token;
			if(!array_key_exists("error", $this->arrayToken)){
				$error = false;
				$this->client->setAccessToken($token);
			}

			if(((isset($token['created']) && isset($token['expires_in']) && $token["created"]+$token["expires_in"] <= time()) || !isset($token['access_token']) || !isset($token['created']) || !isset($token['expires_in'])) || ($this->type === "oauth" && $this->client->isAccessTokenExpired()) || $this->refresh === true || $error === true){
				$token = $this->setAccessToken();
			}
		}
		return isset($token['access_token']) ? $token : false;
	}

	function deletePath($path = ""){
		$path = dirname(__FILE__).self::DIR_TOKENS.'/'.$path;
		if(is_file($path)){
			unlink($path);
			return true;
		}
		return false;
	}

	function renamePath($new_name = "", $old_name = ""){
		$path = dirname(__FILE__).self::DIR_TOKENS.'/';
		if(is_file($path.$old_name)){
			if(rename($path.$old_name, $path.$new_name)){
				return true;
			}
		}
		return false;
	}


	function getRootFolderId(){

		if(!isset($this->service->about))
			return "root";

		try {
			$results = $this->service->files->get('root');
			if($results instanceof Google_Service_Exception)
				return "root";
			return $results->getId();
		} catch(Exception $e){
			return "root";
		}

	}

	function http_authorize(){
		if(!isset($this->service->about))
			return false;

		return $this->client->authorize();
	}


	function getFile($id = "") {

		if(!isset($this->service->about))
			return false;
		
		if(!$id)
			return false;

		try {
			$file = $this->service->files->get($id, [
				'supportsAllDrives' => 'true',
				'fields' => "*"
			]);
			if($file instanceof Google_Service_Exception){
				return false;
			}


			return $this->fileInfo($file);
		} catch (Exception $e) {
			return false;
		}
	}

	function fileInfo($file = ""){
		if(!$file)
			return array();

		$info = [
			"name" => $file->getName(),
			"id" => $file->getId(),
			"iconLink" => $file->getIconLink(),
			"description" => $file->getDescription(),
			"mimeType" => $file->getMimeType(),
			"size" => $file->getSize(),
			"canCopy" => $file->getCapabilities() !== null ? $file->getCapabilities() : false,
			"parents" => $file->getParents(),
			"webContentLink" => $file->getWebContentLink(),
			"webViewLink" => $file->getWebViewLink(),
			"thumbnailLink" => $file->getThumbnailLink(),
			"createdTime" => $file->getCreatedTime(),
			"modifiedByMeTime" => $file->getModifiedByMeTime(),
			"modifiedTime" => $file->getModifiedTime(),
			"trashed" => $file->getTrashed(),
			"owners" => $file->getOwners(),
	        "ownedByMe" => $file->getOwnedByMe(),
	        "resourceKey" => $file->getResourceKey(),
	        "shortcutDetails" => $file->getShortcutDetails()
		];

		$permissions = array();
		if($file->getPermissions() !== null){
			foreach ($file->getPermissions() as $per) {
				$permissions[$per->emailAddress || $per->id] = [
                    "allowFileDiscovery" => $per->allowFileDiscovery,
                    "deleted" => $per->deleted,
                    "displayName" => $per->displayName,
                    "domain" => $per->domain,
                    "emailAddress" => $per->emailAddress,
                    "expirationTime" => $per->expirationTime,
                    "id" => $per->id,
                    "kind" => $per->kind,
                    "photoLink" => $per->photoLink,
                    "role" => $per->role,
                    "type" => $per->type
				];
			}			
		}

		$info['permissions'] = $permissions;


		return $info;
	}

	function getAbout($key = ""){

		if(!isset($this->service->about))
			return false;


		$token = $this->arrayToken;

		$results = [
			"rootFolderId" => $this->getRootFolderId(),
			"user" => [
				"displayName" => "",
				"photoLink" => "",
				"emailAddress" => ""
			],
			"storageQuota" => [
				"limit" => 0,
				"usage" => 0,
				"usageInDrive" => 0,
				"usageInDriveTrash" => 0
			],
			"access_token" => isset($token['access_token']) ? $token['access_token'] : '',
			"expires_in" => isset($token['expires_in']) ? $token['expires_in'] : 0,
			"created" => isset($token['created']) ? $token['created'] : 0
		];

		try {
			$optParams = array('fields' => "storageQuota,user");
			$about = $this->service->about->get($optParams);

			if($about instanceof Google_Service_Exception)
				return $results;

			$results['user'] = (array) $about->user;
			$results['storageQuota'] = (array) $about->storageQuota;
			return $results;

		} catch(Exception $e){
			return $results;
		}


	}

}




?>
