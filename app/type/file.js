
  basis.require('basis.data');
  basis.require('basis.date');
  basis.require('basis.entity');
  basis.require('basis.data.dataset');

  var nsEntity = basis.entity;
  var nsDataset = basis.data.dataset;

  var STATE = basis.data.STATE;
  
  var namespace = 'app.type';

  var File = new nsEntity.EntityType({
    name: namespace + '.File',
    fields: {
      filename: nsEntity.StringId,
      type: String,
      lastUpdate: Date.fromISOString,
      content: function(value){ 
        return value == null ? null : String(value);
      }
    }
  });

  var FileClass = File.entityType.entityClass;

  File.createFile = function(filename){
    app.main.callPageScriptFunction('createFile', filename);    
  }

  FileClass.extend({
    read: function(){
      this.setState(STATE.PROCESSING);
      app.main.callPageScriptFunction('readFile', this.data.filename);
    },
    save: function(){
      if (this.modified)
      {
        this.setState(STATE.PROCESSING);
        app.main.callPageScriptFunction('saveFile', this.data.filename, this.data.content);
      }
    }
  });

  var fileHandler = function(){
    if (this.subscriberCount > 0 && (this.state == STATE.UNDEFINED || this.state == STATE.DEPRECATED))
      this.read();
  }
  Object.extend(FileClass.prototype, {
    state: STATE.UNDEFINED,
    event_subscribersChanged: function(){
      FileClass.superClass_.prototype.event_subscribersChanged.call(this);
      fileHandler.call(this);
    },
    event_stateChanged: function(oldState){
      FileClass.superClass_.prototype.event_stateChanged.call(this, oldState);
      fileHandler.call(this);
    }
  });

  app.main.onPageScriptMessage(function(msg){
    if (msg.action == 'filesChanged')
    {
      var data = msg.data.toObject();

      var f;
      if (data.inserted)
        for (var i = 0, file; file = data.inserted[i]; i++)
        {
          if (file.content == "null")
            delete file.content;

          app.type.File(file);
        }

      if (data.deleted)
        for (var i = 0, filename; filename = data.deleted[i]; i++)
          app.type.File(filename).destroy();
    }
    else if (msg.action == 'updateFile')
    {
      var data = msg.data.toObject();
      var file = app.type.File(data.filename);
      file.commit(data);
      file.setState(data.content == null ? STATE.UNDEFINED : STATE.READY);
    }
  });


  //
  // Datasets
  //
  File.FilesByFolder = new nsDataset.Split({
    source: File.all,
    rule: function(object){
      var path = object.data.filename.split("/");
      path.pop();
      return path.join('/');
    }
  });

  var files = new nsDataset.Subset({
    source: File.all,
    rule: function(object){
      return object.data.type == 'file';
    }
  });

  File.FilesByType = new nsDataset.Split({
    source: files,
    rule: function(object){
      return object.data.filename.split('.').pop();
    }
  });


  exports.File = File;
