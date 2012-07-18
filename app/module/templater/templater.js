
  basis.require('app.type.file');

  var DOM = basis.dom;
  var Event = basis.dom.event;
  var classList = basis.cssom.classList;

  var uiNode = basis.ui.Node;
  var uiContainer = basis.ui.Container;

  var EmptyLabel = basis.ui.label.Empty;

  var EntityType = basis.entity.EntityType;
  var nsEntity = basis.entity;
  var Property = basis.data.property.Property;

  var Button = basis.ui.button.Button;
  var ButtonPanel = basis.ui.button.ButtonPanel;
  var getter = Function.getter;
  var STATE = basis.data.STATE;

  //
  // Main
  //
  var templater = basis.resource('app/templater/templater.js');

  app.main.addModule({
    init: function(){
      app.main.addPage({
        name: 'Templater',
        data: {
          title: 'Templater'
        },
        handler: {
          select: Function.runOnce(function(){
            this.appendChild(templater());

            if (chrome && chrome.extension)
            {
              app.main.onPageScriptMessage(function(msg){
                if (msg.action == 'inited')
                {
                  app.main.callPageScriptFunction('getFileList');
                }
              });

              app.main.callPageScriptFunction('getFileList');

              //templater().editor().setSourceFile('/basis2.0-module/tools/templater/templates/tokenView/resourceList.tmpl');
            }
            else
            {
              app.type.File({
                filename: 'resource.css',
                content: 
                  '#TemplateResourceList LI\n\
                  {\n\
                    padding: 0 0 0 16px;\n\
                    margin: 0;\n\
                  }'
              });

              app.type.File({
                filename: 'resource.tmpl',
                content: 
                  '{resource:resource.css}\n<li>{filename}</li>'
              });
            }
          })
        }
      })
    }
  });

