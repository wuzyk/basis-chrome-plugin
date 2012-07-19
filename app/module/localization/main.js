
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.data');
  basis.require('basis.cssom');
  basis.require('basis.entity');
  basis.require('basis.ui');
  basis.require('basis.ui.label');
  basis.require('basis.ui.button');
  basis.require('basis.ui.field');
  basis.require('basis.data.property');
  basis.require('basis.net.ajax');

  basis.require('app.type.l10n');

  var livememo = basis.resource('app/ext/livememo/livememo.js');

  var DOM = basis.dom;
  var Event = basis.dom.event;
  var classList = basis.cssom.classList;

  var uiNode = basis.ui.Node;

  var EmptyLabel = basis.ui.label.Empty;

  var EntityType = basis.entity.EntityType;
  var nsEntity = basis.entity;
  var Property = basis.data.property.Property;
  var nsAjax = basis.net.ajax;

  var Button = basis.ui.button.Button;
  var ButtonPanel = basis.ui.button.ButtonPanel;
  var getter = Function.getter;
  var STATE = basis.data.STATE;

  var Split = basis.data.dataset.Split;
  var Merge = basis.data.dataset.Merge;
  var Subset = basis.data.dataset.Subset;

  var Resource = app.type.l10n.Resource;
  var Dictionary = app.type.l10n.Dictionary;
  var DictionaryCulture = app.type.l10n.DictionaryCulture;
  var Culture = app.type.l10n.Culture;

  var FLAG_PATH = 'img/flags';
  var BASE_CULTURE = 'base';
  var CULTURE_LIST;
  //var dictionaries;

  var property_CurrentCulture = new Property(null);
  var property_CurrentDictionary = new Property(null);

  //
  // Datasets
  //
  var resourceDictionaryCultureGrouping = new Split({
    source: Resource.all,
    rule: function(object){
      return object.data.Dictionary + '_' + object.data.Culture;
    }
  });

  var resourceDictionaryCultureMerge = new Merge({});

  var resourceGrouping = new nsEntity.Grouping({
    source: resourceDictionaryCultureMerge,
    rule: function(object){
      return object.data.Dictionary + '_' + object.data.Token;
    }
  });

  var dictionaryCultureGrouping = new Split({
    source: DictionaryCulture.all,
    rule: getter('data.Dictionary')
  });

  var dictionaryCultureDataSource = new Subset({
    rule: Function.$true
  });

  var tokenGrouping = new basis.data.dataset.Split({
    source: Token.all,
    rule: getter('data.Dictionary')
  });

  var tokenDataSource = new Subset({});

  // observe resource changes datasets
  var resourceModifiedSubset = new Subset({ 
    source: Resource.all,
    ruleEvents: { 
      rollbackUpdate: true,
      update: true
    },
    rule: function(object){
      return !!object.modified;
    }
  });
  resourceModifiedSubset.addHandler({
    datasetChanged: function(object, delta){
      var objects = [].concat(delta.inserted || [], delta.deleted || []);
      for (var i = 0, object; object = objects[i]; i++)
        Dictionary(object.data.Dictionary).set('ResourceModified', resourceModifiedSplit.getSubset(object.data.Dictionary, true).itemCount > 0, true);
    }
  });
  var resourceModifiedSplit = new basis.data.dataset.Split({
    source: resourceModifiedSubset,
    rule: getter('data.Dictionary')
  });
  var resourceModifiedDataSource = new basis.data.dataset.Subset({
    rule: Function.$true
  });
  property_CurrentDictionary.addHandler({
    change: function(property){
      resourceModifiedDataSource.setSource(resourceModifiedSplit.getSubset(property.value, true));
    }
  });

  //load resource for current dictionary and added culture
  var resourcesLoaded = {};
  dictionaryCultureDataSource.addHandler({
    datasetChanged: function(object, delta){
      if (delta.inserted)
        for (var i = 0, dictCulture; dictCulture = delta.inserted[i]; i++)
        {
          var key = dictCulture.data.Dictionary + '_' + dictCulture.data.Culture;
           if (!resourcesLoaded[key])
           {
             app.callPageScriptFunction('loadDictionaryResource', dictCulture.data.Dictionary, dictCulture.data.Culture);
             resourcesLoaded[key] = true;
           }
        }
    }
  });

  property_CurrentDictionary.addHandler({
    change: function(property){
      var value = property.value;

      DictionaryCulture({
        Dictionary: value,
        Culture: BASE_CULTURE,
        Position: 1
      });

      dictionaryCultureDataSource.setSource(dictionaryCultureGrouping.getSubset(value, true));

      tokenDataSource.setSource(tokenGrouping.getSubset(value, true));

      var cultures = dictionaryCultureDataSource.getItems();
      resourceDictionaryCultureMerge.clear();
      for (var i = 0, culture; culture = cultures[i]; i++)
        resourceDictionaryCultureMerge.addSource(resourceDictionaryCultureGrouping.getSubset(value + '_' + culture.data.Culture, true));
    }
  });

  //
  // functions
  //
  var inspectMode = false;
  function inspect(mode){
    inspectMode = mode;
    classList(lazy_InspectButton().element).bool('active', inspectMode);

    if (inspectMode)
      app.main.callPageScriptFunction('startInspect');
    else
      app.main.callPageScriptFunction('endInspect');
  }

  function saveDictionary(dictionaryName){
    var dictionary = Dictionary(dictionaryName);

    if (dictionary.modified && dictionary.state != STATE.PROCESSING)
    {
      var modifiedCultures = {};
      var modifiedResources = resourceModifiedSplit.getSubset(dictionaryName, true).getItems();
      for (var i = 0, resource; resource = modifiedResources[i]; i++) 
        modifiedCultures[resource.data.Culture] = true;

      var cultureList = [];
      for (var i in modifiedCultures)
        cultureList.push(i);

      app.main.callPageScriptFunction('saveDictionary', dictionaryName, cultureList);
      dictionary.setState(STATE.PROCESSING);
    }
  }

  function addCulture(culture){
    var usedCultures = dictionaryCultureDataSource.getItems();

    var dictionaries = Dictionary.all.getItems();
    for (var i = 0, dictionary; dictionary = dictionaries[i]; i++)
    { 
      DictionaryCulture({
        Dictionary: dictionary.data.Dictionary,
        Culture: culture,
        Position: usedCultures.length + 1
      });
    }

    resourceDictionaryCultureMerge.addSource(resourceDictionaryCultureGrouping.getSubset(property_CurrentDictionary.value + '_' + culture, true))
  }

  function deleteCulture(culture, dictionary){
    resourceDictionaryCultureMerge.removeSource(resourceDictionaryCultureGrouping.getSubset(dictionary + '_' + culture, true));

    var culturePosition = DictionaryCulture({ Culture: culture, Dictionary: dictionary }).data.Position;

    var dictionaries = Dictionary.all.getItems();
    for (var i = 0, dictionary; dictionary = dictionaries[i]; i++)
    {
      DictionaryCulture({ 
        Dictionary: dictionary.getId(), 
        Culture: culture 
      }).destroy();
    }

    var cultures = DictionaryCulture.all.getItems().filter(function(item){ return item.data.Position > culturePosition }) || [];
    for (var i = 0, item; item = cultures[i]; i++)
      item.set('Position', item.data.Position - 1);
  }

  //process resources
  function processDictionaryData(dictionary, data){
    var resource;
    for (var token in data)
    {
      Token({ 
        Dictionary: dictionary, 
        Token: token 
      });
      for (var culture in data[token])
      {
        resource = Resource({ 
          Dictionary: dictionary, 
          Token: token,
          Culture: culture
        });

        resource.commit({
          Value: data[token][culture]
        });
      }
    }
  }

  function listenPageScript(){
    app.main.onPageScriptMessage(function(msg){
      if (msg.action == 'inited')
      {
        app.main.callPageScriptFunction('loadCultureList');
        app.main.callPageScriptFunction('loadDictionaryList');
      }
      /*else if (msg.action == 'fsobserverState')
      {
        var state = msg.data.toObject().state;
        DOM.display(lazy_SaveButtonPanel().element, !!state);
      }*/
      else if (msg.action == 'cultureList'){
        var data = msg.data.toObject();
        CULTURE_LIST = ['base'].concat(data.cultureList);            
        lazy_CultureList().setChildNodes(CULTURE_LIST.map(function(culture){ return { title: culture, value: culture }}));
        property_CurrentCulture.set(data.currentCulture);
      }
      else if (msg.action == 'dictionaryList'){
        Dictionary.all.sync(msg.data.toObject());
      }
      else if (msg.action == 'dictionaryResource'){
        var data = msg.data.toObject()
        processDictionaryData(data.dictionaryName, data.tokens);
      }
      else if (msg.action == 'newDictionary'){
        Dictionary(msg.data.toObject().dictionaryName);
      }
      else if (msg.action == 'token'){
        var data = msg.data.toObject();

        lazy_DictionaryList().setValue(data.dictionaryName);
        lazy_DictionaryEditor().selectToken(data.selectedToken);

        var dc = DictionaryCulture.get({ Dictionary: data.dictionaryName, Culture: property_CurrentCulture.value });
        if (!dc)
          addCulture(property_CurrentCulture.value);

        inspect(false);
      }
      else if (msg.action == 'saveDictionary'){
        var data = msg.data.toObject();
        if (data.result == 'success')
        {
          Dictionary(data.dictionaryName).setState(STATE.READY);
          processDictionaryData(data.dictionaryName, data.tokens);
        }
        else 
          Dictionary(data.dictionaryName).setState(STATE.ERROR, data.errorText);
      }
    });
  }



  //
  // Layout
  //
  var lazy_LocalizationPage = Function.lazyInit(function(){
    var result = new uiContainer({
      template: 
        '<div class="LocalizationPage">' +
          '<div class="Editor-Toolbar">' +
            '<!--{inspectButton}-->' +
            //'<!--{dictionaryList}-->' +
            '<!--{cultureList}-->' +
            '<!--{saveButtonPanel}-->' +
          '</div>' +
          '<div class="Editor-Content">' +
            '<!--{dictionaryList-->' + 
            '<!--{dictionaryEditor}-->' +
          '</div>' +
        '</div>',

      satellite: {
        inspectButton: lazy_InspectButton(),
        dictionaryList: lazy_DictionaryList(),
        dictionaryEditor: lazy_DictionaryEditor(),
        cultureList: lazy_CultureList(),
        saveButtonPanel: lazy_SaveButtonPanel()
      },

      binding: {
        inspectButton: 'satellite:',
        dictionaryList: 'satellite:',
        dictionaryEditor: 'satellite:',
        cultureList: 'satellite:',
        saveButtonPanel: 'satellite:'
      }
    });

    return result;
  });

  var lazy_InspectButton = Function.lazyInit(function(){
    var inspectButton = new basis.ui.button.Button({
      cssClassName: 'InspectButton',
      caption: 'Start Inspect',
      click: function(){
        inspect(!inspectMode);
      }
    });

    return inspectButton;
  });


  var lazy_DictionaryList = Function.lazyInit(function(){
    var list = new basis.ui.field.Combobox({
      title: 'Dictionary: ',
      cssClassName: 'DictionaryList',
      property: property_CurrentDictionary,

      dataSource: Dictionary.all,
      childClass: {          
        /*template:
          '<div class="DictionaryList-Item Basis-Combobox-Item {selected} {disabled} {modified}" event-click="select"><span class="modifiedMarker"></span>{title}</div>',*/

        binding: {
          modified: {
            getter: function(object){
              return object.target && object.target.modified ? 'modified' : '';
            },
            events: 'rollbackUpdate update'
          }
        },

        titleGetter: getter('data.Dictionary'),
        valueGetter: getter('data.Dictionary')
      },
      sorting: 'data.Dictionary'
    });

    return list;
  });

  var lazy_CultureList = Function.lazyInit(function(){
    var result = new basis.ui.field.Combobox({
      title: 'Culture: ',
      cssClassName: 'CultureList',
      property: property_CurrentCulture,
      childClass: {
        template:
          '<div class="CultureList-Item Basis-Combobox-Item {selected} {disabled}" event-click="select"><img{imgElement} src="" event-error="error" event-load="load"/>{title}</div>',

        action: {
          load: function(){
            basis.cssom.show(this.tmpl.imgElement);
          },
          error: function(){
            basis.cssom.hide(this.tmpl.imgElement);
          }
        },

        titleGetter: getter('title'),
        valueGetter: getter('value'),

        templateUpdate: function(){
          var culture = this.getValue();
          if (culture)
          {
            var country = culture.substr(culture.indexOf('-') + 1).toLowerCase();

            var object = this;
            var img = new Image();
            img.onload = function(){ 
              object.tmpl.imgElement.src = img.src; 
              basis.cssom.show(object.tmpl.imgElement) 
            }
            img.onerror = function(){ 
              basis.cssom.hide(object.tmpl.imgElement) 
            }
            img.src = FLAG_PATH + '/' + country + '.png';
          }
        }
      }
    });

    property_CurrentCulture.addHandler({
      change: function(property){
        app.main.callPageScriptFunction('setCulture', property.value);
      }
    });

    return result;
  });

  var lazy_SaveButtonPanel = Function.lazyInit(function(){
    var buttonPanel = new ButtonPanel({
      cssClassName: 'SaveButtonPanel',
      disabled: true,
      childNodes: [
        {
          name: 'save',
          caption: 'Save',
          cssClassName: 'SaveButton',

          click: function(){
            saveDictionary(property_CurrentDictionary.value);
          }
        },
        {
          caption: 'Cancel Changes',
          cssClassName: 'CancelButton',

          click: function(){
            Dictionary(property_CurrentDictionary.value).setState(STATE.READY);
            resourceModifiedDataSource.getItems().forEach(getter('rollback()'));
          }
        }
      ]
    });
    basis.cssom.hide(buttonPanel.element);

    new basis.ui.label.Error({
      cssClassName: 'FileSaveErrorLabel',
      owner: buttonPanel,
      autoDelegate: basis.dom.wrapper.DELEGATE.OWNER,
      handler: {
        stateChanged: function(){
          DOM.insert(DOM.clear(this.tmpl.element), this.state.data);
        }
      }
    });

    property_CurrentDictionary.addLink(buttonPanel, function(value){
      this.setDelegate(Dictionary(value));
    });

    var activityHandler = function(){
      if (!buttonPanel.target.modified || buttonPanel.state == STATE.PROCESSING)
        buttonPanel.disable();
      else
        buttonPanel.enable(); 

      var saveButtonCaption = buttonPanel.state == STATE.PROCESSING ? 'Saving...' : 'Save';
      buttonPanel.getButtonByName('save').setCaption(saveButtonCaption);
    }
    buttonPanel.addHandler({
      stateChanged: activityHandler,
      update: activityHandler
    });

    app.isServerOnline.addLink(buttonPanel, function(value){
      basis.cssom.display(this.element, !!value);
    });

    return buttonPanel;
  });

  var lazy_DictionaryEditor = Function.lazyInit(function(){
    //header
    var addCulturePanel = new uiContainer({
      template: 
        '<div class="AddCulturePanel">' +
          '<span class="title">Add culture: </span>'+
          '<span{childNodesElement}/>' +
        '</div>',

      childClass: {
        template: 
          '<span{element} class="Culture-Flag" event-click="addCulture">' + String.Entity.nbsp + '</span>',

        action: {
          addCulture: function(event){
            addCulture(this.data.culture);
          }
        },

        init: function(config){
          uiNode.prototype.init.call(this, config);
          classList(this.element).add(this.data.culture);
          this.element.title = this.data.culture;
        }
      }
    });

    var dictionaryEditorHeader = new uiContainer({
      id: 'DictionaryEditor-Header',
      template: 
        '<div{element}>' +
          '<div{childNodesElement} class="Cultures Table-Row"/>' +
          '<div class="Table-Row AddCulture-Row">' +
            '<div class="Table-Column"><!--{addCulturePanel}--></div>' +
          '</div>' +
        '</div>',

      satellite: {
        addCulturePanel: addCulturePanel
      },

      binding: {
        addCulturePanel: 'satellite:'
      },

      sorting: getter('data.Position'),

      dataSource: dictionaryCultureDataSource,
      childClass: {
        template: 
          '<div{element} class="Culture-Wrapper Table-Column">' +
            '<div class="title">{title}<a{deleteLink} href="#" class="deleteButton" event-click="deleteCulture">Удалить</a></div>' +
          '</div>',

        action: {
          deleteCulture: function(event){
            deleteCulture(this.data.Culture, this.data.Dictionary);
          } 
        },

        templateUpdate: function(object, delta){ 
          this.tmpl.title.nodeValue = this.data.Culture;
          basis.cssom.display(this.tmpl.deleteLink, this.data.Culture != BASE_CULTURE);
          
          classList(this.element).add(this.data.Culture);
          classList(this.element).bool('even', this.data.Position % 2 == 0);
        }
      }
    });

    dictionaryCultureDataSource.addHandler({
      datasetChanged: function(object){
        var usedCultures = this.getItems();
        var cultures = [];

        for (var i = 0, culture; culture = CULTURE_LIST[i]; i++)
        {
          if (!usedCultures.search(culture, 'data.Culture'))
            cultures.push({ data: { culture: culture } });
        }

        basis.cssom.display(addCulturePanel.element, cultures.length > 0);
        addCulturePanel.setChildNodes(cultures);
      }
    });
    
    //columns
    var columnsContainer = new uiContainer({
      id: 'ColumnBackgroundContainer',

      cssClassName: 'Table-Row',
      
      childClass: {
        template: 
          '<div{element} class="Table-Column"></div>',

        templateUpdate: function(object, delta){
          classList(this.element).bool('even', this.data.Position % 2 == 0);
        }
      },
      dataSource: dictionaryCultureDataSource,
      sorting: 'data.Position'
    });

    //result
    var dictionaryEditor = new uiContainer({
      selection: {},
      template:
        '<div id="DictionaryEditor">' +
          '<!--{header}-->' +
          '<div class="DictionaryEditor-Content">' +
            '<!--{columns}-->' +
            '<!--{childNodesHere}-->' +
          '</div>' +
        '</div>',

      satellite: {
        header: dictionaryEditorHeader,
        columns: columnsContainer
      },

      binding: {
        header: 'satellite:',
        columns: 'satellite:'
      },

      dataSource: tokenDataSource,
      childClass: DictionaryEditorItem(),
      sorting: 'data.Position'
    });
    
    dictionaryCultureDataSource.addHandler({
      datasetChanged: function(object, delta){
        var items = object.getItems();
        var oldCount = items.length + (delta.deleted ? delta.deleted.length : 0) - (delta.inserted ? delta.inserted.length : 0);
        oldCount += (oldCount < CULTURE_LIST.length ? 1 : 0);
        var newCount = items.length + (items.length < CULTURE_LIST.length ? 1 : 0);
        classList(dictionaryEditor.element).replace(oldCount, newCount, 'childCount_');
      }
    });
    
    dictionaryEditor.selectToken = function(tokenName){
      var tokenItem = this.childNodes.search(tokenName, getter('data.Token'));
      if (tokenItem)
      {
        tokenItem.select();
        var resourceNode = tokenItem.childNodes.search(property_CurrentCulture.value, getter('data.Culture'));
        if (resourceNode)
        {
          resourceNode.satellite.memo.tmpl.memo.focus();
        }
      }
    }

    property_CurrentDictionary.addLink(dictionaryEditor, function(value){
      basis.cssom.display(this.element, !!value);
    });


    return dictionaryEditor;
  });


  var DictionaryEditorItem = Function.lazyInit(function(){
    //
    // ResourceEmptyLabel
    //
    /*var ResourceEmptyLabel = uiNode.subclass({
      template: 
        '<div class="EmptyLabel">' +
          '<span class="EmptyLabel-Title">None</span>' +
          '<!--{createButton}-->' +
        '</div>',

      satelliteConfig: {
        createButton: {
          delegate: function(object){
            return object.delegate;
          },
          instanceOf: Button,
          config: {
            caption: 'Create',
            click: function(){
              var group = this.delegate;
              
              Resource({
                Dictionary: this.data.Dictionary,
                Token: group.token,
                Culture: this.data.Culture
              });

              group.first.satellite.memo.tmpl.memo.focus();
            }
          }
        }
      },

      binding: {
        createButton: 'satellite:'
      }
    });*/

    var DictionaryEditorItem = uiContainer.subclass({
      template: resource('template/dictionaryEditorItem.tmpl'),

      binding: {
        title: getter('data.Token')
      },

      childClass: {
        template: resource('template/dictionaryEditorItemResource.tmpl'),

        satelliteConfig: {
          memo: {
            instanceOf: livememo.LiveMemo.subclass({
              event_ownerChanged: function(oldOwner){
                livememo.LiveMemo.prototype.event_ownerChanged.call(this, oldOwner);
                if (this.owner && this.owner.data.Culture == 'base')
                  this.disable();
              },
              action: {
                focus: function(){
                  classList(this.owner.element).remove('empty');
                  this.owner.parentNode.select();
                },
                blur: function(event){
                  var memo = Event.sender(event);
                  this.owner.parentNode.unselect();
                  this.owner.target.set('Value', this.tmpl.memo.value, true);        
                },
                keyup: function(event){
                  this.action.change(event);
                  if (Event.key(event) == Event.KEY.F2)
                    saveDictionary(property_CurrentDictionary.value);
                },
                change: function(){
                  var value = this.tmpl.memo.value;

                  var tokenName = this.data.Token;
                  var dictionaryName = this.data.Dictionary;
                  var culture = this.data.Culture;

                  this.owner.target.set('Value', value, true);

                  app.callPageScriptFunction('setTokenCultureValue', dictionaryName, tokenName, culture, value)  ;
                }
              }
            })
          }
        },

        binding: {
          memo: 'satellite:'
        },

        templateUpdate: function(object, delta){
          classList(this.element).bool('empty', !this.data.Value);

          this.satellite.memo.setText(this.data.Value.replace(/\n/g, "\\n").replace(/\r/g, "\\r"));
          /*var langPosition = DictionaryCulture({ Culture : this.data.Culture, Dictionary: this.data.Dictionary }).data.Position;
          var pathPosition = Path(this.info.PathId).info.Position;
          this.satellite.memo.tmpl.memo.tabIndex = langPosition * 1000 + tokenPosition;*/
        }/*,
        init: function(config){
          uiNode.prototype.init.call(this, config);

          //Event.addHandlers(this.satellite.memo.tmpl.memo, RESOURCE_INPUT_HANDLER, this);

          if (this.data.Culture == 'base')
            this.satellite.memo.tmpl.memo.disabled = true;
        },
        destroy: function(){
          Event.clearHandlers(this.satellite.memo.tmpl.memo);
          uiNode.prototype.destroy.call(this);
        }*/
      },

      grouping: {
        groupGetter: function(item){ 
          return DictionaryCulture({ Culture: item.data.Culture, Dictionary: item.data.Dictionary });
        },
        dataSource: dictionaryCultureDataSource,
        sorting: getter('data.Position'),
        
        childClass: {
          template: resource('template/dictionaryEditorResourceGroup.tmpl')//,

          /*satelliteConfig: {
            emptyLabel: {
              instanceOf: ResourceEmptyLabel,
              delegate: Function.$self,
              existsIf: function(object){
                return object.nodes.length == 0;
              },
              hook: {
                update: false,
                childNodesModified: true
              }
            }
          },
          binding: {
            emptyLabel: 'satellite:'
          }*/
        }
      },

      templateUpdate: function(object, delta){
        if (this.data.Dictionary)
          this.setDataSource(resourceGrouping.getSubset([this.data.Dictionary, this.data.Token].join('_'), true))
      }/*,

      init: function(config){
        uiContainer.prototype.init.call(this, config);

        this.grouping.addHandler(RESOURCE_GROUPING_HANDLER, this);
        RESOURCE_GROUPING_HANDLER.childNodesModified.call(this, this.grouping, { inserted: this.grouping.childNodes });
      },
      destroy: function(){
        this.grouping.removeHandler(RESOURCE_GROUPING_HANDLER, this);

        uiContainer.prototype.destroy.call(this);        
      }*/
    });

    /*var RESOURCE_GROUPING_HANDLER = {
      childNodesModified: function(object, delta){
        if (delta.inserted)
          for (var i = 0, group; group = delta.inserted[i];i++)
            group.token = this.data.Token;
      }
    }*/

    return DictionaryEditorItem;
  });



  //
  // Main
  //

  app.main.addModule({
    init: function(){
      app.main.addPage({
        name: 'Localization',
        data: {
          title: 'Localization'
        },
        handler: {
          select: Function.runOnce(function(){
            this.appendChild(lazy_LocalizationPage());

            if (chrome && chrome.extension)
            {
              listenPageScript();

              //app.callPageScriptFunction('loadCultureList');
              //app.callPageScriptFunction('loadDictionaryList');
            }
            else
            {
              new nsAjax.Transport({
                url: 'app/dictionary.json',
                handler: {
                  success: function(sender, req){
                    var data = req.data.responseText.toObject();
                    
                    for (var dictionaryName in data.dictionaries)
                    {
                      Dictionary(dictionaryName);
                      processDictionaryData(dictionaryName, data.dictionaries[dictionaryName]);
                    }
                    CULTURE_LIST = ['base'].concat(data.cultureList);
                    lazy_CultureList().setChildNodes(CULTURE_LIST.map(function(culture){ return { title: culture, value: culture }}));
                    property_CurrentCulture.set(data.currentCulture);
                  }
                }
              }).get();
            }
          })
        }
      })
    }
  });



