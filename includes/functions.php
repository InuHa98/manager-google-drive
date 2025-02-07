<?php

function mysql_escape_string($inp = "") {
    if(is_array($inp))
        return array_map(__METHOD__, $inp);

    if(!empty($inp) && is_string($inp)) {
        return str_replace(array('\\', "\0", "\n", "\r", "'", '"', "\x1a"), array('\\\\', '\\0', '\\n', '\\r', "\\'", '\\"', '\\Z'), $inp);
    }

    return $inp;
}

if(!function_exists('array_key_last')) {
    function array_key_last(array $array) {
        if( !empty($array) ) return key(array_slice($array, -1, 1, true));
    }
}

if (!function_exists('array_key_first')) {
    function array_key_first(array $arr) {
        foreach($arr as $key => $unused) return $key;
    }
}

if(!function_exists('mb_strlen')){
    function mb_strlen($text = ""){
        return strlen($text);
    }
}

function resultJson($code = 0, $mess = "", $data = [], $flags = 0){
    if(is_array($data) == false && !$flags){
        $flags = $data;
        $data = [];
    }

    return json_encode([
        "code" => $code,
        "message" => $mess,
        "data" => $data
    ], $flags);
}

function pathConfig($drive, $user_id = ""){
    if($user_id){
        $drive = [
            "id" => $drive,
            "user_id" => $user_id
        ];
    }
    return $drive['user_id'].'_'.$drive['id'].'.json';
}

function _listProjects($project_id = ""){
    global $database, $_USER;
    if($project_id === ""){
        return $database->select("core_projects", "*", [
            "user_id" => $_USER->getId(),
            "ORDER" => [
                "name" => "ASC"
            ]
        ]);        
    } else {
        return $database->get("core_projects", "*", [
            "id" => $project_id,
            "user_id" => $_USER->getId()
        ]);    
    }
}

function _listDrives($project_id = ""){
    global $database, $_USER;
    if($project_id === ""){
        return $database->select("core_drives", "*", [
            "user_id" => $_USER->getId(),
            "ORDER" => [
                "name" => "ASC"
            ]
        ]);        
    } else {
        return $database->select("core_drives", "*", [
            "project_id" => $project_id,
            "user_id" => $_USER->getId(),
            "ORDER" => [
                "name" => "ASC"
            ]
        ]);    
    }
}

function _getDrive($drive_id = ""){
    global $database, $_USER;
    if($drive_id === ""){
        return false;        
    } else {
        return $database->get("core_drives", "*", [
            "id" => $drive_id,
            "user_id" => $_USER->getId()
        ]);    
    }
}


function newAlertMessage($arr = []){
    $_alert_message = [
        "type" => "default",
        "message" => "",
        "position" => "top-right",
        "progressBar" => "true",
        "timeout" => 5000,
        "change" => [
            "message" => "",
            "timeout" => 2000
        ]
    ];
    if($arr && is_array($arr)){
        foreach($arr as $key => $value){
            $_alert_message[$key] = $value;
        }
    }
    $result = <<<EOF
            <script type="text/javascript">
                $.niceToast.setup({
                    position: "{$_alert_message['position']}",
                    timeout: {$_alert_message['timeout']},
                    progressBar: {$_alert_message['progressBar']}
                });
EOF;
    $toastType = $_alert_message['type'] == "default" || $_alert_message['type'] === "" ? '$.niceToast' : '$.niceToast.'.$_alert_message['type'];
    if($_alert_message['change']['message']){
            $result .= "let toast = ".$toastType."('".$_alert_message['message']."');
                    toast.change('".$_alert_message['change']['message']."', '".$_alert_message['change']['timeout']."');";
    } else {
            $result .= $toastType."('".$_alert_message['message']."');";
    }
    $result .= '</script>';
    return $result;
}

function splitPage($count = 0, $limit = ""){

    $result = [];

    $pageInfo = _getPagination($limit);

    $query_string = isset($_SERVER['REQUEST_URI']) ? trim($_SERVER['REQUEST_URI']) : '';
    if(preg_match("#^(.*?)\?(.*?)$#si", $query_string)){
        $query_string = preg_replace("#^(.*?)\?(.*?)$#si", "$2", $query_string);
        parse_str($query_string, $query_array);
        if(isset($query_array['page']))
            unset($query_array['page']);
        $result['query_string'] = "?".http_build_query($query_array).(count($query_array) > 0 ? '&' : '')."page=%s";
    } else {
        $result['query_string'] = "?page=%s";
    }


    $page = $pageInfo['page'];

    if($limit === "")
        $limit = $pageInfo['limit'];

    $pageEnd = ceil($count / $limit);
    if ($pageEnd == 0)
        $pageEnd = 1;

    $result['current'] = $page;
    $result['first'] = ($page != 1) && $count > $limit ? 1 : false;
    $result['prev'] = ($page > 1) && $count > $limit  ? $page - 1 : false;
    $result['next'] = ($page < $pageEnd) && $count > $limit  ? ($page + 1) : false;
    $result['end'] = ($page != $pageEnd) && $count > $limit  ? $pageEnd : false; 

    $begin = ($page - 2) < 1 ? 1 : ($page - 2);
    $end   = ($page + 2) > $pageEnd ? $pageEnd : ($page + 2);

    $result['page'] = [];

    for ($i = $begin; $i <= $end; $i++)
        $result['page'][] = $i;

    return $result;
}

function _txtShort($text = "", $num = 8) {
    if(!$text || !is_numeric($num))
        return false;
        
    $result = "";
    if(strlen($text) > $num){
        return substr($text, 0, $num)."...";
    }
    return $text;
    
}

function generateString($length = 6, $explode = 0, $explode_string = "-") {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $charactersLength = strlen($characters);
    $randomString = '';
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[rand(0, $charactersLength - 1)];
    }
    return $explode > 0 ? implode($explode_string, str_split($randomString, $explode)) : $randomString;
}

function _getUser($where = "", $column = "*"){
    global $database;

    if($where === "")
        return false;

    return $database->get("core_users", $column, $where);
}

function _location($url = "", $second = 0){
    if($url === "")
        return null;

	if( is_numeric($second) && $second > 0)
		header('refresh:'.$second.';url='.$url);
	else
		header('Location: '.$url);
}

function _isAdmin($id = ""){
	global $_USER, $database;

    if($id === "")
        return $_USER->getAdm() == 2 ? true : false;

	if($database->has('core_users',[
		"AND" => [
			"id" => $id,
			"adm" => 2
		]
	]))
		return true;

	return false;
}

function _isMod($id = ""){
    global $_USER, $database;

    if($id === "")
        return $_USER->getAdm() == 1 ? true : false;

    if($database->has('core_users',[
        "AND" => [
            "id" => $id,
            "adm" => 1
        ]
    ]))
        return true;

    return false;
}

function _getGet($name = "", $default = ""){
	return isset($_GET[$name]) ? $_GET[$name] : $default;
}

function _getPost($name = "", $default = ""){
	return isset($_POST[$name]) ? $_POST[$name] : $default;
}

function _getRequest($name = "", $default = ""){
	return isset($_REQUEST[$name]) ? $_REQUEST[$name] : $default;
}


function _time($var = 0, $type = "") {

    if($type == 't'){
        return date("H:i A", $var);
    } else if($type == 'd'){
        if (date('Y', $var) == date('Y', time())) {
            if (date('z', $var) == date('z', time()))
                return 'Hôm nay';
            if (date('z', $var) == date('z', time()) - 1)
                return 'Hôm qua';
        }
        return date("d-m-Y", $var);
    } else {
        if (date('Y', $var) == date('Y', time())) {
            if (date('z', $var) == date('z', time()))
                return 'Hôm nay, ' . date("H:i A", $var);
            if (date('z', $var) == date('z', time()) - 1)
                return 'Hôm qua, ' . date("H:i A", $var);
        }
        return date("d-m-Y , H:i A", $var);
    }
}


function _echo($var = ""){
    $var     = htmlentities(trim($var), ENT_QUOTES, 'UTF-8');
    $replace = array(
        chr(0) => '',
        chr(1) => '',
        chr(2) => '',
        chr(3) => '',
        chr(4) => '',
        chr(5) => '',
        chr(6) => '',
        chr(7) => '',
        chr(8) => '',
        chr(9) => '',
        chr(11) => '',
        chr(12) => '',
        chr(13) => '',
        chr(13) => '',
        chr(14) => '',
        chr(15) => '',
        chr(16) => '',
        chr(17) => '',
        chr(18) => '',
        chr(19) => '',
        chr(20) => '',
        chr(21) => '',
        chr(22) => '',
        chr(23) => '',
        chr(24) => '',
        chr(25) => '',
        chr(26) => '',
        chr(27) => '',
        chr(28) => '',
        chr(29) => '',
        chr(30) => '',
        chr(31) => ''
    );
    return strtr($var, $replace);
}

function _deleteDir($dir = "") {
    if(!$dir)
        return false;
    
    foreach (glob($dir) as $file) {
        if (is_dir($file)) { 
            deleteDir("$file/*");
            rmdir($file);
        } else {
            unlink($file);
        }
    }
}

function curl_get_contents($url = "", $cookie = ""){

	if($url === "")
		return false;

	$ch = curl_init();
	$head = array();
	if($cookie){
		$head[] = "Upgrade-Insecure-Requests: 1";
		$head[] = "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3";
		$head[] = "Cookie: ".$cookie;
	}
	curl_setopt($ch, CURLOPT_HTTPHEADER, $head); 
	curl_setopt($ch, CURLOPT_USERAGENT,"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36");
	curl_setopt($ch, CURLOPT_URL, $url);
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
	curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, FALSE);
	curl_setopt($ch, CURLOPT_HEADER, 0);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
	curl_setopt($ch, CURLOPT_TIMEOUT , 10);
	curl_setopt($ch, CURLOPT_CONNECTTIMEOUT ,10);

	curl_setopt($ch, CURLOPT_NOBODY, true);
	curl_setopt($ch, CURLOPT_HTTPGET, true);
	curl_setopt($ch, CURLOPT_AUTOREFERER, true);

	$out = curl_exec($ch);
	curl_close ($ch);
	return $out;
}

function _txtColor($text = "", $color = ""){
    return $color ? '<font color="'.$color.'">'._echo($text).'</font>': _echo($text);
}

function _position($var = ""){
    global $_USER, $database;
    $user = $var === "" ? $_USER->getData() : (is_array($var) ? $var : $database->get("core_users", "*", ["id" => $var]));

    if(!$user)
        return false;

    if($user['adm'] == 2){
        $result = _txtColor("Administrator", "red");
    } else if($user['adm'] == 1){
        $result = _txtColor("Moderator", "orange");
    } else {
        $result = _txtColor("Member", "gray");
    }
    return $result;
}

function _getAvatar($var = ""){
    global $_USER, $_config;
    $id = $var === "" ? $_USER->getId() : (is_array($var) ? $var['id'] : $var);

    if(!file_exists(_rootPath.'/images/users/'.$id.'.png'))
        return $_config['url'].'/images/no-avatar.jpg';
    else
        return $_config['url'].'/images/users/'.$id.'.png?t='.time();
}

function _sizeFormat($size = 0){
    $sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PG', 'EB', 'ZB', 'YB'];
    $count=0;
    if ($size < 1024) {
        return $size . " " . $sizes[$count];
    } else{
        while ($size>1024){
            $size = round($size/1024, 2);
            $count++;
        }
        return $size . " " . $sizes[$count];
    }
}

function render_data_oAuth($client_secret = []){
    $data = ['installed' => []];
    $data['installed']['client_id'] = isset($client_secret['installed']['client_id']) ? $client_secret['installed']['client_id'] : '';
    $data['installed']['project_id'] = isset($client_secret['installed']['project_id']) ? $client_secret['installed']['project_id'] : ''; 
    $data['installed']['auth_uri'] = isset($client_secret['installed']['auth_uri']) ? $client_secret['installed']['auth_uri'] : ''; 
    $data['installed']['token_uri'] = isset($client_secret['installed']['token_uri']) ? $client_secret['installed']['token_uri'] : ''; 
    $data['installed']['auth_provider_x509_cert_url'] = isset($client_secret['installed']['auth_provider_x509_cert_url']) ? $client_secret['installed']['auth_provider_x509_cert_url'] : '';
    $data['installed']['client_secret'] = isset($client_secret['installed']['client_secret']) ? $client_secret['installed']['client_secret'] : '';
    $data['installed']['redirect_uris'] = isset($client_secret['installed']['redirect_uris']) ? $client_secret['installed']['redirect_uris'] : '';
    return $data;
}

function render_data_serviceAccount($service_account = []){
    $data = [];
    $data['type'] = isset($service_account['type']) ? $service_account['type'] : '';
    $data['project_id'] = isset($service_account['project_id']) ? $service_account['project_id'] : '';
    $data['private_key_id'] = isset($service_account['private_key_id']) ? $service_account['private_key_id'] : '';
    $data['private_key'] = isset($service_account['private_key']) ? $service_account['private_key'] : '';
    $data['client_email'] = isset($service_account['client_email']) ? $service_account['client_email'] : '';
    $data['client_id'] = isset($service_account['client_id']) ? $service_account['client_id'] : '';
    $data['client_secret'] = isset($service_account['client_secret']) ? $service_account['client_secret'] : '';
    $data['auth_uri'] = isset($service_account['auth_uri']) ? $service_account['auth_uri'] : '';
    $data['token_uri'] = isset($service_account['token_uri']) ? $service_account['token_uri'] : '';
    $data['auth_provider_x509_cert_url'] = isset($service_account['auth_provider_x509_cert_url']) ? $service_account['auth_provider_x509_cert_url'] : '';
    $data['client_x509_cert_url'] = isset($service_account['client_x509_cert_url']) ? $service_account['client_x509_cert_url'] : '';
    return $data;
}

function _getThumbnailById($id, $size = "w250-h188-p"){
    if(!$id || !$size)
        return false;
    return 'https://drive.google.com/thumbnail?authuser=0&sz='+$size+'&id='+$id;
}

function _changeSizeThumbnailLink($thumbnailLink, $size = "w250-h188-p"){
    if(!$thumbnailLink)
        return false;
    if(!$size)
        return $thumbnailLink;
    return preg_replace("#^(.*?)=(.*?)$#si", "$1=".$size, $thumbnailLink);
}
function _changeSizeIconLink($iconLink, $size = 256){
    if(!$iconLink)
        return false;
    if(!$size)
        return $iconLink;
    return preg_replace("#^(.*?)/([0-9]+)/type/(.*?)$#si", "$1/".$size."/type/$3", $iconLink);
}

?>