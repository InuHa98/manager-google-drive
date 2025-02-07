<?php

$_action = $_Mvc->getAction() ? $_Mvc->getAction() : 'service_account';
$_aPath = dirname(__FILE__).'/actions/'.$_Mvc->getController().'/'.$_action.'.php';

$_title = "Help - Drive Remote";
$_title_module = "Help";

require $_rootPath . '/template/header.php';


?>
<style type="text/css">
	.help {
		padding: 0 15px;
		word-break: break-all;
	}
	p {
		margin-top: 20px;
	}
	.step {
	    font-size: 1.2rem;
	    font-weight: 400;
	}
	p > img {
	    border: 2px solid #ff6b9e;
	}
</style>
<?php

if(file_exists($_aPath)){
	require_once $_aPath;
} else {
	echo '<div class="callout callout-danger"><strong>Error</strong>: Action module not found.</div>';
}

require $_rootPath . '/template/footer.php';

?>