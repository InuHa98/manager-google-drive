<?php


$_model = $_Mvc->getModel();
$error = $_model->getError();
$success = $_model->getSuccess();
$codeError = $_model->getCode();

$drive = $_model->getData("drive");
$about = $_model->getData("about");

if(!$drive){
	$drive = ['id' => 'null'];
}

$_title = (isset($drive['name']) ? 'My Drive: '._echo($drive['name']) : 'Error Drive');
$_title_module = "My Drive"; // (isset($drive['name']) ? _echo($drive['name']) : 'No Drive')

require $_rootPath . '/template/header.php';


$private_share_config = file_exists($_config['private_share_config']) ? json_decode(file_get_contents($_config['private_share_config']), true) : ['client_email' => ''];

$_listDrives = [];

$optionsProject = _listProjects();
$optionDrive = _listDrives();

if($optionDrive){
	foreach($optionDrive as $arr){
		$json = json_decode($arr['data_json'], true);
		$_listDrives[$arr['type'] === "oauth" ? $json['installed']['client_id'] : $json['client_email']] = [
			"drive" => $arr['id'],
			"name" => $arr['name']
		];
	}
}


if($error){
	if($codeError){
		?>
		<div class="col-xl-12">
			<div class="tools_header">
				<div class="row align-items-center">
					<div class="col-lg-12 tools_right">
						<div class="changeview" title="Number of rows">
							<i class="bx bx-layer"></i>
							<select id="select_project" class="form-select">
						<?php 

							if($optionsProject){
								echo '<option value="all">All project</option>';
								foreach ($optionsProject as $arr) {
									echo '<option value="'.$arr['id'].'" '.($arr['id'] == $drive['project_id'] ? 'selected' : '').'>'._echo($arr['name']).'</option>';
								}
							}
						?>
							</select>
						</div>
						<div class="changeview" title="Sorted by">
							<i class="bx bx-chip"></i>
							<select id="select_drive" class="form-select">
						<?php 

							if($optionDrive){
								foreach ($optionDrive as $arr) {
									echo '<option data-project="'.$arr['project_id'].'" value="'.$arr['id'].'" '.($arr['id'] == $drive['id'] ? 'selected' : '').'>'._echo($arr['name']).'</option>';
								}
							}
						?>
							</select>
						</div>
					</div>
				</div>
			</div>
		</div>
		<?php
		echo '<div class="callout callout-warning">'.$error.'</div>';
		goto endModule;
		exit();	
	} else {
		echo $error;
	}
}

if($success){
	echo $success;
}

?>

<ul class="nav-tabs custom-scroll nomargin-top">
<?php if(isset($about['storageQuota'])){ ?>
	<li role="access_myDrive" class="nav-tabs-item selected"><a>Storage: <?=_sizeFormat($about['storageQuota']['usage']);?>/<?=_sizeFormat($about['storageQuota']['limit']);?></a></li>
	<li role="access_trash" class="nav-tabs-item"><a>Trash: <?=_sizeFormat($about['storageQuota']['usageInDriveTrash']);?></a></li>
	<li role="access_sharedWithMe" class="nav-tabs-item"><a>Share with me</a></li>
	<li role="access_recent" class="nav-tabs-item"><a>Recent</a></li>
<?php } ?>
</ul>



<div class="col-xl-12">
	<div class="tools_header">
		<div class="row align-items-center">
			<div class="col-lg-6 tools_right order-xl-2">
				<div class="changeview" title="Number of rows">
					<i class="bx bx-layer"></i>
					<select id="select_project" class="form-select">
				<?php 

					if($optionsProject){
						echo '<option value="all">All project</option>';
						foreach ($optionsProject as $arr) {
							echo '<option value="'.$arr['id'].'" '.($arr['id'] == $drive['project_id'] ? 'selected' : '').'>'._echo($arr['name']).'</option>';
						}
					}
				?>
					</select>
				</div>
				<div class="changeview" title="Sorted by">
					<i class="bx bx-chip"></i>
					<select id="select_drive" class="form-select">
				<?php 

					if($optionDrive){
						foreach ($optionDrive as $arr) {
							echo '<option data-project="'.$arr['project_id'].'" value="'.$arr['id'].'" '.($arr['id'] == $drive['id'] ? 'selected' : '').'>'._echo($arr['name']).'</option>';
						}
					}
				?>
					</select>
				</div>
			</div>
			<div class="col-lg-6 search-drive order-xl-1">
				<i class="bx bx-search"></i>
				<input role="input_search" placeholder="Search file...">
				<i role="cancel_search" class="bx bx-x" style="display: none; cursor: pointer;"></i>
			</div>
		</div>
	</div>
</div>

<div class="tools_bar">
	<span class="form-check">
		<input class="form-check-input" type="checkbox" value="" id="checkAll">
		<label class="form-check-label" for="checkAll">
			<strong><span role="select_count">0</span> file selected</strong> (of <span role="drive_total_files">0</span>)
		</label>
	</span>
	<span class="float-right">
		<span role="tools_mydrive">
			<div role="menu_create" class="menu dropdown">
				<button class="btn drop-button new_drive"><i class='bx bx-plus-medical'></i> New</button>
				<ul class="drop-menu">
					<li role="new_folder">
						<i class="bx bx-folder-plus"></i> New folder
					</li>
					<li role="new_shortcut" class="border-bottom">
						<i class="bx bx-redo"></i> Shortcut
					</li>
					<li role="upload-file">
						<i class="bx bx-upload"></i> Upload file
					</li>
					<li role="upload-folder">
						<i class="bx bx-folder"></i> Upload folder
					</li>
					<li role="import-drive">
						<i class="bx bx-import"></i> Import drive
					</li>
				</ul>
			</div>
			<button type="button" name="move_files" role="tool_action" class="btn btn-gray disabled"><i class="bx bx-folder-open"></i> Move</button>
			<button type="button" name="copy_files" role="tool_action" class="btn btn-gray disabled"><i class="bx bx-copy"></i> Copy</button>
			<button type="button" name="delete_files" role="tool_action" class="btn btn-gray disabled"><i class="bx bx-trash"></i> Delete</button>
		</span>
		<span role="tools_trash" style="display: none">
			<button type="button" name="empty_trash" class="btn new_drive">Empty trash</button>
			<button type="button" name="restore_files" role="tool_action" class="btn btn-gray disabled"><i class="bx bx-reset"></i> Restore</button>
			<button type="button" name="delete_forever_files" role="tool_action" class="btn btn-gray disabled"><i class="bx bx-delete"></i> Delete Forever</button>
		</span>
	</span>
</div>

<ol id="drive_breadcrumb" class="breadcrumb">
	<li>
		<div class="br-item">
			<span>My Drive</span>
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

<input type="file" id="upload_file" style="display: none;" multiple>
<input type="file" id="upload_folder" style="display: none;" webkitdirectory mozdirectory multiple>

<?php 

endModule:

?>
<script type="text/javascript">

	$(document).ready(function(){

		$("#select_drive").children().each(function(){
			if($(this).data("project") != $("#select_project").val()){
				$(this).hide();
			}
		});
		$("#select_project").on("change", function(){
			var currentDrive = <?=$drive['id'];?>;
			if($(this).val() === "all"){
				$("#select_drive option").show();
			} else {
				$("#select_drive option").hide();
				$("#select_drive option[data-project="+$(this).val()+"]").show();
			}
		});
		$("#select_drive").on("change", function(){
			window.location.href = "<?=_getUrl('drive');?>/"+$(this).val();
		});


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
		rootFolderId: "<?=$about['rootFolderId']; ?>",
		storageQuota_limit: "<?=$about['storageQuota']['limit']; ?>",
		storageQuota_usage: "<?=$about['storageQuota']['usage']; ?>",
		storageQuota_usageInDrive: "<?=$about['storageQuota']['usageInDrive']; ?>",
		storageQuota_usageInDriveTrash: "<?=$about['storageQuota']['usageInDriveTrash']; ?>",
		url_refresh_token: "<?=_getUrl('refresh_access_token', $drive['id']);?>",
		listDrives: <?=json_encode($_listDrives);?>
	});
	var _Config = {
		current_drive: "<?=$drive['id'];?>",
		url_drive: "<?=_getUrl('drive');?>",
		url_refresh_token: "<?=_getUrl('refresh_access_token');?>",
		url_stream: "<?=_getUrl('download', $drive['id']);?>",
		url_thumbnail: "<?=_getUrl('thumbnail', $drive['id']);?>",
		url_private_share: "<?=_getUrl('share');?>",
		url_multiple_drive: "<?=_getUrl('multiple_drive');?>",
		user_ps: "<?=$private_share_config['client_email'];?>"
	};

</script>

<script type="text/javascript" src="<?=$_config['url'];?>/assets/scripts/zoom.image.js?v=<?=$_version;?>"></script>
<script type="text/javascript" src="<?=$_config['url'];?>/assets/scripts/swiped-events.js?v=<?=$_version;?>"></script>
<script type="text/javascript" src="<?=$_config['url'];?>/assets/scripts/myDrive.js?v=<?=$_version;?>"></script>
<?php

require $_rootPath . '/template/footer.php';

?>