// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


  var contentScriptPorts = {};
  var extensionUIPorts = {};
  var extensionTabIdTab = {};

  var contentScriptPort;
  var extensionUIPort;


  function attachContentScriptPort(port){
    var tabId = port.sender.tab.id;
    contentScriptPorts[tabId] = port;

    port.onMessage.addListener(function(msg) {
      if (extensionUIPorts[tabId])
        extensionUIPorts[tabId].postMessage({ action: msg.action, data: msg.data });

      if (msg.action == 'token' && extensionTabIdTab[tabId])
        chrome.tabs.update(extensionTabIdTab[tabId], { active: true });
    });

    port.onDisconnect.addListener(function(){
      delete contentScriptPorts[tabId];
    });
  }

  function attachExtensionUIPort(port){
    var tabId;
    var extensionTabId = port.sender.tab.id;

    port.onMessage.addListener(function(msg) {
      if (msg.action == 'extensionInited')
      {
        extensionUIPorts[msg.tabId] = port;
        tabId = msg.tabId;
        extensionTabIdTab[msg.tabId] = extensionTabId;
      }

      if (contentScriptPorts[tabId])
        contentScriptPorts[tabId].postMessage({ action: msg.action });
    });

    port.onDisconnect.addListener(function(){
      if (tabId)
        delete extensionUIPorts[tabId];
    });
  }

  chrome.extension.onConnect.addListener(function(port) {
    if (port.name == 'contentScriptPort')
      attachContentScriptPort(port);

    if (port.name == 'extensionUIPort')
      attachExtensionUIPort(port);
  });


  /*chrome.contextMenus.create({
    type: 'separator'
  });*/

  chrome.contextMenus.create({
    title: 'Translate',
    contexts: ["all"],
    onclick: function(info, tab){
      if (extensionUIPorts[tab.id])
        extensionUIPorts[tab.id].postMessage({ action: 'contextMenuTranslate' });
    }
  });
