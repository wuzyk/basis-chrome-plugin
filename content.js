(function(){
  var transferDiv;
  var transferDataHandler = function(){
    var action = transferDiv.getAttribute('action');
    var data = transferDiv.innerText;

    console.log('transfer data action:', action);
    //console.log('transfer data:', data);

    port.postMessage({ action: action, data: data });
  }

  var port = chrome.extension.connect({name: "contentScriptPort"});
  port.onMessage.addListener(function(msg) {
    if (msg.action == 'pageScriptInited')
    {
      transferDiv = document.getElementById('transferDiv');
      if (transferDiv)
      {
        transferDiv.addEventListener('transferData', transferDataHandler);
        port.postMessage({ action: 'transportInited' });
      }
    }
  });

  port.postMessage({ action: 'contentScriptInited' });

  console.log('content script init');

})();
