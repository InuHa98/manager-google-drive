<?php

$_config = [
    "site_name" => "TTmanga Drive",
    "url"=>"http://localhost/driveAPI",
    "numPage"=>"20",
    "dbName"=>"drive2",
    "dbServer"=>"localhost",
    "dbUser"=>"root",
    "dbPassword"=>"",
    "dbPort"=>"3306",

    "default_limit_drive" => 30,
    
    "mailer" => [
        "smtp" => true,
        "host" => "smtp.gmail.com",
        "secure" => "ssl",
        "port" => "465",
        "username" => "ad.ttmanga@gmail.com",
        "password" => "dezgjhnfjostyqsm",
        "from" => "ad.ttmanga@gmail.com",
        "from_name" => "TTmanga"
    ],

    "private_share_config" => dirname(__FILE__).'/private_share.json',
    "private_share_path" => "service_account_private_share.json"

];

?>