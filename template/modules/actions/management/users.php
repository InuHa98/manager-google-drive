<ul class="nav-tabs nomargin-top">
  <li class="nav-tabs-item selected">Users</li>
  <li class="nav-tabs-item">
    <a href="<?=_getUrl('management', 'drives');?>">Drives</a>
  </li>
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
            <option value="<?=_getUrl('management', 'users');?>?limit=<?=$_config['numPage'];?>" ><?=$_config['numPage'];?></option>
            <option value="<?=_getUrl('management', 'users');?>?limit=50" <?=($_model->getData("limit") == 50 ? 'selected' : '');?> >50</option>
            <option value="<?=_getUrl('management', 'users');?>?limit=100" <?=($_model->getData("limit") == 100 ? 'selected' : '');?> >100</option>
            <option value="<?=_getUrl('management', 'users');?>?limit=250" <?=($_model->getData("limit") == 250 ? 'selected' : '');?> >250</option>
            <option value="<?=_getUrl('management', 'users');?>?limit=500" <?=($_model->getData("limit") == 500 ? 'selected' : '');?> >500</option>
          </select>
        </div>
        <div class="changeview" title="Sorted by">
          <select id="sort" class="form-select">
            <option value="<?=_getUrl('management', 'users');?>?orderBy=name">-- Sort by name --</option>
            <option value="<?=_getUrl('management', 'users');?>?orderBy=active" <?=($_model->getData("orderBy") == "active" ? 'selected' : '');?>>-- Approved --</option>
            <option value="<?=_getUrl('management', 'users');?>?orderBy=inactive" <?=($_model->getData("orderBy") == "inactive" ? 'selected' : '');?>>-- Inactive --</option>
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
          <strong><?=count($_model->getData('itemList'));?> user</strong> (of <?=$_model->getData('itemCount');?>)
        </label>
      </span>
      <span class="float-right">
        <button type="submit" name="approve" role="tool_action" class="btn btn-gray disabled"><i class="bx bx-lock-open"></i> Approve</button>
        <button type="submit" name="deactivate" role="tool_action" class="btn btn-gray disabled"><i class="bx bx-lock"></i> Deactivate</button>
        <button type="button" name="delete" role="tool_action" class="btn btn-gray disabled"><i class="bx bx-x"></i> Delete</button>
      </span>
    </div>
    <div class="box_content">
      <div class="table-scroll">
        <table class="table">
          <thead>
            <tr>
              <th></th>
              <th width="50%">
              <?php if($_model->getData("orderBy") == "name" ){ ?>
                <span class="sort-table sort-table-asc">
                  <i class="bx bx-up-arrow-alt"></i>
                </span>
              <?php } ?>
                Username
              </th>
              <th>
              <?php if($_model->getData("orderBy") == "active" ){ ?>
                <span class="sort-table sort-table-asc">
                  <i class="bx bx-up-arrow-alt"></i>
                </span>
              <?php } ?>
              <?php if($_model->getData("orderBy") == "inactive" ){ ?>
                <span class="sort-table sort-table-desc">
                  <i class="bx bx-down-arrow-alt"></i>
                </span>
              <?php } ?>
                Status
              </th>
              <th width="30%">Email</th>
              <th>Limit Drive</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
        <?php 

          if($_model->getData("itemList")){
            foreach ($_model->getData("itemList") as $arr) {
              echo '<tr class="nowrap" data-id="'.$arr['id'].'" data-limit-drive="'.$arr['limit_drive'].'" data-active="'.$arr['active'].'">
                <td>
                  <div class="form-check">
                    <input role="selected" class="form-check-input" type="checkbox" name="selected[]" value="'.$arr['id'].'">
                  </div>
                </td>
                <td role="username">
                  <div>
                    <img class="profile-avatar" src="'._getAvatar($arr).'">
                    <b>'._echo($arr['name']).'</b> '.($arr['adm'] > 0 ? '('._position($arr).')' :  '').'
                  </div>
                </td>
                <td>'.($arr['active'] > 0 ? '<span class="dot_active"></span> Approved' : '<span class="dot_inactive"></span> Inactive').'</td>
                <td><div><i class="bx bx-mail-send"></i> '._echo($arr['email']).'</div></td>
                <td align="center">'.$arr['limit_drive'].'</td>
                <td>
                  <button type="button" role="setting_user" class="btn btn-sm btn-black"><i class="bx bx-cog"></i> Setting</button>
                  <button type="button" role="delete_user" class="btn btn-sm btn-black"><i class="bx bx-x"></i> Delete</button>
                </td>
              </tr>';
            }
          } else
            echo '<tr><td class="empty" colspan="6">No data available in table.</td></tr>';

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
  $(document).ready(function(){

    sortTable({
      table: $("table"),
      column: [1, 2, 3, 4],
      icon: {
        asc: '<i class="bx bx-up-arrow-alt"></i>',
        desc: '<i class="bx bx-down-arrow-alt"></i>'
      }
    });

    $('#sort, #limit').on('change', function () {
      var url = $(this).val();
      if (url)
        window.location = url;
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

    $("button[role=tool_action][name=delete]").on("click", function(){
      $.sendConfirm({
        title: 'Delete User',
        msg: 'There are <strong>'+$("input[role=selected]:checked").length+'</strong> selected users.',
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

    $("button[role=delete_user]").on("click", function(){
      var id = $(this).parents("tr").data("id");
      $.sendConfirm({
        title: 'Delete User',
        msg: $(this).parents("tr").find("td[role=username]").html(),
        desc: 'you really want to delete this user?',
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
    })

    $("button[role=setting_user]").on("click", function(){
      var id = $(this).parents("tr").data("id");
      var htmlForm = '<form id="dialogForm" class="form-horizontal" method="post">'
        +'<input type="hidden" name="setting" value="submit">'
        +'<input type="hidden" name="user_id" value="'+id+'">'
        +'<div class="form-group">'
        +'<label class="control-label">Limit Drive:</label>'
        +'<div class="col-12">'
        +'<input class="form-control" name="limit_drive" placeholder="enter number limit or \'unlimited\'" type="text" value="'+$(this).parents("tr").data('limit-drive')+'">'
        +'</div>'
        +'</div>'
        +'<div class="form-group">'
        +'<label class="control-label">New Password:</label>'
        +'<div class="col-12">'
        +'<input class="form-control" name="new_password" placeholder="enter new password" type="password">'
        +'</div>'
        +'<div class="col-12">'
        +'<input class="form-control" name="re_new_password" placeholder="enter new password (again)" type="password">'
        +'</div>'
        +'</div>'
        +'<div class="form-group">'
        +'<label class="control-label">Status:</label>'
        +'<div class="col-12">'
        +'<span class="form-check form-check-inline">'
        +'<input class="form-check-input" type="radio" id="type_approved" name="active" value="1" checked>'
        +'<label class="form-check-label" for="type_approved"><font color="green">Approved</font></label>'
        +'</span>'
        +'<span class="form-check form-check-inline">';
              
      if($(this).parents("tr").data('active') !== 1){
        htmlForm  += '<input class="form-check-input" type="radio" id="type_inactive" name="active" value="0" checked>';
      } else {
        htmlForm  += '<input class="form-check-input" type="radio" id="type_inactive" name="active" value="0">';
      }
      htmlForm += '<label class="form-check-label" for="type_inactive">Inactive</label>'
        +'</span>'
        +'</div>'
        +'</div>'
        +'</form>';

      var limit_drive, new_password, re_new_password;

      $.sendConfirm({
        title: 'Setting User',
        msg: $(this).parents("tr").find("td[role=username]").html(),
        content: htmlForm,
        button: {
          confirm: 'Save',
          cancel: 'Cancel'
        },
        width: 'auto',
        isFixed: true,
        bgHide: false,
        noconfirm: false,
        onBeforeConfirm: function(){
          limit_drive = $.trim($("#dialogForm input[name=limit_drive]").val());
          new_password = $.trim($("#dialogForm input[name=new_password]").val());
          re_new_password = $.trim($("#dialogForm input[name=re_new_password]").val());
          if((isNaN(limit_drive) && limit_drive !== "unlimited") || !limit_drive){
            $("#dialogForm input[name=limit_drive]").parents("div.form-group").addClass("error");
            $.niceToast.error("<strong>Error</strong>: Limit drive is number limit or \'unlimited\'.");
            return false;
          } else if(new_password || re_new_password){
            if(new_password !== re_new_password){
              $("#dialogForm input[name=new_password], #dialogForm input[name=re_new_password]").parents("div.form-group").addClass("error");
              $.niceToast.error("<strong>Error</strong>: Re-entered password is incorrect.");
              return false;
            } else if(new_password.length < 4){
              $("#dialogForm input[name=new_password]").parents("div.form-group").addClass("error");
              $.niceToast.error("<strong>Error</strong>: Password must be more than 4 characters.");
              return false;
            }
          }
          $("#dialogForm").submit();
          addScreenLoading();
          return true;
        },
        onConfirm: function() {
        },
        onCancel: function() {},
        onClose: function() {}
      });
    })

    $('#search').click(function() {
      var searchForm = '<form id="dialogForm" class="form-horizontal" method="post">'
              +'<input type="hidden" name="action" value="search">'
              +'<div class="form-group">'
              +'<label class="control-label">Keyword:</label>'
              +'<div class="col-12">'
              +'<input class="form-control" name="keyword" placeholder="Nhập từ khóa" type="text">'
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
              +'<input class="form-check-input" type="radio" id="type_email" name="type" value="email">'
              +'<label class="form-check-label" for="type_email">Email</label>'
              +'</span>'
              +'</div>'
              +'</div>'
              +'</form>';

      $.sendConfirm({
        title: 'Search User',
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