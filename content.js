(function(){
  console.log('content script loading');

  var transferDiv;
  var transferDataHandler = function(){
    var action = transferDiv.getAttribute('action');
    var data = transferDiv.innerText;

    console.log('transfer data action:', action);
    console.log('transfer data:', data);

    port.postMessage({ action: action, data: data });
  }

  var port = chrome.extension.connect({name: "contentScriptPort"});
  port.onMessage.addListener(function(msg) {
    if (msg.action == 'init')
    {
      transferDiv = document.getElementById('transferDiv');
      if (transferDiv)
      {
        transferDiv.addEventListener('transferData', transferDataHandler);
        port.postMessage({ action: 'inited' });
      }
    }
  });
  port.postMessage({ action: 'init' });
})();
