<?php

$_title = "Đăng xuất";

if($_USER->logout() == true)
	_location($_config['url']);
else
	echo '<b>Lỗi hệ thống:</b> không thể đăng xuất.Vui lòng thử lại sau ít phút!';

?>