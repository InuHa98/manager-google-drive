<?php 
  $list_projects = _listProjects();
  $project_options = "";
  if($list_projects){
    foreach($list_projects as $pj){
      $project_options .= '<option value="'.$pj['id'].'" '.($_Mvc->getParams(0) === $pj['id'] ? 'selected' : '').'>'._echo($pj['name']).'</option>';
    }
  } else {
    $project_options = '<option value="">-- No Project --</option>';
  }
?>
<ul class="nav-tabs nomargin-top">
<?php if(_isAdmin() || _isMod()){ ?>
  <li class="nav-tabs-item">
    <a href="<?=_getUrl('management', 'users');?>">Users</a>
  </li>
<?php } ?>
  <li class="nav-tabs-item selected">Drives</li>
  <li class="nav-tabs-item">
    <a href="<?=_getUrl('management', 'projects');?>">Projects</a>
  </li>
</ul>
<div class="col-xl-12">
  <div class="tools_header">
    <div class="row align-items-center">
      <div class="col-lg-6 tools_right order-xl-2">
        <div class="changeview" title="Number of rows">
          <select id="limit" class="form-select">
            <option value="<?=_getUrl('management', 'drives');?>?limit=<?=$_config['numPage'];?>" ><?=$_config['numPage'];?></option>
            <option value="<?=_getUrl('management', 'drives');?>?limit=50" <?=($_model->getData("limit") == 50 ? 'selected' : '');?> >50</option>
            <option value="<?=_getUrl('management', 'drives');?>?limit=100" <?=($_model->getData("limit") == 100 ? 'selected' : '');?> >100</option>
            <option value="<?=_getUrl('management', 'drives');?>?limit=250" <?=($_model->getData("limit") == 250 ? 'selected' : '');?> >250</option>
            <option value="<?=_getUrl('management', 'drives');?>?limit=500" <?=($_model->getData("limit") == 500 ? 'selected' : '');?> >500</option>
          </select>
        </div>
        <div class="changeview" title="Sorted by Project">
          <select id="sort" class="form-select">
            <option value="">-- All projects</option>
            <?=$project_options;?>
          </select>
        </div>
        <div class="changeview" title="Search">
          <button id="search" class="btn btn-default"><i class="bx bx-search"></i></button>
        </div>
      </div>
      <div class="col-lg-6 tools_text order-xl-1">
        <?=$_model->getDescAction();?>
      </div>
    </div>
  </div>
  <form role="tools_form" method="POST">
    <div class="tools_bar">
      <span class="form-check">
        <input class="form-check-input" type="checkbox" value="" id="checkAll">
        <label class="form-check-label" for="checkAll">
          <strong><?=count($_model->getData('itemList'));?> drive</strong> (of <?=$_model->getData('itemCount');?>)
        </label>
      </span>
      <span class="float-right">
        <button type="button" name="new_drive" class="btn new_drive"><i class="bx bx-list-plus"></i> New Drive</button>
        <button type="button" name="delete_drive" role="tool_action" class="btn btn-gray disabled"><i class="bx bx-x"></i> Delete</button>
      </span>
    </div>
    <div class="box_content">
      <div class="table-scroll">
        <table class="table">
          <thead>
            <tr>
              <th></th>
              <th width="30%">
                <span class="sort-table sort-table-asc">
                  <i class="bx bx-up-arrow-alt"></i>
                </span>
                Name
              </th>
              <th width="20%">Project</th>
              <th>Type</th>
              <th width="30%">Email User</th>
              <th width="20%">Note</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
        <?php 

          if($_model->getData("itemList")){
            foreach ($_model->getData("itemList") as $arr) {

              $json = json_decode($arr['data_json'], true);

              echo '<tr class="nowrap" data-id="'.$arr['id'].'" data-project="'.$arr['project_id'].'" data-type="'._echo($arr['type']).'" data-name="'._echo($arr['name']).'" data-note="'._echo($arr['note']).'" data-data_json="data:application/json;base64,'._echo(base64_encode($arr['data_json'])).'" data-multiple_access="'._echo($arr['multiple_access']).'">
                <td>
                  <div class="form-check">
                    <input role="selected" class="form-check-input" type="checkbox" name="selected[]" value="'.$arr['id'].'">
                  </div>
                </td>
                <td>
                  <div>
                    <a href="'._getUrl('drive', $arr['id']).'">
                      <i class="bx bx-chip"></i> <b>'._echo($arr['name']).'</b>
                    </a>
                  </div>
                  <div>
                    <small>'.($arr['multiple_access'] != "true" ? '<span class="dot_danger"></span> Multiple disabled' : '').'</small>
                  </div>
                </td>
                <td>
                  <div>
                    <i class="bx bx-layer"></i> '._echo($arr['project_name']).'
                  </div>
                </td>
                <td>
                  <div>
                    <small>'.$arr['type'].'</small>
                  </div>
                </td>
                <td class="note">
                  <div>
                    <small>
                    '.$arr['emailAddress'].'
                    </small>
                  </div>
                </td>
                <td class="note">
                  <div>
                    <small>
                      '.($arr['note'] ? '<i class="bx bx-notepad"></i> '._echo($arr['note']) : '').'
                    </small>
                  </div>
                </td>
                <td align="right">
                  <button type="button" role="edit_drive" class="btn btn-sm btn-black"><i class="bx bx-edit-alt"></i> Edit</button>
                  <button type="button" role="download_drive" class="btn btn-sm btn-black"><i class="bx bx-download"></i> Download Config</button>
                  <button type="button" role="delete_drive" class="btn btn-sm btn-black"><i class="bx bx-x"></i> Delete</button>
                </td>
              </tr>';
            }
          } else
            echo '<tr><td class="empty" colspan="7">No data available in table.</td></tr>';

        ?>
          </tbody>
        </table>
      </div>

    <?php

      if($_model->getData("itemPage")){

        echo '<div class="pagination_wrap ">';


        if($_model->getData("itemPage")['first'])
          echo '<a class="paging_btn paging_prevnext prev" href="'.sprintf($_model->getData("itemPage")['query_string'], $_model->getData("itemPage")['first']).'"> « </a>';

        echo '<a class="paging_btn paging_prevnext prev '.($_model->getData("itemPage")['prev'] == false ? 'disabled' :'').'" href="'.sprintf($_model->getData("itemPage")['query_string'], $_model->getData("itemPage")['prev']).'">‹ Trước</a>';

        foreach ($_model->getData("itemPage")['page'] as $arr)
          if($arr == $_model->getData("itemPage")['current'])
            echo '<a class="paging_btn page_num current">'.$arr.'</a>';
          else
            echo '<a class="paging_btn page_num " href="'.sprintf($_model->getData("itemPage")['query_string'], $arr).'">'.$arr.'</a>';


        echo '<a class="paging_btn paging_prevnext next '.($_model->getData("itemPage")['next'] == false ? 'disabled' :'').'" href="'.sprintf($_model->getData("itemPage")['query_string'], $_model->getData("itemPage")['next']).'">Sau ›</a>';

        if($_model->getData("itemPage")['end'])
          echo '<a class="paging_btn paging_prevnext next" href="'.sprintf($_model->getData("itemPage")['query_string'], $_model->getData("itemPage")['end']).'"> » </a>';

        echo '</div>';
      }


    ?>
    </div>
  </form>

</div>

<script type="text/javascript">


  function get_url_code(client_id){
    return "https://accounts.google.com/o/oauth2/auth?client_id="+client_id+"&redirect_uri=urn:ietf:wg:oauth:2.0:oob&scope=https://www.googleapis.com/auth/drive&response_type=code&approval_prompt=force&access_type=offline";
  }

  $(document).ready(function(){

    sortTable({
      table: $("table"),
      column: [1, 2],
      icon: {
        asc: '<i class="bx bx-up-arrow-alt"></i>',
        desc: '<i class="bx bx-down-arrow-alt"></i>'
      }
    });

    $('#limit').on('change', function () {
      var url = $(this).val();
      if (url)
        window.location = url;
      return false;
    });
    $('#sort').on('change', function () {
      var id = $(this).val();
      var url = '<?=_getUrl('management', 'drives');?>/';
      window.location = url+id;

      return false;
    });

    $('#checkAll').on("click", function() {
        $('input[role=selected]').prop('checked', this.checked);
        $('input[role=selected]').change();
    });

    $('input[role=selected]').on("change", function() {
      let total = $("input[role=selected]:checked").length;
      if(total > 0)
        $("[role=tool_action]").removeClass("disabled");
      else
        $("[role=tool_action]").addClass("disabled");

      if($("input[role=selected]:checked").length >= $("input[role=selected]").length)
        $('#checkAll').prop('checked', true);
      else
        $('#checkAll').prop('checked', false);
    });

    $("button[role=tool_action][name=delete_drive]").on("click", function(){
      $.sendConfirm({
        title: 'Delete Drive',
        msg: 'There are <strong>'+$("input[role=selected]:checked").length+'</strong> selected drives.',
        desc: 'Do you still want to continue?',
        button: {
          confirm: 'Delete',
          cancel: 'Cancel'
        },
        onConfirm: function() {
          var action = $("<input>").attr("type", "hidden").attr("name", "delete");
          $("form[role=tools_form]").append(action);
          $("form[role=tools_form]").submit();
          addScreenLoading();
        },
        onCancel: function() {},
        onClose: function() {}
      });
    });

    $("button[role=delete_drive]").on("click", function(){
      var id = $(this).parents("tr").data("id");
      $.sendConfirm({
        title: 'Delete Drive',
        msg: 'Drive: <strong>'+$(this).parents("tr").data("name")+'</strong>',
        desc: 'you really want to delete this drive?',
        button: {
          confirm: 'Delete',
          cancel: 'Cancel'
        },
        onConfirm: function() {
          var action = $("<input>").attr("type", "hidden").attr("name", "delete");
          var selected = $("<input>").attr("type", "hidden").attr("name", "selected[]").val(id);
          $("form[role=tools_form]").append(action);
          $("form[role=tools_form]").append(selected);
          $("form[role=tools_form]").submit();
          addScreenLoading();
        },
        onCancel: function() {},
        onClose: function() {}
      });
    });

    $("button[role=download_drive]").on("click", function(){
      var id = $(this).parents("tr").data("id");
      var filename = $(this).parents("tr").data("name")+'.json';
      var data_config = $(this).parents("tr").data("data_json");
      var data;
      try {
        data = atob(data_config.substring(29));
      } catch (e) {
        data ='Error: Could not decrypt json config.';
      }

      var htmlForm = '<div class="form-group">'
        +'<label class="control-label">Config data:</label>'
        +'<div class="col-12">'
        +'<textarea class="form-control" name="note" placeholder="" rows="10">'+data+'</textarea>'
        +'</div>'
        +'</div>';

      
      $.sendConfirm({
        title: 'Download Service Account',
        msg: 'Drive: <strong>'+$(this).parents("tr").data("name")+'</strong>',
        desc: htmlForm,
        button: {
          confirm: 'Download .Json',
          cancel: 'Cancel'
        },
        onConfirm: function() {
          if(window.navigator.msSaveOrOpenBlob) {
              window.navigator.msSaveBlob(data_config, filename);
          } else{
              const elem = document.createElement('a');
              elem.href = data_config;
              elem.download = filename;        
              document.body.appendChild(elem);
              elem.click();        
              document.body.removeChild(elem);
          }
        },
        onCancel: function() {},
        onClose: function() {}
      });
    });

    var project, name, note, data_json_upload, type = "service_account";
    var client_id = "";

    function _callback_upload_json(id){
      $('#dialogForm input[name=data_json_upload]').change(function(event){
        let _this = $(this);
        $.niceToast.clear();

        var files = event.target.files;
        data_json_upload = "";
        if(files && files.length > 0)
        {
          var extension = ['application/json'];
          var mime_type = files[0].type;

          if(extension.indexOf(mime_type) < 0){
            _this.parents("div.form-group").addClass("error");
            $.niceToast.error('<strong>Error</strong>: Invalid json format.');
            return false;
          }
          
          reader = new FileReader();
          reader.onload = function(event){
            _this.parents("div.form-group").removeClass("error");
            try {
              let json = JSON.parse(atob(this.result.substring(29)));

              if(type === "oauth"){
                if(typeof json['installed'] === "undefined"){
                  $("#dialogForm [role=url_get_code]").attr("href", "");
                  $("#dialogForm input[name=code]").val("");
                  $("#dialogForm [role=show_verification_code]").hide();
                  data_json_upload = "";
                  _this.parents("div.form-group").addClass("error");
                  $.niceToast.error('<strong>Error</strong>: Invalid \'client_secret.json\' format.');
                  return false;
                }
                client_id = json['installed']['client_id'];


                if(client_id){
                  let url_get_code = get_url_code(client_id);
                  $("#dialogForm [role=url_get_code]").attr("href", url_get_code);
                  $("#dialogForm [role=show_verification_code]").show();                
                }
              } else {
                $("#dialogForm [role=url_get_code]").attr("href", "");
                $("#dialogForm input[name=code]").val("");
                $("#dialogForm [role=show_verification_code]").hide();
                if(typeof json['private_key_id'] === "undefined" || typeof json['private_key'] === "undefined"){
                  data_json_upload = "";
                  _this.parents("div.form-group").addClass("error");
                  $.niceToast.error('<strong>Error</strong>: Invalid \'service_account.json\' format.');
                  return false;
                }
              }

              if($.trim($("#dialogForm input[name=name]").val()) === ""){
                $("#dialogForm input[name=name]").val(json['project_id'] || json['installed']['project_id']);
              }
              data_json_upload = this.result;

            } catch (e) {
              data_json_upload = "";
              _this.parents("div.form-group").addClass("error");
              $.niceToast.error('<strong>Error</strong>: Invalid json format.');
              return false;
            }

          };
          reader.readAsDataURL(files[0]);

        }
      });


      $('#dialogForm input[name=type]').on("change", function(){
        if($(this).val() === "oauth"){
          type = "oauth";
        } else {
          type = "service_account";
        }
        if($('#dialogForm input[name=data_json_upload]').val()){
          $('#dialogForm input[name=data_json_upload]').change();
        } else {
          if(type === "oauth"){
            $("#dialogForm [role=show_verification_code]").show();
          } else {
            $("#dialogForm [role=show_verification_code]").hide(); 
          }
        }
      });
    }
    $("button[name=new_drive]").on("click", function(){
      var id = $(this).parents("tr").data("id");
      var htmlForm = '<form id="dialogForm" class="form-horizontal" method="post">'
        +'<input type="hidden" name="new" value="submit">'
        +'<input type="hidden" name="data_json_request" value="">'

        +'<div class="form-group">'
        +'<label class="form-label">Project:</label>'
        +'<div class="col-12">'
        +'<select class="form-select form-control-sm" name="project"><?=$project_options;?></select>'
        +'</div>'
        +'</div>'

        +'<div class="form-group">'
        +'<label class="form-label">\
              <span class="form-check form-check-inline">\
                <input class="form-check-input" type="radio" id="type_serivice_account" name="type" value="service_account" checked>\
                <label class="form-check-label" for="type_serivice_account">Service Account</label>\
              </span>\
              <span class="form-check form-check-inline">\
                <input class="form-check-input" type="radio" id="type_oauth" name="type" value="oauth">\
                <label class="form-check-label" for="type_oauth">Oauth Client ID</label>\
              </span>\
        </label>'
        +'<div class="col-12">'
        +'<input class="form-control form-control-sm" name="data_json_upload" type="file">'
        +'</div>'
        +'</div>'

        +'<div role="show_verification_code" class="form-group" style="display: none">'
        +'<label class="control-label">[ <a role="url_get_code" target="_blank" href="">Click here to get Verification Code</a> ]</label>'
        +'<div class="col-12">'
        +'<input class="form-control" name="code" placeholder="Verification Code" type="text" value="">'
        +'</div>'
        +'</div>'

        +'<div class="form-group">'
        +'<label class="control-label">Name:</label>'
        +'<div class="col-12">'
        +'<input class="form-control" name="name" placeholder="enter name drive" type="text" value="">'
        +'</div>'
        +'</div>'

        +'<div class="form-group">'
        +'<label class="control-label">Note:</label>'
        +'<div class="col-12">'
        +'<textarea class="form-control" name="note" placeholder="option" rows="5"></textarea>'
        +'</div>'
        +'</div>'
        +'</form>';

      $.sendConfirm({
        title: 'Add Drive',
        content: htmlForm,
        button: {
          confirm: 'Add',
          cancel: 'Cancel'
        },
        width: 'auto',
        isFixed: true,
        bgHide: false,
        noconfirm: false,
        callback: function(){
          _callback_upload_json(id);
        },
        onBeforeConfirm: function(){
          project = $.trim($("#dialogForm select[name=project]").val());
          name = $.trim($("#dialogForm input[name=name]").val());
          note = $.trim($("#dialogForm input[name=note]").val());

          var ele_project = $("#dialogForm select[name=project]"),
              ele_data_json_upload = $("#dialogForm input[name=data_json_upload]"),
              ele_code = $("#dialogForm input[name=code]"),
              ele_name = $("#dialogForm input[name=name]");

          $.niceToast.clear();
          if(project === "" || project < 1){
            ele_project.parents("div.form-group").siblings("div.form-group").removeClass("error");
            ele_project.parents("div.form-group").addClass("error");
            $.niceToast.error('<strong>Error</strong>: Please select project to add drive.');
            return false;
          } else if(!data_json_upload){
            ele_data_json_upload.parents("div.form-group").siblings("div.form-group").removeClass("error");
            ele_data_json_upload.parents("div.form-group").addClass("error");
            $.niceToast.error('<strong>Error</strong>: Please upload \'Service_account.json\' or \'client_secret.json\'.');
            return false;
          } else if(type === "oauth" && !$.trim(ele_code.val())){
            ele_code.parents("div.form-group").siblings("div.form-group").removeClass("error");
            ele_code.parents("div.form-group").addClass("error");
            $.niceToast.error('<strong>Error</strong>: Please enter Verification Code.');
            return false;
          } else if(!name){
            ele_name.parents("div.form-group").siblings("div.form-group").removeClass("error");
            ele_name.parents("div.form-group").addClass("error");
            $.niceToast.error("<strong>Error</strong>: Please enter drive name.");
            return false;
          } else if(name.length > 50){
            ele_name.parents("div.form-group").siblings("div.form-group").removeClass("error");
            ele_name.parents("div.form-group").addClass("error");
            $.niceToast.error("<strong>Error</strong>: The drive name cannot exceed 50 characters.");
            return false;
          }
          $("#dialogForm input[name=data_json_request]").val(data_json_upload);
          $("#dialogForm").submit();
          addScreenLoading();
          return true;
        },
        onConfirm: function() {
        },
        onCancel: function() {},
        onClose: function() {}
      });
    });


    $("button[role=edit_drive]").on("click", function(){
      var parent = $(this).parents("tr");
      var id = parent.data("id");
      project = $(this).parents("tr").data("project"),
      type = $(this).parents("tr").data("type"),
      multiple_access = $(this).parents("tr").data("multiple_access"),
      name = $(this).parents("tr").data("name"),
      note = $(this).parents("tr").data("note"),
      data_json_upload = $(this).parents("tr").data("data_json");

      var url_get_code = null;
      if(type === "oauth"){
        try {
          let data_config = JSON.parse(atob(data_json_upload.substring(29)));
          url_get_code = get_url_code(data_config['installed']['client_id']);
        } catch (e) {
          url_get_code = null;
        }

      }

      var htmlForm = '<form id="dialogForm" class="form-horizontal" method="post">'
        +'<input type="hidden" name="edit" value="submit">'
        +'<input type="hidden" name="drive_id" value="'+id+'">'
        +'<input type="hidden" name="data_json_request" value="">'

        +'<div class="form-group">'
        +'<label class="form-label">Project:</label>'
        +'<div class="col-12">'
        +'<select class="form-select form-control-sm" name="project"><?=$project_options;?></select>'
        +'</div>'
        +'</div>'

        +'<div class="form-group">'
        +'<label class="form-label">\
              <span class="form-check form-check-inline">\
                <input class="form-check-input" type="radio" id="type_serivice_account" name="type" value="service_account" '+(type !== "oauth" ? 'checked' : '')+'>\
                <label class="form-check-label" for="type_serivice_account">Service Account</label>\
              </span>\
              <span class="form-check form-check-inline">\
                <input class="form-check-input" type="radio" id="type_oauth" name="type" value="oauth" '+(type === "oauth" ? 'checked' : '')+'>\
                <label class="form-check-label" for="type_oauth">Oauth Client ID</label>\
              </span>\
        </label>'
        +'<div class="col-12">'
        +'<input class="form-control form-control-sm" name="data_json_upload" type="file">'
        +'</div>'
        +'</div>'

        +'<div role="show_verification_code" class="form-group" style="display: '+(url_get_code !== null ? 'block' : 'none')+'">'
        +'<label class="control-label">[ <a role="url_get_code" target="_blank" href="'+url_get_code+'">Click here to get Verification Code</a> ]</label>'
        +'<div class="col-12">'
        +'<input class="form-control" name="code" placeholder="Verification Code" type="text" value="">'
        +'</div>'
        +'</div>'

        +'<div class="form-group">'
        +'<label class="control-label">Name:</label>'
        +'<div class="col-12">'
        +'<input class="form-control" name="name" placeholder="enter name drive" type="text" value="'+name+'">'
        +'</div>'
        +'</div>'

        +'<div class="form-group">'
        +'<label class="control-label">Multiple upload/import:</label>'
        +'<div class="col-12">\
              <span class="form-check form-check-inline">\
                <input class="form-check-input" type="radio" id="multiple_true" name="multiple_access" value="true" '+(multiple_access !== false ? 'checked' : '')+'>\
                <label class="form-check-label" for="multiple_true"><font color="green">enable</font></label>\
              </span>\
              <span class="form-check form-check-inline">\
                <input class="form-check-input" type="radio" id="multiple_false" name="multiple_access" value="false" '+(multiple_access === false ? 'checked' : '')+'>\
                <label class="form-check-label" for="multiple_false"><font color="red">disable</font></label>\
              </span>\
        </div>'
        +'</div>'

        +'<div class="form-group">'
        +'<label class="control-label">Note:</label>'
        +'<div class="col-12">'
        +'<textarea class="form-control" name="note" placeholder="option" rows="5">'+note+'</textarea>'
        +'</div>'
        +'</div>'
        +'</form>';

      $.sendConfirm({
        title: 'Edit Drive',
        content: htmlForm,
        button: {
          confirm: 'Save',
          cancel: 'Cancel'
        },
        width: 'auto',
        isFixed: true,
        bgHide: false,
        noconfirm: false,
        callback: function(){
          $("#dialogForm select[name=project]").val(project);
          _callback_upload_json(id);
        },
        onBeforeConfirm: function(){
          project = $.trim($("#dialogForm select[name=project]").val());
          name = $.trim($("#dialogForm input[name=name]").val());
          note = $.trim($("#dialogForm input[name=note]").val());

          var ele_project = $("#dialogForm select[name=project]"),
              ele_data_json_upload = $("#dialogForm input[name=data_json_upload]"),
              ele_code = $("#dialogForm input[name=code]"),
              ele_name = $("#dialogForm input[name=name]");

          $.niceToast.clear();

          if(project === "" || project < 1){
            ele_project.parents("div.form-group").siblings("div.form-group").removeClass("error");
            ele_project.parents("div.form-group").addClass("error");
            $.niceToast.error('<strong>Error</strong>: Please select project to add drive.');
            return false;
          } else if(!data_json_upload){
            ele_data_json_upload.parents("div.form-group").siblings("div.form-group").removeClass("error");
            ele_data_json_upload.parents("div.form-group").addClass("error");
            $.niceToast.error('<strong>Error</strong>: Please upload \'Service_account.json\' or \'client_secret.json\'.');
            return false;
          } else if(parent.data("data_json") !== data_json_upload && type === "oauth" && !$.trim(ele_code.val())){
            ele_code.parents("div.form-group").siblings("div.form-group").removeClass("error");
            ele_code.parents("div.form-group").addClass("error");
            $.niceToast.error('<strong>Error</strong>: Please enter Verification Code.');
            return false;
          } else if(!name){
            ele_name.parents("div.form-group").siblings("div.form-group").removeClass("error");
            ele_name.parents("div.form-group").addClass("error");
            $.niceToast.error("<strong>Error</strong>: Please enter drive name.");
            return false;
          } else if(name.length > 50){
            ele_name.parents("div.form-group").siblings("div.form-group").removeClass("error");
            ele_name.parents("div.form-group").addClass("error");
            $.niceToast.error("<strong>Error</strong>: The drive name cannot exceed 50 characters.");
            return false;
          }

          $("#dialogForm input[name=data_json_request]").val(data_json_upload);
          $("#dialogForm").submit();
          addScreenLoading();
          return true;
        },
        onConfirm: function() {
        },
        onCancel: function() {},
        onClose: function() {}
      });
    });


    $('#search').click(function() {
      var searchForm = '<form id="dialogForm" class="form-horizontal" method="post">'
              +'<input type="hidden" name="action" value="search">'
              +'<div class="form-group">'
              +'<label class="control-label">Keyword:</label>'
              +'<div class="col-12">'
              +'<input class="form-control" name="keyword" placeholder="Enter keyword" type="text">'
              +'</div>'
              +'</div>'
              +'<div class="form-group">'
              +'<label class="control-label">Search by:</label>'
              +'<div class="col-12">'
              +'<span class="form-check form-check-inline">'
              +'<input class="form-check-input" type="radio" id="type_name" name="type" value="name" checked>'
              +'<label class="form-check-label" for="type_name">Name</label>'
              +'</span>'
              +'<span class="form-check form-check-inline">'
              +'<input class="form-check-input" type="radio" id="type_project" name="type" value="project">'
              +'<label class="form-check-label" for="type_project">Project</label>'
              +'</span>'
              +'<span class="form-check form-check-inline">'
              +'<input class="form-check-input" type="radio" id="type_note" name="type" value="note">'
              +'<label class="form-check-label" for="type_note">Note</label>'
              +'</span>'
              +'</div>'
              +'</div>'
              +'</form>';

      $.sendConfirm({
        title: 'Search Drive',
        content: searchForm,
        button: {
          confirm: 'Search',
          cancel: 'Cancel'
        },
        width: 'auto',
        isFixed: true,
        noconfirm: false,
        onBeforeConfirm: function(){
          $("#dialogForm").submit();
          addScreenLoading();
        },
        onConfirm: function() {},
        onCancel: function() {},
        onClose: function() {}
      });
    });
  });
</script>