
  basis.require('basis.cssom');
  basis.require('basis.data.property');
  basis.require('basis.template');
  basis.require('basis.dom.event');
  basis.require('basis.ui');
  basis.require('basis.ui.button');
  basis.require('basis.ui.resizer');

  resource('css/style.css')().startUse();

  //
  // import names
  //

  var nsTemplate = basis.template;
  var nsButton  = basis.ui.button;
  var classList = basis.cssom.classList;


  var editor = resource('widget/tmplEditor.js');
  var tokenView = resource('widget/tokenView.js');
  var filelist = resource('widget/filelist.js');
  var resourceEditor = resource('widget/resourceEditor.js');



  editor().tmplSource.addLink(tokenView(), function(source){
    if (source)
    {
      var decl = nsTemplate.makeDeclaration(source);

      tokenView().setSource(decl);

      var path;
      var curTemplateFile = editor().tmplEditor.delegate;
      if (curTemplateFile)
      {
        var filename = curTemplateFile.data.filename;
        if (filename)
          path = filename.substring(0, filename.lastIndexOf('/') + 1);
      }
        
      resourceEditor().setSource(decl, path);
    }
    else
    {
      tokenView().setSource();
      resourceEditor().setSource();
    }  
  });

   
  //
  // Inspect button
  //
  var inspectButton = new nsButton.Button({
    cssClassName: 'InspectButton',
    caption: 'Start Inspect',
    click: function(){
      inspect(!inspectMode);
    },
    container: editor().firstChild.element
  });
  
  var inspectMode = false;
  function inspect(mode){
    inspectMode = mode;
    classList(inspectButton.element).bool('active', inspectMode);

    if (inspectMode)
      app.callPageScriptFunction('startTemplateInspect');
    else
      app.callPageScriptFunction('endTemplateInspect');
  }
  


  //
  // result
  //
  var templater = new basis.ui.Container({
    template:
      '<div class="TemplaterPage">' +
        '<!--{inspectButton}-->' +
        '<!--{filelist}-->' +
        '<!--{resourceEditor}-->' + 
        //'<!--{tokenView}-->' +
        '<!--{editor}-->' +
      '</div>',

    binding: {
      filelist: 'satellite:',
      inspectButton: 'satellite:',
      resourceEditor: 'satellite:',
      //tokenView: 'satellite:',
      editor: 'satellite:'
    },
    satellite: {
      //tokenView: tokenView(),
      //inspectButton: inspectButton,
      editor: editor(),
      filelist: filelist(),
      resourceEditor: resourceEditor()
    }
  });

  var initFilelist = Function.runOnce(function(){
    templater.setSatellite('filelist', filelist());    

    filelist().tree.selection.addHandler({
      datasetChanged: function(selection, delta){
        var item = selection.pick();
        this.setSourceFile(item && item.data.type == 'file' ? item : null);
      }
    }, editor());
  });

  app.isServerOnline.addLink(null, function(value){
    initFilelist();
  });

  if (chrome && chrome.extension)
  {
    app.isPageScriptReady.addLink(null, function(value){
      if (value)
        app.callPageScriptFunction('getFileList');
    });
  }
  else
  {
    app.type.file.File({
      filename: 'basis/resource.css',
      type: 'file',
      content: 
        '#TemplateResourceList LI\n\
        {\n\
          padding: 0 0 0 16px;\n\
          margin: 0;\n\
        }'
    });

    app.type.file.File({
      filename: 'basis/resource.tmpl',
      type: 'file',
      content: 
        '{b:resource src="resource.css"}\n<li>{filename}</li>'
    });
  }

  app.onPageScriptMessage(function(msg){
    if (msg.action == 'pickTemplate')
    {
      inspect(false);

      var data = msg.data.toObject();
      if (data.filename)
      {
        var fileNode = searchFileInTree(data.filename, filelist().tree);
        if (fileNode)
        {
          fileNode.select();
          fileNode.element.scrollIntoView();
        }
      }
      else if (data.content)
      {
        filelist().tree.selection.clear();
        editor().setSource(data.content);
      }
    }
  });

  function searchFileInTree(filename, root){
    var result;
    if (root.data.filename == filename)
      result = root;

    if (root.childNodes)
      for (var i = 0, child; child = root.childNodes[i]; i++)
      {
        if (result = searchFileInTree(filename, child))
          break;
      }

    return result;
  }



  //
  // main part
  //

  // editor -> tokenView
  //editor().tmplSource.addLink(tokenView(), tokenView().setSource);

  /*function updatePickupElement(value, oldValue){
    if (value && value.element.nodeType == 1)
      basis.cssom.setStyle(value, {
        'box-shadow': '0 0 15px rgba(0,128,0,.75)',
        'outline': '2px solid rgba(0,128,0,.75)',
        'background-color': 'rgba(0,128,0,.5)'
      });
    if (oldValue && oldValue.element.nodeType == 1)
      basis.cssom.setStyle(oldValue, {
        'box-shadow': '',
        'outline': '',
        background: ''
      });
  }

  var pickupActive = new basis.data.property.Property(false, {
    change: function(value){
      updatePickupElement(
        value ? pickupTarget.value : null,
        !value ? pickupTarget.value : null
      );
    }
  });
  var pickupTarget = new basis.data.property.Property(null, {
    change: function(value, oldValue){
      if (pickupActive.value)
        updatePickupElement(value, oldValue);
    }
  }, function(value){
    return value && value.element && value.template instanceof basis.template.Template ? value : null;
  });

  basis.dom.event.addGlobalHandler('mousemove', function(event){
    pickupActive.set(event.altKey && event.ctrlKey);
    var cursor = basis.dom.event.sender(event);
    var refId;
    do {
      if (refId = cursor.basisObjectId)
        return pickupTarget.set(basis.template.resolveObjectById(refId));
    } while (cursor = cursor.parentNode);
  });
  basis.dom.event.addGlobalHandler('click', function(event){
    if (pickupTarget.value && pickupActive.value)
    {
      basis.dom.event.kill(event);

      var source = pickupTarget.value.template.source;
      editor().setSource(String(typeof source == 'function' ? source() : source));
    }
  });
  basis.dom.event.addGlobalHandler('keydown', function(event){
    pickupActive.set(event.altKey && event.ctrlKey);
  });
  basis.dom.event.addGlobalHandler('keyup', function(event){
    pickupActive.set(event.altKey && event.ctrlKey);
  });*/





  exports = module.exports = templater;
  exports.filelist = filelist;
  exports.editor = editor;
  //exports.tokenView = tokenView;

