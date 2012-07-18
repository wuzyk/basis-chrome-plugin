
  basis.require('basis.l10n');
  basis.require('basis.data');
  basis.require('basis.data.property');
  basis.require('basis.ui');

  var uiNode = basis.ui.Node;
  var Property = basis.data.property.Property;

  //
  // main menu
  //

  var EXTENSION_LAST_TAB_STORAGE_KEY = 'BasisDevtoolLastTab';

  function initMainMenu(){
    var mainMenu = basis.resource('app/module/mainmenu/mainmenu.js')();
    
    mainMenu.setChildNodes([
      /*basis.resource('app/module/localization/localization.js')(),
      basis.resource('app/module/templater/templater.js')()*/
    ]);

    var tabName = localStorage[EXTENSION_LAST_TAB_STORAGE_KEY];
    if (tabName)
    {
      var tab = mainMenu.item(tabName);
      if (tab)
        tab.select();
    }
    mainMenu.selection.addHandler({
      datasetChanged: function(){
        var tab = this.pick();
        if (tab)
          localStorage[EXTENSION_LAST_TAB_STORAGE_KEY] = tab.name;        
      }
    });
  }
  
  //
  // pageScript
  //

  var port;
  var missedHandlers = [];
  var isServerOnline = new Property(false);

  function initPageScript(){
    port = chrome.extension.connect({ name: "extensionUIPort" });

    port.onMessage.addListener(function(msg) {
      if (msg.action == 'init')
      {
        injectScript();
      }
      else if (msg.action == 'inited')
      {
        callPageScriptFunction('checkFsObserverState');
      }
      else if (msg.action == 'fsobserverState')
      {
        isServerOnline.set(msg.data.toObject().state);
      }
    });

    for (var i = 0, handler; handler = missedHandlers[i]; i++)
      port.onMessage.addListener(handler);

    injectScript();
  }

  function injectScript(){
    if (window.pageScript)
    {
      var tabId = chrome.devtools.inspectedWindow.tabId;

      chrome.devtools.inspectedWindow.eval(window.pageScript(), function(result){
        if (result)
          port.postMessage({ action: 'init', tabId: tabId});
        else
        {
          new uiNode({
            cssClassName: 'BasisNotSupported',
            container: document.body,
            content: 'Basis not found'
          });
        }
      });
    }
  }

  function callPageScriptFunction(funcName){
    if (!chrome.devtools)
      return;

    var args = Array.from(arguments).slice(1).map(JSON.stringify);

    chrome.devtools.inspectedWindow.eval(
      '(function(){ try { if (window.pageScript) window.pageScript.' + funcName + "(" + (args.length ? args.join(", ") : '') + "); return true;} catch(e){ console.warn(e.toString()) }})();"
    );
  }

  function onPageScriptMessage(handler){
    if (port)
      port.onMessage.addListener(handler);
    else
      missedHandlers.push(handler);
  }

  //
  // init
  //

  basis.ready(function(){
    if (chrome && chrome.extension)
      initPageScript();

    initMainMenu();
  });

  //
  // extend
  //

  module.exports = {
    onPageScriptMessage: onPageScriptMessage,
    callPageScriptFunction: callPageScriptFunction,
    isServerOnline: isServerOnline
  };

