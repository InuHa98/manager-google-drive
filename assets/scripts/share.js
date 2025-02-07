/*!
 * private share.js v1.0.0
 * Copyright 2021-present inuHa
 *
 */
var _Share = {
	currentTitle: document.title,
	infoFolder: null,
	resourcekey: null,
	parents: [],
	DATA_FILES: [],
	ALL_FOLDERS: [],

	type_folder: 'application/vnd.google-apps.folder',
	type_shortcut: 'application/vnd.google-apps.shortcut',

	class_file: "drive-file",
	div_breadcrumb: $("#drive_breadcrumb"),
	div_list_item: $("#listFile"),

	role_list_folders: 'role_list_folders',
	role_list_files: 'role_list_files',

	role_folder: 'drive_folder',
	role_file: 'drive_file',

	role_action_file: 'role_action_file',
	role_info_file: 'role_info_file',
	role_download_file: 'role_download_file',

	css_append_folder: null,
	css_append_file: null,

	toast: null,

	role: function(role_name){
		return '[role='+role_name+']';
	},

	isEmptyFolder: function(type, text = null){
		if(type === false){
			if(this.div_list_item.children(".empty-folder").length > 0){
				this.div_list_item.html("");
			}		
		} else {
			if(this.div_list_item.children(".empty-folder").length < 1){
				this.div_list_item.html('<div class="empty-folder"><div class="bg-empty"><div class="txt-empty"><span>'+(text !== null ? text : 'This folder is empty.')+'</span></div></div></div>');
			}				
		}
	},

	isFolder: function(file){
		if(file['mimeType'] === undefined){
			return false
		};

		if(file['mimeType'] === this.type_shortcut){
			file['iconLink'] = "https://drive-thirdparty.googleusercontent.com/32/type/"+file['shortcutDetails']['targetMimeType'];
			return (file['shortcutDetails']['targetMimeType'] === this.type_folder) ? true : false;
		}

		return (file['mimeType'] === this.type_folder) ? true : false;
	},
	isFile: function(file){
		if(file['mimeType'] === undefined){
			return false
		};

		if(file['mimeType'] === this.type_shortcut){
			file['iconLink'] = "https://drive-thirdparty.googleusercontent.com/32/type/"+file['shortcutDetails']['targetMimeType'];
			return (file['shortcutDetails']['targetMimeType'] !== this.type_folder) ? true : false;
		}

		return (file['mimeType'] !== this.type_folder) ? true : false;
	},
	_getShare: function(file){
		if(typeof file !== "object"){
			return false;
		}

		return file['permissions'].find(function(o){
			return o['id'] === "anyoneWithLink";
		}) || false; 
	},
	_lazyload: new LazyLoad({
        container: document.getElementById("scroll_view") || document,
        threshold: 200
    }),
	_resetLazyImage: function(){
		this._lazyload.update();
	},
	_getDataFileById: function(id){
		if(!id){
			return false;
		}
		id = this._link(id);

		return this.DATA_FILES.find(function(o){
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
	_getThumbnailById: function(file, size = "w250-h188-p"){ // w250-h188-p
		if(!file['id'] || !size){
			return false;
		}
		if(file['canCopy'] === true){
			return this._changeSizeThumbnailLink(file, size);
		}
		return url_thumbnail+'/'+size+'/'+file['id']+'/thumbnail.png';
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

		return '<li role="'+_self.role_folder+'" class="'+_self.class_file+' folder" title="'+folder['title']+'" data-id="'+this._link(folder['id'])+'">\
			<div class="file-info">\
				<div class="flex-left">\
					<div class="icon">\
						<img src="'+_self._changeSizeIconLink(folder['iconLink'], 32)+'">\
						'+(folder['shortcutDetails'] !== null ? shortcut : '')+'\
					</div>\
					<div class="txt">\
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
						<ul role="'+_self.role_action_file+'" class="drop-menu" data-id="'+_self._link(folder['id'])+'">\
							<li role="'+_self.role_info_file+'" class="border-top"><i class="bx bx-info-circle"></i> Info</li>\
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
			<svg width="40px" height="40px" viewBox="0 0 40 40" focusable="false">\
				<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">\
					<path opacity="0.54" fill="#000000" d="M20,0 C8.95,0 0,8.95 0,20 C0,31.05 8.95,40 20,40 C31.05,40 40,31.05 40,20 C40,8.95 31.05,0 20,0 L20,0 Z"></path>\
					<path fill="#FFFFFF" d="M16,29 L16,11 L28,20 L16,29 L16,29 Z"></path>\
				</g>\
			</svg>';

		return  '<li role="'+_self.role_file+'" class="'+_self.class_file+' file" data-id="'+this._link(file['id'])+'">\
			<div class="preview">\
				<img class="lazy" data-src="'+_self._getThumbnailById(file)+'" src="'+_self._changeSizeIconLink(file['iconLink'], 128)+'">\
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
					'+( file['shortcutDetails'] === null ? '\
				</div>\
				<div class="flex-right">\
					<div class="hide-info">\
						<div class="owner" title="'+file['owners'][0]['emailAddress']+'">'+file['owners'][0]['displayName']+'</div>\
						<div class="size">—</div>\
					</div>\
					<div role="menu_file" class="menu dropdown">\
						<div class="drop-button">\
							<i class="bx bx-dots-vertical"></i>\
						</div>\
						<ul role="'+_self.role_action_file+'" class="drop-menu" data-id="'+_self._link(file['id'])+'">\
							<li role="'+_self.role_info_file+'" class="border-top"><i class="bx bx-info-circle"></i> Info</li>\
							<li role="'+_self.role_download_file+'" class="border-bottom"><i class="bx bx-download"></i> Download</li>\
						</ul>\
					</div>\
				</div>\
				' : '')+'\
			</div>\
		</li>';
	},
	changeBreadcrumb: function(arr_parents){
		var _self = this;
		let parents = arr_parents || this.parents;
		let html = '';

		if(parents){
			parents.forEach(function(parent, i){
				html += '<li data-position="'+i+'" data-id="'+_self._link(parent['id'])+'" title="'+parent['name']+'"><div class="br-item"><span>'+parent['name']+'</span></div></li>';					
			});
		}
		this.div_breadcrumb.html(html);
	},
	browseFolder: function(file){
		if(typeof file === "string"){
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

			document.location.hash = this._link(file['id']);
			document.title = file['title'] + ' - '+this.currentTitle;
			this.infoFolder = file;					

		}

	},
	getFullParents: function(file){
		let _self = this;
		if(!file){
			return false;
		}


		let parents = [{id: _self._link(file['id']), name: file['title'], iconLink: file['iconLink']}];
		let getParent = function(id){

			GDrive.execute("fileInfo", {
				id: id,
				fields: "id,title,parents,iconLink",
				success: function(data){

					parents.push({id: id, name: data['title'], iconLink: data['iconLink']});
					if(data.parents[0]){
						getParent(data.parents[0]);
					} else {
						parents.reverse();
						_self.parents = parents;
						_self.changeBreadcrumb(parents);
					}
				}
			});

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
	getFolder: function(id_folder, trash = false, keyword = null){
		var _self = this;

		addScreenLoading(_self.div_list_item, "fixed_loading");
		let query = [
			"trashed="+trash
		];
		if(keyword !== null){
			query.push("title contains '"+keyword+"'");
		}
		_self.DATA_FILES = [];
		var isLoadPage = true;
		var nextPageToken = null;

		let total_folder = 0;
		let total_file = 0;
		
		let load_folder = function(){
			GDrive.execute("listFiles", {
				id: id_folder,
				resourcekey: _self.resourcekey,
				maxResults: 100,
				loadFull: false,
				nextPageToken: nextPageToken,
				q: query,
				success: function(data, next_page_token){

					if(nextPageToken === null){

						_self.div_list_item.html("");

						if(data.length < 1){
							removeScreenLoading(_self.div_list_item);
							return _self.isEmptyFolder(true, keyword == null ? null : "No result is found");
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

					total_folder += folders.length;
					total_file += files.length;

					let htmlFolders = '';
					let htmlFiles = '';
					if(folders.length > 0){
						if($(_self.role(_self.role_list_folders)).length < 1){
							_self.div_list_item.prepend(_self._htmlDivListFolders());
						}
						folders.forEach(function(folder){
							htmlFolders += _self._htmlFolder(folder, trash);
						});
					}

					if(files.length > 0){
						if($(_self.role(_self.role_list_files)).length < 1){
							_self.div_list_item.append(_self._htmlDivListFiles());
						}
						files.forEach(function(file){
							htmlFiles += _self._htmlFile(file, trash);
						});
					}


					$(_self.role(_self.role_list_folders)).append(htmlFolders);
					$(_self.role(_self.role_list_files)).append(htmlFiles);

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
					_self.autoReload = false;
				},
				error: function(response){
					isLoadPage = false;
					$.niceToast.clear();
					$.niceToast.error('<strong>Error</strong>: '+response.error['message']);
					removeScreenLoading(_self.div_list_item);

					if(_self.DATA_FILES.length < 1){
						_self.isEmptyFolder(true);	
					}
								
					if(response.error.code === 401 && nextPageToken === null && _self.autoReload === true){
            			GDrive.execute("refreshToken", {
            				success: function(){
            					_self.getFolder(id_folder, trash, keyword);
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
				_self.parents.push({id: _self._link(file['id']), name: file['title'], iconLink: file['iconLink']});
				document.location.hash = _self._link(file['id']);
			} else {
				window.open(_self._linkShare(file['shortcutDetails']['targetId'], file['shortcutDetails']['targetMimeType'], file['shortcutDetails']['targetResourceKey']), "_blank");
			}
		});

	},
	_linkShare: function(id, type,  resourcekey){
		if(type !== this.type_folder){
			return "https://drive.google.com/file/d/"+id+"/view?usp=drivesdk"+(resourcekey ? "&resourcekey="+resourcekey : "");
		}
		return "https://drive.google.com/drive/folders/"+id+(resourcekey ? "?resourcekey="+resourcekey : "");
	},
	_link: function(id){
		return id.split("").reverse().join("");
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
				<div class="zoom-bar">\
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

		let regex = /^(image|video|audio)\/(.*?)$/gis;
		if(file['mimeType'].match(regex)){
			let mimeType = regex.exec(file['mimeType']);

			var extension_image = ['image/jpg', 'image/jpe', 'image/jpeg', 'image/jfif', 'image/png', 'image/bmp', 'image/dib', 'image/gif'];
			if(extension_image.indexOf(file['mimeType']) > -1){
				create_image();
			} else if(mimeType[1] === "video"){
				$("#preview-loading").hide();
				$("#preview-file").html('<video src="'+url_stream+'/'+file['id']+'" controls></video>');
			} else if(mimeType[1] === "audio"){
				$("#preview-loading").hide();
				$("#preview-file").html('<audio src="'+url_stream+'/'+file['id']+'" controls></audio>');
			} else {
				no_preview();
			}
		} else {
			no_preview();
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

		_self.downloadFile(file);

	},

	getIdFolderByHash: function(){
		var _self = this;
		let hash = window.location.hash.substring(1) || GDrive.rootFolderId;
		let regex = /^(.*?)\?resourcekey=(.*?)$/gis;
		if(hash.match(regex)){
        	let match = regex.exec(hash);
        	_self.resourcekey = match[2];
        	return _self._link(match[1]);
		}
		_self.resourcekey = null;
		return _self._link(hash);
	},

	run: function(id_folder){
		var _self = this;

		/////////////////// load folder by id ///////////////////////
		GDrive.execute("fileInfo", {
			id: id_folder,
			success: function(data){
				_self.infoFolder = data;
				_self.browseFolder(data);
				
				if(_self.isFile(data)){
					$(".home-section").remove();
					$(".sidebar").remove();
					removeScreenLoading(_self.div_list_item);
					_self.addPreviewFile(data, true);
				} else {
					_self.getFolder(id_folder);
				}
			},
			error: function(){
				_self.isEmptyFolder(true, 'File not found');
				removeScreenLoading(_self.div_list_item);
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


		/////////// breadcrumb click /////////////////
		$(document).on("click", "#drive_breadcrumb li", function(){
			$(this).next("li").remove();
			document.location.hash = $(this).data("id");
		});


		/////////////////// show memu file ///////////////////////
		dropdownmenu(".dropdown");

		$(document).on("click", _self.role(_self.role_action_file),  function(e){
			let target = $(e.target);
			let file = _self._getDataFileById($(this).data("id"));

			if(typeof file === "undefined"){
				return false;
			}

			let target_li = $(this).parents("li[data-id="+_self._link(file['id'])+"]");

			$.niceToast.clear();
			switch(target.attr("role")) {

				case _self.role_info_file:
					var htmlForm = '\
						<div id="dialogForm" class="driveInfo">\
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
						htmlForm += '<li><div class="name">Size:</div><div class="value"> '+_self._sizeFormat(file['size'])+'</div></li>';
					}
					htmlForm += '</ul></div>';

					$.sendMsg(htmlForm, false);
				break;

				case _self.role_download_file:
					_self.actionDownload(file);
				break;
			}
		});


		/////////////////// load folder ///////////////////////
		window.onhashchange = function() {
			let id_folder = _self.getIdFolderByHash();
			_self.removePreviewFile();
			$.niceToast.clear();

			let breadcumd_index = _self.parents.map(function(o) {
				return o.id;
			}).indexOf(id_folder);
			_self.parents = _self.parents.slice(0, (breadcumd_index + 1));
			_self.browseFolder(id_folder);					

			_self.getFolder(id_folder);				

		}
	}
};

GDrive.onLoad(function(){
	_Share.run(_Share.getIdFolderByHash());		
}, function(error){
	_Share.isEmptyFolder(true, 'File not found');
	removeScreenLoading(_Share.div_list_item);
});