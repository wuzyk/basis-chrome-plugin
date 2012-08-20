window.pageScript = function(){
  var pageScriptFunction = function(){
    var DOM = basis.dom;
    var STATE = basis.data.STATE;
    var DataObjectSet = basis.data.property.DataObjectSet;    

    //
    // Share DOM
    //
    var transferDataEvent = document.createEvent('Event');
    transferDataEvent.initEvent('transferData', true, true);

    var transferDiv = document.createElement('pre');
    transferDiv.id = 'transferDiv';
    document.body.appendChild(transferDiv);

    function sendData(action, data){
      transferDiv.setAttribute('action', action);
      transferDiv.innerText = JSON.stringify(data || {});
      transferDiv.dispatchEvent(transferDataEvent);
      transferDiv.innerText = '';
    }

    //
    // l10n context menu
    //
    var nodePickedByContextMenu;
    document.addEventListener('contextmenu', contextMenuHandler);

    function contextMenuHandler(event){
      nodePickedByContextMenu = basis.dom.event.sender(event);
    }

    function getTokenByContextMenu(){
      if (nodePickedByContextMenu)
      {
        var node = nodePickedByContextMenu;
        var basisObjectId = node.basisObjectId;

        while (!basisObjectId && node.parentNode)
        {
          node = node.parentNode;
          basisObjectId = node.basisObjectId;
        }

        if (basisObjectId)
        {
          var basisNode = basis.template.resolveObjectById(basisObjectId);
          if (basisNode)
          {
            bindings = (basisNode.tmpl.set.debug && basisNode.tmpl.set.debug()) || [];
            for (var j = 0, binding; binding = bindings[j]; j++)
            {
              if (binding.attachment && binding.dom.nodeType == basis.dom.TEXT_NODE && nodePickedByContextMenu.contains(binding.dom))
              {
                loadToken(binding.attachment);
              }
            }
          }
        }
      }
    }

    //
    // l10n Inspect
    //

    var overlay = DOM.createElement('DIV[style="position: absolute; top: 0; bottom: 0; left: 0; right: 0; z-index: 10000; background: rgba(128,128,128,.0.05)"]');
    overlay.addEventListener('click', clickHandler);
    var inspectMode;
    var elements = [];

    function clickHandler(event){
      var sender = basis.dom.event.sender(event);

      var token = sender.token;
      if (token)
      {
        endInspect();
        loadToken(token);
      } 
    }

    function startInspect(){ 
      if (!inspectMode)
      {
        highlight();
        inspectMode = true;
      }
    }
    function endInspect(){
      if (inspectMode)
      {
        unhighlight();
        inspectMode = false;
      }
    }

    function highlight(){
      DOM.insert(document.body, overlay);
      domTreeHighlight(document.body);
    }

    function unhighlight(){
      DOM.remove(overlay);
      for (var i = 0, node; node = elements[i]; i++)
      {
        delete node.token;
        DOM.remove(node);
      }
      elements = [];
    }

    function domTreeHighlight(root){
      var node;
      var bindings;
      var element;
      var range = document.createRange();

      for (var i = 0, child; child = root.childNodes[i]; i++)
      {
        if (child.nodeType == basis.dom.ELEMENT_NODE) 
        {
          if (child.basisObjectId)
          {
            node = basis.template.resolveObjectById(child.basisObjectId);
            if (node)
            {
              bindings = (node.tmpl.set.debug && node.tmpl.set.debug()) || [];
              for (var j = 0, binding; binding = bindings[j]; j++)
              {
                if (binding.attachment && binding.dom.nodeType == basis.dom.TEXT_NODE && child.contains(binding.dom))
                {
                  //nodes.push(binding.dom);

                  range.selectNodeContents(binding.dom);
                  var rect = range.getBoundingClientRect();
                  if (rect)
                  {
                    var color = getColorForDictionary(binding.attachment.dictionary.namespace);
                    var bgColor = 'rgba(' + color.join(',') + ', .3)';
                    var borderColor = 'rgba(' + color.join(',') + ', .6)';
                    element = overlay.appendChild(basis.dom.createElement('DIV[style="background-color:' + bgColor + ';outline:1px solid ' + borderColor + ';z-index:65000;position:fixed;cursor:pointer;top:' + 
                      rect.top + 'px;left:' + 
                      rect.left + 'px;width:' + 
                      rect.width + 'px;height:' +
                      rect.height +
                    'px"]'));

                    element.token = binding.attachment;

                    elements.push(element);
                  }
                }
              }
            }
          }

          domTreeHighlight(child);
        }  
      }
    }

    var dictionaryColor = {};
    function getColorForDictionary(dictionaryName){
      if (!dictionaryColor[dictionaryName])
        dictionaryColor[dictionaryName] = getColor();

      return dictionaryColor[dictionaryName];
    }

    //
    // L10n functions
    //

    function loadCultureList(){
      var data = {
        currentCulture: basis.l10n.getCulture(),
        cultureList: basis.l10n.getCultureList()
      }
      sendData('cultureList', data);
    }

    function loadDictionaryList(){
      var dictionaries = basis.l10n.getDictionaries();

      var data = [];

      for (var dictionaryName in dictionaries)
      {
        if (dictionaries[dictionaryName].location)
          data.push({ Dictionary: dictionaryName, Location: dictionaries[dictionaryName].location });
      }

      sendData('dictionaryList', data);
    }

    function loadDictionaryResource(dictionaryName, culture){
      var dict = basis.l10n.getDictionary(dictionaryName);
      if (dict)
      {
        basis.l10n.loadCultureForDictionary(basis.l10n.getDictionary(dictionaryName), culture);

        var data = {
          dictionaryName: dictionaryName,
          tokens: {}
        };
        for (var tokenName in dict.resources['base'])
        {
          if (!data.tokens[tokenName])
          {
            data.tokens[tokenName] = {};
            dict.getToken(tokenName);
          }
          
          data.tokens[tokenName][culture] = dict.resources[culture] && dict.resources[culture][tokenName] || '';
        }

        sendData('dictionaryResource', data);
      }
    }
    
    function loadToken(token){
      var dictionary = token.dictionary;
      var cultureList = basis.l10n.getCultureList();

      var data = { 
        cultureList: cultureList,
        selectedToken: token.name,
        dictionaryName: dictionary.namespace, 
        tokens: {}
      };

      for (var i in dictionary.tokens){
        var tkn = dictionary.tokens[i];
        data.tokens[tkn.name] = {};
        for (var j = 0, culture; culture = cultureList[j]; j++){
          data.tokens[tkn.name][culture] = dictionary.getCultureValue(culture, tkn.name);
        }
      }
      
      sendData('token', data);        
    }

    function setTokenCultureValue(namespace, name, culture, value){
      var token = basis.l10n.getToken(namespace + '.' + name);
      token.dictionary.setCultureValue(culture, name, value);
    }

    function setCulture(culture){
      basis.l10n.setCulture(culture);

      if (inspectMode)
      {
        unhighlight();
        highlight();
      }
    }

    function saveDictionary(dictionaryName, cultureList){
      if (!basis.devtools)
        return;

      var dict = basis.l10n.getDictionary(dictionaryName);
      var location = dict.location;

      var dictionaryData = {};
      var dictContent;
      var resourceParts;

      var fileDataObjectSet = new DataObjectSet({
        handler: {
          stateChanged: function(){
            if (this.state == STATE.READY)
              sendData('saveDictionary', { result: 'success', dictionaryName: dictionaryName, tokens: dictionaryData });
            else if (this.state == STATE.ERROR)
              sendData('saveDictionary', { result: 'error', dictionaryName: dictionaryName, errorText: this.state.data });

            if (this.state == STATE.READY || this.state == STATE.ERROR)
            {
              setTimeout(function(){
                fileDataObjectSet.destroy();
              }, 0);
            }
          }
        }
      });

      var dictionaries;
      var resourceParts;      
      var dictParts;
      var filename;
      var file;
      var newContent;
      for (var i = 0, culture; culture = cultureList[i]; i++)
      {
        filename = '/' + basis.path.relative(location + '/' + culture + '.json');
        file = basis.devtools.getFile(filename);

        if (file)
        {
          dictionaries = Object.extend({}, basis.resource(filename)());
          dictionaries[dictionaryName] = dict.resources[culture];
          dictParts = [];
          for (var dName in dictionaries)
          {
            resourceParts = [];
            
            for (var tokenName in dict.resources['base'])
            {
              if (dictionaries[dName][tokenName])
                resourceParts.push('    "' + tokenName + '": "' + dictionaries[dName][tokenName] + '"');

              if (dName == dict.namespace)
              {
                if (!dictionaryData[tokenName])
                  dictionaryData[tokenName] = {};

                dictionaryData[tokenName][culture] = dictionaries[dName][tokenName] || '';
              }
            }

            dictParts.push('\r\n  "' + dName + '": {\r\n' + resourceParts.join(',\r\n') + '\r\n  }');
          }


          newContent = '{' + dictParts.join(', ') + '\r\n}';	

          file.setState(STATE.UNDEFINED);
          fileDataObjectSet.add(file);
          file.update({ content: newContent });
          file.save();
        }
        else
          sendData('saveDictionary', { result: 'error', dictionaryName: dictionaryName, errorText: 'File ' + filename + ' not found' });
      }
    }

    basis.l10n.addCreateDictionaryHandler(function(dictionaryName){
      sendNewDictionary(dictionaryName);
    }); 

    function sendNewDictionary(dictionaryName){
      sendData('newDictionary', { dictionaryName: dictionaryName });
    }


    //
    // Template Inspect
    //

    var templateInspector = (function(){
      /*var overlay = DOM.createElement('DIV[style="position: absolute; top: 0; bottom: 0; left: 0; right: 0; z-index: 10000; background: rgba(128,128,128,.0.05)"]');
      overlay.addEventListener('click', clickHandler);*/
      //var elements = [];
      var inspectMode;

      function startInspect(){ 
        if (!inspectMode)
        {
          basis.dom.event.addGlobalHandler('mousemove', mousemoveHandler);
          inspectMode = true;
        }
      }
      function endInspect(){
        if (inspectMode)
        {
          basis.dom.event.removeGlobalHandler('mousemove', mousemoveHandler);
          inspectMode = false;
          pickupTarget.set();
        }
      }

      function mousemoveHandler(){
        var sender = basis.dom.event.sender(event);
        var cursor = sender;
        var refId;
        do {
          if (refId = cursor.basisObjectId)
          {
            /*document.addEventListener('mousedown', kill, true);
            sender.addEventListener('click', kill, true);*/
            /*basis.dom.event.addHandler(sender, 'mousedown', kill);
            basis.dom.event.addHandler(sender, 'click', kill);
            basis.dom.event.addHandler(sender, 'mouseup', kill);*/
            return pickupTarget.set(basis.template.resolveObjectById(refId));
          }
        } while (cursor = cursor.parentNode);

        //if (sender != overlay)
          pickupTarget.set();
      }

      var pickupTarget = new basis.data.property.Property(null, {
        change: function(value, oldValue){
          updatePickupElement(value, oldValue);
        }
      }, function(value){
        return value && value.element && value.template instanceof basis.template.Template ? value : null;
      });

      function updatePickupElement(property, oldValue){
        var value = property.value;
        if (value)
        {
          //range.selectNodeContents(value.element);
          var rect = value.element.getBoundingClientRect();
          if (rect)
          {
            basis.cssom.setStyle(overlay, {
              left: rect.left + 'px',
              top: rect.top + 'px',
              width: rect.width + 'px',
              height: rect.height + 'px'
            });
            document.body.appendChild(overlay);
            basis.dom.event.captureEvent('mousedown', basis.dom.event.kill);
            basis.dom.event.captureEvent('mouseup', basis.dom.event.kill);
            basis.dom.event.captureEvent('click', clickHandler);
            //basis.dom.event.addGlobalHandler('mousedown', clickHandler);
          }
        }
        else
        {
          document.body.removeChild(overlay);
          basis.dom.event.releaseEvent('mousedown');
          basis.dom.event.releaseEvent('mouseup');
          basis.dom.event.releaseEvent('click');
          //basis.dom.event.addGlobalHandler('mousedown', clickHandler);
        }
      }


      var overlay = DOM.createElement('DIV[style="pointer-events: none; position: absolute; top: 0; bottom: 0; left: 0; right: 0; z-index: 10000; background: rgba(110,163,217,0.7)"]');
      //overlay.addEventListener('click', clickHandler);
      /*function kill(event){
        basis.dom.event.kill(event);
      }*/
      function clickHandler(event){
        basis.dom.event.kill(event);
        if (pickupTarget.value)
        {
          var url = pickupTarget.value.template.source.url;
          if (url)
          {
            var filename = '/' + basis.path.relative(url);
            sendData('pickTemplate', { filename: filename });
          }
          else
          { 
            sendData('pickTemplate', { content: pickupTarget.value.template.source });
          }
        } 
      }

      return {
        start: startInspect,
        end: endInspect
      }
    })();

    function startTemplateInspect(){
      templateInspector.start();
    }
    function endTemplateInspect(){
      templateInspector.end();
    }


    //
    // Files
    //
    function getFileList(){
      if (basis.devtools)
      {
        var files = basis.devtools.files; 
        sendData('filesChanged', { 
          inserted: files.getItems().map(function(file){ 
            return { filename: file.data.filename }
          }) 
        });
      }
    }
    function sendFile(file){
      var data = basis.object.extend({}, file.data);

      if (/tmpl$/.test(file.data.filename) && file.data.content)
      {
        data.declaration = basis.template.makeDeclaration(file.data.content, basis.path.dirname(basis.path.resolve(file.data.filename)) + '/');
        data.resources = data.declaration.resources.map(function(item){ return '/' + basis.path.relative(item) });
      }  
        
      sendData('updateFile', data);
    }

    function createFile(filename){
      basis.devtools.createFile(filename);
    }
    function readFile(filename){
      var file = basis.devtools.getFile(filename);
      if (file)
      {
        if (file.data.content)
          sendFile(file);
        else
          file.read();
      }
    }
    function saveFile(filename, content){
      var file = basis.devtools.getFile(filename);
      if (file)
      {
        file.update({ content: content });
        file.save();
      }
    }

    // Sync

    var FILE_HANDLER = {
      update: function(object, delta){
        sendFile(object);
      }
    }
    var FILE_LIST_HANDLER = {
      datasetChanged: function(dataset, delta){
        var data = {};
        if (delta.inserted)
        {
          data.inserted = [];
          var fileData;
          for (var i = 0, object; object = delta.inserted[i]; i++)
          {
            if (/\.(tmpl|css)$/.test(object.data.filename))
            {
              fileData = basis.object.extend({}, object.data);
              delete fileData.content;

              data.inserted.push(fileData);
              object.addHandler(FILE_HANDLER);
            }
          }
        }
            
        if (delta.deleted)
        {
          data.deleted = [];

          for (var i = 0, object; object = delta.deleted[i]; i++)
          {
            if (/\.(tmpl|css)$/.test(object.data.filename))
            {
              data.deleted.push(object.getId());
              object.removeHandler(FILE_HANDLER);
            }
          }
        }
        
        if ((data.inseted && data.inseted.length) || (data.deleted && data.deleted.length))
          sendData('filesChanged', data);
      }
    }

    if (basis.devtools)
    {
      var files = basis.devtools.files;
      files.addHandler(FILE_LIST_HANDLER);
      FILE_LIST_HANDLER.datasetChanged.call(files, files, { inserted: files.getItems() });
    }

    //
    //check server state 
    //

    var serverStateChangedHandler = {
      update: function(object, delta){
        if ('isOnline' in delta)
          sendData('fsobserverState', { state: this.data.isOnline });
      } 
    }

    function checkFsObserverState(){
      if (basis.devtools)
        sendData('fsobserverState', { state: basis.devtools.serverState.data.isOnline });
    }
    
    if (basis.devtools)
      basis.devtools.serverState.addHandler(serverStateChangedHandler);
    
    //
    // Color staff
    //
    function getColor(){
      var golden_ratio_conjugate = 0.618033988749895;

      var h = Math.random();
      h += golden_ratio_conjugate;
      h %= 1;

      return hsv_to_rgb(h, 0.7, 0.95);
    }
    function hsv_to_rgb(h, s, v)
    {
      var h1 = h * 6;
      var c = v * s;
      var x = c * (1 - Math.abs(h1 % 2 - 1));
      var rgb;
      switch(Math.floor(h1))
      { 
        case 0: rgb = [c, x, 0]; break;
        case 1: rgb = [x, c, 0]; break;
        case 2: rgb = [0, c, x]; break;
        case 3: rgb = [0, x, c]; break;
        case 4: rgb = [x, 0, c]; break;
        case 5: rgb = [c, 0, x]; break;
      }
      var m = v - c; 
      return [
        Math.floor((rgb[0] + m) * 256), 
        Math.floor((rgb[1] + m) * 256), 
        Math.floor((rgb[2] + m) * 256) 
      ];
    }

    return {
      checkFsObserverState: checkFsObserverState,

      loadDictionaryList: loadDictionaryList,
      loadDictionaryResource: loadDictionaryResource,
      setTokenCultureValue: setTokenCultureValue,
      setCulture: setCulture,
      startInspect: startInspect,
      endInspect: endInspect,
      saveDictionary: saveDictionary,
      loadCultureList: loadCultureList,

      getFileList: getFileList,
      readFile: readFile,
      saveFile: saveFile,
      createFile: createFile,
      startTemplateInspect: startTemplateInspect,
      endTemplateInspect: endTemplateInspect,
      getTokenByContextMenu: getTokenByContextMenu
    }
  }

  return "(function(){" +
      "if (window.basis){" +
        "if (!window.pageScript){" +
          "try{" +
            "window.pageScript = (" + pageScriptFunction.toString() + ")();" +
          "}catch(e){" +
            "console.warn(e.toString())" +
          "}" +
        "}" +
        "return true;" +
      "}" +
      "else return false;" +
    "})()";
}
