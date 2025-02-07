/*!
 * GoogleDriveAPI.js v1.0.0
 * Copyright 2021-present inuHa
 *
 */
 var GoogleDriveAPI = function(options = {}){
    var self = this;
    var noop = function(){};
    this._Config = {
        "access_token": options.access_token || null,
        "expires_in": options.expires_in || 0,
        "created": options.created || 0
    };
    this.rootFolderId = options.rootFolderId || "root";
    this.url_refresh_token = options.url_refresh_token || null; 
    this.storageQuota = {
        "limit": options.storageQuota_limit || 0,
        "usage": options.storageQuota_usage || 0,
        "usageInDrive": options.storageQuota_usageInDrive || 0,
        "usageInDriveTrash": options.storageQuota_usageInDriveTrash || 0
    };

    this.listDrives = options.listDrives || [];

    this.success = function(response){};
    this.error = function(response = null, callback = null){
        if(response === null){
            return;
        }
        if(typeof response.error !== "undefined"){
            if(response.error['code'] === 401 && this.url_refresh_token !== null){
                this.refreshToken({
                    success: callback
                });
            }
        }
    };

    this.xhr_uploader = [];
    this.progressUpload = 0;
    this.xhr_download = null;
    this.blob_download = null
};

GoogleDriveAPI.prototype.onLoad = function(callback, error) {
    var self = this;
    if(this.rootFolderId === "root"){
        this.getAbout({
            success: callback.bind(self),
            error: error.bind(self)
        });
        return;
    }
    if (callback && typeof(callback) === "function") {
        callback.bind(self)();
    }
};

GoogleDriveAPI.prototype.execute = function(action, options){
    var self = this;

    if(GoogleDriveAPI.prototype.hasOwnProperty(action)){
        this[action](options);
    } else {
       throw new Error('Action \''+action+'\' not found.'); 
    }
};

GoogleDriveAPI.prototype._success = function(options = {}){
    var self = this;
    return function(response, data){
        self.success(response);
        return (options !== undefined && options.success && typeof(options.success) === "function") ? options.success.bind(self)(response, data) : function(){};
    };
};

GoogleDriveAPI.prototype._error = function(options = {}){
    var self = this;
    return function(response, data){
        self.error(response);
        return (options !== undefined && options.error && typeof(options.error) === "function") ? options.error.bind(self)(response, data) : function(){};
    };
};

GoogleDriveAPI.prototype.REQUEST = async function(options = {}){
    var noop = function(){};
    var query = options.query ? '?'+Object.keys(options.query).map(function(key){return key+"="+options.query[key]}).join("&") : '';

    var xhr = new XMLHttpRequest();
    xhr.responseType = options.responseType || "text";
    xhr.open(options.method || 'GET', (options.url || null) + query, true);
    if(options.headers){
        for(let key in options.headers){
            xhr.setRequestHeader(key, options.headers[key]) 
        }        
    }
    xhr.onreadystatechange = options.onReadyStateChange || noop;
    xhr.onload = options.onLoad || noop;
    xhr.onerror = options.onError || noop;
    xhr.send(JSON.stringify(options.metadata) || options.requestBody || null);
};

GoogleDriveAPI.prototype._buildHeader = function(headers){
    headers = headers || {};
    if(!headers['Accept']){
        headers['Accept'] = 'application/json';
    }
    if(!headers['Content-Type']){
        headers['Content-Type'] = 'application/json';
    }
    if(!headers['Authorization']){
        headers['Authorization'] = 'Bearer ' + this._Config['access_token'];
    }
    
    return headers;
};

GoogleDriveAPI.prototype.refreshToken = function(options = {}){
    var self = this;

    var _success = options.success || function(){};
    var _error = options.error || function(){};

    self.REQUEST({
        method: "POST",
        responseType: "json",
        url: self.url_refresh_token,
        onLoad: function(xhr){
            if(this.response){
                if(this.response.code === 200){
                    self._Config = {
                        "access_token": this.response.data['access_token'] || null,
                        "expires_in": this.response.data['expires_in'] || 0,
                        "created": this.response.data['created'] || 0
                    };
                    self.rootFolderId = this.response.data['rootFolderId'] || "root";
                    self.storageQuota['limit'] = this.response.data['storageQuota']['limit'] || 0;
                    self.storageQuota['usage'] = this.response.data['storageQuota']['usage'] || 0;
                    self.storageQuota['usageInDrive'] = this.response.data['storageQuota']['usageInDrive'] || 0;
                    self.storageQuota['usageInDriveTrash'] = this.response.data['storageQuota']['usageInDriveTrash'] || 0;
                    _success(this.response);
                } else {
                    _error(this.response);
                }
            }
        }
    });

};

GoogleDriveAPI.prototype.getAbout = function(options = {}){
    var self = this;

    var _success = this._success(options);
    var _error = this._error(options);

    this.REQUEST({
        method: "GET",
        responseType: "json",
        url: "https://www.googleapis.com/drive/v2/about?supportsAllDrives=true&fields=rootFolderId,quotaBytesTotal,quotaBytesUsed,quotaBytesUsedAggregate,quotaBytesUsedInTrash",
        headers: self._buildHeader(),
        onLoad: function(xhr){
            if(this.response){
                if(this.response.hasOwnProperty('error') === false){

                    self.rootFolderId = this.response['rootFolderId'] || "root";
                    self.storageQuota['limit'] = this.response['quotaBytesTotal'] || 0;
                    self.storageQuota['usage'] = this.response['quotaBytesUsed'] || 0;
                    self.storageQuota['usageInDrive'] = this.response['quotaBytesUsedAggregate'] || 0;
                    self.storageQuota['usageInDriveTrash'] = this.response['quotaBytesUsedInTrash'] || 0;

                    _success(this.response);
                    return;
                }
            }
            _error(this.response);
        }
    });
};


GoogleDriveAPI.prototype.listFiles = function(options = {}){
    var self = this;
    var _success = this._success(options);
    var _error = this._error(options);
    var _loadFull = (options !== undefined && options.loadFull ? true : false);

    if(typeof options.id === "undefined"){
        return _error({
            "error": {
                "code": 404,
                "message": "Id not found."
            }
        });
    }
    
    var q = options.id !== null ? ["'" + options.id + "' in parents"] : [];
    if(options.q){
        options.q.forEach(function(query, i){
            q.push(query);
        });
    }
    if(q.length > 0){
        q = q.join(" AND ");
    }

    let headers = {};
    if(options.resourcekey){
        headers['X-Goog-Drive-Resource-Keys'] = options.id+"/"+options.resourcekey;
    }

    let driveFiles = [];
    let getListFiles = function(nextPageToken){
        self.REQUEST({
            method: "GET",
            responseType: "json",
            url: "https://www.googleapis.com/drive/v2/files",
            headers: self._buildHeader(headers),
            query: {
                "includeItemsFromAllDrives": true,
                "supportsAllDrives": true,
                "orderBy": options.orderBy || "folder,title_natural",
                "maxResults": options.maxResults || 100,
                "fields": options.fields || "nextPageToken,items(*)",
                "q": q,
                "pageToken": nextPageToken || ""
            },
            onLoad: function(xhr){
                if(this.response){
                    if(this.response.hasOwnProperty('error') === false){
                        if(this.response['items'].length > 0){
                           this.response['items'].forEach(function(item, i){
                                driveFiles.push(self.infoData(item));
                           }); 
                        }
                        if(this.response['nextPageToken'] && _loadFull === true){
                            getListFiles(this.response['nextPageToken']);
                        } else {
                            _success(driveFiles, (this.response['nextPageToken'] || null));
                        }
                        return;
                    }
                }
                _error(this.response);
            }
        });
    };

    getListFiles(options.nextPageToken || null);

};

GoogleDriveAPI.prototype.fileInfo = function(options = {}){
    var self = this;
    var _success = this._success(options);
    var _error = this._error(options);

    if(options.id === undefined){
        return _error({
            "error": {
                "code": 404,
                "message": "Id not found."
            }
        });
    }

    let headers = {};
    if(options.resourcekey){
        headers['X-Goog-Drive-Resource-Keys'] = options.id+"/"+options.resourcekey;
    }

    this.REQUEST({
        method: "GET",
        responseType: "json",
        url: "https://www.googleapis.com/drive/v2/files/" + options.id,
        headers: self._buildHeader(headers),
        query: {
            "supportsAllDrives": true,
            "fields": options.fields || "*"
        },
        onLoad: function(xhr){
            if(this.response){
                if(this.response.hasOwnProperty('error') === false){
                    _success(self.infoData(this.response));
                    return;
                }
            }
            _error(this.response);
        }
    });
};


GoogleDriveAPI.prototype.createFolder = function(options = {}){
    var self = this;
    var _success = this._success(options);
    var _error = this._error(options);
    if(options.name === undefined){
        return _error({
            "error": {
                "code": 404,
                "message": "Name invalid."
            }
        });
    }
    let headers = {};
    if(options.resourcekey && options.parent){
        headers['X-Goog-Drive-Resource-Keys'] = options.parent + "/" +options.resourcekey;
    }

    this.REQUEST({
        method: "POST",
        responseType: "json",
        url: "https://www.googleapis.com/drive/v2/files",
        headers: self._buildHeader(headers),
        query: {
            "supportsAllDrives": true,
            "fields": options.fields || "*"
        },
        metadata: {
            "title": options.name,
            "mimeType": "application/vnd.google-apps.folder",
            "parents": options.parent ? [{id: options.parent}] : []
        },
        onLoad: function(xhr){
            if(this.response){
                if(this.response.hasOwnProperty('error') === false){
                    _success(self.infoData(this.response));
                    return;
                }
            }
            _error(this.response);
        }
    });
};

GoogleDriveAPI.prototype.createShortCut = function(options = {}){
    var self = this;
    var _success = this._success(options);
    var _error = this._error(options);
    if(options.file === undefined){
        return _error({
            "error": {
                "code": 404,
                "message": "File shortcut invalid."
            }
        });
    }
    let headers = {};
    if(options.resourcekey && options.parent){
        headers['X-Goog-Drive-Resource-Keys'] = options.parent + "/" +options.resourcekey;
    }

    this.REQUEST({
        method: "POST",
        responseType: "json",
        url: "https://www.googleapis.com/drive/v2/files",
        headers: self._buildHeader(headers),
        query: {
            "supportsAllDrives": true,
            "fields": options.fields || "*"
        },
        metadata: {
            "title": options.file['title'] || null,
            "mimeType": "application/vnd.google-apps.shortcut",
            "shortcutDetails": {
                "targetId": options.file['id'],
                "targetMimeType": options.file['mimeType'],
                "targetResourceKey": options.file['resourceKey'] || null
            },
            "parents": options.parent ? [{id: options.parent}] : []
        },
        onLoad: function(xhr){
            if(this.response){
                if(this.response.hasOwnProperty('error') === false){
                    _success(self.infoData(this.response));
                    return;
                }
            }
            _error(this.response);
        }
    });
};

GoogleDriveAPI.prototype.delete = function(options = {}){
    var self = this;
    var _success = this._success(options);
    var _error = this._error(options);

    if(!options.file){
        return _error({
            "error": {
                "code": 404,
                "message": "File invalid."
            }
        });
    }

    let headers = {};
    if(options.resourcekey || options.file['resourceKey']){
        headers['X-Goog-Drive-Resource-Keys'] = options.file['id'] + "/" +(options.file['resourceKey'] || options.resourcekey);
    }

    this.REQUEST({
        method: "DELETE",
        responseType: "json",
        url: "https://www.googleapis.com/drive/v2/files/" + options.file['id'],
        headers: self._buildHeader(headers),
        query: {
            "supportsAllDrives": true
        },
        onLoad: function(xhr){
            if(this.response){
                _error(this.response);
            } else {
                _success(this.response);
            }
        }
    });
};

GoogleDriveAPI.prototype.deleteMultiple = function(options = {}){
    var self = this;
    var _success = this._success(options);
    var _error = this._error(options);

    if(!options.files){
        return _error({
            "error": {
                "code": 404,
                "message": "File invalid."
            }
        });
    }

    var boundary = "END_OF_PART";
    var separation = "\n--"+boundary + "\n";
    var ending = "\n--" + boundary + "--";

    let bodyData = "";
    options.files.forEach(function(file, i){
        let resourcekey = [];
        if(file['resourceKey']){
            resourcekey.push(file['id']+"/"+file['resourceKey']);
        }
        if(resourcekey.length > 0){
            resourcekey = "X-Goog-Drive-Resource-Keys: "+resourcekey.join(',')+"\n";
        }
        bodyData += separation +
        "Content-Type: application/http\n" +
        "Content-ID: "+file['id']+"\n\n" +
        "DELETE https://www.googleapis.com/drive/v2/files/" + file['id'] + "?supportsAllDrives=true\n"+
        resourcekey;
    });
    bodyData += ending;

    this.REQUEST({
        method: "POST",
        responseType: "text",
        url: "https://www.googleapis.com/batch/drive/v2",
        headers: {
            'Content-Type': 'multipart/mixed; boundary='+ boundary,
            'Authorization': 'Bearer ' + self._Config['access_token']
        },
        requestBody: bodyData,
        onLoad: function(xhr){
            var pattern = /\nContent\-Length\: ([0-9]+)(\s+)(.*?)(\s+)\-\-batch_(.*?)(\n|\-\-)/gis;
            var match;
            let res_array = [];
            while (match = pattern.exec(this.response)){
                if(match[3].trim() != ""){
                    res_array.push(JSON.parse(match[3]));                
                }
            }
            if(res_array.length < 1){
                _success(res_array);
                return;
            }
            _error(res_array);
        }
    });
};

GoogleDriveAPI.prototype.move = function(options = {}){
    var self = this;
    var _success = this._success(options);
    var _error = this._error(options);

    if(!options.file){
        return _error({
            "error": {
                "code": 404,
                "message": "File invalid."
            }
        });
    }

    if(!options.to_folder){
        return _error({
            "error": {
                "code": 404,
                "message": "To folder invalid."
            }
        });
    }

    let headers = {};
    let resourcekey = [];
    if(options.resourcekey){
        file['parents'].forEach(function(parent_id){
            resourcekey.push(parent_id+"/"+options.resourcekey);
        });
    }
    if(file['resourceKey'] || options.file['resourceKey']){
        if(file['resourceKey']){
            resourcekey.push(file['id']+"/"+file['resourceKey']);
        }
        if(options.to_folder['resourceKey']){
            resourcekey.push(options.to_folder['id']+"/"+options.to_folder['resourceKey']);
        }
        if(resourcekey.length > 0){
            headers["X-Goog-Drive-Resource-Keys"] = resourcekey.join(',');
        }
    }

    this.REQUEST({
        method: "PUT",
        responseType: "json",
        url: "https://www.googleapis.com/drive/v2/files/" + options.file['id'],
        headers: self._buildHeader(headers),
        query: {
            "supportsAllDrives": true,
            "fields": options.fields || "*",
            "addParents": options.to_folder['id'] || null,
            "removeParents": options.file['parents'].join(",") || null,
        },
        onLoad: function(xhr){
            if(this.response){
                if(this.response.hasOwnProperty('error') === false){
                    _success(self.infoData(this.response));
                    return;
                }
            }
            _error(this.response);
        }
    });
};

GoogleDriveAPI.prototype.moveMultiple = function(options = {}){
    var self = this;
    var _success = this._success(options);
    var _error = this._error(options);

    if(!options.files){
        return _error({
            "error": {
                "code": 404,
                "message": "File invalid."
            }
        });
    }

    if(!options.to_folder){
        return _error({
            "error": {
                "code": 404,
                "message": "To folder invalid."
            }
        });
    }

    var boundary = "END_OF_PART";
    var separation = "\n--"+boundary + "\n";
    var ending = "\n--" + boundary + "--";

    let bodyData = "";

    let default_resourcekey = [];
    if(options.to_folder['resourceKey']){
        default_resourcekey.push(options.to_folder['id']+"/"+options.to_folder['resourceKey']);
    }
    options.files.forEach(function(file, i){
        let resourcekey = default_resourcekey;
        if(options.resourcekey){
            file['parents'].forEach(function(parent_id){
                resourcekey.push(parent_id+"/"+options.resourcekey);
            });
        }
        if(file['resourceKey']){
            resourcekey.push(file['id']+"/"+file['resourceKey']);
        }
        if(resourcekey.length > 0){
            resourcekey = "X-Goog-Drive-Resource-Keys: "+resourcekey.join(',')+"\n";
        }
        bodyData += separation +
        "Content-Type: application/http\n" +
        "Content-ID: "+file['id']+"\n\n" +
        "PUT https://www.googleapis.com/drive/v2/files/"+file['id']+"?supportsAllDrives=true&removeParents="+file['parents'].join(",")+"&addParents="+options.to_folder['id']+"&fields="+(options.fields || "*")+"\n"+
        resourcekey;
    });
    bodyData += ending;

    this.REQUEST({
        method: "POST",
        responseType: "text",
        url: "https://www.googleapis.com/batch/drive/v2",
        headers: {
            'Content-Type': 'multipart/mixed; boundary='+ boundary,
            'Authorization': 'Bearer ' + self._Config['access_token']
        },
        requestBody: bodyData,
        onLoad: function(xhr){
            var pattern = /\nContent\-Length\: ([0-9]+)(\s+)(.*?)(\s+)\-\-batch_(.*?)(\n|\-\-)/gis;
            var match;
            let res_array = [];
            let err_array = [];
            while (match = pattern.exec(this.response)){
                let json = JSON.parse(match[3]);
                if(json.hasOwnProperty('error') === false){
                    res_array.push(self.infoData(json));
                } else {
                    err_array.push(json);
                }
            }
            if(res_array.length > 0){
                _success(res_array);
                return;
            }
            _error(err_array);
        }
    });
};

GoogleDriveAPI.prototype.rename = function(options = {}){
    var self = this;
    var _success = this._success(options);
    var _error = this._error(options);

    if(!options.file){
        return _error({
            "error": {
                "code": 404,
                "message": "File invalid."
            }
        });
    }

    if(!options.name){
        return _error({
            "error": {
                "code": 404,
                "message": "New name invalid."
            }
        });
    }

    let headers = {};
    if(options.resourcekey || options.file['resourceKey']){
        headers['X-Goog-Drive-Resource-Keys'] = options.file['id'] + "/" + (options.file['resourceKey'] || options.resourcekey);
    }

    this.REQUEST({
        method: "PUT",
        responseType: "json",
        url: "https://www.googleapis.com/drive/v2/files/" + options.file['id'],
        headers: self._buildHeader(headers),
        query: {
            "supportsAllDrives": true,
            "fields": options.fields || "*"
        },
        metadata: {
            "title": options.name || options.file['title']
        },
        onLoad: function(xhr){
            if(this.response){
                if(this.response.hasOwnProperty('error') === false){
                    _success(self.infoData(this.response));
                    return;
                }
            }
            _error(this.response);
        }
    });
};

GoogleDriveAPI.prototype.copy = function(options = {}){
    var self = this;
    var _success = this._success(options);
    var _error = this._error(options);

    if(!options.file){
        return _error({
            "error": {
                "code": 404,
                "message": "File invalid."
            }
        });
    }

    let headers = {
        Authorization: 'Bearer ' + (options.access_token || self._Config['access_token'])
    };

    let resourcekey = [];
    if(options.resourcekey && options.parent){
        resourcekey.push(options.parent+"/"+options.resourcekey);
    }
    if(options.file['resourceKey']){
        resourcekey.push(options.file['id']+"/"+options.file['resourceKey']);
    }
    if(resourcekey.length > 0){
        headers['X-Goog-Drive-Resource-Keys'] = resourcekey.join(',');
    }

    let metadata = {
        "title": options.name || (options.file['title'] ? "Copy - " + options.file['title'] : "")
    };

    if(options.parent !== null){
        metadata['parents'] = [
            {id: options.parent}
        ];
    }

    this.REQUEST({
        method: "POST",
        responseType: "json",
        url: "https://www.googleapis.com/drive/v2/files/" + options.file['id'] + "/copy",
        headers: self._buildHeader(headers),
        query: {
            "supportsAllDrives": true,
            "fields": options.fields || "*"
        },
        metadata: metadata,
        onLoad: function(xhr){
            if(this.response){
                if(this.response.hasOwnProperty('error') === false){
                    _success(self.infoData(this.response));
                    return;
                }
            }
            _error(this.response);
        }
    });
};

GoogleDriveAPI.prototype.copyMultiple = function(options = {}){
    var self = this;
    var _success = this._success(options);
    var _error = this._error(options);

    if(!options.files){
        return _error({
            "error": {
                "code": 404,
                "message": "File invalid."
            }
        });
    }

    var boundary = "END_OF_PART";
    var separation = "\n--"+boundary + "\n";
    var ending = "\n--" + boundary + "--";

    let bodyData = "";
    options.files.forEach(function(file, i){
        let resourcekey = [];
        if(options.resourcekey && options.parent){
            resourcekey.push(options.parent+"/"+options.resourcekey);
        }
        if(file['resourceKey']){
            resourcekey.push(file['id']+"/"+file['resourceKey']);
        }
        if(resourcekey.length > 0){
            resourcekey = "X-Goog-Drive-Resource-Keys: "+resourcekey.join(',')+"\n";
        }
        bodyData += separation +
        "Content-Type: application/http\n" +
        "Content-ID: "+file['id']+"\n"+
        "content-transfer-encoding: binary\n\n" +
        "POST https://www.googleapis.com/drive/v2/files/" + file['id'] + "/copy?supportsAllDrives=true&fields="+(options.fields || "*")+"\n"+
        resourcekey+
        "Content-Type: application/json; charset=UTF-8\n\n\n\n"+
        "{\"title\": \""+(options.changeName === true ? "Copy - " + file['title'] : file['title'])+"\""+(options.parent !== null ? ', \"parents\": [{\"id\": \"'+options.parent+'\"}]' : '')+"}";
    });
    bodyData += ending;

    this.REQUEST({
        method: "POST",
        responseType: "text",
        url: "https://www.googleapis.com/batch/drive/v2",
        headers: {
            'Content-Type': 'multipart/mixed; boundary='+ boundary,
            'Authorization': 'Bearer ' + self._Config['access_token']
        },
        requestBody: bodyData,
        onLoad: function(xhr){
            var pattern = /\nContent\-Length\: ([0-9]+)(\s+)(.*?)(\s+)\-\-batch_(.*?)(\n|\-\-)/gis;
            var match;
            let res_array = [];
            let err_array = [];
            while (match = pattern.exec(this.response)){
                let json = JSON.parse(match[3]);
                if(json.hasOwnProperty('error') === false){
                    res_array.push(self.infoData(json));
                } else {
                    err_array.push(json);
                }
            }
            if(res_array.length > 0){
                _success(res_array);
                return;
            }
            _error(err_array);
        }
    });
};


GoogleDriveAPI.prototype.trash = function(options = {}){
    var self = this;
    var _success = this._success(options);
    var _error = this._error(options);

    if(!options.file){
        return _error({
            "error": {
                "code": 404,
                "message": "File invalid."
            }
        });
    }

    let headers = {};
    if(options.resourcekey || options.file['resourceKey']){
        headers['X-Goog-Drive-Resource-Keys'] = options.file['id'] + "/" + (options.file['resourceKey'] || options.resourcekey);
    }

    this.REQUEST({
        method: "POST",
        responseType: "json",
        url: "https://www.googleapis.com/drive/v2/files/" + options.file['id'] + "/trash",
        headers: self._buildHeader(headers),
        query: {
            "supportsAllDrives": true,
            "fields": options.fields || "*"
        },
        onLoad: function(xhr){
            if(this.response){
                if(this.response.hasOwnProperty('error') === false){
                    _success(self.infoData(this.response));
                    return;
                }
            }
            _error(this.response);
        }
    });
};

GoogleDriveAPI.prototype.untrash = function(options = {}){
    var self = this;
    var _success = this._success(options);
    var _error = this._error(options);

    if(!options.file){
        return _error({
            "error": {
                "code": 404,
                "message": "File invalid."
            }
        });
    }

    let headers = {};
    if(options.resourcekey || options.file['resourceKey']){
        headers['X-Goog-Drive-Resource-Keys'] = options.file['id'] + "/" + (options.file['resourceKey'] || options.resourcekey);
    }

    this.REQUEST({
        method: "POST",
        responseType: "json",
        url: "https://www.googleapis.com/drive/v2/files/" + options.file['id'] + "/untrash",
        headers: self._buildHeader(headers),
        query: {
            "supportsAllDrives": true,
            "fields": options.fields || "*"
        },
        onLoad: function(xhr){
            if(this.response){
                if(this.response.hasOwnProperty('error') === false){
                    _success(self.infoData(this.response));
                    return;
                }
            }
            _error(this.response);
        }
    });
};

GoogleDriveAPI.prototype.trashMultiple = function(options = {}){
    var self = this;
    var _success = this._success(options);
    var _error = this._error(options);

    if(!options.files){
        return _error({
            "error": {
                "code": 404,
                "message": "File invalid."
            }
        });
    }

    var boundary = "END_OF_PART";
    var separation = "\n--"+boundary + "\n";
    var ending = "\n--" + boundary + "--";

    let bodyData = "";
    options.files.forEach(function(file, i){
        let resourcekey = [];
        if(file['resourceKey']){
            resourcekey.push(file['id']+"/"+file['resourceKey']);
        }
        if(resourcekey.length > 0){
            resourcekey = "X-Goog-Drive-Resource-Keys: "+resourcekey.join(',')+"\n";
        }
        bodyData += separation +
        "Content-Type: application/http\n" +
        "Content-ID: "+file['id']+"\n\n" +
        "POST https://www.googleapis.com/drive/v2/files/" + file['id'] + "/trash?supportsAllDrives=true&fields="+(options.fields || "*")+"\n"+
        resourcekey;
    });
    bodyData += ending;

    this.REQUEST({
        method: "POST",
        responseType: "text",
        url: "https://www.googleapis.com/batch/drive/v2",
        headers: {
            'Content-Type': 'multipart/mixed; boundary='+ boundary,
            'Authorization': 'Bearer ' + self._Config['access_token']
        },
        requestBody: bodyData,
        onLoad: function(xhr){
            var pattern = /\nContent\-Length\: ([0-9]+)(\s+)(.*?)(\s+)\-\-batch_(.*?)(\n|\-\-)/gis;
            var match;
            let res_array = [];
            let err_array = [];
            while (match = pattern.exec(this.response)){
                let json = JSON.parse(match[3]);
                if(json.hasOwnProperty('error') === false){
                    res_array.push(self.infoData(json));
                } else {
                    err_array.push(json);
                }
            }
            if(res_array.length > 0){
                _success(res_array);
                return;
            }
            _error(err_array);
        }
    });
};

GoogleDriveAPI.prototype.untrashMultiple = function(options = {}){
    var self = this;
    var _success = this._success(options);
    var _error = this._error(options);

    if(!options.files){
        return _error({
            "error": {
                "code": 404,
                "message": "File invalid."
            }
        });
    }

    var boundary = "END_OF_PART";
    var separation = "\n--"+boundary + "\n";
    var ending = "\n--" + boundary + "--";

    let bodyData = "";
    options.files.forEach(function(file, i){
        let resourcekey = [];
        if(file['resourceKey']){
            resourcekey.push(file['id']+"/"+file['resourceKey']);
        }
        if(resourcekey.length > 0){
            resourcekey = "X-Goog-Drive-Resource-Keys: "+resourcekey.join(',')+"\n";
        }
        bodyData += separation +
        "Content-Type: application/http\n" +
        "Content-ID: "+file['id']+"\n\n" +
        "POST https://www.googleapis.com/drive/v2/files/" + file['id'] + "/untrash?supportsAllDrives=true&fields="+(options.fields || "*")+"\n"+
        resourcekey;
    });
    bodyData += ending;

    this.REQUEST({
        method: "POST",
        responseType: "text",
        url: "https://www.googleapis.com/batch/drive/v2",
        headers: {
            'Content-Type': 'multipart/mixed; boundary='+ boundary,
            'Authorization': 'Bearer ' + self._Config['access_token']
        },
        requestBody: bodyData,
        onLoad: function(xhr){
            var pattern = /\nContent\-Length\: ([0-9]+)(\s+)(.*?)(\s+)\-\-batch_(.*?)(\n|\-\-)/gis;
            var match;
            let res_array = [];
            let err_array = [];
            while (match = pattern.exec(this.response)){
                let json = JSON.parse(match[3]);
                if(json.hasOwnProperty('error') === false){
                    res_array.push(self.infoData(json));
                } else {
                    err_array.push(json);
                }
            }
            if(res_array.length > 0){
                _success(res_array);
                return;
            }
            _error(err_array);
        }
    });
};

GoogleDriveAPI.prototype.emptyTrash = function(options = {}){
    var self = this;
    var _success = this._success(options);
    var _error = this._error(options);

    this.REQUEST({
        method: "DELETE",
        responseType: "json",
        url: "https://www.googleapis.com/drive/v2/files/trash",
        headers: self._buildHeader(),
        query: {
            "supportsAllDrives": true
        },
        onLoad: function(xhr){
            if(this.response){
                _error(this.response);
            } else {
                _success(this.response);
            }
            
        }
    });
};

GoogleDriveAPI.prototype.getPermission = function(options = {}){
    var self = this;
    var _success = this._success(options);
    var _error = this._error(options);

    if(!options.file){
        return _error({
            "error": {
                "code": 404,
                "message": "File invalid."
            }
        });
    }

    let headers = {};
    if(options.resourcekey || options.file['resourceKey']){
        headers['X-Goog-Drive-Resource-Keys'] = options.file['id'] + "/" + (options.file['resourceKey'] || options.resourcekey);
    }

    this.REQUEST({
        method: "GET",
        responseType: "json",
        url: "https://www.googleapis.com/drive/v3/files/"+ options.file['id'] +"/permissions",
        headers: self._buildHeader(headers),
        query: {
            "supportsAllDrives": true,
            "fields": options.fields || "*"
        },
        onLoad: function(xhr){
            if(this.response){
                if(this.response.hasOwnProperty('error') === false){
                    _success(this.response);
                    return;
                }
            }
            _error(this.response);
        }
    });
};

GoogleDriveAPI.prototype.addPermission = function(options = {}){
    var self = this;
    var _success = this._success(options);
    var _error = this._error(options);

    if(!options.file){
        return _error({
            "error": {
                "code": 404,
                "message": "File invalid."
            }
        });
    }

    let metadata = {
        "role": options.role || "reader",
        "type": options.type || "anyone"
    };
    if(options.withLink){
        Object.assign(metadata, {"withLink": options.withLink});
    }
    if(options.emailAddress){
        Object.assign(metadata, {"emailAddress": options.emailAddress});
    }

    let headers = {};
    if(options.resourcekey || options.file['resourceKey']){
        headers['X-Goog-Drive-Resource-Keys'] = options.file['id'] + "/" + (options.file['resourceKey'] || options.resourcekey);
    }

    this.REQUEST({
        method: "POST",
        responseType: "json",
        url: "https://www.googleapis.com/drive/v3/files/"+ options.file['id'] +"/permissions",
        headers: self._buildHeader(headers),
        query: {
            "supportsAllDrives": true,
            "fields": options.fields || "*"
        },
        metadata: metadata,
        onLoad: function(xhr){
            if(this.response){
                if(this.response.hasOwnProperty('error') === false){
                    _success(this.response);
                    return;
                }
            }
            _error(this.response);
        }
    });
};

GoogleDriveAPI.prototype.updatePermission = function(options = {}){
    var self = this;
    var _success = this._success(options);
    var _error = this._error(options);

    if(!options.file){
        return _error({
            "error": {
                "code": 404,
                "message": "File invalid."
            }
        });
    }

    if(!options.id){
        return _error({
            "error": {
                "code": 404,
                "message": "Id permission invalid."
            }
        });
    }

    let metadata = {};

    if(options.type){
        Object.assign(metadata, {"type": options.type});
    }
    if(options.role){
        Object.assign(metadata, {"role": options.role});
    }
    if(options.withLink){
        Object.assign(metadata, {"withLink": options.withLink});
    }
    if(options.emailAddress){
        Object.assign(metadata, {"emailAddress": options.emailAddress});
    }

    if(!metadata['type'] && !metadata['role'] && !metadata['withLink'] && !metadata['value']){
        return _error({
            "error": {
                "code": 403,
                "message": "Nothing needs to change."
            }
        });
    }

    let headers = {};
    if(options.resourcekey || options.file['resourceKey']){
        headers['X-Goog-Drive-Resource-Keys'] = options.file['id'] + "/" + (options.file['resourceKey'] || options.resourcekey);
    }

    this.REQUEST({
        method: "PATCH",
        responseType: "json",
        url: "https://www.googleapis.com/drive/v3/files/"+ options.file['id'] +"/permissions/"+ options.id,
        headers: self._buildHeader(headers),
        query: {
            "supportsAllDrives": true,
            "fields": options.fields || "*"
        },
        metadata: metadata,
        onLoad: function(xhr){
            if(this.response){
                if(this.response.hasOwnProperty('error') === false){
                    _success(this.response);
                    return;
                }
            }
            _error(this.response);
        }
    });
};

GoogleDriveAPI.prototype.deletePermission = function(options = {}){
    var self = this;
    var _success = this._success(options);
    var _error = this._error(options);

    if(!options.file){
        return _error({
            "error": {
                "code": 404,
                "message": "File invalid."
            }
        });
    }

    if(!options.id && !options.email){
        return _error({
            "error": {
                "code": 404,
                "message": "Id or email invalid."
            }
        });
    }

    let headers = {};
    if(options.resourcekey || options.file['resourceKey']){
        headers['X-Goog-Drive-Resource-Keys'] = options.file['id'] + "/" + (options.file['resourceKey'] || options.resourcekey);
    }

    let request = function(id){
        self.REQUEST({
            method: "DELETE",
            responseType: "json",
            url: "https://www.googleapis.com/drive/v2/files/"+ options.file['id'] +"/permissions/"+ id,
            headers: self._buildHeader(headers),
            query: {
                "supportsAllDrives": true
            },
            onLoad: function(xhr){
                if(this.response){
                    _error(this.response);
                } else {
                    _success(this.response);
                }
                
            }
        });
    };

    var id = options.id || null;

    if(id === null && options.email){
        self.REQUEST({
            method: "GET",
            responseType: "json",
            url: "https://www.googleapis.com/drive/v2/permissionIds/"+ options.email,
            headers: self._buildHeader(headers),
            query: {
                "supportsAllDrives": true
            },
            onLoad: function(xhr){
                if(this.response){
                    if(this.response.hasOwnProperty('error') === false){
                       request(this.response['id']);
                       return;
                    }
                }
                _error(this.response);
            }
        });
    } else {
       request(id); 
    }

};


GoogleDriveAPI.prototype.infoData = function(file){
    var self = this;
    if(typeof file['title'] === "undefined"){
        file['title'] = file['name'];
    }
    var info = {
        id: file.id || null,
        title: file.title || null,
        iconLink: file.iconLink || null,
        description: file.description || null,
        mimeType: file.mimeType || null,
        size: file.fileSize || 0,
        quotaBytesUsed: file.quotaBytesUsed || 0,
        canCopy: (file.capabilities !== undefined ? file.capabilities['canCopy'] : false),
        parents: (file.parents !== undefined ? file.parents.map(function(obj){return obj['id']}) : null),
        alternateLink: file.alternateLink || null,
        webContentLink: file.webContentLink || null,
        embedLink: file.embedLink || null,
        thumbnailLink: file.thumbnailLink || null,
        createdDate: file.createdDate || null,
        markedViewedByMeDate: file.markedViewedByMeDate || null,
        modifiedDate: file.modifiedDate || null,
        trashed: (file.labels !== undefined ? file.labels.trashed : false),
        owners: file.owners || null,
        permissions: file.permissions || [],
        ownedByMe: file.ownedByMe || false,
        editable: file.editable || false,
        resourceKey: file.resourceKey || null,
        shortcutDetails: file.shortcutDetails || null
    };

    if(info['permissions']){
        info['permissions'] = info['permissions'].map(function(o){
            if(typeof o['name'] === "undefined"){
                return o;
            }
            if(typeof self.listDrives[o['name']] !== "undefined"){
                o['name'] = self.listDrives[o['name']].name;
            }
            return o;
        });        
    }

    if(info['owners']) {
        info['owners'] = info['owners'].map(function(o){
            if(typeof o['displayName'] === "undefined"){
                o['displayName'] = o['name'];
            }
            
            if(typeof self.listDrives[o['displayName']] !== "undefined"){
                o['displayName'] = self.listDrives[o['displayName']].name;
            }
            return o;
        });        
    } else {
        info['owners'] = [
        {
            displayName: '',
            emailAddress: ''
        }];
    }

    return info;
};

GoogleDriveAPI.prototype.getUrlFolder = function(id){
    return "https://drive.google.com/drive/folders/" + id;
};

GoogleDriveAPI.prototype.getUrlFile = function(id){
    return "https://drive.google.com/file/d/"+ id +"/view?usp=sharing";
};

var RetryHandler = function () {
    this.interval = 1000; // Start at one second
    this.maxInterval = 60 * 1000; // Don't wait longer than a minute 
};

RetryHandler.prototype.retry = function (fn) {
    setTimeout(fn, this.interval);
    this.interval = this.nextInterval_();
};

RetryHandler.prototype.reset = function () {
    this.interval = 1000;
};

RetryHandler.prototype.nextInterval_ = function () {
    var interval = this.interval * 2 + this.getRandomInt_(0, 1000);
    return Math.min(interval, this.maxInterval);
};

RetryHandler.prototype.getRandomInt_ = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

GoogleDriveAPI.prototype.upload = function(options = {}){
    var self = this;
    var noop = function () { };
    let file = options.file;
    let contentType = options.contentType || file.type || 'application/octet-stream';
    let metadata = options.metadata || {
        'title': file.name,
        'mimeType': contentType
    };
    let token = options.access_token || self._Config['access_token'];
    let onComplete = options.onComplete || noop;
    let onProgress = options.onProgress || noop;
    let onError = options.onError || noop;
    let onCancel = options.onCancel || noop;

    let offset = options.offset || 0;
    let chunkSize = options.chunkSize || 0;
    let retryHandler = new RetryHandler();
    let resourcekey = options.resourcekey || null;

    self.progressUpload++;
    let progressUpload = options.progressUpload || self.progressUpload;
    self.xhr_uploader[progressUpload] = {
        sendFile_: new XMLHttpRequest(),
        resume_: new XMLHttpRequest(),
        start_: new XMLHttpRequest(),
        status: "uploading"
    };

    

    let sendFile_ = function (retry = false) {
        var content = file;
        var end = file.size;

        if (offset || chunkSize) {
            // Only bother to slice the file if we're either resuming or uploading in chunks
            if (chunkSize) {
                end = Math.min(offset + chunkSize, file.size);
            }
            content = content.slice(offset, end);
        }

        self.xhr_uploader[progressUpload]['sendFile_'].open('PUT', url, true);
        if(retry === false){
            self.xhr_uploader[progressUpload]['sendFile_'].responseType = "json";            
        }

        self.xhr_uploader[progressUpload]['sendFile_'].setRequestHeader('Content-Type', contentType);
        self.xhr_uploader[progressUpload]['sendFile_'].setRequestHeader('Content-Range', "bytes " + offset + "-" + (end - 1) + "/" + file.size);
        self.xhr_uploader[progressUpload]['sendFile_'].setRequestHeader('X-Upload-Content-Type', file.type);
        if(resourcekey !== null){
            self.xhr_uploader[progressUpload]['sendFile_'].setRequestHeader('X-Goog-Drive-Resource-Keys', resourcekey);
        }
        

        if (self.xhr_uploader[progressUpload]['sendFile_'].upload) {
            self.xhr_uploader[progressUpload]['status'] = "uploading";
            self.xhr_uploader[progressUpload]['sendFile_'].upload.addEventListener('progress', onProgress);
        }
        self.xhr_uploader[progressUpload]['sendFile_'].onload = onContentUploadSuccess_.bind(this);
        self.xhr_uploader[progressUpload]['sendFile_'].onerror = onContentUploadError_.bind(this);
        self.xhr_uploader[progressUpload]['sendFile_'].onabort = onContentUploadCancel_.bind(this);

        self.xhr_uploader[progressUpload]['sendFile_'].send(content);
    };

    let resume_ = function() {

        self.xhr_uploader[progressUpload]['resume_'].responseType = "json";
        self.xhr_uploader[progressUpload]['resume_'].open('PUT', url, true);
        self.xhr_uploader[progressUpload]['resume_'].setRequestHeader('Content-Range', "bytes */" + file.size);
        self.xhr_uploader[progressUpload]['resume_'].setRequestHeader('X-Upload-Content-Type', file.type);
        if(resourcekey !== null){
            self.xhr_uploader[progressUpload]['resume_'].setRequestHeader('X-Goog-Drive-Resource-Keys', resourcekey);
        }

        if (self.xhr_uploader[progressUpload]['resume_'].upload) {
            self.xhr_uploader[progressUpload]['status'] = "uploading";
            self.xhr_uploader[progressUpload]['resume_'].upload.addEventListener('progress', onProgress);
        }
        self.xhr_uploader[progressUpload]['resume_'].onload = onContentUploadSuccess_.bind(this);
        self.xhr_uploader[progressUpload]['resume_'].onerror = onContentUploadError_.bind(this);
        self.xhr_uploader[progressUpload]['resume_'].onabort = onContentUploadCancel_.bind(this);

        self.xhr_uploader[progressUpload]['resume_'].send();
    };

    let extractRange_ = function (xhr) {
        var range = xhr.getResponseHeader('Range');
        if (range) {
            offset = parseInt(range.match(/\d+/g).pop(), 10) + 1;
        }
    };

    let onContentUploadSuccess_ = function (e) {
        if (e.target.status == 200 || e.target.status == 201) {
            if(e.target.response.hasOwnProperty('error') === false){
                self.xhr_uploader[progressUpload]['status'] = "complete";
                onComplete(progressUpload, self.infoData(e.target.response));
            } else {
                self.xhr_uploader[progressUpload]['status'] = "error";
                onError(progressUpload, e.target.response);
            }
        } else if (e.target.status == 308) {
            extractRange_(e.target);
            retryHandler.reset();
            sendFile_(true);
        } else {
            onError(progressUpload, e.target.response);
        }
    };

    let onContentUploadError_ = function (e) {
        if (e.target.status && e.target.status < 500) {
            self.xhr_uploader[progressUpload]['status'] = "error";
            onError(progressUpload, e.target.response);
        } else {
            retryHandler.retry(resume_.bind(this));
        }
    };

    let onContentUploadCancel_ = function (e) {
        self.xhr_uploader[progressUpload]['status'] = "cancel";
        onCancel(progressUpload, file);
    };


    let onUploadError_ = function (e) {
        self.xhr_uploader[progressUpload]['status'] = "error";
        onError(progressUpload, e.target.response); // TODO - Retries for initial upload
    };
    let buildQuery_ = function (params) {
        params = params || {};
        return Object.keys(params).map(function (key) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
        }).join('&');
    };

    let buildUrl_ = function (id, params, baseUrl) {
        var url = baseUrl || 'https://www.googleapis.com/upload/drive/v2/files/';
        if (id) {
            url += id;
        }
        var query = buildQuery_(params);
        if (query) {
            url += '?' + query;
        }
        return url;
    };

    let url = options.url;
    if (!url) {
        var params = options.params || {};
        params.uploadType = 'resumable';
        params.fields = "*";
        url = buildUrl_(options.fileId, params, options.baseUrl);
    }
    let httpMethod = options.fileId ? 'PUT' : 'POST';


    self.xhr_uploader[progressUpload]['start_'].responseType = "json";
    self.xhr_uploader[progressUpload]['start_'].open(httpMethod, url, true);
    self.xhr_uploader[progressUpload]['start_'].setRequestHeader('Authorization', 'Bearer ' + token);
    self.xhr_uploader[progressUpload]['start_'].setRequestHeader('Content-Type', 'application/json');
    self.xhr_uploader[progressUpload]['start_'].setRequestHeader('X-Upload-Content-Length', file.size);
    self.xhr_uploader[progressUpload]['start_'].setRequestHeader('X-Upload-Content-Type', contentType);
    if(resourcekey !== null){
        self.xhr_uploader[progressUpload]['start_'].setRequestHeader('X-Goog-Drive-Resource-Keys', resourcekey);
    }

    self.xhr_uploader[progressUpload]['start_'].onload = function (e) {
        if (e.target.status < 400) {
            var location = e.target.getResponseHeader('Location');
            url = location;
            sendFile_();
        } else {
            onUploadError_(e);
        }
    }.bind(this);
    self.xhr_uploader[progressUpload]['start_'].onerror = onUploadError_.bind(this);

    self.xhr_uploader[progressUpload]['start_'].send(JSON.stringify(metadata));
};

GoogleDriveAPI.prototype.abortUpload = function(options = {}){
    var self = this;
    var _success = this._success(options);
    var _error = this._error(options);
    let progressUpload = options.progressUpload || null;
    
    if(!progressUpload){

        for(let progress in this.xhr_uploader){
            for (const xhr in this.xhr_uploader[progress]) {
                if(xhr !== "status"){
                    this.xhr_uploader[progress][xhr].abort();
                }
            }
            this.xhr_uploader[progress]["status"] = "cancel";
        }
        return _success();
    } else if(typeof this.xhr_uploader[progressUpload] !== "undefined"){
        for (const xhr in this.xhr_uploader[progressUpload]) {
            if(xhr !== "status"){
                this.xhr_uploader[progressUpload][xhr].abort();
            }
        }
        this.xhr_uploader[progressUpload]["status"] = "cancel";
        return _success();
    }
    _error();
}


GoogleDriveAPI.prototype.download = function(options = {}){
    var self = this;
    var _success = this._success(options);
    var _error = this._error(options);
    var _progress = options.progress || function(){};
    var noSave = options.noSave || false;

    if(!options.file){
        return _error({
            "error": {
                "code": 404,
                "message": "File invalid."
            }
        });
    }

    self.xhr_download = new XMLHttpRequest();
    self.xhr_download.open('GET', 'https://www.googleapis.com/drive/v2/files/'+options.file['id']+'?alt=media&acknowledgeAbuse='+(options.file['canCopy'] !== true ? 'true' : 'false'), true);
    self.xhr_download.setRequestHeader('Authorization', 'Bearer ' + self._Config['access_token']);
    //self.xhr_download.setRequestHeader('Accept-Encoding', 'None');
    self.xhr_download.responseType = 'blob';

    self.xhr_download.onprogress = function(event){
        _progress(event);
    };
    self.xhr_download.onload = function() {
        self.blob_download = this.response;
        _success(self.blob_download);
        if(noSave === false){
           self.saveOrOpenBlob(options.file['title']); 
        }
        
    }
    self.xhr_download.onerror = function(xhr){
        _error(this);
    };
    self.xhr_download.send();
}

GoogleDriveAPI.prototype.saveOrOpenBlob = function(fileName){
    if(this.blob_download === null){
        return false;
    }

    var tempEl = document.createElement("a");
    document.body.appendChild(tempEl);
    tempEl.style = "display: none";
    url = window.URL.createObjectURL(this.blob_download);
    tempEl.href = url;
    tempEl.download = fileName;
    tempEl.click();
    window.URL.revokeObjectURL(url);
}