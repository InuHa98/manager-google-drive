<?php

$_title = "Profile";
$_title_module = "Profile";

require $_rootPath . '/template/header.php';

$_model = $_Mvc->getModel();
$error = $_model->getError();
$success = $_model->getSuccess();
$codeError = $_model->getCode();

?>
<div class="header pb-8 pt-5 pt-lg-8 d-flex align-items-center profile-cover">
  <!-- Mask -->
  <span class="mask bg-gradient-default opacity-8"></span>
</div>
<div class="container-fluid mt--7 profile-section">
  <div class="row">
    <div class="col-xl-3 order-xl-2 mb-5 mb-xl-0">
      <div class="card card-profile shadow">
        <div class="row justify-content-center">
          <div class="col-lg-3 order-lg-2">
            <div class="card-profile-image">
                <img id="preview_avatar" src="<?=_getAvatar();?>" class="rounded-circle">
                <form method="post">
					<div id="uploaded_image" class="change-avatar">
						<i class='bx bx-camera'></i>
						<span>Thay đổi</span>
					</div>
					<input type="file" name="image" class="image" id="upload_image" style="display:none"/>
				</form>
            </div>
          </div>
        </div>
        <div class="card-header text-center border-0 pt-8 pt-md-4 pb-0 pb-md-4">
        	
        </div>
        <div class="card-body pt-0 pt-md-4">
          <div class="row">
            <div class="col">
              <div class="card-profile-stats d-flex justify-content-center mt-md-5">
	              <div>
	                <span class="heading"><?=$database->count("core_projects", ["user_id" => $_USER->getId()]);?></span>
	                <span class="description">Projects</span>
	              </div>
	              <div>
	                <span class="heading"><?=$database->count("core_drives", ["user_id" => $_USER->getId()]);?></span>
	                <span class="description">Drives</span>
	              </div>
	              <div>
	                <span class="heading"><?=$_USER->getLimit_drive();?></span>
	                <span class="description">Max Drive</span>
	              </div>
              </div>
		          <div class="text-center">
		            <h1><?=_echo($_USER->getName());?></h1>
		            <div class="h3 font-weight-300">
		              <?=_position();?>
		            </div>
		            <div role="btn_avatar" style="display: none;">
		            	<form method="POST">
		            		<input id="data_avatar" type="hidden" name="data_avatar">
		            		<button type="submit" name="change_avatar" class="btn btn-default">Save Avatar <i class='bx bx-save'></i></button>
		            		<button type="button" role="cancel_avatar" class="btn btn-gray">Cancel</button>
		            	</form>
		            </div>
		          </div>
            </div>
          </div>

        </div>
      </div>
    </div>
    <div class="col-xl-9 order-xl-1">
      <div class="card bg-secondary shadow">
        <div class="card-header bg-white border-0">
          <div class="row align-items-center">
            <div class="col-8">
              <h3 class="mb-0">My account</h3>
            </div>
          </div>
        </div>
        <div class="card-body">
          <form method="POST">
            <h6 class="heading-small text-muted mb-4">User information</h6>
            <div class="pl-lg-4">
              <div class="row">
                <div class="col-lg-6">
                  <div class="form-group focused">
                    <label class="form-control-label" for="input-username">Username</label>
                    <input type="text" id="input-username" class="form-control form-control-alternative" value="<?=_echo($_USER->getName());?>" disabled>
                  </div>
                </div>
                <div class="col-lg-6">
                  <div class="form-group <?=in_array($codeError, [4, 5]) ? 'error' : '';?>">
                    <label class="form-control-label" for="input-email">Email address</label>
                    <input type="email" id="input-email" name="email" class="form-control form-control-alternative" value="<?=_echo($_model->getData('email'));?>">
                  </div>
                </div>
              </div>
            </div>
            <hr class="my-4">
            <!-- Address -->
            <h6 class="heading-small text-muted mb-4">Change Password</h6>
            <div class="pl-lg-4">
              <div class="row">
                <div class="col-md-12">
                  <div class="form-group focused <?=in_array($codeError, [6]) ? 'error' : '';?>">
                    <label class="form-control-label" for="current-password">Current Password</label>
                    <input id="current-password" name="password" class="form-control form-control-alternative" placeholder="Enter current password" value="" type="password">
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col-md-12">
                  <div class="form-group focused <?=in_array($codeError, [7, 8]) ? 'error' : '';?>">
                    <label class="form-control-label" for="new-password">New Password</label>
                    <input id="new-password" name="new_password" class="form-control form-control-alternative" placeholder="Enter new password" value="" type="password">
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col-md-12">
                  <div class="form-group focused <?=in_array($codeError, [7, 8]) ? 'error' : '';?>">
                    <label class="form-control-label" for="renew-password">New Password (Again)</label>
                    <input id="renew-password" name="re_new_password" class="form-control form-control-alternative" placeholder="Enter new password (again)" value="" type="password">
                  </div>
                </div>
              </div>
            </div>
            <button type="submit" name="edit_profile" class="btn btn-default float-right">Save Change <i class='bx bx-save'></i></button>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>

<link rel='stylesheet' href='<?=$_config['url'];?>/assets/styles/cropper.css?v=<?=$_version;?>'>
<script type="text/javascript" src="<?=$_config['url'];?>/assets/scripts/cropper.js?v=<?=$_version;?>"></script>
<script type="text/javascript">
	$(document).ready(function(){


		var cropper, canvas;

		$('#uploaded_image').on("click", function(){
			$('#upload_image').click();
		});

		$("[role=cancel_avatar]").on("click", function(){
			$("#data_avatar").val("");
			$("[role=btn_avatar]").hide();
		});
		$('#upload_image').change(function(event){
			var files = event.target.files;

			if(files && files.length > 0)
			{
				var extension = ['image/jpg', 'image/jpe', 'image/jpeg', 'image/jfif', 'image/png', 'image/bmp', 'image/dib', 'image/gif'];
				var mime_type = files[0].type;

				if(extension.indexOf(mime_type) < 0){
					$.niceToast.error('<strong>Error</strong>: Invalid image format.');
					return false;
				}
				
				reader = new FileReader();
				reader.onload = function(event)
				{
					

					var Form = '<div class="form-horizontal">'
				            	+'<div class="row">'
				                +'<div class="col-12">'
				                +'<canvas id="crop_image"></canvas>'
				                +'</div>'
				            	+'</div>'
								+'</div>';

					$.sendConfirm({
						title: 'Upload Avatar',
						content: Form,
						button: {
							confirm: 'Select',
							cancel: 'Cancel'
						},
						bgHide: false,
						width: null,
						isFixed: true,
						noconfirm: false,
						callback: function(){
							canvas = document.getElementById("crop_image");
							var context = canvas.getContext("2d");
							var img = new Image();
							img.onload = function() {
								context.canvas.height = img.height;
								context.canvas.width  = img.width;
								context.drawImage(img, 0, 0);
								cropper = new Cropper(canvas, {
									aspectRatio: 1,
									viewMode: 2,
									autoCropArea: 1,
									dragMode: 'move',
									minCropBoxWidth: 100,
									minCropBoxHeight: 100
								});
							};
							img.src = reader.result;

						},
						onConfirm: function(){

							cropper.getCroppedCanvas().toBlob(function(blob){
								url = URL.createObjectURL(blob);
								var reader = new FileReader();
								reader.readAsDataURL(blob);
								reader.onloadend = function(){
									var base64data = reader.result;
									$('#preview_avatar').attr('src', base64data);
									$("#data_avatar").val(base64data);
									$("[role=btn_avatar]").show();
									cropper.destroy();
							   		cropper = null;
								};
							});
						},
						onCancel: function(){
							$("#upload_image").val("");
							cropper.destroy();
					   		cropper = null;
						},
						onClose: function(){
							$("#upload_image").val("");
						}
					});

				};
				reader.readAsDataURL(files[0]);

			}
		});

		
	});
</script>


<?php
require $_rootPath . '/template/footer.php';
?>