<ul class="nav-tabs nomargin-top">
  <li class="nav-tabs-item selected">Service Account</li>
  <li class="nav-tabs-item">
  	<a href="<?=_getUrl('help', 'client_secret');?>">OAuth Client ID</a>
  </li>
</ul>
<div class="help">
	<div class="i_title">How create 'service_account.json'?</div>
	<p>One gmail account can create up to 12 projects. Each project corresponds to 15gb (total 180Gb).</p>
	<div class="step">Step 1:</div>
	<p>-- Go to <a target="_blank" href="https://console.cloud.google.com/getting-started?hl=en">https://console.cloud.google.com/getting-started?hl=en</a> and sign in with your desired gmail account.</p>
	<p><img src="<?=$_config['url'];?>/images/help/01.png"></p>
	<p><img src="<?=$_config['url'];?>/images/help/02.png"></p>
	<p><img src="<?=$_config['url'];?>/images/help/03.png"></p>
	<p>-- Click "<b>Create</b>" and wait.</p>
	<div class="step">Step 2:</div>
	<p>-- Select the newly created project.</p>
	<p>-- Choose "<b>APIs & Services</b> > <b>Library</b>" in the menu.</p>
	<p><img src="<?=$_config['url'];?>/images/help/04.png"></p>
	<p>-- Enter "<b>Google Drive Api</b>" and on the returned result.</p>
	<p><img src="<?=$_config['url'];?>/images/help/05.png"></p>
	<p><img src="<?=$_config['url'];?>/images/help/06.png"></p>
	<p>-- Click "<b>Enable</b>" and wait.</p>
	<div class="step">Step 3:</div>
	<p>-- Choose "<b>APIs & Services</b> > <b>Credentials</b>" in the menu.</p>
	<p><img src="<?=$_config['url'];?>/images/help/07.png"></p>
	<p>-- Choose "<b>Create Credentials</b> > <b>Service Account</b>"</p>
	<p><img src="<?=$_config['url'];?>/images/help/08.png"></p>
	<p>-- Enter the required information as images.</p>
	<p><img src="<?=$_config['url'];?>/images/help/09.png"></p>
	<p><img src="<?=$_config['url'];?>/images/help/10.png"></p>
	<p>-- Click "<b>Done</b>" and wait.</p>
	<div class="step">Step 4:</div>
	<p>-- Create a new Service Account as instructed below.</p>
	<p><img src="<?=$_config['url'];?>/images/help/11.png"></p>
	<p><img src="<?=$_config['url'];?>/images/help/12.png"></p>
	<p><img src="<?=$_config['url'];?>/images/help/13.png"></p>
	<p>-- Save the downloaded access code and upload it to <a href="<?=_getUrl('drive');?>">Managament Drives</a>.</p>
</div>