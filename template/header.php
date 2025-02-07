<?php


$_title = isset($_title) ? $_title : '';


?>
<!DOCTYPE html>

<html lang="en" dir="ltr">
  <head>
    <meta charset="UTF-8">
    <title><?=$_title.' - '.$_config['site_name'];?></title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
    <link rel='stylesheet' href='<?=$_config['url'];?>/assets/styles/boxicons.css?v=<?=$_version;?>'>


    <script type="text/javascript" src="<?=$_config['url'];?>/assets/scripts/jquery-3.4.1.min.js?v=<?=$_version;?>"></script>
    <script type="text/javascript" src="<?=$_config['url'];?>/assets/scripts/GoogleDriveAPI.js?v=<?=$_version;?>"></script>

    <script type="text/javascript" src="<?=$_config['url'];?>/assets/scripts/jquery.dialog.min.js"></script>
    <link rel="stylesheet" href="<?=$_config['url'];?>/assets/styles/dialog.css?v=<?=$_version;?>">


    <link rel='stylesheet' href='<?=$_config['url'];?>/assets/styles/responsive.css?v=<?=$_version;?>'>
    <link rel="stylesheet" href="<?=$_config['url'];?>/assets/styles/style.css?v=<?=$_version;?>">

    <script type="text/javascript" src="<?=$_config['url'];?>/assets/scripts/lazyload.min.js?v=<?=$_version;?>"></script>
    <link rel="icon" type="image/x-icon" href="<?=$_config['url'];?>/favico.ico">
    <link rel="shortcut icon" type="image/x-icon" href="<?=$_config['url'];?>/favico.ico">
  </head>
  <body>

    <link rel="stylesheet" href="<?=$_config['url'];?>/assets/styles/nice-toast-js.css?v=<?=$_version;?>">
    <script type="text/javascript" src="<?=$_config['url'];?>/assets/scripts/nice-toast-js.js"></script>
    <script type="text/javascript" src="<?=$_config['url'];?>/assets/scripts/custom.js?v=<?=$_version;?>"></script>
    
    <script type="text/javascript">
      $(document).ready(function(){
        $.niceToast.setup({
            position: "top-right",
            timeout: 0,
        });
        var ele_active = $("ul.nav-links").find("li.active");
        $("ul.nav-links li:not(.all-storage):not(:last-child)").on("mouseover", function(e){
          ele_active.removeClass("active");
          e.stopPropagation();
        });
        $("ul.nav-links li:not(.all-storage):not(:last-child)").on("mouseout", function(e){
          ele_active.addClass("active");
          e.stopPropagation();
        });

        $(".storage-refresh").on("click", function(){
          let _this = $(this);
          _this.addClass("disabled");
          $("#storage-usage-txt").html('"..."');
          let ajax_get_info = function(usage = 0,start = 0){
            $.ajax({
              type: "GET",
              url: "<?=_getUrl('get_storage_info');?>",
              data: {usage: usage, start: start},
              dataType: 'json',
              cache: false,
              success: function(response) {
                  if(response.code === 200){
                    $("#storage-usage-txt").html(response.data['usage']);
                    $("#storage-usage-bar").css('width', response.data['rate']+'%');
                    if(response.data['next'] !== null){
                      ajax_get_info(response.data['usage_size'], response.data['next']);
                    } else {
                      _this.removeClass("disabled");
                    }
                  }
              },
              error: function(){
                _this.removeClass("disabled");
              }
            });
          };
          ajax_get_info();
        });


      });



    </script>

<?php if($_hide_header !== true){ ?>
    <div class="sidebar close">
      <div class="logo-details">
        <a href="<?=$_config['url'];?>">
          <img src="<?=$_config['url'];?>/images/logo.png">
          <span class="logo_name"><b>Drive</b>remote</span>
        </a>
      </div>

<?php if($_USER->isLogin()){ ?>
      <ul class="nav-links">
        <li <?=($_Mvc->getController() == "myDrive" ? 'class="active"' : '');?>>
          <a href="<?=$_config['url'];?>">
            <i class='bx bx-grid-alt'></i>
            <span class="link_name">My Drive</span>
          </a>
          <ul class="sub-menu blank">
            <li>
              <a class="link_name" href="<?=$_config['url'];?>">My Drive</a>
            </li>
          </ul>
        </li>

        <li <?=($_Mvc->getController() == "profile" ? 'class="active"' : '');?>>
          <a href="<?=_getUrl('profile');?>">
            <i class='bx bx-user-circle'></i>
            <span class="link_name">Profile</span>
          </a>
          <ul class="sub-menu blank">
            <li>
              <a class="link_name" href="<?=_getUrl('profile');?>">Profile</a>
            </li>
          </ul>
        </li>

        <li <?=($_Mvc->getController() == "management" ? 'class="active"' : '');?>>
          <div class="iocn-link">
            <a href="<?=(_isAdmin() || _isMod() ? _getUrl('management', 'users') : _getUrl('management', 'drives'));?>">
              <i class='bx bx-cog'></i>
              <span class="link_name">Management</span>
            </a>
            <i class='bx bxs-chevron-down arrow'></i>
          </div>
          <ul class="sub-menu">
            <li>
              <a class="link_name" href="<?=(_isAdmin() || _isMod() ? _getUrl('management', 'users') : _getUrl('management', 'drives'));?>">Management</a>
            </li>
          <?php if(_isAdmin() || _isMod()){ ?>
            <li>
              <a href="<?=_getUrl('management', 'users');?>">Users</a>
            </li>
          <?php } ?>
            <li>
              <a href="<?=_getUrl('management', 'drives');?>">Drives</a>
            </li>
            <li>
              <a href="<?=_getUrl('management', 'projects');?>">Projects</a>
            </li>
          </ul>
        </li>


        <li <?=($_Mvc->getController() == "help" ? 'class="active"' : '');?>>
          <div class="iocn-link">
            <a href="<?=_getUrl('help', 'service_account');?>">
              <i class='bx bx-help-circle'></i>
              <span class="link_name">Help</span>
            </a>
            <i class='bx bxs-chevron-down arrow'></i>
          </div>
          <ul class="sub-menu">
            <li>
              <a class="link_name" href="<?=_getUrl('help', 'service_account');?>">Help</a>
            </li>
            <li>
              <a href="<?=_getUrl('help', 'service_account');?>">Service Account</a>
            </li>
            <li>
              <a href="<?=_getUrl('help', 'client_secret');?>">OAuth Client ID</a>
            </li>
          </ul>
        </li>

      <?php

        $total_drives = $database->count("core_drives", ["user_id" => $_USER->getId()]);
        $storage_limit = ($total_drives * 15) * (1024 * 1024 * 1024);
        $storage_usage = $database->sum("core_drives", "storage_usage", ["user_id" => $_USER->getId(), "storage_limit[!]" => ""]);
      ?>

        <li class="all-storage">
          <a>
            <i class='bx bx-cloud'></i>
            <span class="link_name">Storage</span>
            <i class='bx bx-refresh storage-refresh'></i>
          </a>
          <div class="storage-bar">
            <div id="storage-usage-bar" class="storage-usage" style="width: <?=($storage_usage/$storage_limit * 100);?>%;"></div>
            <div class="storage-limit"></div>
          </div>
          <div class="storage-info">Used <span id="storage-usage-txt"><?=_sizeFormat($storage_usage);?></span> out of <?=_sizeFormat($storage_limit);?></div>
        </li>

        <li>
          <div class="profile-details">
            <div class="profile-content">
              <img src="<?=_getAvatar();?>" alt="profileImg">
            </div>
            <div class="name-job">
              <div class="profile_name"><?=_echo($_USER->getName());?></div>
              <div class="job"><?=_position();?></div>
            </div>
            <a href="<?=_getUrl('logout');?>">
              <i class='bx bx-log-out'></i>
            </a>
            <ul class="sub-menu blank">
              <li>
                <a class="link_name" href="<?=_getUrl('logout');?>">Logout <i class='bx bx-log-out'></i></a>
              </li>
            </ul>
          </div>
        </li>
      </ul>

<?php } else { ?>

      <ul class="nav-links">
        <li>
          <a href="<?=_getUrl('login');?>">
            <i class='bx bx-log-in'></i>
            <span class="link_name">Login</span>
          </a>
          <ul class="sub-menu blank">
            <li>
              <a class="link_name" href="<?=_getUrl('login');?>">Login</a>
            </li>
          </ul>
        </li>

        <li>
          <a href="<?=_getUrl('register');?>">
            <i class='bx bx-user-plus'></i>
            <span class="link_name">Register</span>
          </a>
          <ul class="sub-menu blank">
            <li>
              <a class="link_name" href="<?=_getUrl('register');?>">Register</a>
            </li>
          </ul>
        </li>

      </ul>

<?php } ?>

    </div>
    <section class="home-section">
      <div class="home-content">
        <i class='bx bx-menu'></i>
        <span class="text"><a href="<?=$_SERVER['REQUEST_URI'];?>"><?=$_title_module;?></a></span>
      </div>
      <div id="scroll_view" class="content-section custom-scroll">
<?php } ?>