
  basis.require('app.type.file');

  //
  // Main
  //

  module.exports = {
    name: 'Templater',
    title: 'Templater',
    lazyContent: resource('view.js'),
    handler: {
      select: Function.runOnce(function(){
        if (chrome && chrome.extension)
        {
          /*app.onPageScriptMessage(function(msg){
            if (msg.action == 'inited')
            {
              app.callPageScriptFunction('getFileList');
            }
          });*/
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
              '{resource:resource.css}\n<li>{filename}</li>'
          });
        }
      })
    }
  }
