<?php


$urls = [
    "multiple_drive" => "/ajax.php?act=multiple_drive",
    "get_storage_info" => "/ajax.php?act=get_storage_info",
    "refresh_access_token" => "/ajax.php?act=refresh_access_token&drive=%s",
    "refresh_private_share" => "/ajax.php?act=refresh_private_share",
    "home" => '',
    "drive" => "/Drive/%s",
    "login" => "/Login",
    "register" => "/Register",
    "forgotPass" => "/ForgotPassword",
    "forgetPasswordKey" => "/ForgotPassword/%s",
    "logout" => "/Logout",
    "profile" => "/Profile",
    "management" => "/Management/%s",
    "help" => "/Help/%s",
    "share" => "/Share/%s",
    "download" => "/Download/%s",
    "thumbnail" => "/Thumbnail/%s"
];

function _getUrl(){
    global $_config, $urls;

    if(func_num_args() < 1)
        return "not args";

    $params = func_get_args();
    $key = isset($params[0]) ? trim($params[0]) : '';
    unset($params[0]);


    if(array_key_exists($key, $urls))
        return $_config['url']."/".($params ?
            trim(vsprintf($urls[$key], array_map(function($str){
                                            return is_string($str) ? trim($str, "/") : $str; 
                                        }, $params)), "/") :
            trim(str_replace("%s", "", $urls[$key]), "/"));

    return "#urlNotFound";

}

?>