<ul class="nav-tabs nomargin-top">
  <li class="nav-tabs-item">
  	<a href="<?=_getUrl('help', 'service_account');?>">Service Account</a>
  </li>
  <li class="nav-tabs-item selected">OAuth Client ID</li>
</ul>
<div class="help">
	<div class="i_title">How create 'client_secret.json'?</div>
	<p>Used to manage current Google Drive of google account</p>
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
	<p>-- Choose "<b>APIs & Services</b> > <b>OAuth consent screen</b>" in the menu.</p>
	<p><img src="<?=$_config['url'];?>/images/help/o_09.png"></p>
	<p>-- Choose "<b>External</b>" and click button <b>"Create"</b>.</p>
	<p><img src="<?=$_config['url'];?>/images/help/o_11.png"></p>
	<p>-- Just enter the 3 fields marked with * required.</p>
	<p><img src="<?=$_config['url'];?>/images/help/o_12.png"></p>
	<p>-- skip step 2 to step 3. click "<b>Add user</b>" and enter the gmail you want to manage Google Drive.</p>
	<p><img src="<?=$_config['url'];?>/images/help/o_13.png"></p>
	<p>-- Click "<b>Save and countinue</b>".</p>
	<div class="step">Step 4:</div>
	<p>-- Create a new OAuth client ID as instructed below.</p>
	<p><img src="<?=$_config['url'];?>/images/help/o_14.png"></p>
	<p><img src="<?=$_config['url'];?>/images/help/o_15.png"></p>
	<p><img src="<?=$_config['url'];?>/images/help/o_16.png"></p>
	<p><img src="<?=$_config['url'];?>/images/help/o_17.png"></p>
	<p>-- Save the downloaded access code and upload it to <a href="<?=_getUrl('drive');?>">Managament Drives</a>.</p>
</div>