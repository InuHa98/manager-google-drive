/*!
 * drive remote.js v1.0.0
 * Copyright 2021-present inuHa
 *
 */
var myDrive = {
	currentTitle: document.title,
	infoFolder: null,
	resourceKey: null,
	parents: [],
	DATA_FILES: [],
	ALL_FOLDERS: [],
	selected_file: [],

	type_folder: 'application/vnd.google-apps.folder',
	type_shortcut: 'application/vnd.google-apps.shortcut',

	class_file: "drive-file",
	div_breadcrumb: $("#drive_breadcrumb"),
	div_list_item: $("#listFile"),
	div_scroll_view: 'scroll_view',

	role_list_folders: 'role_list_folders',
	role_list_files: 'role_list_files',

	role_total_item: 'drive_total_files',
	role_folder: 'drive_folder',
	role_file: 'drive_file',

	role_action_file: 'role_action_file',
	role_private_share: 'role_private_share',
	role_share_file: 'role_share_file',
	role_move_file: 'role_move_file',
	role_change_name_file: 'role_change_name_file',
	role_info_file: 'role_info_file',
	role_copy_file: 'role_copy_file',
	role_copy_my_drive: 'role_copy_to_drive',
	role_download_file: 'role_download_file',
	role_delete_file: 'role_delete_file',
	role_restore_file: 'role_restore_file',
	role_delete_forever_file: 'role_delete_forever_file',
	role_share_type: 'role_share_type',
	role_flag_type: 'role_flag_type',

	role_uploading_box: 'role_uploading_box',
	role_uploading_body: 'role_uploading_body',
	role_uploading_title: 'role_uploading_title',
	role_uploading_notify: 'role_uploading_notify',
	role_retry_upload: 'role_retry_upload',
	role_cancel_upload: 'role_cancel_upload',

	access_myDrive: 'access_myDrive',
	access_trash: 'access_trash',
	access_sharedWithMe: 'access_sharedWithMe',
	access_recent: 'access_recent',

	role_search: 'input_search',
	cancel_search: 'cancel_search',
	input_upload_file: '#upload_file',
	input_upload_folder: '#upload_folder',

	upload: [],
	isUploading: false,

	import: [],
	import_data: [],
	total_size_import: 0,
	isImporting: false,

	css_append_folder: null,
	css_append_file: null,

	toast: null,

	role: function(role_name){
		return '[role='+role_name+']';
	},
	setTotalItem: function(total){
		$(this.role(this.role_total_item)).html(total);
	},
	isEmptyFolder: function(type, text = null){
		if(type === false){
			if(this.div_list_item.children(".empty-folder").length > 0){
				this.div_list_item.html("");
			}		
		} else {
			if(this.div_list_item.children(".empty-folder").length < 1){
				this.setTotalItem(0);
				this.div_list_item.html('<div class="empty-folder"><div class="bg-empty"><div class="txt-empty"><span>'+(text !== null ? text : 'This folder is empty.')+'</span></div></div></div>');
			}				
		}
	},
	_linkPrivateShare: function(file){
		if(typeof file === "undefined"){
			return false;
		}
		return _Config['url_private_share']+'/'+(this.isFolder(file) ? 'folders/#' : 'file/#')+file['id'].split("").reverse().join("");
	},
	_linkShare: function(id, type,  resourceKey){
		if(type !== this.type_folder){
			return "https://drive.google.com/file/d/"+id+"/view?usp=drivesdk"+(resourceKey ? "&resourcekey="+resourceKey : "");
		}
		return "https://drive.google.com/drive/folders/"+id+(resourceKey ? "?resourcekey="+resourceKey : "");
	},
	isFolder: function(file, change_data_shortcut = false){
		if(file['mimeType'] === undefined){
			return false
		};

		if(file['mimeType'] === this.type_shortcut){
			file['alternateLink'] = this._linkShare(file['shortcutDetails']['targetId'], file['shortcutDetails']['targetMimeType'], file['shortcutDetails']['targetResourceKey']);
			file['iconLink'] = "https://drive-thirdparty.googleusercontent.com/32/type/"+file['shortcutDetails']['targetMimeType'];
			if(change_data_shortcut === true){
				file['mimeType'] = file['shortcutDetails']['targetMimeType'];
				file['id'] = file['shortcutDetails']['targetId'];
				file['resourceKey'] = file['shortcutDetails']['targetResourceKey'];
			}
			return (file['shortcutDetails']['targetMimeType'] === this.type_folder) ? true : false;
		}

		return (file['mimeType'] === this.type_folder) ? true : false;
	},
	isFile: function(file, change_data_shortcut = false){
		if(file['mimeType'] === undefined){
			return false
		};

		if(file['mimeType'] === this.type_shortcut){
			file['alternateLink'] = this._linkShare(file['shortcutDetails']['targetId'], file['shortcutDetails']['targetMimeType'], file['shortcutDetails']['targetResourceKey']);
			file['iconLink'] = "https://drive-thirdparty.googleusercontent.com/32/type/"+file['shortcutDetails']['targetMimeType'];
			if(change_data_shortcut === true){
				file['mimeType'] = file['shortcutDetails']['targetMimeType'];
				file['id'] = file['shortcutDetails']['targetId'];
				file['resourceKey'] = file['shortcutDetails']['targetResourceKey'];
			}
			return (file['shortcutDetails']['targetMimeType'] !== this.type_folder) ? true : false;
		}

		return (file['mimeType'] !== this.type_folder) ? true : false;
	},
	_lazyload: new LazyLoad({
        container: document.getElementById(this.div_scroll_view) || document,
        threshold: 200
    }),
	_resetLazyImage: function(){
		this._lazyload.update();
	},
	_getDataFileById: function(id){
		if(!id){
			return false;
		}
		return this.DATA_FILES.find(function(o){
			return o['id'] === id;
		}) || this.ALL_FOLDERS.find(function(o){
			return o['id'] === id;
		});
	},
	_changeSizeIconLink: function(iconLink, size){
		if(!iconLink)
			return false;
		if(!size)
			return iconLink;
		return iconLink.replace(new RegExp('^(.*?)/([0-9]+)/type/(.*?)$', "ig"), '$1/'+size+'/type/$3');
	},
	_changeSizeThumbnailLink: function(file, size){
		if(!file['thumbnailLink'] || !file['thumbnailLink'].match(/googleusercontent/gim)){
			return this._changeSizeIconLink(file['iconLink'], 128);
		}

		if(!size)
			return file['thumbnailLink'];
		return file['thumbnailLink'].replace(new RegExp('^(.*?)=(.*?)$', "ig"), '$1='+size);
	},
	_getThumbnailById: function(file, size = "w350-h288-p"){ // w250-h188-p
		if(!file['id'] || !size){
			return false;
		}
		if(file['canCopy'] === true){
			return this._changeSizeThumbnailLink(file, size);
		}
		return _Config['url_thumbnail']+'/'+size+'/'+file['id']+'/thumbnail.png';
	},
	_getShare: function(file){
		if(typeof file !== "object"){
			return false;
		}
		if(!file['permissions']){
			return false;
		}

		return file['permissions'].find(function(o){
			return o['id'] === "anyoneWithLink";
		}) || false; 
	},
	_htmlDivListFolders: function(){
		return '\
			<div class="title">Folders:</div>\
			<ul role="'+this.role_list_folders+'" class="grid">\
			</ul>';
	},
	_htmlDivListFiles: function(){
		return '\
			<div class="title">Files:</div>\
			<ul role="'+this.role_list_files+'" class="grid">\
			</ul>';
	},
	_htmlFolder: function(folder, trash = false){
		let _self = this;
		if(typeof folder !== "object"){
			return "";
		}
		let shortcut = '\
			<svg class="short-cut" viewBox="0 0 16 16" fill="none" focusable="false" xmlns="http://www.w3.org/2000/svg" class="a-dn-c" width="16px" height="16px">\
				<circle cx="8" cy="8" r="8" fill="white"></circle>\
				<path d="M10,3H6V4H8.15A5,5,0,0,0,10,13V12A4,4,0,0,1,9,4.65V7h1Z" fill="#5F6368"></path>\
			</svg>';

		return '<li role="'+_self.role_folder+'" class="'+_self.class_file+' folder" data-id="'+folder['id']+'">\
			<div class="file-info">\
				<div class="flex-left">\
					<span class="form-check">\
						<input role="selected" class="form-check-input" type="checkbox" value="">\
					</span>\
					<div class="icon">\
						<img src="'+_self._changeSizeIconLink(folder['iconLink'], 32)+'">\
						'+(folder['shortcutDetails'] !== null ? shortcut : '')+'\
					</div>\
					<div class="txt" title="'+folder['title']+'">\
						<a href="#'+folder['id']+'">'+folder['title']+'</a>\
					</div>\
				</div>\
				<div class="flex-right">\
					<div class="hide-info">\
						<div class="owner" title="'+folder['owners'][0]['emailAddress']+'">'+folder['owners'][0]['displayName']+'</div>\
						<div class="size">—</div>\
					</div>\
					<div role="menu_file" class="menu dropdown">\
						<div class="drop-button">\
							<i class="bx bx-dots-vertical"></i>\
						</div>\
						<ul role="'+_self.role_action_file+'" class="drop-menu" data-id="'+folder['id']+'">\
						'+(trash === false ? '\
							'+(folder['shortcutDetails'] === null && (folder['ownedByMe'] === true || folder['editable'] === true) ? '<li role="'+_self.role_private_share+'" class="border-bottom"><i class="bx bx-lock"></i> Private share</li>': '')+'\
							<li role="'+_self.role_share_file+'"><i class="bx bx-share-alt"></i> Share</li>\
							<li role="'+_self.role_move_file+'" class="'+(folder['editable'] !== true ? 'disabled' : '')+'"><i class="bx bx-transfer"></i> Move</li>\
							<li role="'+_self.role_change_name_file+'" class="'+(folder['editable'] !== true ? 'disabled' : '')+'"><i class="bx bx-edit-alt"></i> Change name</li>\
							<li role="'+_self.role_info_file+'" class="border-top"><i class="bx bx-info-circle"></i> Info</li>\
							<li role="'+_self.role_delete_file+'" class="'+(folder['editable'] !== true ? 'disabled' : '')+'"><i class="bx bx-trash"></i> Delete</li>\
						' : '\
							<li role="'+_self.role_restore_file+'"><i class="bx bx-reset"></i> Restore</li>\
							<li role="'+_self.role_delete_forever_file+'"><i class="bx bx-trash"></i> Delete forever</li>\
						')+'\
						</ul>\
					</div>\
				</div>\
			</div>\
		</li>';
	},
	_htmlFile: function(file, trash = false){
		let _self = this;
		if(typeof file !== "object"){
			return "";
		}
		let shortcut = '\
			<svg class="short-cut" viewBox="0 0 16 16" fill="none" focusable="false" xmlns="http://www.w3.org/2000/svg" class="a-dn-c" width="16px" height="16px">\
				<circle cx="8" cy="8" r="8" fill="white"></circle>\
				<path d="M10,3H6V4H8.15A5,5,0,0,0,10,13V12A4,4,0,0,1,9,4.65V7h1Z" fill="#5F6368"></path>\
			</svg>';

		let play = '\
			<svg class="svg-video" viewBox="0 0 40 40" focusable="false">\
				<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">\
					<path opacity="0.54" fill="#000000" d="M20,0 C8.95,0 0,8.95 0,20 C0,31.05 8.95,40 20,40 C31.05,40 40,31.05 40,20 C40,8.95 31.05,0 20,0 L20,0 Z"></path>\
					<path fill="#FFFFFF" d="M16,29 L16,11 L28,20 L16,29 L16,29 Z"></path>\
				</g>\
			</svg>';

		return  '<li role="'+_self.role_file+'" class="'+_self.class_file+' file" data-id="'+file['id']+'">\
			<div class="preview">\
				<span class="form-check">\
					<input role="selected" class="form-check-input" type="checkbox" value="">\
					<div class="i">\
						<i role="'+_self.role_share_type+'" class="bx bxs-group" style="display: '+(_self._getShare(file) !== false ? 'inline-block': 'none')+'"></i>\
						<i role="'+_self.role_flag_type+'" class="bx bxs-flag"  style="display: '+(file['canCopy'] ? 'none': 'inline-block')+'"></i>\
					</div>\
				</span>\
				<img class="lazy" referrerpolicy="no-referrer" data-src="'+_self._getThumbnailById(file)+'" src="'+_self._changeSizeIconLink(file['iconLink'], 128)+'">\
				'+(file['mimeType'].match(/^(video|audio)\/(.*?)$/gis) ? play : '')+'\
			</div>\
			<div class="file-info">\
				<div class="flex-left">\
					<div class="icon">\
						<img src="'+_self._changeSizeIconLink(file['iconLink'], 32)+'">\
						'+(file['shortcutDetails'] !== null ? shortcut : '')+'\
					</div>\
					<div class="txt" title="'+file['title']+'">\
						'+file['title']+'\
					</div>\
					<div class="hide-i">\
						<i role="'+_self.role_share_type+'" class="bx bxs-group" style="display: '+(_self._getShare(file) !== false ? 'inline-block': 'none')+'"></i>\
						<i role="'+_self.role_flag_type+'" class="bx bxs-flag"  style="display: '+(file['canCopy'] ? 'none': 'inline-block')+'"></i>\
					</div>\
				</div>\
				<div class="flex-right">\
					<div class="hide-info">\
						<div class="owner" title="'+file['owners'][0]['emailAddress']+'">'+file['owners'][0]['displayName']+'</div>\
						<div class="size">'+_self._sizeFormat(file['size'])+'</div>\
					</div>\
					<div role="menu_file" class="menu dropdown">\
						<div class="drop-button">\
							<i class="bx bx-dots-vertical"></i>\
						</div>\
						<ul role="'+_self.role_action_file+'" class="drop-menu" data-id="'+file['id']+'">\
						'+(trash === false ? '\
							'+(file['shortcutDetails'] === null && (file['ownedByMe'] === true || file['editable'] === true) ? '<li role="'+_self.role_private_share+'" class="border-bottom"><i class="bx bx-lock"></i> Private share</li>': '')+'\
							<li role="'+_self.role_share_file+'"><i class="bx bx-share-alt"></i> Share</li>\
							<li role="'+_self.role_move_file+'" class="'+(file['editable'] !== true ? 'disabled' : '')+'"><i class="bx bx-transfer"></i> Move</li>\
							<li role="'+_self.role_change_name_file+'" class="'+(file['editable'] !== true ? 'disabled' : '')+'"><i class="bx bx-edit-alt"></i> Change name</li>\
							<li role="'+_self.role_info_file+'" class="border-top"><i class="bx bx-info-circle"></i> Info</li>\
							<li role="'+_self.role_copy_file+'" class="'+(file['editable'] !== true ? 'disabled' : '')+'"><i class="bx bx-copy"></i> Copy</li>\
							'+(file['ownedByMe'] !== true ? '<li role="'+_self.role_copy_my_drive+'"><i class="bx bx-copy"></i> Copy to My Drive</li>' : '')+'\
							<li role="'+_self.role_download_file+'" class="border-bottom"><i class="bx bx-download"></i> Download</li>\
							<li role="'+_self.role_delete_file+'" class="'+(file['editable'] !== true ? 'disabled' : '')+'"><i class="bx bx-trash"></i> Delete</li>\
						' : '\
							<li role="'+_self.role_restore_file+'"><i class="bx bx-reset"></i> Restore</li>\
							<li role="'+_self.role_delete_forever_file+'"><i class="bx bx-trash"></i> Delete forever</li>\
						')+'\
						</ul>\
					</div>\
				</div>\
			</div>\
		</li>';
	},
	changeBreadcrumb: function(arr_parents){
		let _self = this;
		let parents = arr_parents || this.parents;
		let html = '';
		if(parents){
			parents.forEach(function(parent, i){
				html += '\
				<li data-position="'+i+'" data-id="'+parent['id']+'" data-resourceKey="'+(parent['resourceKey'] ? parent['resourceKey'] : '')+'" title="'+parent['title']+'">\
					<div class="br-item">\
						<span>'+parent['title']+'</span>\
						'+(parent['id'] === _self.getIdFolderByHash() && parent['id'] !== 'trash' && parent['id'] !== "sharedWithMe" && parent['id'] !== "recent" && parent['id'] !== GDrive.rootFolderId ? '\
						<div role="menu_file" class="menu dropdown">\
							<div class="drop-button">\
								<i class="bx bx-dots-vertical"></i>\
							</div>\
							<ul role="'+_self.role_action_file+'" class="drop-menu" data-id="'+parent['id']+'">\
								'+(parent['shortcutDetails'] === null && (parent['ownedByMe'] === true || parent['editable'] === true) ? '<li role="'+_self.role_private_share+'" class="border-bottom"><i class="bx bx-lock"></i> Private share</li>': '')+'\
								<li role="'+_self.role_share_file+'"><i class="bx bx-share-alt"></i> Share</li>\
								<li role="'+_self.role_move_file+'" class="'+(parent['editable'] !== true || !parent['parents'][0] ? 'disabled' : '')+'"><i class="bx bx-transfer"></i> Move</li>\
								<li role="'+_self.role_change_name_file+'" class="'+(parent['editable'] !== true ? 'disabled' : '')+'"><i class="bx bx-edit-alt"></i> Change name</li>\
								<li role="'+_self.role_info_file+'" class="border-top"><i class="bx bx-info-circle"></i> Info</li>\
								<li role="'+_self.role_delete_file+'" class="'+(parent['editable'] !== true ? 'disabled' : '')+'"><i class="bx bx-trash"></i> Delete</li>\
							</ul>\
						</div>\
						' : '')+'\
					</div>\
				</li>';					
			});
		}
		this.div_breadcrumb.html(html);
	},

	browseFolder: function(file){
		if(file === "trash"){
			file = {
				id: 'trash',
				title: 'Trashed',
				iconLink: '',
				resourceKey: this.resourceKey
			};
			this.parents = [
				{id: GDrive.rootFolderId, title: 'My Drive', iconLink: '', resourceKey: this.resourceKey},
				{id: 'trash', title: 'Trash', iconLink: '', resourceKey: this.resourceKey}
			];
		} else if(file === "sharedWithMe"){
			file = {
				id: 'sharedWithMe',
				title: 'Shared With Me',
				iconLink: '',
				resourceKey: this.resourceKey
			};
			this.parents = [
				{id: GDrive.rootFolderId, title: 'My Drive', iconLink: '', resourceKey: this.resourceKey},
				{id: 'sharedWithMe', title: 'Shared with me', iconLink: '', resourceKey: this.resourceKey}
			];
		} else if(file === "recent"){
			file = {
				id: 'recent',
				title: 'Recent',
				iconLink: '',
				resourceKey: this.resourceKey
			};
			this.parents = [
				{id: GDrive.rootFolderId, title: 'My Drive', iconLink: '', resourceKey: this.resourceKey},
				{id: 'recent', title: 'Recent', iconLink: '', resourceKey: this.resourceKey}
			];

		} else if(typeof file === "string"){
			file = this.ALL_FOLDERS.find(function(o){
				return o['id'] === file;
			});
		}

		if(this.parents.length > 0){
			this.changeBreadcrumb();
		} else {
			this.getFullParents(file);
		}

		if(typeof file !== "undefined"){
			if(file['id'] === GDrive.rootFolderId){
				document.location.hash = GDrive.rootFolderId;
				document.title = 'My drive - '+this.currentTitle;
				this.infoFolder = {id: GDrive.rootFolderId, title: "My Drive", iconLink: "", resourceKey: this.resourceKey};
			} else {
				if(file['ownedByMe'] !== true && file['resourceKey'] !== null){
					document.location.hash = file['id']+"?resourceKey="+file['resourceKey'];
				} else {
					document.location.hash = file['id'];
				}
				document.title = file['title'] + ' - '+this.currentTitle;
				this.infoFolder = file;					
			}
			if(file['editable'] !== true){
				$(this.role("menu_create")).find("li").removeClass("disabled").addClass("disabled");
			} else {
				$(this.role("menu_create")).find("li").removeClass("disabled");
			}
		} else {
			document.title = (typeof this.parents[this.parents.length - 1] !== "undefined" ? this.parents[this.parents.length - 1]['title'] + ' - ' : '') +this.currentTitle;
			if(typeof this.parents[this.parents.length - 1] !== "undefined"){
				this.infoFolder = this.parents[this.parents.length - 1];
			} else {
				this.infoFolder = {id: GDrive.rootFolderId, title: "My Drive", iconLink: "", resourceKey: this.resourceKey};
			}
		}

	},
	getFullParents: function(file){
		let _self = this;
		if(!file){
			return false;
		}

		let parents = [file];
		let getParent = function(id){
			let info_parent = _self.ALL_FOLDERS.find(function(o){ return o['id'] === id});
			if(!info_parent){
				GDrive.execute("fileInfo", {
					id: id,
					resourcekey: _self.resourceKey,
					success: function(data){
						parents.push(data);
						if(_self.ALL_FOLDERS.some(function(o){return o['id'] === data['id']}) === false){
							_self.ALL_FOLDERS.push(data);
						}
						if(data['parents'] && data['parents'].length > 0){
							getParent(data['parents'][0]);
						} else {
							parents.reverse();
							_self.parents = parents;
							_self.changeBreadcrumb(parents);	
						}
					}
				});
			} else {
				parents.push(info_parent);
				if(info_parent['parents'] && info_parent['parents'].length > 0){
					getParent(info_parent['parents'][0]);
				} else {
					parents.reverse();
					_self.parents = parents;
					_self.changeBreadcrumb(parents);	
				}
			}


		};
		if(file['parents'][0]){
			getParent(file['parents'][0]);
		} else {
			_self.parents = parents;
			_self.changeBreadcrumb(parents);
		}
		
		return _self.parents;
	},
	fix_css_grid: function(files = null, folders = null){
		var _self = this;

		if(files === null){
			files = _self.DATA_FILES.filter(function(o) {
				return _self.isFile(o);
			}).length;
		}

		if(folders === null){
			folders = _self.DATA_FILES.filter(function(o) {
				return _self.isFolder(o);
			}).length;
		}

		if(_self.css_append_file !== null){
			_self.css_append_file.remove();
			_self.css_append_file = null;
		}
		if(_self.css_append_folder !== null){
			_self.css_append_folder.remove();
			_self.css_append_folder = null;
		}

		if(folders < 5){
			_self.css_append_folder = $('\
				<style>\
					.drive-list ul'+_self.role(_self.role_list_folders)+'.grid {\
						grid-template-columns: repeat(auto-fit, minmax(100px, 240px));\
					}\
				</style>');
			$("body").append(_self.css_append_folder);
		}
		
		if(files < 5){
			_self.css_append_file = $('\
				<style>\
					.drive-list ul'+_self.role(_self.role_list_files)+'.grid {\
						grid-template-columns: repeat(auto-fit, minmax(100px, 240px));\
					}\
				</style>');
			$("body").append(_self.css_append_file);
		}
	},
	autoReload: true,
	getFolder: function(id_folder, trash = false, keyword = null, sharedWithMe = false, recent = false){
		var _self = this;

		addScreenLoading(_self.div_list_item, "fixed_loading");
		let query = [
			"trashed="+trash
		];
		if(trash === true){
			query.push("explicitlyTrashed=true");
		}
		if(keyword){
			query.push("title contains '"+keyword+"'");
		}
		if(sharedWithMe !== false){
			query.push("sharedWithMe=true");
		}

		_self.DATA_FILES = [];
		var isLoadPage = true;
		var nextPageToken = null;

		let total_folder = 0;
		let total_file = 0;


		let load_folder = function(){
			GDrive.execute("listFiles", {
				id: id_folder,
				resourcekey: _self.resourceKey,
				maxResults: 100,
				loadFull: false,
				nextPageToken: nextPageToken,
				orderBy: (recent !== false ? 'lastViewedByMeDate desc' : 'folder,title_natural'),
				q: query,
				success: function(data, next_page_token){

					if(nextPageToken === null){

						_self.div_list_item.html("");

						if(data.length < 1){
							removeScreenLoading(_self.div_list_item);
							return _self.isEmptyFolder(true, keyword ? "No result is found" : null);
						} else {
							_self.isEmptyFolder(false);
						}					
					}

					let folders = data.filter(function(o) {
						return _self.isFolder(o);
					});

					folders.forEach(function(folder){
					    if(!_self.ALL_FOLDERS.some(function(o){ return o.id === folder['id'];})){
					    	_self.ALL_FOLDERS.push(folder);
					    }
					});

					let files = data.filter(function(o) {
						return _self.isFile(o);
					});


					_self.DATA_FILES = _self.DATA_FILES.concat(data);
					_self.setTotalItem(_self.DATA_FILES.length);

					total_folder += folders.length;
					total_file += files.length;

					let htmlFolders = [];
					let htmlFiles = [];
					if(folders.length > 0){
						if($(_self.role(_self.role_list_folders)).length < 1){
							_self.div_list_item.prepend(_self._htmlDivListFolders());
						}
						folders.forEach(function(folder){
							htmlFolders.push(_self._htmlFolder(folder, trash));
						});
					}

					if(files.length > 0){
						if($(_self.role(_self.role_list_files)).length < 1){
							_self.div_list_item.append(_self._htmlDivListFiles());
						}
						files.forEach(function(file){
							htmlFiles.push(_self._htmlFile(file, trash));
						});
					}


					$(_self.role(_self.role_list_folders)).append(htmlFolders.join(''));
					$(_self.role(_self.role_list_files)).append(htmlFiles.join(''));

					if(_self.DATA_FILES.length > 0){
						_self.div_list_item.prepend('\
							<div class="change-view">\
								<div class="change-to-list" title="list view">\
									<i class="bx bx-list-ul"></i>\
								</div>\
								<div class="change-to-grid" title="grid view">\
									<i class="bx bx-grid"></i>\
								</div>\
							</div>\
						');
					}

					_self.fix_css_grid(total_file, total_folder);

					removeScreenLoading(_self.div_list_item);
					_self._resetLazyImage();

					isLoadPage = false;
					nextPageToken = next_page_token;
					_self.autoReload = true;
				},
				error: function(response){
					isLoadPage = false;
					$.niceToast.clear();
					$.niceToast.error('<strong>Error</strong>: '+response.error['message'], {
						timeout: 3000
					});
					removeScreenLoading(_self.div_list_item);

					if(_self.DATA_FILES.length < 1){
						_self.isEmptyFolder(true);	
					}
								
					if(response.error.code === 401 && nextPageToken === null && _self.autoReload === true){
            			GDrive.execute("refreshToken", {
            				success: function(){
            					_self.getFolder(id_folder, trash, keyword, sharedWithMe, recent);
            				},
            				error: function(){
            					_self.autoReload = false;
            				}
            			});
					}
				}
			});
		};
		load_folder();


		/////////////////// more loading ///////////////////////
		$("#"+_self.div_scroll_view).off("scroll");
		$("#"+_self.div_scroll_view).on("scroll", function() {
			var element = event.target;
			if (element.scrollHeight - element.scrollTop - 1 <= element.clientHeight){
				if(nextPageToken !== null && isLoadPage === false && _self.DATA_FILES.length > 0){
					isLoadPage = true;
					addScreenLoading(_self.div_list_item);
					load_folder();
				}
			}
		});

		/////////////////// load folder in click ///////////////////////
		$(document).off("click.folder");
		$(document).on("click.folder", ".txt > a", function(e){
			e.preventDefault();
			$(this).parents(_self.role(_self.role_folder)).click();
			return false;
		});
		$(document).on("click.folder", _self.role(_self.role_folder),  function(e){
			if(trash !== false){
				$(this).find("input"+_self.role("selected")).click();
				return false;
			}

			let file = _self._getDataFileById($(this).data("id"));
			if(file === undefined){
				return false;
			}
			if(file['shortcutDetails'] === null){
				_self.infoFolder = file;
				_self.parents = [];
				document.location.hash = file['id'] + (file['resourceKey'] && file['ownedByMe'] !== true ? '?resourcekey='+file['resourceKey'] : '');
			} else {
				_self.getInfoFolder(file['shortcutDetails']['targetId'], (file['shortcutDetails']['targetResourceKey'] || null));
				document.location.hash = file['shortcutDetails']['targetId'] + (file['shortcutDetails']['targetResourceKey'] ? '?resourcekey='+file['shortcutDetails']['targetResourceKey'] : '');
			}
		});

	},

	addPreviewFile: function(file, hideClose = false){
		var _self = this;
		if(!file){
			return false;
		}

		if(file['shortcutDetails'] !== null){
			window.open(file['alternateLink'], '_blank');
			return;
		}

		$.niceToast.clear();

		let files = _self.DATA_FILES.filter(function(o) {
			return _self.isFile(o) && o['shortcutDetails'] === null;
		});

		let position = files.map(function(o) {
			return o.id;
		}).indexOf(file['id']);


		if($("body").find("#previewFile").length < 1){
			$("body").append('\
				<div id="previewFile" class="previewFile">\
					<div class="previewHeader">\
						'+(hideClose === false ? '\
						<div role="esc_previewfile" class="back">\
							<i class="bx bx-arrow-back"></i>\
						</div>\
						' : '')+'\
						<div class="icon"><img role="icon_preview" src="'+_self._changeSizeIconLink(file['iconLink'], 16)+'"></div>\
						<div role="name_preview" class="name">'+file['title']+'</div>\
						<div role="download_file" class="download">\
							<i class="bx bx-download"></i>\
						</div>\
					</div>\
					<div class="previewContent">\
						<div id="preview-loading" class="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>\
						<div id="preview-file">\
						</div>\
						<button role="pre_preview" class="btn button-icon btn-pre">\
							<i class="bx bx-chevron-left"></i>\
						</button>\
						<button role="next_preview" class="btn button-icon btn-next">\
							<i class="bx bx-chevron-right"></i>\
						</button>\
					</div>\
				</div>\
			');
		} else {
			$("#preview-loading").show();
			$("#preview-file").html("");
			$(_self.role("icon_preview")).attr("src", _self._changeSizeIconLink(file['iconLink'], 16));
			$(_self.role("name_preview")).html(file['title']);
		}


		var iviewer = {};

		let update_button = function(object){

			if(object.targetScale > object.settings.scaleMin){
				$(_self.role("zoom-out")).removeClass("disabled");
			} else {
				$(_self.role("zoom-out")).removeClass("disabled").addClass("disabled");
			}

			if(object.targetScale != 1 && object.targetScale != 0){
				$(_self.role("zoom-reset")).removeClass("disabled");
			} else {
				$(_self.role("zoom-reset")).removeClass("disabled").addClass("disabled");
			}

			if(object.targetScale >= object.settings.scaleMax){
				$(_self.role("zoom-in")).removeClass("disabled").addClass("disabled");
			} else {
				$(_self.role("zoom-in")).removeClass("disabled");
			}
		}
		let create_image = function(){
			$("#preview-file").html('<div id="viewer_image"></div>\
				<div class="zoom-bar" style="display: none">\
					<span role="zoom-out" class="zoom-out disabled"><i class="bx bx-minus"></i></span>\
					<span role="zoom-reset" class="zoom-reset disabled"><i class="bx bx-zoom-out"></i></span>\
					<span role="zoom-in" class="zoom-in"><i class="bx bx-plus"></i></span>\
				</div>\
			');

			$("#viewer_image").imgZoom({
				src: _self._getThumbnailById(file, 's0'),
				scaleDifference: 0.5,
				scaleMax: 5,
				scaleMin: 1,
				transitionDuration: 200,
				doubleclickDelay: 300,
				initCallback: function(){
					iviewer = this;
				},
				onFinishLoad: function(){
					$("#preview-loading").hide();
					$(".zoom-bar").show();
					this.img_object.object.show();
					iviewer.scaleMax = Math.round(this.img_object.naturalHeight / this.img_object.height);
					update_button(this);
				},
				onErrorLoad: function(){
					no_preview();
				},
				onZoom: function(zoom){
					update_button(this);
				},
				onClick: function(){
					$(".previewContent").click();
				},
				onSwipe: function(swipe){
					if(swipe === "left"){
						$(_self.role("next_preview")).click();
					} else if(swipe === "right"){
						$(_self.role("pre_preview")).click();
					}
				}
			});
		};

		let no_preview = function(){
			$("#preview-file").html('\
				<div class="no-preview">\
					<div class="title">There are no previews yet</div>\
					<div class="action">\
						<div role="download_file" class="download"><i class="bx bx-download"></i> Download ('+_self._sizeFormat(file['size'])+')</div>\
					</div>\
				</div>\
			');
			$("#preview-loading").hide();
		};

		let iframe = function(){
			$("#preview-file").html('<iframe id="preview-iframe" src="' + file['embedLink'] + '" allowtrancparency="yes" allowfullscreen="yes"></iframe>');
			$("#preview-iframe").on("load", function(){
				$("#preview-loading").hide();
			}).on('error', function() {
				no_preview();
			});			
		}


		let regex = /^(image|video|audio)\/(.*?)$/gis;
		if(file['mimeType'].match(regex)){
			let mimeType = regex.exec(file['mimeType']);

			var extension_image = ['image/jpg', 'image/jpe', 'image/jpeg', 'image/jfif', 'image/png', 'image/bmp', 'image/dib', 'image/gif'];
			if(extension_image.indexOf(file['mimeType']) > -1){
				create_image();
			} else if(mimeType[1] === "video"){
				if(_self._getShare(file)){
					iframe();
				} else {
					$("#preview-loading").hide();
					$("#preview-file").html('<video src="'+_Config['url_stream']+'/'+file['id']+'" controls></video>');
				}
			} else if(mimeType[1] === "audio"){
				if(_self._getShare(file)){
					iframe();
				} else {
					$("#preview-loading").hide();
					$("#preview-file").html('<audio src="'+_Config['url_stream']+'/'+file['id']+'" controls></audio>');
				}
			} else {
				no_preview();
			}
		} else {
			if(_self._getShare(file)){
				iframe();
			} else {
				no_preview();
			}
		}

		if(typeof files[(position - 1)] !== "undefined"){
			$("body").find(_self.role("pre_preview")).css("opacity", 1);
		} else {
			$("body").find(_self.role("pre_preview")).css("opacity", 0);
		}

		if(typeof files[(position + 1)] !== "undefined"){
			$("body").find(_self.role("next_preview")).css("opacity", 1);
		} else {
			$("body").find(_self.role("next_preview")).css("opacity", 0);
		}

		$(document).off('click.previewFile');

		$(document).on("click.previewFile", ".zoom-bar span", function(e){
			e.stopPropagation();

			switch($(this).attr("role")){
				case "zoom-out":
					if(iviewer.targetScale > iviewer.settings.scaleMin){
						iviewer.setZoom(-1);
					}
				break;

				case "zoom-in":
					if(iviewer.targetScale < iviewer.settings.scaleMax){
						iviewer.setZoom(1);
					}
				break;

				case "zoom-reset":
					if(iviewer.targetScale != 1){
						iviewer.fit();
					}
				break;
			}

			update_button(iviewer);
		});



		$(document).on("click.previewFile", _self.role("esc_previewfile"), function(e){
			e.stopPropagation();
			$(document).off("swiped");
			_self.removePreviewFile();
		});

		$(document).on("click.previewFile", _self.role("download_file"), function(e){
			e.stopPropagation();
			_self.actionDownload(file);
		});

		$(document).on("click.previewFile", _self.role("pre_preview"), function(e){
			e.stopPropagation();
			if(typeof files[(position - 1)] !== "undefined"){
				_self.addPreviewFile(files[(position - 1)]);
			}
		});

		$(document).on("click.previewFile", _self.role("next_preview"), function(e){
			e.stopPropagation();
			if(typeof files[(position + 1)] !== "undefined"){
				_self.addPreviewFile(files[(position + 1)]);
			}
		});


		$(document).on("click.previewFile", ".previewContent", function(e){
			$(_self.role("pre_preview")+", "+_self.role("next_preview")).toggle();
			$(".previewHeader").toggle();
			$(".zoom-bar").toggle();
		});

		$(document).off("swiped");
		$(document).on('swiped', "#previewFile", function(e) {
			let swipe = e.detail.dir;

			if(swipe === "left"){
				$(_self.role("next_preview")).click();
			} else if(swipe === "right"){
				$(_self.role("pre_preview")).click();
			}

		});


		$(document).off('keyup.previewFile'); 
	    $(document).bind("keyup.previewFile", function (e) {
	        if (e.which == 37)
	            $(_self.role("pre_preview")).click();
	    });
	    $(document).bind("keyup.previewFile", function (e) {
	        if (e.which == 39)
	            $(_self.role("next_preview")).click();
	    });
        $(document).on("keyup.previewFile", function (e) {
            if (e.which == 27){
                _self.removePreviewFile();
            }
        });
        $(window).off("navigate.previewFile");
		$(window).on("navigate.previewFile", function (event, data) {
			var direction = data.state.direction;
			if (direction == 'back') {
				_self.removePreviewFile();
			}
			return false;
		});

	},
	removePreviewFile: function(){
		if($("body").find("#previewFile").length > 0){
			$("#previewFile").remove();	
		}
	},
	_sizeFormat: function(size = 0){
	    let sizes = ['B', 'KB', 'MB', 'GB'];
	    let count = 0;
	    if (size < 1024) {
	        return size + " " + sizes[count];
	    } else {
	        while (size > 1024){
	            size = Math.round(size / 1024, 2);
	            count++;
	        }
	        return size + " " + sizes[count];
	    }
	},
	_findDataBy: function(data, column, find){
		return data.some(function(o, p){
			return o[column] === find;
		});
	},
	_addDataFolder: function(folder){
		var _self = this;

		if(typeof folder !== "object"){
			return false;
		}

		let folders = _self.DATA_FILES.filter(function(o) {
			return _self.isFolder(o);
		});

		let last_position;

		if(typeof folders[folders.length - 1] === "undefined"){
			last_position = -1;
		} else {
			last_position = _self.DATA_FILES.map(function(o) {
				return o.id;
			}).indexOf(folders[folders.length - 1]['id']);			
		}

		_self.DATA_FILES.splice((last_position + 1), 0, folder);
		_self.setTotalItem(_self.DATA_FILES.length);
	},
	_addDataFile: function(file){
		var _self = this;

		if(typeof file !== "object"){
			return false;
		}

		let files = _self.DATA_FILES.filter(function(o) {
			return _self.isFile(o);
		});

		let first_position;
		if(typeof files[0] === "undefined"){
			first_position = 0;
		} else {
			let first_position = _self.DATA_FILES.map(function(o) {
				return o.id;
			}).indexOf(files[0]['id']);			
		}

		_self.DATA_FILES.splice(first_position, 0, file);
		_self.setTotalItem(_self.DATA_FILES.length);
	},
	_removeData: function(position){
		var _self = this;

		if(Array.isArray(position) === true){
			position.forEach(function(file){
				_self._removeData(file);
			});
			return true;
		}

		if(typeof position === "object"){
			position = _self.DATA_FILES.map(function(o) {
				return o.id;
			}).indexOf(position['id']);
		}

		if(typeof _self.DATA_FILES[position] === "undefined"){
			return false;
		}

		_self.DATA_FILES.splice(position, 1);
		if(_self.DATA_FILES.length < 1){
			_self.isEmptyFolder(true);
		}
		_self.setTotalItem(_self.DATA_FILES.length);
	},
	_addData: function(position, file){
		var _self = this;

		if(typeof file !== "object" || position < 0){
			return false;
		}

		_self.DATA_FILES.splice(position, 0, file);
		_self.setTotalItem(_self.DATA_FILES.length);
	},
	_unSelected: function(){
		$('#checkAll').prop('checked', false);
		$("input"+this.role("selected")+":checked").each(function(){
			$(this).prop('checked', false);
		});
		$(this.role("select_count")).html('0');
		$(this.role("tool_action")).removeClass("disabled").addClass("disabled");
		this.selected_file = [];
	},
	actionCopy: function(files, parent, copy_to_my_drive = false, target, changeName = true){
		let _self = this;
		if(typeof files !== "object"){
			return false;
		}

		files = files.filter(function(o) {
			return _self.isFile(o);
		});

		if(files.length < 1){
			return false;
		}

		let resourceKey = _self.resourceKey;

		if(parent && typeof parent === "object"){
			resourceKey = parent['resourceKey'];
			parent = parent['parent'];
		}

		let insert;
		$.niceToast.clear();
		let toast = $.niceToast(files.length > 1 ? 'Creating copy '+files.length+' selected...' : 'Creating copy \''+files[0]['title']+'\'...');
		
		if(target){
			addScreenLoading(target);
		} else {
			addScreenLoading(_self.div_list_item, "fixed_loading");
		}

		GDrive.execute("copyMultiple", {
			files: files,
			parent: parent || null,
			changeName: changeName,
			resourcekey: resourceKey,
			success: function(new_file){
				if(target){
					removeScreenLoading(target);
				} else {
					removeScreenLoading(_self.div_list_item);
				}

				if(copy_to_my_drive === false){
					if($(_self.role(_self.role_list_files)).length < 1){
						_self.isEmptyFolder(false);
						_self.div_list_item.append(_self._htmlDivListFiles());
					}
					if(new_file.length > 1){
						new_file.forEach(function(newFile){
							insert = $(_self._htmlFile(newFile));
							insert.addClass("selected");
							_self.div_list_item.find(_self.role(_self.role_list_files)).prepend(insert);
							_self._addDataFile(newFile);
						});
						_self._resetLazyImage();
						toast.change('Created '+new_file.length+' files. <span role="undo_copy" class="action">Undo</span>');

					} else {
						toast.change('Created \''+new_file[0]['title']+'\'. <span role="undo_copy" class="action">Undo</span>');
						insert = $(_self._htmlFile(new_file[0]));
						insert.addClass("selected");
						_self.div_list_item.find(_self.role(_self.role_list_files)).prepend(insert);
						_self._addDataFile(new_file[0]);
						_self._resetLazyImage();				
					}
					_self.fix_css_grid();
				} else {
					toast.change('Copied to \'My Drive\' successfully. <span role="undo_copy" class="action">Undo</span>');
				}

				$(document).off("click.undo");
				$(document).on("click.undo", _self.role("undo_copy"), function(){
					_self.actionDelete(new_file);
					_self._unSelected();
				});
			},
			error: function(response){
				response = Array.isArray(response) ? response[0] : response;
				$.niceToast.clear();
				$.niceToast.error('<strong>Error</strong>: '+response.error['message']);
				if(target){
					removeScreenLoading(target);
				} else {
					removeScreenLoading(_self.div_list_item);
				}
			}
		});
	},
	insertNewFolder: function(new_folder){
		let _self = this;
		if(typeof new_folder === "undefined"){
			return false;
		}

		let insert = $(_self._htmlFolder(new_folder));
		insert.addClass("selected");
		if($(_self.role(_self.role_list_folders)).length < 1){
			_self.isEmptyFolder(false);
			_self.div_list_item.prepend(_self._htmlDivListFolders());
		}
		_self.div_list_item.find(_self.role(_self.role_list_folders)).prepend(insert);
		_self._addDataFolder(new_folder);
		_self.fix_css_grid();
	},
	actionCreateFolder: function(name, parent, callback_success, callback_error){
		let _self = this;
		if(name === null){
			return false;
		}
		GDrive.execute("createFolder", {
			name: name,
			resourcekey: _self.resourceKey,
			parent: parent || null,
			success: function(new_folder){
				_self.ALL_FOLDERS.push(new_folder);	
				if(callback_success){
					callback_success(new_folder);
				}
			},
			error: function(response){
				if(callback_error){
					callback_error(response);
				}
			}
		});
	},
	actionCreateShortCut: function(file, parent, callback_success, callback_error){
		let _self = this;
		if(typeof file !== "object"){
			return false;
		}

		GDrive.execute("createShortCut", {
			file: file,
			resourcekey: _self.resourceKey,
			parent: parent || null,
			success: function(new_shortcut){

				$.niceToast.clear();
				$.niceToast('Created shortcut \''+file['title']+'\'', {
					timeout: 6000
				});

				let insert;
				if(_self.isFolder(new_shortcut)){
					insert = $(_self._htmlFolder(new_shortcut)).addClass("selected");

					if($(_self.role(_self.role_list_folders)).length < 1){
						_self.isEmptyFolder(false);
						_self.div_list_item.prepend(_self._htmlDivListFolders());
					}
					_self.div_list_item.find(_self.role(_self.role_list_folders)).prepend(insert);
					_self._addDataFolder(new_shortcut);
				} else {
					insert = $(_self._htmlFile(new_shortcut)).addClass("selected");

					if($(_self.role(_self.role_list_files)).length < 1){
						_self.isEmptyFolder(false);
						_self.div_list_item.prepend(_self._htmlDivListFiles());
					}
					_self.div_list_item.find(_self.role(_self.role_list_files)).prepend(insert);
					_self._addDataFile(new_shortcut);
				}

				_self.fix_css_grid();
				if(callback_success){
					callback_success();
				}
			},
			error: function(response){
				if(callback_error){
					callback_error(response);
				}
				$.niceToast.clear();
				$.niceToast.error('<strong>Error</strong>: '+response.error['message']);
			}
		});
	},
	actionChangeName: function(new_name, file, old_name){
		let _self = this;
		if(typeof file !== "object" || new_name === null){
			return false;
		}
		old_name = old_name || file['title'];

		if(new_name === old_name){
			return false;
		}

		addScreenLoading(_self.div_list_item, "fixed_loading");
		GDrive.execute("rename", {
			file: file,
			resourcekey: _self.resourceKey,
			name: new_name,
			success: function(){
				removeScreenLoading(_self.div_list_item);
				$.niceToast.clear();
				$.niceToast('Changed name '+(_self.isFolder(file) ? 'folder' : 'file')+' \''+old_name+'\' to \''+new_name+'\'.<span role="undo_rename" class="action">Undo</span>', {
					timeout: 10000
				});
				file['title'] = new_name;

				_self.div_list_item.find("li."+_self.class_file+"[data-id="+file['id']+"]").find(".file-info .txt > a").html(new_name);

				if(file['id'] === _self.getIdFolderByHash()){
					_self.div_breadcrumb.find("li[data-id="+file['id']+"]").find(".br-item > span").html(new_name);
					let parent_breadcumb = _self.parents.find(function(o){
						return o['id'] === file['id'];
					});
					let parent_folder = _self.ALL_FOLDERS.find(function(o){
						return o['id'] === file['id'];
					});
					if(parent_breadcumb){
						parent_breadcumb['title'] = new_name;
					}
					if(parent_folder){
						parent_folder['title'] = new_name;
					}
					_self.browseFolder(file);
				}
				
				$(document).off("click.undo");
				$(document).on("click.undo", _self.role("undo_rename"), function(){
					_self.actionChangeName(old_name, file, new_name);
				});
			},
			error: function(response){
				$.niceToast.clear();
				$.niceToast.error('<strong>Error</strong>: '+response.error['message']);
				removeScreenLoading(_self.div_list_item);
			}
		});
	},

	downloadFile: function(file){
		var _self = this;
		if(typeof file !== "object"){
			return false;
		}

		var htmlForm = '\
			<div id="dialogForm" class="downloadFile">\
				<div class="image">\
					<img class="lazy" referrerpolicy="no-referrer" data-src="'+_self._getThumbnailById(file)+'" src="'+_self._changeSizeIconLink(file['iconLink'], 128)+'">\
				</div>\
				<div class="info">\
					<div class="title">'+file['title']+'</div>\
					<div class="size">'+_self._sizeFormat(file['size'])+'</div>\
			        <div class="progress">\
			            <p role="txt-downloading" class="counter">0%</p>\
			            <div role="bar-downloading" class="bar"></div>\
			        </div>\
			        <div class="size_bar">\
			        	<small>Downloading: </small><span role="mb_load">0 B</span> <span role="speed_download"></span>\
			        </div>\
				</div>\
			</div>';

	    var downloaded = 0;
	    var downloadTimer;
	    var downSpeed = 0;
	    var lastDownTime = 0;

		$.sendConfirm({
			content: htmlForm,
			hideHeader: true,
			hideClose: true,
			button: {
				confirm: 'Save',
				cancel: 'Cancel'
			},
			isFixed: true,
			bgHide: false,
			callback: function(){
				$(".j_dialogConfirm").addClass("disabled");
				GDrive.execute("download", {
					file: file,
					success: function(Blob){
						$(".j_dialogConfirm").removeClass("disabled");
					},
					error: function(response){
						$.niceToast.clear();
						$.niceToast.error("An error occurred. Please try again in a few minutes!");
					},
					progress: function(event){
						let total = event.total <= 0 ? file['size'] : event.total;
						let percent = (Math.round(((event.loaded / total) * 100), 0));
	                    var endTime = (new Date()).getTime();
	                    downSpeed = ((event.loaded - downloaded) * 1000) / ((endTime - lastDownTime) * 1024);
	                    downloaded = event.loaded;
	                    lastDownTime = endTime;
	                    $(_self.role("speed_download")).html("("+_self._sizeFormat(Math.round(downSpeed, 0) * 1024)+"/s)");
						$(_self.role("mb_load")).html(_self._sizeFormat(event.loaded));
						$(_self.role("txt-downloading")).html(percent+"%");
                		$(_self.role("bar-downloading")).css({
                			width: percent+'%'
                		});
					}
				});
			},
			onConfirm: function() {
				GDrive.saveOrOpenBlob(file['title']);
				return false;
			},
			onCancel: function() {
				GDrive.blob_download = null;
				GDrive.xhr_download.abort();
			},
			onClose: function() {
				GDrive.blob_download = null;
				GDrive.xhr_download.abort();
			}
		});	

	},
	actionDownload: function(file){
		let _self = this;
		if(typeof file !== "object"){
			return false;
		}

		if(_self._getShare(file) === false || file['canCopy'] === false){
			_self.downloadFile(file);
			return false;
		}

		if(file['webContentLink'] !== null){
			window.open(file['webContentLink'], '_blank');
			//window.location.href = file['webContentLink'];				
		}

	},
	actionDelete: function(files){
		let _self = this;
		if(Array.isArray(files) === false){
			return false;
		}
		addScreenLoading(_self.div_list_item, "fixed_loading");
		GDrive.execute("deleteMultiple", {
			files: files,
			resourcekey: _self.resourceKey,
			success: function(){
				removeScreenLoading(_self.div_list_item);
				$.niceToast.clear();
				$.niceToast(files.length > 1 ? files.length+' selected has been deleted.' : ((_self.isFolder(files[0]) ? 'Folder' : 'File')+' \''+files[0]['title']+'\' has been deleted.'), {
					timeout: 6000
				});

				files.forEach(function(file){
					_self.div_list_item.find("li."+_self.class_file+"[data-id="+file['id']+"]").remove();
					_self._removeData(file);
				});

				_self._unSelected();
			},
			error: function(response){
				response = Array.isArray(response) ? response[0] : response;
				$.niceToast.clear();
				$.niceToast.error('<strong>Error</strong>: '+response.error['message']);
				removeScreenLoading(_self.div_list_item);
			}
		});
	},
	actionTrash: function(files){
		let _self = this;
		if(typeof files !== "object"){
			return false;
		}

		addScreenLoading(_self.div_list_item, "fixed_loading");
		GDrive.execute("trashMultiple", {
			files: Array.isArray(files) === true ? files : [files],
			resourcekey: _self.resourceKey,
			success: function(){
				removeScreenLoading(_self.div_list_item);
				$.niceToast.clear();
				if(Array.isArray(files) === true){
					$.niceToast(files.length+' selected has been moved to the trash.<span role="undo_trash" class="action">Undo</span>', {
						timeout: 6000
					});
					files.forEach(function(file){
						_self.div_list_item.find("li."+_self.class_file+"[data-id="+file['id']+"]").hide();
						_self._removeData(file);
					});
				} else {
					$.niceToast((_self.isFolder(files) ? 'Folder' : 'File')+' has been moved to the trash.<span role="undo_trash" class="action">Undo</span>', {
						timeout: 10000
					});
					_self.div_list_item.find("li."+_self.class_file+"[data-id="+files['id']+"]").hide();
					_self._removeData(files);

					if(files['id'] === _self.getIdFolderByHash()){
						document.location.hash = files['parents'][0] || GDrive.rootFolderId;
					}
				}
				_self._unSelected();
				_self.fix_css_grid();
				
				$(document).off("click.undo");
				$(document).on("click.undo", _self.role("undo_trash"), function(){
					_self.actionUndoTrash(files);
				});
			},
			error: function(response){
				response = Array.isArray(response) ? response[0] : response;
				$.niceToast.clear();
				$.niceToast.error('<strong>Error</strong>: '+response.error['message']);
				removeScreenLoading(_self.div_list_item);
			}
		});
	},
	actionUndoTrash: function(files, restore = false){
		let _self = this;
		if(typeof files !== "object"){
			return false;
		}
		addScreenLoading(_self.div_list_item, "fixed_loading");
		GDrive.execute("untrashMultiple", {
			files: Array.isArray(files) === true ? files : [files],
			resourcekey: _self.resourceKey,
			success: function(){
				removeScreenLoading(_self.div_list_item);
				$.niceToast.clear();
				$.niceToast('Undo successfully!', {
					timeout: 4000
				});

				if(_self.DATA_FILES.length < 1){
					_self.isEmptyFolder(false);
					if(files.some(function(o){ return o['mimeType'] === _self.type_folder}) === true){
						_self.div_list_item.prepend(_self._htmlDivListFolders());
					}
					if(files.some(function(o){ return o['mimeType'] !== _self.type_folder}) === true){
						_self.div_list_item.append(_self._htmlDivListFiles());
					}
				}
				if(Array.isArray(files) === true){
					files.forEach(function(file){
						let element = _self.div_list_item.find("li."+_self.class_file+"[data-id="+file['id']+"]");
						let index = _self.div_list_item.find("li."+_self.class_file).index(element);
						if(restore === false){
							if(element.length > 0){
								element.show();
							} else {
								if(_self.isFolder(file)){
									$(_self.role(_self.role_list_folders)).append(_self._htmlFolder(file));
								} else {
									$(_self.role(_self.role_list_files)).append(_self._htmlFile(file));
								}
								element = _self.div_list_item.find("li."+_self.class_file+"[data-id="+file['id']+"]");
								index = _self.div_list_item.find("li."+_self.class_file).index(element);
							}
							_self._addData(index, file);
						} else {
							element.hide();
							_self._removeData(file);
						}
					});
				} else {
					let element = _self.div_list_item.find("li."+_self.class_file+"[data-id="+files['id']+"]");
					let index = _self.div_list_item.find("li."+_self.class_file).index(element);
					if(restore === false){
						if(element.length > 0){
							element.show();
						} else {
							if(_self.isFolder(file)){
								$(_self.role(_self.role_list_folders)).append(_self._htmlFolder(file));
							} else {
								$(_self.role(_self.role_list_files)).append(_self._htmlFile(file));
							}
							element = _self.div_list_item.find("li."+_self.class_file+"[data-id="+files['id']+"]");
							index = _self.div_list_item.find("li."+_self.class_file).index(element);
						}
						_self._addData(index, files);
					} else {
						element.hide();
						_self._removeData(files);
					}
				}
				_self.fix_css_grid();
			},
			error: function(response){
				response = Array.isArray(response) ? response[0] : response;
				$.niceToast.clear();
				$.niceToast.error('<strong>Error</strong>: '+response.error['message']);
				removeScreenLoading(_self.div_list_item);
			}
		});
	},
	actionMove: function(files, to_folder, target){
		var _self = this;
		if(typeof files !== "object" || typeof to_folder !== "object"){
			return false;
		}

		GDrive.execute("moveMultiple", {
			files: files,
			to_folder: to_folder,
			resourcekey: _self.resourceKey,
			success: function(datas){
				
				datas.forEach(function(file){
					_self.div_list_item.find("li."+_self.class_file+"[data-id="+file['id']+"]").remove();
					_self._removeData(file);
				});

				$.niceToast.clear();
				if(datas.length > 1){
					$.niceToast('Moved '+datas.length+' files to \''+to_folder['title']+'\'.');
				} else {
					$.niceToast('Moved \''+datas[0]['title']+'\' to \''+to_folder['title']+'\'.');
				}

				if(files[0]['id'] === _self.getIdFolderByHash()){
					_self.getInfoFolder(to_folder['id'], _self.resourceKey, function(){
						let parent_folder = _self.ALL_FOLDERS.find(function(o){
							return o['id'] === files[0]['id'];
						});
						let parent_breadcumb = _self.parents.find(function(o){
							return o['id'] === files[0]['id'];
						});
						if(parent_folder){
							parent_folder['parents'][0] = to_folder['id'];							
						}
						if(parent_breadcumb){
							parent_breadcumb['parents'][0] = to_folder['id'];
						}
						document.location.hash = to_folder['id'];
					});
				} else {
					if(target){
						removeScreenLoading(target);
					}
					$.closeDialog();
					_self._unSelected();
				}
			},
			error: function(response){
				response = Array.isArray(response) ? response[0] : response;
				$.niceToast.clear();
				$.niceToast.error(response.error.message);
				if(target){
					removeScreenLoading(target);
				}
			}
		});
	},
	actionEmptyTrash: function(){
		var _self = this;

		addScreenLoading(_self.div_list_item, "fixed_loading");
		GDrive.execute("emptyTrash", {
			success: function(){
				$.niceToast.clear();
				$.niceToast('Successfully empty trash!');
				removeScreenLoading(_self.div_list_item);
				_self._unSelected();
				_self.isEmptyFolder(true);
			},
			error: function(response){
				$.niceToast.clear();
				$.niceToast.error('An error occurred. Please try again in a few minutes!');
				removeScreenLoading(_self.div_list_item);
			}
		});
	},
	getIdFolderByHash: function(){
		var _self = this;
		let hash = window.location.hash.substring(1) || GDrive.rootFolderId;
		let regex = /^(.*?)\?resourcekey=(.*?)$/gis;
		if(hash.match(regex)){
        	let match = regex.exec(hash);
        	_self.resourceKey = match[2];
        	return match[1];
		}
		_self.resourceKey = null;
		return hash;
	},
	getMapFolder: function(files, target){
		var _self = this;
		if(typeof files !== "object"){
			return false;
		}

		let selected_folder = null;
		let id_parent = files[0]['id'] === _self.getIdFolderByHash() ? files[0]['parents'][0] : _self.getIdFolderByHash();
		let map = [];


		let setMapFolder = function(currentFolder, selectId){
			let html = '\
				<div class="mapFolder-header">\
					'+(currentFolder['back'] !== false ? '<button class="btn-back" role="load_map_folder" data-id="'+currentFolder['back']+'"><i class="bx bx-arrow-back"></i></button>' : '')+'\
					<span class="currentFolder">'+currentFolder['name']+'</span>\
				</div>';
				
			let shortcut = '\
				<svg class="short-cut" viewBox="0 0 16 16" fill="none" focusable="false" xmlns="http://www.w3.org/2000/svg" class="a-dn-c" width="16px" height="16px">\
					<circle cx="8" cy="8" r="8" fill="white"></circle>\
					<path d="M10,3H6V4H8.15A5,5,0,0,0,10,13V12A4,4,0,0,1,9,4.65V7h1Z" fill="#5F6368"></path>\
				</svg>';

			if(currentFolder['item'].length > 0){
				html += '<ul class="mapFolder" role="mapFolder">';
				currentFolder['item'].forEach(function(item){
					item = map[item];
					html += '\
					<li data-id="'+item['id']+'" class="'+(_self._findDataBy(files, 'id', item['id']) === true ? 'disabled' : '')+'">\
						<div class="icon">\
							<img src="'+_self._changeSizeIconLink(item['icon'], 32)+'">\
							'+(item['isShortCut'] === true ? shortcut : '')+'\
						</div>\
						<div class="name">'+item['name']+'</div>\
						<div class="open" role="load_map_folder" data-id="'+item['id']+'"><i class="bx bx-chevron-right"></i></div>\
					</li>';
				});
				html += '</ul>';
			} else {
				html += '<div class="empty">Folder is empty.</div>';
			}
			
			html += '<div class="confirm">\
				<div class="txt">'+(files.length > 1 ? '<b>'+files.length+'</b> selected' : files[0]['title'])+'</div>\
				<button role="confirm_move" class="btn move '+(selectId === id_parent ? 'disabled' : '')+'">Move here</button>\
			</div>';
			target.html(html);
		};

		let loadMapFolder = function(id_folder, selectId){
			addScreenLoading(target);

 			if(typeof map[id_folder] !== "undefined" && typeof map[id_folder]['item'] !== "undefined"){
				setMapFolder(map[id_folder], selectId);
				removeScreenLoading(target);
			} else {
				GDrive.execute("fileInfo", {
					id: id_folder,
					resourcekey: _self.resourceKey,
					success: function(infoFile){
						GDrive.execute("listFiles", {
							id: id_folder,
							resourcekey: infoFile['resourceKey'] || _self.resourceKey,
							maxResults: 500,
							loadFull: true,
							fields: "nextPageToken,items(id, title, parents, iconLink, mimeType, shortcutDetails, resourceKey)",
							q: [
								"trashed=false",
								"(mimeType='"+_self.type_folder+"' or mimeType='"+_self.type_shortcut+"')"
							],
							success: function(data){

								data = data.filter(function(o) {
									return _self.isFolder(o, true);
								});

								if(typeof map[infoFile['id']] === "undefined"){
									map[infoFile['id']] = {
										id: infoFile['id'],
										name: infoFile['title'],
										item: [],
										back: infoFile['parents'][0] || false,
										resourceKey: infoFile['resourceKey'] || null,
										icon: infoFile['iconLink'],
										isShortCut: infoFile['shortcutDetails'] !== null ? true : false 
									};
								} else {
									map[infoFile['id']]['item'] = [];
								}

								if(data.length > 0){

									data.forEach(function(file){
										if(map[infoFile['id']]['item'].some(function(o){ return o === file['id']}) === false){
											map[infoFile['id']]['item'].push(file['id']);
										}
										
										if(typeof map[file['id']] === "undefined"){
											map[file['id']] = {
												id: file['id'],
												name: file['title'],
												back: infoFile['id'],
												resourceKey: file['resourceKey'] || null,
												icon: file['iconLink'],
												isShortCut: file['shortcutDetails'] !== null ? true : false 
											};											
										}
									});
								}

								setMapFolder(map[infoFile['id']], selectId);
								removeScreenLoading(target);
							},
							error: function(response){
								removeScreenLoading(target);
							}
						});

					},
					error: function(response){
						$.niceToast.clear();
						$.niceToast.error('<strong>Error</strong>: '+response.error['message']);
						removeScreenLoading(target);
					}
				});
			}
			selected_folder = id_folder;
		};

		loadMapFolder(id_parent, id_parent);


		$(document).off("click.mapFolder");
		$(document).on("click.mapFolder", _self.role("load_map_folder"), function(e){
			e.stopPropagation();
			addScreenLoading(target);
			loadMapFolder($(this).data("id"), $(this).data("id"));
			selected_folder = $(this).data("id");
		});
		$(document).on("click.mapFolder", _self.role("mapFolder")+" li", function(){
			let btn_confirm = target.find(_self.role("confirm_move"));
			if($(this).hasClass("selected")){
				$(this).removeClass("selected");
				btn_confirm.html("Move here");
				if(selected_folder === id_parent){
					btn_confirm.removeClass("disabled").addClass("disabled");
				} else {
					btn_confirm.removeClass("disabled");
				}
			} else {
				btn_confirm.html("Move");
				target.find(_self.role("mapFolder")+" li").removeClass("selected");
				$(this).removeClass("selected").addClass("selected");
				if($(this).data("id") === id_parent || _self._findDataBy(files, 'id', $(this).data("id"))  === true){
					btn_confirm.removeClass("disabled").addClass("disabled");
				} else {
					btn_confirm.removeClass("disabled");
				}
			}
		});
		$(document).on("click.mapFolder", _self.role("confirm_move"), function(){
			let selected = $(_self.role("mapFolder")+" li.selected").data("id") || selected_folder;

			if(id_parent !== selected && selected !== null){
				let info = map[selected];
				addScreenLoading(target);
				_self.actionMove(files, {id: info['id'], title: info['name'], resourceKey: info['resourceKey']}, target);				
			}
		});
	},
	accessMyDrive: function(){
		$(".nav-tabs li").removeClass("selected");
		$(this.role(this.access_myDrive)).addClass("selected");
		$(this.role("tools_mydrive")).show();
		$(this.role("tools_trash")).hide();
	},
	accessTrash: function(){
		$(".nav-tabs li").removeClass("selected");
		$(this.role(this.access_trash)).addClass("selected");
		this.browseFolder('trash');
		$(this.role("tools_mydrive")).hide();
		$(this.role("tools_trash")).show();
	},
	accessSharedWithMe: function(){
		$(".nav-tabs li").removeClass("selected");
		$(this.role(this.access_sharedWithMe)).addClass("selected");
		this.browseFolder('sharedWithMe');
		$(this.role("tools_mydrive")).hide();
		$(this.role("tools_trash")).hide();
	},
	accessRecent: function(){
		$(".nav-tabs li").removeClass("selected");
		$(this.role(this.access_recent)).addClass("selected");
		this.browseFolder('recent');
		$(this.role("tools_mydrive")).show();
		$(this.role("tools_trash")).hide();
	},
	addPermission: function(file, options, target, callback_success, callback_error){
		var _self = this;
		if(typeof file !== "object" || !options.type || !options.role){
			return false;
		}
		if(target){
			addScreenLoading(target);
		}
		let request_opt = {
			file: file,
			resourcekey: _self.resourceKey,
			type: options.type,
			role: options.role,
			success: function(data){
				if(target){
					removeScreenLoading(target);
				}
				if(data['id'] === "anyoneWithLink"){
					_self.div_list_item.find("li."+_self.class_file+"[data-id="+file['id']+"]").find(_self.role(_self.role_share_type)).show();
				}
				
				if(typeof data['name'] === "undefined"){
					data['name'] = data['displayName'];
				}
				file['permissions'].push(data);

				if(callback_success){
					callback_success(data);
				}

				_self._resetLazyImage();

			},
			error: function(response){

				if(typeof response['error'] !== "undefined"){
	            	if(response['error']['errors'][0]['reason'] === "authError"){

            			GDrive.execute("refreshToken", {
            				success: function(){
            					_self.addPermission(file, options, target, callback_success, callback_error);
            				},
            				error: function(){
								if(target){
									removeScreenLoading(target);
								}
								if(callback_error){
									callback_error(response);
								}
            				}
            			});
	            	}
	            }
			}
		};
	    if(options.withLink){
	        Object.assign(request_opt, {withLink: options.withLink});
	    }
	    if(options.emailAddress){
	        Object.assign(request_opt, {emailAddress: options.emailAddress});
	    }
	    $.niceToast.clear();
		GDrive.execute("addPermission", request_opt);
	},
	updatePermission: function(file, options, target, callback_success, callback_error){
		var _self = this;
		if(typeof file !== "object" || !options.id){
			return false;
		}
		if(target){
			addScreenLoading(target);
		}
		let request_opt = {
			id: options.id,
			resourcekey: _self.resourceKey,
			file: file,
			success: function(data){
				if(target){
					removeScreenLoading(target);
				}
				let index_anyoneWithLink = file['permissions'].map(function(o) {
					return o.id;
				}).indexOf(options.id);
				file['permissions'][index_anyoneWithLink] = data;
				$.niceToast('Access have been updated', {
					timeout: 3000
				});
				if(callback_success){
					callback_success(data);
				}
			},
			error: function(response){
				if(target){
					removeScreenLoading(target);
				}
				if(callback_error){
					callback_error(response);
				}
				$.niceToast.error('<strong>Error</strong>: '+response.error['message']);
			}
		};
	    if(options.type){
	        Object.assign(request_opt, {type: options.type});
	    }
	    if(options.role){
	        Object.assign(request_opt, {role: options.role});
	    }
	    if(options.withLink){
	        Object.assign(request_opt, {withLink: options.withLink});
	    }
	    if(options.emailAddress){
	        Object.assign(request_opt, {emailAddress: options.emailAddress});
	    }
	    $.niceToast.clear();
		GDrive.execute("updatePermission", request_opt);
	},
	deletePermission: function(file, id_permission, target, callback_success, callback_error){
		var _self = this;
		if(typeof file !== "object" || !id_permission){
			return false;
		}
		if(target){
			addScreenLoading(target);
		}
		$.niceToast.clear();
		GDrive.execute("deletePermission", {
			file: file,
			resourcekey: _self.resourceKey,
			id: id_permission,
			success: function(data){
				if(target){
					removeScreenLoading(target);
				}
				if(id_permission === "anyoneWithLink"){
					_self.div_list_item.find("li."+_self.class_file+"[data-id="+file['id']+"]").find(_self.role(_self.role_share_type)).hide();
				}
				
				file['permissions'] = file['permissions'].filter(function(o){
					return o['id'] !== id_permission;
				});
				$.niceToast('Access have been updated', {
					timeout: 3000
				});
				if(callback_success){
					callback_success(data);
				}
			},
			error: function(response){
				if(target){
					removeScreenLoading(target);
				}
				if(callback_error){
					callback_error(response);
				}
				$.niceToast.error('<strong>Error</strong>: '+response.error['message']);
			}
		});
	},
	_htmlUploadBox: function(show = true){
		return '<div role="'+this.role_uploading_box+'" class="upload-box '+(show ? 'show' : '')+'">\
			<div class="header-box">\
				<div role="'+this.role_uploading_title+'" class="title"></div>\
				<div class="icon">\
					<button role="hidden-upload" class="show">\
						<i class="bx bx-chevron-'+(show ? 'down' : 'up')+'"></i>\
					</button>\
					<button role="close-upload">\
						<i class="bx bx-x"></i>\
					</button>\
				</div>\
			</div>\
			<div role="'+this.role_uploading_notify+'" class="notify">\
				<div class="text"></div>\
				<div class="cancel">Cancel</div>\
				<div class="retry">ReTry</div>\
			</div>\
			<div role="'+this.role_uploading_body+'" class="body-box">\
			</div>\
		</div>';
	},
	_htmlUploadItem: function(file, id_progress, status){
		if(typeof file !== "object"){
			return "";
		}
		let item = $('\
			<div class="item-box" data-progressUpload="'+id_progress+'">\
				<div class="icon">\
					<img src="//drive-thirdparty.googleusercontent.com/16/type/'+file['type']+'">\
				</div>\
				<div class="text">\
					<div title="'+file['name']+'">'+file['name']+'</div>\
					'+(file['rawPath'] ? '<div class="folder" title="'+file['rawPath']+'"><i class="bx bxs-folder"></i>'+file['rawPath']+'</div>' : '')+'\
				</div>\
				<div class="align-right">\
					<div class="desc"></div>\
					<div class="action '+status.replace('error', 'cancel')+'">\
						<div class="uploading-bar">\
							<div class="percent">\
								<svg>\
									<circle cx="20" cy="20" r="20"></circle>\
									<circle cx="20" cy="20" r="20"></circle>\
								</svg>\
								<div class="number">\
									0<span>%</span>\
								</div>\
							</div>\
							<div role="'+this.role_cancel_upload+'" class="cancel-upload">\
								<i class="bx bx-x"></i>\
							</div>\
						</div>\
						<svg class="svg-complete" width="24px" height="24px" viewBox="0 0 24 24" fill="#0F9D58">\
							<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>\
						</svg>\
						<div class="retry">\
						    <span class="error">\
						        <i class="bx bxs-error-circle"></i>\
						    </span>\
						    <span role="'+this.role_retry_upload+'" class="try">\
						        <i class="bx bx-revision"></i>\
						    </span>\
						</div>\
					</div>\
				</div>\
			</div>');
		this.updateProgressUploadBar(item);
		return item[0].outerHTML;
	},
	showUploading: function(html_upload_items){
		var _self = this;
		if(html_upload_items.length < 1){
			return;
		}

		if($(_self.role(_self.role_uploading_box)).length < 1){
			$("body").append(_self._htmlUploadBox(true));
		} else {
			$(_self.role(_self.role_uploading_notify)).show();
		}
		$(_self.role(_self.role_uploading_body)).prepend(html_upload_items.reverse().join(""));
		$(_self.role(_self.role_uploading_title)).html('Uploading '+_self.upload.length+' files');
	},
	updateProgressUploadBar: function(bar, percent = null){
		let upload_box = bar.find(".uploading-bar");
		let circle = upload_box.find("svg circle");
		let strokeDasharray = circle.eq(1).attr("r") * 2 * Math.PI;
		if(percent === null){
			circle.attr({
				'stroke-dasharray': strokeDasharray,
				'stroke-dashoffset': strokeDasharray
			});			
		} else {
			upload_box.find(".number").html(percent+'<span>%</span>');
			circle.eq(1).attr({
				'stroke-dashoffset': strokeDasharray - percent / 100 * strokeDasharray
			});
		}


	},

	drive_id_upload: null,
	access_token_upload: null,
	start_upload: function(){
		var _self = this;

		let pending_list = _self.upload.filter(function(o){
			return o['status'] === "pending";
		});

        let title = $(_self.role(_self.role_uploading_title));
        let notify = $(_self.role(_self.role_uploading_notify));

		if(pending_list.length < 1){
			let error_cancel_list = _self.upload.filter(function(o){
				return o['status'] === "error" || o['status'] === "cancel";
			});
			let complete_list = _self.upload.filter(function(o){
				return o['status'] === "complete";
			});

			title.html("Upload complete "+complete_list.length+" items");
			if(complete_list.length >= _self.upload.length){
				_self.drive_id_upload = null;
				_self.access_token_upload = null;
				_self.auto_upload_multiple_drive = false;
				notify.hide();
			} else {
		        notify.find(".text").html(error_cancel_list.length+" items not uploaded yet");
		        notify.find(".cancel").hide();
		        notify.find(".retry").show();
				notify.show();
			}
			_self.auto_upload_multiple_drive = false;
			_self.isUploading = false;
			return;
		}

		let _file = pending_list[0];
		_self.isUploading = true;

        let id_progress = _file['id_progress'];
        let data_file = _file['file'];


        let item_box = $(_self.role(_self.role_uploading_body)).find(".item-box[data-progressUpload="+id_progress+"]");


        if(item_box){
        	let scrollTo = $(_self.role(_self.role_uploading_body)).scrollTop() + (item_box.position().top - $(_self.role(_self.role_uploading_body)).position().top) - ($(_self.role(_self.role_uploading_body)).height()/2) + (item_box.height()/2);
		    $(_self.role(_self.role_uploading_body)).animate({
		        scrollTop: scrollTo
		    }, 100);        	
        }

        let desc = item_box.find(".desc");

        item_box.find(".action").removeClass("cancel").removeClass("complete").addClass("pending");
        notify.find(".text").html("Uploading "+pending_list.length+" items");
        notify.find(".cancel").show();
        notify.find(".retry").hide();
        notify.show();
        _self.updateProgressUploadBar(item_box, 0);


        let error_upload = function(response, current_id_drive = null) {

			if(typeof response['error'] !== "undefined"){
            	if(response['error']['errors'][0]['reason'] === "authError"){

            		if(current_id_drive === null){
            			GDrive.execute("refreshToken", {
            				success: function(){
            					_file['errorStorage'] = true;
            					_self.start_upload();
            				},
            				error: function(){
            					_file['status'] = "error";
            					_self.start_upload();
            				}
            			});
            		} else {
						$.ajax({
							type: "GET",
							url: _Config['url_refresh_token']+_self.drive_id_upload,
							dataType: 'json',
							cache: false,
							success: function(response) {
								if(response.code === 200){
									_file['errorStorage'] = true;
									_self.access_token_upload = response.data['access_token'];
								} else {
									_file['status'] = "error";
								}
								_self.start_upload();
							},
							error: function(){
								_file['status'] = "error";
								_self.start_upload();
							}
						});            			
            		}

            		return;

            	} else if(response['error']['errors'][0]['reason'] === "quotaExceeded" && _file['errorStorage'] === true && _self.auto_upload_multiple_drive === true){
            		_file['errorStorage'] = false;

					$.ajax({
						type: "POST",
						url: _Config['url_multiple_drive'],
						dataType: 'json',
						cache: false,
						data: {
							type_drive: _self.type_upload_multiple_drive,
							size_file: data_file['size']
						},
						success: function(response) {
							if(response.code === 200){
								_self.drive_id_upload = response.data['drive_id'];
								_self.access_token_upload = response.data['access_token'];


								let get_root_folder = _self.ALL_FOLDERS.find(function(o){ return o['id'] === _file['parent']});
								let checkPermission = false;
								if(get_root_folder){
									checkPermission = get_root_folder['permissions'].find(function(o) {
										return o['emailAddress'] === response.data['emailAddress'] && o['type'] === "user";
									}) || false;
								}

								if(checkPermission === false || checkPermission['role'] !== "writer"){
									_self.addPermission(get_root_folder, {type: 'user', role: 'writer', emailAddress: response.data['emailAddress']}, null, function(){
										_self.start_upload();
									}, function(response){
										error_upload(response);
									});
								} else {
									_self.start_upload();
								}


							} else {
								$.niceToast.clear();
								$.niceToast.warning(response.message);
								_self.drive_id_upload = null;
								_self.access_token_upload = null;
								_self.auto_upload_multiple_drive = false;
								_self.start_upload();
							}
							
						},
						error: function(){
							_self.upload = _self.upload.map(function(o){
								if(o['errorStorage'] === true){
									o['errorStorage'] = false;
								}
								return o;
							});

							$.niceToast.clear();
							$.niceToast.warning('Error: Can\'t get the Drive list. Please try again in a few minutes!');

							_self.drive_id_upload = null;
							_self.access_token_upload = null;
							_self.auto_upload_multiple_drive = false;
							_self.start_upload();
						}
					});

            		return;
            	}
            }

        	_file['status'] = "error";
			let message = typeof response['error'] !== "undefined" ? response['error']['errors'][0]['reason'] : "Error upload";
        	desc.html(message);
        	desc.attr("title", message);
        	desc.show();

        	if(!item_box.find(".action").hasClass("cancel")){
        		item_box.find(".action").removeClass("complete").removeClass("pending").addClass("cancel");
        	}
			_self.start_upload();
        };

        let run_upload = function(id_parent = null){
        	let parent_upload = id_parent || _self.getIdFolderByHash();
	        var metadata = {
	            'title': data_file.name,
	            'mimeType': data_file.type || 'application/octet-stream',
	            "parents": [{
	                "kind": "drive#file",
	                "id": parent_upload
	            }]
	        };

	        if (data_file.size <= 0) {
	            data_file = new Blob([" "], { type: data_file.type || 'application/octet-stream' });
	        }

        	let insert;

	        try {
	            var uploader = GDrive.upload({
	                file: data_file,
	                access_token: _self.access_token_upload || null,
	                progressUpload: id_progress,
	                resourcekey: _self.resourceKey ? _self.getIdFolderByHash()+'/'+_self.resourceKey : null,
	                metadata: metadata,
	                params: {
	                    convert: false,
	                    ocr: false
	                },
	                onError: function (progress_upload, response) {
	                	error_upload(response, _self.drive_id_upload);
	                },
	                onComplete: function(progress_upload, new_file) {
	                	_file['status'] = "complete";

	                	let comelete_count = _self.upload.filter(function(o){ return o['status'] === "complete"}).length;
	                	title.html("Upload complete "+comelete_count+" items");
	                	if(comelete_count >= _self.upload.length){
	                		notify.hide();
	                	}

	                	if(_self.getIdFolderByHash() === parent_upload){
							insert = $(_self._htmlFile(new_file));
							insert.addClass("selected");

							if($(_self.role(_self.role_list_files)).length < 1){
								_self.isEmptyFolder(false);
								_self.div_list_item.append(_self._htmlDivListFiles());
							}
							_self.div_list_item.find(_self.role(_self.role_list_files)).prepend(insert);
		                    _self._addDataFile(new_file);
		                    _self.fix_css_grid();
		                    _self._resetLazyImage();	                		
	                	}


						item_box.find(".action").removeClass("pending").addClass("complete");
						_self.start_upload();
	                },
	                onProgress: function(event) {
	                	let total = event.total <= 0 ? file['size'] : event.total;
	                	let ProgressPercentage = (Math.round(((event.loaded / total) * 100), 0));
	                	_self.updateProgressUploadBar(item_box, ProgressPercentage);
	                },
	                onCancel: function(progress_upload, file){
	                	_file['status'] = "cancel";

	                	desc.html("Cancelled upload");
	                	desc.show();

	                	if(!item_box.find(".action").hasClass("cancel")){
	                		item_box.find(".action").removeClass("complete").removeClass("pending").addClass("cancel");
	                	}

						_self.start_upload();
	                }
	            });
	        } catch (error) {
	        	error_upload();
	        }
        };

        let create_folder = function(path_array = [], new_id_folder = null){
        	let path = path_array.shift();

        	if(!path){
        		return run_upload(new_id_folder);
        	}

        	let folder = _self.map_folder_upload.find(function(o){ return o['name'] === path});
        	if(folder){
        		if(folder['created'] === false){
					_self.actionCreateFolder(path.split("/").pop(), folder['parent'], function(new_folder){
						_self.changeParentUploadFolder(new_folder['id'], folder['id']);
						if(_self.getIdFolderByHash() === folder['parent']){
							_self.insertNewFolder(new_folder);
						}
						create_folder(path_array, new_folder['id']);
					},
					function(response){
						error_upload(response, null);
					});
        		} else {
        			create_folder(path_array, folder['id']);
        		}
        	} else {
				return error_upload();
			}
        };

        if(data_file['rawPath']){

			let arr_path = data_file['rawPath'].split("/");
			let raw_path = '';
			let path_array = [];
			arr_path.forEach(function(folder){
				raw_path += '/'+folder;
				path_array.push(raw_path.replace(/^\/+|\/+$/g, ''));
			});
        	create_folder(path_array, _file['parent']);

        } else {
        	run_upload(_file['parent']);
        }
	},

	auto_upload_multiple_drive: false,
	type_upload_multiple_drive: 'all',
	uploadFile: function(files){
		var _self = this;

		if(typeof files !== "object"){
			return false;
		}

		let check_storage = GDrive.storageQuota['limit'] - GDrive.storageQuota['usage'];
		let total_size_upload = 0;

		
		let html_upload_items = [];

		for(let file of files){

			total_size_upload += parseInt(file['size']);
			let id_progress = Date.now().toString(36) + Math.random().toString(36).substr(2);
			let parent_upload = _self.getIdFolderByHash();
			if(parent_upload === "trash" || parent_upload === "sharedWithMe" || parent_upload === "recent"){
				parent_upload = GDrive.rootFolderId;
			}

			if(file['webkitRelativePath']){
				let arr_path = file['webkitRelativePath'].split("/");
				let rawPath = arr_path.filter(function(o, i){
					return i !== (arr_path.length - 1); 
				});
				file['rawPath'] = rawPath.join("/");
				file['folderName'] = rawPath.pop();
			}

			if(_self._findDataBy(_self.upload, "id_progress", id_progress) === false){
				let status = ((GDrive.storageQuota_limit === "" || check_storage >= total_size_upload) || _self.auto_upload_multiple_drive === true ? "pending" : "error");
				_self.upload.push({
					id_progress: id_progress,
					file: file,
					status: status,
					parent: parent_upload,
					errorStorage: (status === "error" || _self.auto_upload_multiple_drive === true ? true : false)
				});
				html_upload_items.push(_self._htmlUploadItem(file, id_progress, status));
			}

		}
		_self.showUploading(html_upload_items);

		if(_self.isUploading === false){
			_self.start_upload();
		}

		if(GDrive.storageQuota_limit !== "" && check_storage < total_size_upload && _self.auto_upload_multiple_drive === false){
			var htmlForm = '\
				<div id="dialogForm">\
					<div class="form-group">\
						<p>Do you want to a upload to multiple Drives?</p>\
						<div class="col-12">\
							<span class="form-check form-check-inline">\
								<input class="form-check-input" type="radio" id="type_all" role="dialog_input_type" name="type_multiple" value="all" checked>\
								<label class="form-check-label" for="type_all">\
									<font color="green">All Drive</font>\
								</label>\
							</span>\
							<span class="form-check form-check-inline">\
								<input class="form-check-input" type="radio" id="type_foldes" role="dialog_input_type" name="type_multiple" value="service_account">\
								<label class="form-check-label" for="type_folders">Only Service account</label>\
							</span>\
							<span class="form-check form-check-inline">\
								<input class="form-check-input" type="radio" id="type_files" role="dialog_input_type" name="type_multiple" value="oauth">\
								<label class="form-check-label" for="type_files">Only Oauth</label>\
							</span>\
						</div>\
					</div>\
				</div>\
			';
			$.sendConfirm({
				title: 'Error: Not enough storage',
				content: htmlForm,
				button: {
					confirm: 'Yes',
					cancel: 'Cancel'
				},
				bgHide: false,
				isFixed: true,
				onBeforeConfirm: function(){
					_self.type_upload_multiple_drive = $.trim($("#dialogForm input"+_self.role("dialog_input_type")+":checked").val());
				},
				onConfirm: function() {
					_self.auto_upload_multiple_drive = true;
					let errorStorage = _self.upload.filter(function(o){
						return o['errorStorage'] === true && o['status'] === "error";
					});

					errorStorage.forEach(function(upload){
						upload['status'] = "pending";
					});

					let item_box = $(_self.role(_self.role_uploading_box)).find(".item-box .action.error, .item-box .action.cancel");
					item_box.removeClass("cancel").removeClass("error").addClass("pending");
		        	item_box.siblings(".desc").hide();
		        	_self.updateProgressUploadBar(item_box, 0);

					if(_self.isUploading === false){
						_self.start_upload();
					}
				},
				onCancel: function(){

				},
				onClose: function(){
				}
			});
		}


		$(document).off("click.uploading");
		$(document).on("click.uploading", ".upload-box button[role=hidden-upload]", function(){
			let box = $(".upload-box");
			if(box.hasClass("show")){
				box.find("button[role=hidden-upload]").html('<i class="bx bx-chevron-up"></i>');
				box.removeClass("show");
			} else {
				box.find("button[role=hidden-upload]").html('<i class="bx bx-chevron-down"></i>');
				box.removeClass("show").addClass("show");
			}
		});
		$(document).on("click.uploading", ".upload-box button[role=close-upload]", function(){
			if(_self.upload.some(function(o){ return o['status'] === "pending"}) === true){
				$.sendConfirm({
					title: 'Cancel Upload',
					msg: 'Your upload is not complete. Do you want to cancel the upload?',
					button: {
						confirm: 'Keep Uploading',
						cancel: 'Cancel Upload'
					},
					isFixed: true,
					onConfirm: function() {
					},
					onCancel: function() {
			            $(_self.input_upload_file).val("");
						$(_self.input_upload_folder).val("");
						$(_self.role(_self.role_uploading_notify)+ " .cancel").click();
						_self.upload = [];
						_self.isUploading = false;
						$(".upload-box").remove();
					},
					onClose: function() {
					}
				});				
			} else {
            	$(_self.input_upload_file).val("");
				$(_self.input_upload_folder).val("");
				_self.upload = [];
				$(".upload-box").remove();
			}
		});

		$(document).on("click.uploading", _self.role(_self.role_uploading_notify)+ " .cancel", function(){
			let notify = $(this).parents(_self.role(_self.role_uploading_notify));
			let pending = _self.upload.filter(function(o){
				return o['status'] === "pending";
			});
			pending.forEach(function(upload){
				upload['status'] = "cancel";
			});
			let item_box = $(_self.role(_self.role_uploading_box)).find(".item-box .action.pending");
			item_box.removeClass("pending").addClass("cancel");
        	item_box.siblings(".desc").html("Cancelled upload").show();

			GDrive.execute("abortUpload", {
				success: function(){
					_self.isUploading = false;
					notify.find(".text").html('Not upload '+pending.length+' items');
					notify.find(".retry").show();
					notify.find(".cancel").hide();
					notify.show();
				},
				error: function(){
					$.niceToast.clear();
					$.niceToast.error("An error occurred. Please try again!");
				}
			});
		});
		$(document).on("click.uploading", _self.role(_self.role_uploading_notify)+ " .retry", function(){
			let notify = $(this).parents(_self.role(_self.role_uploading_notify));
			let cancel_error = _self.upload.filter(function(o){
				return o['status'] === "error" || o['status'] === "cancel";
			});
			cancel_error.forEach(function(upload){
				upload['status'] = "pending";
			});

			let item_box = $(_self.role(_self.role_uploading_box)).find(".item-box .action.error, .item-box .action.cancel");
			item_box.removeClass("cancel").removeClass("error").addClass("pending");
        	item_box.siblings(".desc").html("Retry uploading").hide();
        	_self.updateProgressUploadBar(item_box, 0);

			notify.find(".text").html("Retry uploading "+cancel_error.length+" items");
			notify.find(".retry").hide();
			notify.find(".cancel").show();
			notify.show();

			if(_self.isUploading === false){
				_self.start_upload();
			}
		});

		$(document).on("click.uploading", _self.role(_self.role_retry_upload), function(){
			let item_box = $(this).parents(".item-box");
			let notify = $(_self.role(_self.role_uploading_notify));
			let desc = item_box.find(".desc");
			let id_progress = $.trim(item_box.data("progressupload"));
			let file_retry = _self.upload.find(function(o){
				return o['id_progress'] === id_progress;
			});

			if(typeof file_retry !== "undefined"){
				if(file_retry['status'] === "cancel" || file_retry['status'] === "error"){
					file_retry['status'] = "pending";
					desc.html("Uploading...");
					desc.hide();

	        		item_box.find(".action").removeClass("cancel").removeClass("error").addClass("pending");
	        		_self.updateProgressUploadBar(item_box, 0);
	
					let pending = _self.upload.filter(function(o){
						return o['status'] === "pending";
					});
					
					if(pending.length > 0){
						notify.find(".text").html("Uploading "+pending.length+" items");
						notify.find(".retry").hide();
						notify.find(".cancel").show();
						notify.show();
					}

					if(_self.isUploading === false){
						_self.start_upload();
					}
				}
			}
		});
		$(document).on("click.uploading", _self.role(_self.role_cancel_upload), function(){
			let item_box = $(this).parents(".item-box");
			let notify = $(_self.role(_self.role_uploading_notify));
			let desc = item_box.find(".desc");
			let id_progress = $.trim(item_box.data("progressupload"));
			let file_retry = _self.upload.find(function(o){
				return o['id_progress'] === id_progress;
			});

			if(typeof file_retry !== "undefined"){
				if(file_retry['status'] === "pending"){
					file_retry['status'] = "cancel";
					desc.html("Cancelled upload");
					desc.show();
					item_box.find(".action").removeClass("error").removeClass("pending").addClass("cancel");

					GDrive.execute("abortUpload", {
						progressUpload: id_progress
					});

					let cancel_error = _self.upload.filter(function(o){
						return o['status'] === "error" || o['status'] === "cancel";
					});		
					let pending = _self.upload.filter(function(o){
						return o['status'] === "pending";
					});
					
					if(cancel_error.length > 0 && pending.length < 1){
						_self.isUploading = false;
						notify.find(".text").html('Not upload '+cancel_error.length+' items');
						notify.find(".retry").show();
						notify.find(".cancel").hide();
						notify.show();
					} else if(pending.length > 0){
						notify.find(".text").html("Uploading "+pending.length+" items");
					}

				}
			}
		});
	},


	map_folder_upload: [],
	changeParentUploadFolder: function(new_id, old_id){
		this.map_folder_upload = this.map_folder_upload.map(function(o){
			if(o['id'] === old_id){
				o['id'] = new_id;
				o['created'] = true;
			}
			if(o['parent'] === old_id){
				o['parent'] = new_id;
			}
			return o;
		});
	},
	uploadFolder: function(files){
		var _self = this;

		if(typeof files !== "object"){
			return false;
		}

		let data_path = [];

		for(let file of files){
			if(file['webkitRelativePath']){
				let arr_path = file['webkitRelativePath'].split("/");
				let path = arr_path.filter(function(o, i){
					return i !== (arr_path.length - 1);
				});
				if(_self.map_folder_upload.some(function(o){ return o['name'] === path.join("/")}) === false){
					let raw_path = '';
					path.forEach(function(folder){
						let parent = _self.getIdFolderByHash();
						if(parent === "trash" || parent === "sharedWithMe" || parent === "recent"){
							parent = GDrive.rootFolderId;
						}
						let find_parent = _self.map_folder_upload.find(function(o){ return o['name'] === raw_path});

						if(find_parent){
							parent = find_parent['id'];
						}
						raw_path += '/'+folder;
						raw_path = raw_path.replace(/^\/+|\/+$/g, '');

						if(_self.map_folder_upload.some(function(o){ return o['name'] === raw_path}) === false){
							let id_new_folder = Date.now().toString(36) + Math.random().toString(36).substr(2);
							let data = {
								name: raw_path,
								id: id_new_folder,
								parent: parent,
								created: false 
							};
							_self.map_folder_upload.push(data);
							data_path.push(data);
						}
					});
				}				
			}
		}

		if(data_path[0]){
			if(_self.isUploading === false){
				addScreenLoading(_self.div_list_item);
			}
			GDrive.execute("listFiles", {
				id: _self.getIdFolderByHash(),
				resourcekey: _self.resourceKey,
				maxResults: 1,
				q: [
					"trashed=false",
					"title='"+data_path[0]['name']+"'"
				],
				success: function(data){
					removeScreenLoading(_self.div_list_item);

					let keepAsSeparate = function(){
						if(_self.isUploading === false){
							addScreenLoading(_self.div_list_item, "fixed_loading");
						}
						_self.actionCreateFolder(data_path[0]['name'], data_path[0]['parent'], function(new_folder){
							_self.insertNewFolder(new_folder);
							_self.changeParentUploadFolder(new_folder['id'], data_path[0]['id']);
							_self.uploadFile(files);
							removeScreenLoading(_self.div_list_item);
						},
						function(response){
							$.niceToast.clear();
							$.niceToast.error(response.error.message);
							removeScreenLoading(_self.div_list_item);
						});
					};

					if(data.length > 0){
						$.sendConfirm({
							title: 'Duplicate folder upload',
							msg: 'You already have a version of this folder in Drive.',
							button: {
								confirm: 'Keep as separate',
								cancel: 'Merge folder'
							},
							bgHide: false,
							isFixed: true,
							onConfirm: function() {
								keepAsSeparate();
							},
							onCancel: function(){
								_self.changeParentUploadFolder(data[0]['id'], data_path[0]['id']);
								_self.uploadFile(files);
							},
							onClose: function(){
							}
						});
					} else {
						keepAsSeparate();
					}
				},
				error: function(response){
					$.niceToast.clear();
					$.niceToast.error(response.error.message);
					removeScreenLoading(_self.div_list_item);
				}
			});
			return false;
		} else {
			_self.uploadFile(files);
		}
	},

	count_success_import: 0,
	count_error_import: 0,
	cancel_import: false,
	stop_import: function(message = true){
		if(message === true){
			$.niceToast.clear();
			$.niceToast.error("Import stopped!");			
		}

		this.isImporting = false;
		this.cancel_import = false;
		this.import = [];
		this.import_data = [];
		this.total_size_import = 0;
		this.total_file_import = 0;
		this.folder_root_import = null;
		this.drive_id_import = null;
		this.access_token_import = null;
		this.auto_import_multiple_drive = false;
	},
	start_import: function(){
		var _self = this;

		let pending_list = _self.import_data.filter(function(o){
			return o['status'] === "pending";
		});

		if(pending_list.length < 1 || _self.cancel_import === true){
			removeScreenLoading($("#dialogConfirmBox"));
			$(".j_dialogConfirm").removeClass("disabled");
			$.niceToast.clear();
			$.niceToast.success("Successfully imported "+_self.count_success_import+" files");

			if(_self.count_error_import > 0){
				$(_self.role("import_error")).html(_self.count_error_import);
				$(_self.role("error_bar")).show();
			}
			return _self.stop_import(false);
		}

		_self.isImporting = true;

		let import_data = pending_list[0];
		let file = import_data['file'];
		let parent = import_data['parent'];
		let resourceKey = import_data['file']['resourceKey'] || null;

		if($(_self.role("progressImport")).length < 1){
			var htmlForm = '\
				<div id="dialogForm" role="progressImport" class="importFolder">\
					<div class="info">\
						<div role="import_title" class="title"></div>\
						<div role="import_size" class="size"></div>\
				        <div class="progress">\
				            <p role="txt-importing" class="counter">0%</p>\
				            <div role="bar-importing" class="bar"></div>\
				        </div>\
				        <div class="size_bar">\
				        	<small>Progress: </small><span role="import_success">0</span>/<span role="import_total">'+_self.total_file_import+'</span> files\
				        </div>\
						<div role="error_bar" class="error_bar">\
							<small>Error: </small><span role="import_error">0</span> files</div>\
					</div>\
				</div>';


			$.sendConfirm({
				content: htmlForm,
				title: 'Import folder: '+_self.folder_root_import['title'],
				hideClose: true,
				button: {
					confirm: 'Done',
					cancel: 'Cancel'
				},
				isFixed: true,
				bgHide: false,
				callback: function(){
					$(".j_dialogConfirm").addClass("disabled");
				},
				onCancel: function() {
					_self.cancel_import = true;
				}
			});
		}

		$(_self.role("import_title")).html(file['title']);
		$(_self.role("import_size")).html("Size: "+_self._sizeFormat(file['size']));


        let error_import = function(response, current_id_drive = null) {

			if(typeof response['error'] !== "undefined" && import_data['status'] === "retry"){
            	import_data['status'] = "pending";				
            	if(response['error']['errors'][0]['reason'] === "authError"){
            		if(current_id_drive === null){
            			GDrive.execute("refreshToken", {
            				success: function(){
            					_self.start_import();
            				},
            				error: function(){
            					_self.start_import();
            				}
            			});
            		} else {
						$.ajax({
							type: "GET",
							url: _Config['url_refresh_token']+_self.drive_id_import,
							dataType: 'json',
							cache: false,
							success: function(response) {
								if(response.code === 200){
									_self.access_token_import = response.data['access_token'];
								}
								_self.start_import();
							},
							error: function(){
								_self.start_import();
							}
						});            			
            		}

            		return;

            	} else if(response['error']['errors'][0]['reason'] === "quotaExceeded" && _self.auto_import_multiple_drive === true){

					$.ajax({
						type: "POST",
						url: _Config['url_multiple_drive'],
						dataType: 'json',
						cache: false,
						data: {
							type_drive: _self.type_import_multiple_drive,
							size_file: file['size']
						},
						success: function(response) {
							if(response.code === 200){
								_self.drive_id_import = response.data['drive_id'];
								_self.access_token_import = response.data['access_token'];

								let get_root_folder = _self.ALL_FOLDERS.find(function(o){ return o['id'] === _self.folder_root_import['id']});
								let checkPermission = false;
								if(get_root_folder){
									checkPermission = get_root_folder['permissions'].find(function(o) {
										return o['emailAddress'] === response.data['emailAddress'] && o['type'] === "user";
									}) || false;
								}

								if(checkPermission === false || checkPermission['role'] !== "writer"){
									_self.addPermission(get_root_folder, {type: 'user', role: 'writer', emailAddress: response.data['emailAddress']}, null, function(){
										_self.start_import();
									}, function(response){
										import_data['status'] === "retry";
										error_import(response);
									});
								} else {
									_self.start_import();
								}

							} else {
								$.niceToast.clear();
								$.niceToast.warning(response.message);
								_self.drive_id_import = null;
								_self.access_token_import = null;
								_self.auto_import_multiple_drive = false;
								_self.start_import();
							}
							
						},
						error: function(){
							_self.import_data = _self.import_data.map(function(o){
								if(o['status'] === "retry"){
									o['status'] = "pending";
								}
								return o;
							});

							$.niceToast.clear();
							$.niceToast.warning('Error: Can\'t get the Drive list. Please try again in a few minutes!');

							_self.drive_id_import = null;
							_self.access_token_import = null;
							_self.auto_import_multiple_drive = false;
							_self.start_import();
						}
					});

            		return;
            	}
            }

        	import_data['status'] = "error";
        	_self.count_error_import++;
			_self.start_import();
        };

		GDrive.execute("copy", {
			file: file,
			access_token: _self.access_token_import || null,
			parent: parent,
			changeName: false,
			resourcekey: resourceKey,
			success: function(new_files){
				import_data['status'] = "complete";

				_self.count_success_import++;
				let percent = Math.round((_self.count_success_import / _self.total_file_import) * 100);
				$(_self.role("txt-importing")).html(percent+"%");
				$(_self.role("bar-importing")).css({
        			width: percent+'%'
        		});
				$(_self.role("import_success")).html(_self.count_success_import);
				_self.start_import();
			},
			error: function(response){
				import_data['status'] = "retry";
				error_import(response, _self.drive_id_import);
			}
		});
	},

	auto_import_multiple_drive: false,
	type_import_multiple_drive: 'all',
	folder_root_import: null,
	total_file_import: 0,
	drive_id_import: null,
	access_token_import: null,
	importFolder: function(name, query){
		var _self = this;

		if(_self.cancel_import === true){
			return _self.stop_import();
		}

		let pending_list = _self.import.filter(function(o){
			return o['status'] === "pending";
		});

		if(pending_list.length < 1){
			_self.count_success_import = 0;
			_self.count_error_import = 0;
			_self.cancel_import = false;

			if(GDrive.storageQuota_limit === "" || (GDrive.storageQuota['limit'] - GDrive.storageQuota['usage']) >= _self.total_size_import){
				_self.start_import();
			} else {
				$.niceToast.clear();
				removeScreenLoading($("#dialogConfirmBox"));
				var htmlForm = '\
					<div id="dialogForm">\
						<div class="form-group">\
							<p>Do you want to a import to multiple Drives?</p>\
							<div class="col-12">\
								<span class="form-check form-check-inline">\
									<input class="form-check-input" type="radio" id="type_all" role="dialog_input_type" name="type_multiple" value="all" checked>\
									<label class="form-check-label" for="type_all">\
										<font color="green">All Drive</font>\
									</label>\
								</span>\
								<span class="form-check form-check-inline">\
									<input class="form-check-input" type="radio" id="type_foldes" role="dialog_input_type" name="type_multiple" value="service_account">\
									<label class="form-check-label" for="type_folders">Only Service account</label>\
								</span>\
								<span class="form-check form-check-inline">\
									<input class="form-check-input" type="radio" id="type_files" role="dialog_input_type" name="type_multiple" value="oauth">\
									<label class="form-check-label" for="type_files">Only Oauth</label>\
								</span>\
							</div>\
						</div>\
					</div>\
				';
				$.sendConfirm({
					title: 'Error: Not enough storage',
					content: htmlForm,
					button: {
						confirm: 'Yes',
						cancel: 'Cancel'
					},
					bgHide: false,
					isFixed: true,
					onBeforeConfirm: function(){
						_self.type_import_multiple_drive = $.trim($("#dialogForm input"+_self.role("dialog_input_type")+":checked").val());
					},
					onConfirm: function() {
						_self.auto_import_multiple_drive = true;
						_self.start_import();
					},
					onCancel: function(){
						_self.cancel_import = true;
					},
					onClose: function(){
						_self.cancel_import = true;
					}
				});
			}
			return;
		}

		let _import_folder = pending_list[0];
		let id_parent = _import_folder['parent'];
		let file = _import_folder['file'];

		query = query || ["trashed=false"];

		_self.isImporting = true;


        let error_create_folder = function(response) {

			if(typeof response['error'] !== "undefined" && _import_folder['status'] === "retry"){
            	if(response['error']['errors'][0]['reason'] === "authError"){
            		_import_folder['status'] = "pending";
        			GDrive.execute("refreshToken", {
        				success: function(){
        					_self.importFolder();
        				},
        				error: function(){
        					_self.importFolder();
        				}
        			});
            		return;
            	}
            }

        	_import_folder['status'] = "error";
			_self.importFolder();
        };


		$.niceToast.clear();
		GDrive.execute("createFolder", {
			name: name || file['title'],
			resourcekey: file['resourceKey'] || _self.resourceKey,
			parent: id_parent,
			success: function(new_folder){
				_self.ALL_FOLDERS.push(new_folder);
				_import_folder['status'] = "complete";

				if(id_parent === _self.getIdFolderByHash()){
					let insert = $(_self._htmlFolder(new_folder));
					insert.addClass("selected");
					if($(_self.role(_self.role_list_folders)).length < 1){
						_self.isEmptyFolder(false);
						_self.div_list_item.prepend(_self._htmlDivListFolders());
					}

					_self.div_list_item.find(_self.role(_self.role_list_folders)).prepend(insert);
					_self._addDataFolder(new_folder);
					_self.fix_css_grid();
				}

				if(_self.folder_root_import === null){
					_self.folder_root_import = new_folder;
					var htmlForm = '\
						<div id="dialogForm" class="importFolder">\
							<div class="info">\
								<div role="import_title" class="title"></div>\
								<div role="import_size" class="size"></div>\
						        <div class="size_bar">\
						        	<small>Total files: </small><span role="import_total">0</span>... <i class="bx bx-refresh icon-loading"></i>\
						        </div>\
							</div>\
						</div>';


					$.sendConfirm({
						content: htmlForm,
						title: 'Import folder: '+_self.folder_root_import['title'],
						hideClose: true,
						button: {
							confirm: null,
							cancel: 'Cancel'
						},
						isFixed: true,
						bgHide: false,
						onCancel: function() {
							_self.cancel_import = true;
						}
					});
				}

				$(_self.role("import_title")).html("Getting list files: "+file['title']);

				GDrive.execute("listFiles", {
					id: file['id'],
					resourcekey: file['resourceKey'],
					maxResults: 500,
					loadFull: true,
					q: query,
					success: function(files){
						_import_folder['status'] = "complete";
						let list_import = [];
						files.forEach(function(file_import){
							if(_self.isFile(file_import)){
								_self.import_data.push({
									parent: new_folder['id'],
									file: file_import,
									resourceKey: new_folder['resourceKey'] || null,
									status: "pending"
								});
								_self.total_size_import = _self.total_size_import + parseInt(file_import['size']);
								_self.total_file_import++;
							} else {
								if(file_import['shortcutDetails'] !== null){
									file_import['id'] = file_import['shortcutDetails']['targetId'];
									file_import['resourceKey'] = file_import['shortcutDetails']['targetResourceKey'] || null;
								}
								_self.import.push({
									parent: new_folder['id'],
									file: file_import,
									status: "pending"
								});
							}
						});

						$(_self.role("import_total")).html(_self.total_file_import);

						_self.importFolder();
					},
					error: function(response){
						_import_folder['status'] = "retry";
						error_create_folder(response);
					}
				});

			},
			error: function(response){
				_import_folder['status'] = "retry";
				error_create_folder(response);
			}
		});
	},
	getInfoFolder: function(id_folder, resourceKey, callback_success){
		var _self = this;
		GDrive.execute("fileInfo", {
			id: id_folder,
			resourcekey: resourceKey,
			success: function(data){
				_self.ALL_FOLDERS.push(data);
				_self.infoFolder = data;
				_self.browseFolder(data);
				_self.resourceKey = data['resourceKey'] || null;
				if(callback_success){
					callback_success(data);
				}
			},
			error: function(response){
				$.niceToast.clear();
				$.niceToast.error('<strong>Error</strong>: '+response.error['message']);
			}
		});
	},
	run: function(id_folder){
		var _self = this;

		/////////////////// load folder by id ///////////////////////
		if(this.infoFolder == null && (id_folder !== GDrive.rootFolderId && id_folder !== "root" && id_folder !== "trash" && id_folder !== "sharedWithMe" && id_folder !== "recent")){
			_self.getInfoFolder(id_folder, _self.resourceKey);
		} else {
			let parent = {id: GDrive.rootFolderId, title: "My Drive", iconLink: "", parents: [], resourceKey: _self.resourceKey};
			_self.ALL_FOLDERS.push(parent);
			_self.infoFolder = parent;
			_self.parents = [parent];
		}

		if(id_folder === "trash"){
			_self.accessTrash();
			_self.getFolder(null, true);
		} else if(id_folder === "sharedWithMe"){
			_self.accessSharedWithMe();
			_self.getFolder(null, false, null, true);
		} else if(id_folder === "recent"){
			_self.accessRecent();
			_self.getFolder(null, false, null, false, true);
		} else {
			_self.getFolder(id_folder);
		}



		////////////// access mydrive or trash /////////////////
		$(document).on("click", _self.role(_self.access_myDrive), function(e) {
			if($(this).hasClass("selected")){
				return false;
			}
			$(".nav-tabs li").removeClass("selected");
			$(this).addClass("selected");
			document.location.hash = GDrive.rootFolderId;
		});

		$(document).on("click", _self.role(_self.access_trash), function(e) {
			if($(this).hasClass("selected")){
				return false;
			}
			$(".nav-tabs li").removeClass("selected");
			$(this).addClass("selected");
			document.location.hash = "trash";
		});

		$(document).on("click", _self.role(_self.access_sharedWithMe), function(e) {
			if($(this).hasClass("selected")){
				return false;
			}
			$(".nav-tabs li").removeClass("selected");
			$(this).addClass("selected");
			document.location.hash = "sharedWithMe";
		});

		$(document).on("click", _self.role(_self.access_recent), function(e) {
			if($(this).hasClass("selected")){
				return false;
			}
			$(".nav-tabs li").removeClass("selected");
			$(this).addClass("selected");
			document.location.hash = "recent";
		});

		////////////// select file /////////////////////////////
		$('#checkAll').on("click", function() {
			$('input'+_self.role("selected")).prop('checked', this.checked);
			$('input'+_self.role("selected")).change();
		});
		$(document).on("click", ".form-check", function(e) {
			e.stopPropagation();
		});
		$(document).on("change", _self.role("selected"), function() {
			if(this.checked === true){
				$(this).parents("li").removeClass("selected").addClass("selected");
			} else {
				$(this).parents("li").removeClass("selected");
			}

			let total = $("input"+_self.role("selected")+":checked").length;
			if(total > 0){
				$(_self.role("tool_action")).removeClass("disabled");
			} else {
				$(_self.role("tool_action")).addClass("disabled");
			}

			if($("input"+_self.role("selected")+":checked").length >= $("input"+_self.role("selected")).length){
				$('#checkAll').prop('checked', true);
			} else {
				$('#checkAll').prop('checked', false);
			}
			$(_self.role("select_count")).html(total);
			let selected = [];
			$("input"+_self.role("selected")+":checked").each(function(){
				selected.push(_self._getDataFileById($(this).parents("li").data("id")));
			});
			_self.selected_file = selected;
			if(_self._findDataBy(selected, 'mimeType', _self.type_folder) === true){
				$(_self.role("tool_action")+"[name=copy_files]").removeClass("disabled").addClass("disabled");
			}
			if(_self._findDataBy(selected, 'editable', false) === true){
				$(_self.role("tool_action")).removeClass("disabled").addClass("disabled");
			}
		});

		/////////////////// preview file in click ///////////////////////
		$(document).on("click", _self.role(this.role_file),  function(){
			let file = _self._getDataFileById($(this).data("id"));
			if(file === undefined){
				return false;
			}
			_self.addPreviewFile(file);
		});

		////////////// tool bar /////////////////////////////////
		$(document).on("click", _self.role("tool_action")+"[name=copy_files]", function(){
			if(_self.selected_file.length < 1){
				return false;
			}
			_self.actionCopy(_self.selected_file, _self.getIdFolderByHash());
		});

		$(document).on("click", _self.role("tool_action")+"[name=move_files]", function(){
			if(_self.selected_file.length < 1){
				return false;
			}

			if(_self.selected_file.some(function(o){ return o['ownedByMe'] !== true}) === true){
				$.niceToast.clear();
				$.niceToast.warning("Can't move other people's files!");
			} else {
				var htmlForm = '\
					<div id="dialogForm" class="mapFolder">\
					</div>\
				';

				$.sendMsg(htmlForm, false);
				addScreenLoading($("#dialogForm"));
				_self.getMapFolder(_self.selected_file, $("#dialogForm"));
			}

		});

		$(document).on("click", _self.role("new_folder"), function(){
			var htmlForm = '\
				<div id="dialogForm">\
					<input role="dialog_input_name" class="form-control" type="text" value="New folder no title">\
				</div>\
			';
			$.sendConfirm({
				title: 'New Folder',
				content: htmlForm,
				button: {
					confirm: 'Create',
					cancel: 'Cancel'
				},
				isFixed: true,
				bgHide: false,
				callback: function(){
					$("#dialogForm input"+_self.role("dialog_input_name")).on("keyup", function(){
						let input = $.trim($(this).val());
						if(!input){
							$(".j_dialogConfirm").addClass("disabled");
						} else {
							$(".j_dialogConfirm").removeClass("disabled");
						}
					});
				},
				onBeforeConfirm: function(){
					let name = $.trim($("#dialogForm input"+_self.role("dialog_input_name")).val());
					if(name){
						addScreenLoading(_self.div_list_item, "fixed_loading");
						_self.actionCreateFolder(name, _self.getIdFolderByHash(), function(new_folder){
							$.niceToast.clear();
							$.niceToast('Created folder \''+name+'\'', {
								timeout: 6000
							});

							_self.insertNewFolder(new_folder);
							removeScreenLoading(_self.div_list_item);
						},
						function(response){
							$.niceToast.clear();
							$.niceToast.error('<strong>Error</strong>: '+response.error['message']);
							removeScreenLoading(_self.div_list_item);
						});
						return true;									
					}
					return false;
				},
				onConfirm: function() {
				},
				onCancel: function() {},
				onClose: function() {}
			});
		});


		$(document).on("click", _self.role("tool_action")+"[name=delete_files]", function(){
			if(_self.selected_file.length < 1){
				return false;
			}
			if(_self.selected_file.some(function(o){ return o['ownedByMe'] !== true}) === true){
				$.niceToast.clear();
				$.niceToast.warning("Can't delete other people's files!");
			} else {
				$.sendConfirm({
					title: 'Move trash',
					msg: '<strong>'+_self.selected_file.length+' selected</strong>',
					desc: 'Do you really want to delete the selected items?',
					button: {
						confirm: 'Yes',
						cancel: 'Cancel'
					},
					isFixed: true,
					onConfirm: function() {
						_self.actionTrash(_self.selected_file);
					},
					onCancel: function() {},
					onClose: function() {}
				});					
			}
		});

		$(document).on("click", _self.role("tool_action")+"[name=restore_files]", function(){
			if(_self.selected_file.length < 1){
				return false;
			}
			_self.actionUndoTrash(_self.selected_file, true);
		});

		$(document).on("click", _self.role("tool_action")+"[name=delete_forever_files]", function(){
			if(_self.selected_file.length < 1){
				return false;
			}
			$.sendConfirm({
				title: 'Delete Forever',
				msg: '<strong>'+_self.selected_file.length+' selected</strong>',
				desc: 'will be permanently deleted and you cannot restore it?',
				button: {
					confirm: 'Delete Forever',
					cancel: 'Cancel'
				},
				isFixed: true,
				onConfirm: function() {
					_self.actionDelete(_self.selected_file);
				},
				onCancel: function() {},
				onClose: function() {}
			});
		});

		$(document).on("click", "button[name=empty_trash]", function(){

			$.sendConfirm({
				title: 'Empty Trash',
				msg: 'All items in the recycle bin will be permanently deleted and you cannot restore them?',
				button: {
					confirm: 'Empty trash',
					cancel: 'Cancel'
				},
				isFixed: true,
				onConfirm: function() {
					_self.actionEmptyTrash();
				},
				onCancel: function() {},
				onClose: function() {}
			});
		});

		/////////////////// show memu file ///////////////////////
		dropdownmenu(".dropdown");

		$(document).on("click", _self.role(_self.role_action_file),  function(e){
			let target = $(e.target);
			let file = _self._getDataFileById($(this).data("id"));

			if(typeof file === "undefined"){
				return false;
			}

			$.niceToast.clear();
			switch(target.attr("role")) {

				case _self.role_private_share:

					if(!_Config['user_ps']){
						$.niceToast.clear();
						$.niceToast.error('Error system: Private sharing not configured.');
						break;
					}

					var htmlForm = '<div id="dialogForm" class="driveShare">';

					var private_share = file['permissions'].find(function(o){
						return o['emailAddress'] === _Config['user_ps'] && o['type'] === "user";
					});

					htmlForm += '\
						<div class="get-link-box private_share '+(private_share ? 'public' : '')+'">\
							<div class="title">Private Share</div>\
							<div class="get-link">\
								<div class="link">\
									<input type="text" value="'+_self._linkPrivateShare(file)+'">\
								</div>\
								<div role="private-copy-link" class="button">Copy Link</div>\
							</div>';
					if(file['ownedByMe'] === true){
						htmlForm += '<div class="options">\
									<div class="icon_public"><i class="bx bx-link-alt"></i></div>\
									<div class="icon_private"><i class="bx bx-lock"></i></div>\
									<div class="type">\
										<div class="role dropdown">\
											<button role="private-txt_type" class="drop-button role-options">'+(private_share ? 'Anyone with the link' : 'Restricted')+'</button>\
											<ul role="private-share-type" class="drop-menu">\
												<li data-type="private" class="'+(private_share ? '' : 'selected')+'"><i class="bx bx-check"></i> Restricted</li>\
												<li data-type="public" class="'+(private_share ? 'selected' : '')+'"><i class="bx bx-check"></i> Anyone with the link</li>\
											</ul>\
										</div>\
										<div class="txt_public">Anyone on the internet with this link can comment</div>\
										<div class="txt_private">Only people added can open with this link</div>\
									</div>\
								</div>';	
					}

					htmlForm += '</div></div>';

					$.sendMsg(htmlForm, false);
					$(document).off("click.private_share");
					$(document).on("click.private_share", _self.role("private-share-type")+" li", function(e){
						let current_selected = $(_self.role("private-share-type")+" li.selected");
						if(!$(this).hasClass("selected")){
							$(_self.role("private-share-type")+" li").removeClass("selected");
							$(this).addClass("selected");
							$(_self.role("private-txt_type")).html($.trim($(this).text()));
							if($(this).data("type") === "public"){
								$(".get-link-box").removeClass("public").addClass("public");
								_self.addPermission(file, {type: 'user', role: 'reader', emailAddress: _Config['user_ps']}, $("#dialogForm"), function(permission){
									private_share = permission;
									$.niceToast.clear();
									$.niceToast('Access have been updated', {
										timeout: 3000
									});
								}, function(response){
									$(_self.role("private-txt_type")).html($.trim(current_selected.text()));
									$(_self.role("private-share-type")+" li").removeClass("selected");
									current_selected.addClass("selected");
									$(".get-link-box").removeClass("public");
									$.niceToast.clear();
									$.niceToast.error('<strong>Error</strong>: '+response.error['message']);
								});
							} else {
								$(".get-link-box").removeClass("public");
								_self.deletePermission(file, private_share['id'], $("#dialogForm"), null, function(){
									$(_self.role("private-txt_type")).html($.trim(current_selected.text()));
									$(_self.role("private-share-type")+" li").removeClass("selected");
									current_selected.addClass("selected");
									$(".get-link-box").removeClass("public").addClass("public");
								});
								
							}
							
						}
					});

					$(document).on("click.private_share", _self.role("private-copy-link"), function(e){
						let input = $(this).siblings("div.link").find("input");
						input.focus().select();
						if (document.execCommand('copy')) {
							$.niceToast("Copy successfully!", {
								timeout: 3000
							});
						}
					});

				break;

				case _self.role_share_file:
					var htmlForm = '<div id="dialogForm" class="driveShare">';

					let anyoneWithLink = _self._getShare(file);
					let role = {
						reader: "Viewer",
						commenter: "Commenter",
						writer: "Editor"
					};

					var users = file['permissions'].filter(function(o){
						return o['type'] === "user" && o['role'] !== "owner" && o['emailAddress'] !== _Config['user_ps'];
					});

					var owner = file['permissions'].find(function(o){
						return o['type'] === "user" && o['role'] === "owner";
					});

					var private_share = file['permissions'].find(function(o){
						return o['type'] === "user" && o['emailAddress'] ===  _Config['user_ps'];
					});

					htmlForm += '\
						<div class="share-user">\
							<div class="title"><span class="title_icon"><i class="bx bx-user-plus"></i></span>Share with people</div>\
							<div class="text">'+(users.length > 0 ? 'Shared with '+users.map(function(o){ return o['name']}).join(", ") : 'No people added yet')+'</div>\
							<div class="add-user-box">\
								<div class="add-bar">\
									<input type="text" class="form-control form-control-alternative" placeholder="Email Address" role="share_user_emailAddress">\
									<div class="flex-row">\
										<select class="form-select" role="share_user_role">\
											<option value="reader">'+role['reader']+'</option>\
											<option value="commenter">'+role['commenter']+'</option>\
											<option value="writer">'+role['writer']+'</option>\
										</select>\
										<button class="btn" role="share_user_submit">Add</button>\
									</div>\
								</div>\
								<div role="share_user_list" class="user-list custom-scroll">';

					if(owner){
						htmlForm += '\
							<div class="user">\
								<div class="avatar">\
									<img src="'+owner['photoLink']+'">\
								</div>\
								<div class="info">\
									<div class="name" title="'+owner['name']+'">'+owner['name']+'</div>\
									<div class="email" title="'+owner['emailAddress']+'">'+owner['emailAddress']+'</div>\
								</div>\
								<div class="action">Owner</div>\
							</div>\
						';
					}

					if(private_share){
						htmlForm += '\
							<div class="user">\
								<div class="avatar">\
									<i class="bx bx-cog"></i>\
								</div>\
								<div class="info">\
									<div class="name" title="Private Share">Private Share</div>\
									<div class="email" title="This is access for private sharing">This is access for private sharing</div>\
								</div>\
								<div class="action">System</div>\
							</div>\
						';
					}

					let html_user_share = function(user){
						if(!users){
							return "";
						}

						if(typeof user['name'] === "undefined"){
							user['name'] = user['displayName'];
						}

						return '\
							<div class="user" data-id="'+user['id']+'">\
								<div class="avatar">\
									<img src="'+user['photoLink']+'">\
								</div>\
								<div class="info">\
									<div class="name" title="'+user['name']+'">'+user['name']+'</div>\
									<div class="email" title="'+user['emailAddress']+'">'+user['emailAddress']+'</div>\
								</div>\
								<div class="action dropdown">\
									<button class="drop-button role-options">'+(typeof role[user['role']] === "undefined" ? role['reader'] : role[user['role']])+'</button>\
									<ul role="share-role-user" class="drop-menu">\
										<li data-role="reader" class="'+(user['role'] === "reader" || typeof role[user['role']] === "undefined" ? 'selected' : '')+'"><i class="bx bx-check"></i> '+role['reader']+'</li>\
										<li data-role="commenter" class="'+(user['role'] === "commenter" ? 'selected' : '')+'"><i class="bx bx-check"></i> '+role['commenter']+'</li>\
										<li data-role="writer" class="'+(user['role'] === "writer" ? 'selected' : '')+'"><i class="bx bx-check"></i> '+role['writer']+'</li>\
										<li data-role="delete" class="border-top">Delete</li>\
									</ul>\
								</div>\
							</div>\
						';
					}
					if(users.length > 0){
						users.forEach(function(user){
							htmlForm += html_user_share(user);
						});
					}

					htmlForm += '</div></div></div>';


					htmlForm += '\
						<div class="get-link-box '+(anyoneWithLink !== false ? 'public' : '')+'">\
							<div class="title"><span class="title_icon"><i class="bx bx-link"></i></span> Get the link</div>\
							<div class="get-link">\
								<div class="link">\
									<input type="text" value="'+file['alternateLink']+'">\
								</div>\
								<div role="copy-link" class="button">Copy Link</div>\
							</div>';
					if(file['ownedByMe'] === true){
						htmlForm += '<div class="options">\
									<div class="icon_public"><i class="bx bx-link-alt"></i></div>\
									<div class="icon_private"><i class="bx bx-lock"></i></div>\
									<div class="type">\
										<div class="role dropdown">\
											<button role="txt_type" class="drop-button role-options">'+(anyoneWithLink !== false ? 'Anyone with the link' : 'Restricted')+'</button>\
											<ul role="share-type" class="drop-menu">\
												<li data-type="private" class="'+(anyoneWithLink !== false ? '' : 'selected')+'"><i class="bx bx-check"></i> Restricted</li>\
												<li data-type="public" class="'+(anyoneWithLink !== false ? 'selected' : '')+'"><i class="bx bx-check"></i> Anyone with the link</li>\
											</ul>\
										</div>\
										<div class="txt_public">Anyone on the internet with this link can comment</div>\
										<div class="txt_private">Only people added can open with this link</div>\
									</div>\
									<div id="role_options" class="role dropdown">\
										<button role="txt_role" class="drop-button role-options">'+(typeof role[anyoneWithLink['role']] === "undefined" ? role['reader'] : role[anyoneWithLink['role']])+'</button>\
										<ul role="share-role" class="drop-menu">\
											<li data-role="reader" class="'+(anyoneWithLink['role'] === "reader" || typeof role[anyoneWithLink['role']] === "undefined" ? 'selected' : '')+'"><i class="bx bx-check"></i> '+role['reader']+'</li>\
											<li data-role="commenter" class="'+(anyoneWithLink['role'] === "commenter" ? 'selected' : '')+'"><i class="bx bx-check"></i> '+role['commenter']+'</li>\
											<li data-role="writer" class="'+(anyoneWithLink['role'] === "writer" ? 'selected' : '')+'"><i class="bx bx-check"></i> '+role['writer']+'</li>\
										</ul>\
									</div>\
								</div>';						
					}

					htmlForm += '</div></div>';

					$.sendMsg(htmlForm, false);
					$(document).off("click.share");
					$(document).on("click.share", _self.role("share-type")+" li", function(e){
						let current_selected = $(_self.role("share-type")+" li.selected");
						if(!$(this).hasClass("selected")){
							$(_self.role("share-type")+" li").removeClass("selected");
							$(this).addClass("selected");
							$(_self.role("txt_type")).html($.trim($(this).text()));
							if($(this).data("type") === "public"){
								$(".get-link-box").removeClass("public").addClass("public");
								_self.addPermission(file, {type: 'anyone', role: 'reader', withLink: true}, $("#dialogForm"), function(){
									$.niceToast.clear();
									$.niceToast('Access have been updated', {
										timeout: 3000
									});
								}, function(response){
									$(_self.role("txt_type")).html($.trim(current_selected.text()));
									$(_self.role("share-type")+" li").removeClass("selected");
									current_selected.addClass("selected");
									$(".get-link-box").removeClass("public");

									$.niceToast.clear();
									$.niceToast.error('<strong>Error</strong>: '+response.error['message']);
								});
							} else {
								$(".get-link-box").removeClass("public");
								_self.deletePermission(file, "anyoneWithLink", $("#dialogForm"), null, function(){
									$(_self.role("txt_type")).html($.trim(current_selected.text()));
									$(_self.role("share-type")+" li").removeClass("selected");
									current_selected.addClass("selected");
									$(".get-link-box").removeClass("public").addClass("public");
								});
								
							}
							
						}
					});
					$(document).on("click.share", _self.role("share-role")+" li", function(e){
						let current_selected = $(_self.role("share-role")+" li.selected");
						if(!$(this).hasClass("selected")){
							$(_self.role("share-role")+" li").removeClass("selected");
							$(this).addClass("selected");
							$(_self.role("txt_role")).html($.trim($(this).text()));
							let request_opt = {
								id: "anyoneWithLink",
								role: $.trim($(this).data("role"))
							};
							_self.updatePermission(file, request_opt, $("#dialogForm"), null, function(){
								$(_self.role("txt_role")).html($.trim(current_selected.text()));
								$(_self.role("share-role")+" li").removeClass("selected");
								current_selected.addClass("selected");
							});
						}
					});
					$(document).on("click.share", _self.role("copy-link"), function(e){
						let input = $(this).siblings("div.link").find("input");
						input.focus().select();
						if (document.execCommand('copy')) {
							$.niceToast("Copy successfully!", {
								timeout: 3000
							});
						}
					});
					$(document).on("click.share", ".share-user", function(e){
						let parent = $(this).parents(".driveShare");
						if(!parent.hasClass("open-share-user")){
							$(this).find(".title_icon").html('<i class="bx bx-arrow-back"></i>');
							parent.removeClass("open-share-user").addClass("open-share-user");
							$.resizeDialog();
						}
					});
					$(document).on("click.share", ".share-user .title_icon", function(e){
						e.stopPropagation();
						let parent = $(this).parents(".driveShare");
						if(parent.hasClass("open-share-user")){
							$(this).html('<i class="bx bx-user-plus"></i>');
							parent.removeClass("open-share-user");
						} else {
							$(this).html('<i class="bx bx-arrow-back"></i>');
							parent.removeClass("open-share-user").addClass("open-share-user");
						}
						$.resizeDialog();
					});
					$(document).on("click.share", _self.role("share_user_submit"), function(e){
						e.stopPropagation();
						let emailAddress = $.trim($(_self.role("share_user_emailAddress")).val());
						let role = $.trim($(_self.role("share_user_role")).val());
						if(!emailAddress || !role){
							return false;
						}
						_self.addPermission(file, {type: 'user', role: role, emailAddress: emailAddress}, $("#dialogForm"), function(user){
							$(_self.role("share_user_list")).append(html_user_share(user));
							$.niceToast.clear();
							$.niceToast('Access have been updated', {
								timeout: 3000
							});
						}, function(response){
							$.niceToast.clear();
							$.niceToast.error('<strong>Error</strong>: '+response.error['message']);
						});
					});
					$(document).on("click.share", _self.role("share-role-user")+" li", function(e){
						let current_selected = $(_self.role("share-role-user")+" li.selected");
						let id_permission = $(this).parents(".user").data("id");
						let parent = $(this).parents(".action");
						let role = $.trim($(this).data("role"));
						if(!$(this).hasClass("selected")){
							
							parent.find("li").removeClass("selected");
							$(this).addClass("selected");
							parent.find(".role-options").html($.trim($(this).text()));
							if(role === "delete") {
								_self.deletePermission(file, id_permission, $("#dialogForm"), function(){
									$(this).parents(".user").remove();
								}, function(){
									parent.find(".role-options").html($.trim(current_selected.text()));
									parent.find("li").removeClass("selected");
									current_selected.addClass("selected");
								});
							} else {
								let request_opt = {
									id: id_permission,
									role: role
								};
								_self.updatePermission(file, request_opt, $("#dialogForm"), null, function(){
									parent.find(".role-options").html($.trim(current_selected.text()));
									parent.find("li").removeClass("selected");
									current_selected.addClass("selected");
								});								
							}
						}
					});
				break;

				case _self.role_move_file:
					var type = _self.isFolder(file) ? 'Folder' : 'File';
					if(file['ownedByMe'] !== true){
						if(typeof GDrive.listDrives[file['owners'][0]['emailAddress']] !== "undefined"){
							let location_drive = _Config['url_drive']+'/'+GDrive.listDrives[file['owners'][0]['emailAddress']].drive+'#'+file['parents'][0];
							
							$.sendConfirm({
								title: 'Error Move',
								msg: 'Owners: <b>'+GDrive.listDrives[file['owners'][0]['emailAddress']].name+'</b>',
								desc: 'To be able to move this '+type+', you must go to the owner\'s Drive?',
								button: {
									confirm: 'Go to Drive',
									cancel: 'Cancel'
								},
								isFixed: true,
								onConfirm: function() {
									window.open(location_drive, '_blank');
									$.closeDialog();
								},
								onCancel: function() {},
								onClose: function() {}
							});
						} else {
							$.niceToast.clear();
							$.niceToast.warning("Can't delete other people's files!");
						}
					} else {
						var htmlForm = '\
							<div id="dialogForm" class="mapFolder">\
							</div>\
						';

						$.sendMsg(htmlForm, false);
						addScreenLoading($("#dialogForm"));
						_self.getMapFolder([file], $("#dialogForm"));
					}

				break;

				case _self.role_change_name_file:
					var htmlForm = '\
						<div id="dialogForm">\
							<input role="dialog_input_name" class="form-control" type="text" value="'+file['title']+'">\
						</div>\
					';
					$.sendConfirm({
						title: 'Change name',
						content: htmlForm,
						button: {
							confirm: 'Ok',
							cancel: 'Cancel'
						},
						isFixed: true,
						bgHide: false,
						callback: function(){
							$("#dialogForm input"+_self.role("dialog_input_name")).on("keyup", function(){
								let input = $.trim($(this).val());
								if(!input){
									$(".j_dialogConfirm").addClass("disabled");
								} else {
									$(".j_dialogConfirm").removeClass("disabled");
								}
							});
						},
						onBeforeConfirm: function(){
							let new_name = $.trim($("#dialogForm input"+_self.role("dialog_input_name")).val());
							if(new_name){
								_self.actionChangeName(new_name, file);
								return true;									
							}
							return false;
						},
						onConfirm: function() {
						},
						onCancel: function() {},
						onClose: function() {}
					});
				break;

				case _self.role_info_file:
					let location_drive = "";

					if(file['ownedByMe'] !== true){
						if(typeof GDrive.listDrives[file['owners'][0]['emailAddress']] !== "undefined"){
							location_drive = '<a target="_blank" href="'+_Config['url_drive']+'/'+GDrive.listDrives[file['owners'][0]['emailAddress']].drive+'#'+file['parents'][0]+'"><i class="bx bx-subdirectory-right" style="background: #f1f1f1;padding: 5px 10px;"></i> </a>';
						}
					} else {
						location_drive = "(me) ";
					}


					var htmlForm = '<div id="dialogForm" class="driveInfo">';

					/*
					htmlForm += '<div class="title">Person with access rights</div>\
							<div class="access">';
					var users = file['permissions'].filter(function(o){
						return o['type'] === "user" && o['role'] !== "owner" && o['emailAddress'] !== _Config['user_ps'];
					});



					if(users.length > 0){
						htmlForm += '<div>';
						users.forEach(function(user){
							let title = user['name'];
							if(user['role'] === "owner"){
								title += " is owner";
							} else if(user['role'] === "reader"){
								title += " can view";
							} else if(user['role'] === "writer"){
								title += " can edit";
							}
							htmlForm += '<img class="user-access" src="'+user['photoLink']+'" title="'+title+'">';
						});
						htmlForm += '</div>';
					}
					htmlForm += '<div>';

					htmlForm += (_self._getShare(file) === false ? '<div class="private-share"><i class="bx bx-lock"></i></div> Not shared' : '<div class="public-share"><i class="bx bx-link-alt"></i></div> Anyone with a link')+'\
								</div>\
							</div>';
					*/

					htmlForm += '<div class="title">System properties</div>\
							<ul class="drive-file-info">\
								<li>\
									<div class="name">Name:</div>\
									<div class="value">\
										'+file['title']+'\
									</div>\
								</li>\
								<li>\
									<div class="name">Type:</div>\
									<div class="value">\
										<img src="'+file['iconLink']+'">\
										'+file['mimeType']+'\
									</div>\
								</li>';
					if(_self.isFile(file)){
						htmlForm += '<li><div class="name">Size:</div><div class="value"> '+_self._sizeFormat(file['size'])+'</div></li>\
							<li><div class="name">Used storage:</div><div class="value"> '+_self._sizeFormat(file['quotaBytesUsed'])+'</div></li>';
					}
					htmlForm += '<li>\
									<div class="name">Location: </div>\
									<div id="location_file" class="value">\
										<img src="'+_self.infoFolder['iconLink']+'">\
										'+_self.infoFolder['title']+'\
									</div>\
								</li>\
								<li>\
									<div class="name">Owner:</div>\
									<div class="value" title="'+file['owners'][0]['emailAddress']+'">\
										'+location_drive+' \
										'+file['owners'][0]['displayName']+'\
									</div>\
								</li>\
								<li><div class="name">Last edited:</div><div class="value">'+new Date(file['modifiedDate']).toLocaleString()+'</div></li>\
								<li><div class="name">Created:</div><div class="value">'+new Date(file['createdDate']).toLocaleString()+'</div></li>\
							</ul>\
						</div>';

					GDrive.execute("fileInfo", {
						id: file['parents'][0],
						resourcekey: file['resourceKey'] || _self.resourceKey,
						fields: "id,title,parents,iconLink,resourceKey",
						success: function(data){
							$("#location_file").html('<img src="'+data['iconLink']+'"> '+data['title']);
						}
					});

					$.sendMsg(htmlForm, false);
				break;

				case _self.role_copy_file:
					_self.actionCopy([file], _self.getIdFolderByHash());
				break;

				case _self.role_copy_my_drive:
					_self.actionCopy([file], GDrive.rootFolderId, true);
				break;

				case _self.role_download_file:
					_self.actionDownload(file);
				break;

				case _self.role_delete_file:

					var type = (_self.isFolder(file) ? 'Folder' : 'File');

					if(file['ownedByMe'] !== true){
						if(typeof GDrive.listDrives[file['owners'][0]['emailAddress']] !== "undefined"){
							let location_drive = _Config['url_drive']+'/'+GDrive.listDrives[file['owners'][0]['emailAddress']].drive+'#'+file['parents'][0];
							
							$.sendConfirm({
								title: 'Error Delete',
								msg: 'Owners: <b>'+GDrive.listDrives[file['owners'][0]['emailAddress']].name+'</b>',
								desc: 'To be able to delete this '+type+', you must go to the owner\'s Drive?',
								button: {
									confirm: 'Go to Drive',
									cancel: 'Cancel'
								},
								isFixed: true,
								onConfirm: function() {
									window.open(location_drive, '_blank');
									$.closeDialog();
								},
								onCancel: function() {},
								onClose: function() {}
							});
						} else {
							$.niceToast.clear();
							$.niceToast.warning("Can't delete other people's files!");
						}
					} else {
						$.sendConfirm({
							title: 'Move trash',
							msg: type +': <strong>'+file['title']+'</strong>',
							desc: 'you really want to delete this '+type+'?',
							button: {
								confirm: 'Move trash',
								cancel: 'Cancel'
							},
							isFixed: true,
							onConfirm: function() {
								_self.actionTrash(file);
							},
							onCancel: function() {},
							onClose: function() {}
						});						
					}


				break;

				case _self.role_restore_file:
					_self.actionUndoTrash(file, true);
				break;

				case _self.role_delete_forever_file:
					var type = (_self.isFolder(file) ? 'Folder' : 'File');
					$.sendConfirm({
						title: 'Delete Forever',
						msg: type +': <strong>'+file['title']+'</strong>',
						desc: 'will be permanently deleted and you cannot restore it?',
						button: {
							confirm: 'Delete Forever',
							cancel: 'Cancel'
						},
						isFixed: true,
						onConfirm: function() {
							_self.actionDelete([file]);
						},
						onCancel: function() {},
						onClose: function() {}
					});

				break;
			}
		});


		/////////// breadcrumb click /////////////////
		$(document).on("click", "#drive_breadcrumb > li:not(:last-child)", function(){
			$(this).next("li").remove();
			if($(this).data("resourceKey") !== null){
				document.location.hash = $(this).data("id")+($(this).data("resourceKey") ? "?resourcekey="+$(this).data("resourceKey") : '');
			} else {
				document.location.hash = $(this).data("id");
			}
		});


		let check_search = false;
		/////////////////// search ///////////////////////////
		$(_self.role(_self.role_search)).on('keyup', function (e) {
			let keyword = $.trim($(this).val());
	    	let id_folder = _self.getIdFolderByHash() === "trash" || _self.getIdFolderByHash() === "sharedWithMe" || _self.getIdFolderByHash() === "recent" || keyword ? null : _self.getIdFolderByHash();
	    	let trash = _self.getIdFolderByHash() === "trash" ? true : false;
	    	let sharedWithMe = _self.getIdFolderByHash() === "sharedWithMe" ? true : false;
	    	let recent = _self.getIdFolderByHash() === "recent" ? true : false;

		    if (e.key === 'Enter' || e.keyCode === 13) {
		    	if(keyword !== ""){
		    		check_search = true;
		    	} else {
		    		check_search = false;
		    	}
		    	_self.getFolder(id_folder, trash, keyword, sharedWithMe, recent);
		    }
	    	if(keyword !== ""){
	    		$(_self.role(_self.cancel_search)).show();
	    	} else {
	    		$(_self.role(_self.cancel_search)).hide();
	    	}
		});

		$(_self.role(_self.cancel_search)).on("click", function(){
			$(_self.role(_self.role_search)).val("");
			$(this).hide();
			if(check_search === true){
				check_search = false;
		    	let id_folder = _self.getIdFolderByHash() === "trash" || _self.getIdFolderByHash() === "sharedWithMe" || _self.getIdFolderByHash() === "recent" || keyword ? null : _self.getIdFolderByHash();
		    	let trash = _self.getIdFolderByHash() === "trash" ? true : false;
		    	let sharedWithMe = _self.getIdFolderByHash() === "sharedWithMe" ? true : false;
		    	let recent = _self.getIdFolderByHash() === "recent" ? true : false;
				_self.getFolder(id_folder, trash, null, sharedWithMe, recent);
			}
		});

		/////////////////// upload file//////////////////////////
		$(_self.role("upload-file")).on("click", function(e){
			e.stopPropagation();
			$(_self.role("menu_create")).removeClass("show");
			GDrive.execute("refreshToken");
			$(_self.input_upload_file).val("");
			$(_self.input_upload_file).click();
		});
	    $(_self.input_upload_file).on("change", function () {
	        var uploadObj = $(this);
	        _self.uploadFile(uploadObj.prop("files"));
	    });


		/////////////////// upload folder//////////////////////////
		$(_self.role("upload-folder")).on("click", function(e){
			e.stopPropagation();
			$(_self.role("menu_create")).removeClass("show");
			GDrive.execute("refreshToken");
			$(_self.input_upload_folder).val("");
			$(_self.input_upload_folder).click();
		});
	    $(_self.input_upload_folder).on("change", function () {
	        var uploadObj = $(this);
	        _self.uploadFolder(uploadObj.prop("files"));
	    });


		/////////////////// import drive //////////////////////////
		$(_self.role("import-drive")).on("click", function(e){
			var htmlForm = '\
				<div id="dialogForm">\
					<div class="form-group">\
						<label class="control-label">Type Import:</label>\
						<div class="col-12">\
							<span class="form-check form-check-inline">\
								<input class="form-check-input" type="radio" id="type_all" role="dialog_input_type" name="type_import" value="all" checked>\
								<label class="form-check-label" for="type_all">\
									<font color="green">All files</font>\
								</label>\
							</span>\
							<span class="form-check form-check-inline">\
								<input class="form-check-input" type="radio" id="type_foldes" role="dialog_input_type" name="type_import" value="folders">\
								<label class="form-check-label" for="type_folders">Only folders</label>\
							</span>\
							<span class="form-check form-check-inline">\
								<input class="form-check-input" type="radio" id="type_files" role="dialog_input_type" name="type_import" value="files">\
								<label class="form-check-label" for="type_files">Only files</label>\
							</span>\
						</div>\
					</div>\
					<div class="form-group">\
						<div class="col-12">\
							<label class="form-label">Import Link:</label>\
							<input role="dialog_input_link" class="form-control" type="text" placeholder="https://drive.google.com/xxxxxx">\
						</div>\
					</div>\
					<div class="form-group">\
						<div class="col-12">\
							<label class="form-label">Replace Name:</label>\
							<input role="dialog_input_name" class="form-control" type="text" placeholder="Leave blank to keep name">\
						</div>\
					</div>\
				</div>\
			';
			$.sendConfirm({
				title: 'Import Drive',
				content: htmlForm,
				button: {
					confirm: 'Import',
					cancel: 'Cancel'
				},
				isFixed: true,
				bgHide: false,
				callback: function(){

				},
				onBeforeConfirm: function(){
					let type = $.trim($("#dialogForm input"+_self.role("dialog_input_type")+":checked").val());
					let link = $.trim($("#dialogForm input"+_self.role("dialog_input_link")).val());
					let name = $("#dialogForm input"+_self.role("dialog_input_name"));
					type = type || "all";


					let id_folder = null;
					let resourceKey = null;

					let regex_link = /^(.*)\/(folders\/|file\/d\/)([A-Za-z0-9-_]+)([\/\?]?)(.*?)$/gis;
					let regex_resourceKey = /resourcekey=([A-Za-z0-9-_]+)/gis;
					if(link.match(regex_link)){
						let match_link = regex_link.exec(link);
						id_folder = match_link[3];
						if(match_link[5].match(regex_resourceKey)){
							let match_resourceKey = regex_resourceKey.exec(match_link[5]);
							resourceKey = match_resourceKey[1];
						}				
					}

					if(!id_folder) {
						$.niceToast.clear();
						$.niceToast.error("<strong>Error</strong>: Invalid import link");
						return false;
					}

					$.niceToast.clear();

					addScreenLoading($("#dialogConfirmBox"));
					GDrive.execute("fileInfo", {
						id: id_folder,
						resourcekey: resourceKey,
						success: function(file){
							if(!$.trim(name.val())){
								name.val(file['title']);
							}

							let parent_import = _self.getIdFolderByHash();

							if(parent_import === "trash" || parent_import === "sharedWithMe" || parent_import === "recent"){
								parent_import = GDrive.rootFolderId;
							}
							GDrive.execute("getAbout", {
								success: function(about){

									if(_self.isFolder(file)){
										let query = [
											"trashed=false"
										];
										if(type === "folders"){
											query.push("mimeType='"+_self.type_folder+"'");
										} else if(type === "files"){
											query.push("mimeType!='"+_self.type_folder+"'");
										}

										_self.total_size_import = 0;
										_self.total_file_import = 0;
										_self.import_data = [];
											
										_self.import = [{
											parent: parent_import,
											file: file,
											status: "pending"
										}];

										if(_self.isImporting === false){
											_self.importFolder($.trim(name.val()), query);
										}

									} else {
										if(about.storageQuota['usage'] === "" || (about.storageQuota['limit'] - about.storageQuota['usage']) >= file['size']){
											if(name !== file['title']){
												file['title'] = $.trim(name.val());
											}
											_self.actionCopy([file], parent_import, false, $("#dialogConfirmBox"), false);
										} else {
											$.niceToast.clear();
											$.niceToast.error('<strong>Error</strong>: Not enough storage. Need an extra '+_self._sizeFormat(file['size'] - (about.storageQuota['limit'] - about.storageQuota['usage']))+' to be able to import this item');
											removeScreenLoading($("#dialogConfirmBox"));
										}
									}
								},
								error: function(response){
									$.niceToast.clear();
									$.niceToast.error('<strong>Error</strong>: '+response.error['message']);
									removeScreenLoading($("#dialogConfirmBox"));
								}
							});

						},
						error: function(response){
							$.niceToast.clear();
							$.niceToast.error('<strong>Error</strong>: '+response.error['message']);
							removeScreenLoading($("#dialogConfirmBox"));
						}
					});
					return false;
				},
				onConfirm: function() {
				},
				onCancel: function() {},
				onClose: function() {}
			});
		});


		/////////////////// create shortcut //////////////////////////
		$(_self.role("new_shortcut")).on("click", function(e){
			var htmlForm = '\
				<div id="dialogForm">\
					<div class="form-group">\
						<div class="col-12">\
							<label class="form-label">Enter drive link:</label>\
							<input role="dialog_input_link" class="form-control" type="text" placeholder="https://drive.google.com/xxxxxx">\
						</div>\
					</div>\
				</div>\
			';
			$.sendConfirm({
				title: 'New Shortcut',
				content: htmlForm,
				button: {
					confirm: 'Create',
					cancel: 'Cancel'
				},
				isFixed: true,
				bgHide: false,
				callback: function(){

				},
				onBeforeConfirm: function(){
					let link = $.trim($("#dialogForm input"+_self.role("dialog_input_link")).val());

					let id_folder = null;
					let resourceKey = null;

					let regex_link = /^(.*)\/(folders\/|file\/d\/)([A-Za-z0-9-_]+)([\/\?]?)(.*?)$/gis;
					let regex_resourceKey = /resourcekey=([A-Za-z0-9-_]+)/gis;
					if(link.match(regex_link)){
						let match_link = regex_link.exec(link);
						id_folder = match_link[3];
						if(match_link[5].match(regex_resourceKey)){
							let match_resourceKey = regex_resourceKey.exec(match_link[5]);
							resourceKey = match_resourceKey[1];
						}				
					}

					if(!id_folder) {
						$.niceToast.clear();
						$.niceToast.error("<strong>Error</strong>: Invalid drive link");
						return false;
					}

					addScreenLoading($("#dialogConfirmBox"));
					GDrive.execute("fileInfo", {
						id: id_folder,
						resourcekey: resourceKey,
						success: function(file){
							_self.actionCreateShortCut(file, _self.getIdFolderByHash(), function(){
								removeScreenLoading($("#dialogConfirmBox"));
								$.closeDialog();
							}, function(response){
								$.niceToast.clear();
								$.niceToast.error('<strong>Error</strong>: '+response.error['message']);
								removeScreenLoading($("#dialogConfirmBox"));
							});
						},
						error: function(response){
							$.niceToast.clear();
							$.niceToast.error('<strong>Error</strong>: '+response.error['message']);
							removeScreenLoading($("#dialogConfirmBox"));
						}
					});
					return false;
				},
				onConfirm: function() {
				},
				onCancel: function() {},
				onClose: function() {}
			});
		});

	    //////// leave page ////////////////
		window.onbeforeunload = function(){
			if(_self.upload.some(function(o){ return o['status'] === "pending"}) === true){
				return 'Are you sure you want to leave?';
			}
		};

		/////////////////// load folder ///////////////////////
		window.onhashchange = function() {
			let id_folder = _self.getIdFolderByHash();
			_self._unSelected();
			_self.removePreviewFile();
			$.niceToast.clear();
			$.closeDialog();

			if(id_folder === "trash"){
				_self.getFolder(null, true);
				_self.accessTrash();
			} else if(id_folder === "sharedWithMe"){
				_self.accessSharedWithMe();
				_self.getFolder(null, false, null, true);
			} else if(id_folder === "recent"){
				_self.accessRecent();
				_self.getFolder(null, false, null, false, true);
			} else {
				_self.accessMyDrive();

				_self.parents = _self.parents.filter(function(o) {
					return o['title'] !== "trash" || o['title'] !== "sharedWithMe" || o['title'] !== "recent";
				});
				let breadcumd_index = _self.parents.map(function(o) {
					return o.id;
				}).indexOf(id_folder);
				_self.parents = _self.parents.slice(0, (breadcumd_index + 1));
				_self.browseFolder(id_folder);					

				_self.getFolder(id_folder);				
			}
		}
	}
};

GDrive.onLoad(function(){
	myDrive.run(myDrive.getIdFolderByHash());		
}, function(error){
	myDrive.isEmptyFolder(true);
	removeScreenLoading(myDrive.div_list_item);
	$.niceToast.clear();
	$.niceToast.error(error.error.message);
});