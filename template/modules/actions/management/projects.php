<ul class="nav-tabs nomargin-top">
<?php if(_isAdmin() || _isMod()){ ?>
  <li class="nav-tabs-item">
    <a href="<?=_getUrl('management', 'users');?>">Users</a>
  </li>
<?php } ?>
  <li class="nav-tabs-item">
    <a href="<?=_getUrl('management', 'drives');?>">Drives</a>
  </li>
  <li class="nav-tabs-item selected">Projects</li>
</ul>
<div class="col-xl-12">
  <div class="tools_header">
    <div class="row align-items-center">
      <div class="col-lg-6 tools_right order-xl-2">
        <div class="changeview" title="Number of rows">
          <select id="limit" class="form-select">
            <option value="<?=_getUrl('management', 'projects');?>?limit=<?=$_config['numPage'];?>" ><?=$_config['numPage'];?></option>
            <option value="<?=_getUrl('management', 'projects');?>?limit=50" <?=($_model->getData("limit") == 50 ? 'selected' : '');?> >50</option>
            <option value="<?=_getUrl('management', 'projects');?>?limit=100" <?=($_model->getData("limit") == 100 ? 'selected' : '');?> >100</option>
            <option value="<?=_getUrl('management', 'projects');?>?limit=250" <?=($_model->getData("limit") == 250 ? 'selected' : '');?> >250</option>
            <option value="<?=_getUrl('management', 'projects');?>?limit=500" <?=($_model->getData("limit") == 500 ? 'selected' : '');?> >500</option>
          </select>
        </div>
        <div class="changeview" title="Sorted by">
          <select id="sort" class="form-select">
            <option value="<?=_getUrl('management', 'projects');?>?orderBy=name">-- Sort by name --</option>
            <option value="<?=_getUrl('management', 'projects');?>?orderBy=new" <?=($_model->getData("orderBy") == "new" ? 'selected' : '');?>>-- New --</option>
            <option value="<?=_getUrl('management', 'projects');?>?orderBy=old" <?=($_model->getData("orderBy") == "old" ? 'selected' : '');?>>-- Old --</option>
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
          <strong><?=count($_model->getData('itemList'));?> project</strong> (of <?=$_model->getData('itemCount');?>)
        </label>
      </span>
      <span class="float-right">
        <button type="button" name="new_project" class="btn new_drive"><i class="bx bx-list-plus"></i> New Project</button>
        <button type="button" name="delete_project" role="tool_action" class="btn btn-gray disabled"><i class="bx bx-x"></i> Delete</button>
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
              <th>Drive</th>
              <th width="50%">Note</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
        <?php 

          if($_model->getData("itemList")){
            foreach ($_model->getData("itemList") as $arr) {

              $countDrive = $database->count("core_drives", ["project_id" => $arr['id'], "user_id" => $_USER->getId()]);

              echo '<tr class="nowrap" data-id="'.$arr['id'].'" data-name="'._echo($arr['name']).'" data-note="'._echo($arr['note']).'">
                <td>
                  <div class="form-check">
                    <input role="selected" class="form-check-input" type="checkbox" name="selected[]" value="'.$arr['id'].'">
                  </div>
                </td>
                <td>
                  <div>
                    <a href="'._getUrl('management', 'drives/'.$arr['id']).'">
                      <i class="bx bx-layer"></i> <b>'._echo($arr['name']).'</b>
                    </a>
                  </div>
                </td>
                <td align="center">'.$countDrive.' drive</td>
                <td class="note">
                  <div>
                    <small>
                      '.($arr['note'] ? '<i class="bx bx-notepad"></i> '._echo($arr['note']) : '').'
                    </small>
                  </div>
                </td>
                <td>
                  <button type="button" role="edit_project" class="btn btn-sm btn-black"><i class="bx bx-edit-alt"></i> Edit</button>
                  <button type="button" role="delete_project" class="btn btn-sm btn-black"><i class="bx bx-x"></i> Delete</button>
                </td>
              </tr>';
            }
          } else
            echo '<tr><td class="empty" colspan="5">No data available in table.</td></tr>';

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
      column: [1, 2],
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

    $("button[role=tool_action][name=delete_project]").on("click", function(){
      $.sendConfirm({
        title: 'Delete Project',
        msg: 'There are <strong>'+$("input[role=selected]:checked").length+'</strong> selected projects.',
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

    $("button[role=delete_project]").on("click", function(){
      var id = $(this).parents("tr").data("id");
      $.sendConfirm({
        title: 'Delete Project',
        msg: 'Project: <strong>'+$(this).parents("tr").data("name")+'</strong>',
        desc: 'you really want to delete this project?',
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

    $("button[name=new_project]").on("click", function(){
      var id = $(this).parents("tr").data("id");
      var htmlForm = '<form id="dialogForm" class="form-horizontal" method="post">'
        +'<input type="hidden" name="new" value="submit">'
        +'<div class="form-group">'
        +'<label class="control-label">Name:</label>'
        +'<div class="col-12">'
        +'<input class="form-control" name="name" placeholder="enter name project" type="text" value="">'
        +'</div>'
        +'</div>'
        +'<div class="form-group">'
        +'<label class="control-label">Note:</label>'
        +'<div class="col-12">'
        +'<textarea class="form-control" name="note" placeholder="option" rows="10"></textarea>'
        +'</div>'
        +'</div>'
        +'</form>';

      var name, note;

      $.sendConfirm({
        title: 'New Project',
        content: htmlForm,
        button: {
          confirm: 'Create',
          cancel: 'Cancel'
        },
        width: 'auto',
        isFixed: true,
        bgHide: false,
        noconfirm: false,
        onBeforeConfirm: function(){
          name = $.trim($("#dialogForm input[name=name]").val());
          note = $.trim($("#dialogForm input[name=note]").val());
          if(!name){
            $("#dialogForm input[name=name]").parents("div.form-group").addClass("error");
            $.niceToast.error("<strong>Error</strong>: Please enter project name.");
            return false;
          } else if(name.length > 50){
              $("#dialogForm input[name=name]").parents("div.form-group").addClass("error");
              $.niceToast.error("<strong>Error</strong>: The project name cannot exceed 50 characters.");
              return false;
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
    });

    $("button[role=edit_project]").on("click", function(){
      var id = $(this).parents("tr").data("id");
      var htmlForm = '<form id="dialogForm" class="form-horizontal" method="post">'
        +'<input type="hidden" name="project_id" value="'+id+'">'
        +'<input type="hidden" name="edit" value="submit">'
        +'<div class="form-group">'
        +'<label class="control-label">Name:</label>'
        +'<div class="col-12">'
        +'<input class="form-control" name="name" placeholder="enter name project" type="text" value="'+$(this).parents("tr").data("name")+'">'
        +'</div>'
        +'</div>'
        +'<div class="form-group">'
        +'<label class="control-label">Note:</label>'
        +'<div class="col-12">'
        +'<textarea class="form-control" name="note" placeholder="option" rows="10">'+$(this).parents("tr").data("note")+'</textarea>'
        +'</div>'
        +'</div>'
        +'</form>';

      var name, note;

      $.sendConfirm({
        title: 'Edit Project',
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
          name = $.trim($("#dialogForm input[name=name]").val());
          note = $.trim($("#dialogForm input[name=note]").val());
          if(!name){
            $("#dialogForm input[name=name]").parents("div.form-group").addClass("error");
            $.niceToast.error("<strong>Error</strong>: Please enter project name.");
            return false;
          } else if(name.length > 50){
              $("#dialogForm input[name=name]").parents("div.form-group").addClass("error");
              $.niceToast.error("<strong>Error</strong>: The project name cannot exceed 50 characters.");
              return false;
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
    });

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
              +'<input class="form-check-input" type="radio" id="type_note" name="type" value="note">'
              +'<label class="form-check-label" for="type_note">Note</label>'
              +'</span>'
              +'</div>'
              +'</div>'
              +'</form>';

      $.sendConfirm({
        title: 'Search Project',
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