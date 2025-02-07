<?php

$_model = $_Mvc->getModel();
$error = $_model->getError();
$success = $_model->getSuccess();
$codeError = $_model->getCode();

$about = $_model->getData("about");

$_title = "Share";
$_title_module = "Sharing";

if($_model->getData("type") !== "folders"){
	$_hide_header =  true;
	$_hide_footer = true;
}

require $_rootPath . '/template/header.php';


?>
<?php if($_model->getData("type") === "folders"){ ?>
<style type="text/css">
	.content-section {
		margin: 70px 10px 0;
	}
</style>
<ol id="drive_breadcrumb" class="breadcrumb">
	<li>
		<div class="br-item">
			<span>Share</span>
		</div>
	</li>
</ol>
<?php

$style_view = isset($_COOKIE['view_mode']) ? $_COOKIE['view_mode'] : '';

?>
<div id="listFile" class="drive-list <?=$style_view;?>">
	<div class="screen_loading">
		<div class="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
	</div>
</div>
<?php } ?>

<script type="text/javascript">

	$(document).ready(function(){

		$(document).on("click", ".change-view div", function(){
			let mode = $(this).attr("class");
			if(mode === "change-to-list"){
				$("#listFile").removeClass("list-view").addClass("list-view");
				document.cookie = "view_mode=list-view; expires=Thu, 2 Aug <?=date('Y')+20;?> 20:47:11 UTC;path=/";
			} else {
				$("#listFile").removeClass("list-view");
				document.cookie = "view_mode=; expires=Thu, 2 Aug 1997 20:47:11 UTC;path=/";
			}
		});

	});

	var GDrive = new GoogleDriveAPI({
		access_token: "<?=$about['access_token']; ?>",
		expires_in: "<?=$about['expires_in']; ?>",
		created: "<?=$about['created']; ?>",
		rootFolderId: 'private-share',
		storageQuota_limit: "<?=$about['storageQuota']['limit']; ?>",
		storageQuota_usage: "<?=$about['storageQuota']['usage']; ?>",
		storageQuota_usageInDrive: "<?=$about['storageQuota']['usageInDrive']; ?>",
		storageQuota_usageInDriveTrash: "<?=$about['storageQuota']['usageInDriveTrash']; ?>",
		url_refresh_token: "<?=_getUrl('refresh_private_share');?>"
	});
	var url_stream = '<?=_getUrl('download');?>';
	var url_thumbnail = '<?=_getUrl('thumbnail');?>';

</script>
<script type="text/javascript" src="<?=$_config['url'];?>/assets/scripts/zoom.image.js?v=<?=$_version;?>"></script>
<script type="text/javascript" src="<?=$_config['url'];?>/assets/scripts/swiped-events.js?v=<?=$_version;?>"></script>
<script type="text/javascript" src="<?=$_config['url'];?>/assets/scripts/share.js?v=<?=$_version;?>"></script>

<?php

require $_rootPath . '/template/footer.php';

?>