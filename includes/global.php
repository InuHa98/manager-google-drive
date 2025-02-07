<?php

if (extension_loaded('zlib')) {
    @ini_set('zlib_output_compression','On');
    @ini_set('zlib.output_compression_level', 3);
    @ini_set('output_buffering','On');
    //header('Content-Encoding: gzip');
    ob_start();
} else {
    ob_start();
}


session_start();
date_default_timezone_set('Asia/Ho_Chi_Minh');


$_version = time(); // phiên bản
$_path = dirname(__FILE__);

$_debug = isset($_debug) ? $_debug : true; // hiển thị báo lỗi

if(file_exists($_path.'/config.php'))
    include $_path.'/config.php';

if($_debug == false) {
    error_reporting(0);
    @ini_set('display_errors', 0);
} else {
    error_reporting(E_ALL & ~E_NOTICE);
    @ini_set('display_errors', 1);
}



function encodePassword($password = ""){
    return $password ? md5(md5($password)) : '';
}

function isJson($string = "") {
    if(!$string)
        return false;
    
    $decoded = json_decode($string);
    if ( !is_object($decoded) && !is_array($decoded) )
        return false;
    return (json_last_error() == JSON_ERROR_NONE);
}

require $_path.'/classes/class.medoo.php';
use Medoo\Medoo;

try {

    $database = new Medoo(
                    array(
                        "database_type" => "mysql",
                        "database_name" => $_config['dbName'],
                        "server" => $_config['dbServer'],
                        "username" => $_config['dbUser'],
                        "password" => $_config['dbPassword'],
                        "charset" => "utf8",
                        "port" => $_config['dbPort']
                    )
                );
} catch(PDOException $e) {
    exit('Không thể kết nối tới cơ sở dữ liệu.');
}


require $_path.'/classes/class.user.php';
$_USER = new User();

$classes = glob($_path.'/classes/class.*.php', GLOB_BRACE);
if($classes){

    $skips = ["class.medoo.php", "class.user.php"];

    foreach ($classes as $class) {
        if(!in_array(basename($class), $skips))
            require $class;
    }
}

$_GDrive = new GoogleDriveAPI();

$_act = isset($_GET['act']) ? $_GET['act'] : '';
$_mod = isset($_GET['mod']) ? $_GET['mod'] : '';
$_id  = isset($_GET['id']) ? intval($_GET['id']) : '';

$_referer = isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '';


$_numPage = $_config['numPage'];

function _getPagination($numPage = ""){
    global $_numPage;

    $limit = isset($_GET['limit']) && $_GET['limit'] > 0 ? intval($_GET['limit']) : ($numPage && $numPage > 0 ? $numPage : $_numPage);
    $page = isset($_GET['page']) && $_GET['page'] > 0 ? intval($_GET['page']) : 1;
    $start = isset($_GET['page']) ? $page * $limit - $limit : (isset($_GET['start']) ? abs(intval($_GET['start'])) : 0);

    return [
        "page" => $page,
        "start" => $start,
        "limit" => $limit
    ];
}

if(!file_exists(dirname($_path).'/images')){
    mkdir(dirname($_path).'/images', 0755);
}

include $_path.'/functions.php';
include $_path.'/urlMaps.php';

$_title = "";
$_title_module = "";
$_hide_header = false;
$_hide_footer = false;

?>