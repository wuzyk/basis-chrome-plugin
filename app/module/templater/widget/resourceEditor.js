
  basis.require('basis.dom.event');
  basis.require('basis.cssom');
  basis.require('basis.data');
  basis.require('basis.layout');
  basis.require('basis.ui');
  basis.require('basis.ui.tabs');
  basis.require('basis.ui.resizer');

  resource('../templates/resourceEditor/style.css')().startUse();

  //
  // import names
  //

  var wrapper = Function.wrapper;

  var DOM = basis.dom;
  var domEvent = basis.dom.event;
  var classList = basis.cssom.classList;
  var DELEGATE = basis.dom.wrapper.DELEGATE;

  var UINode = basis.ui.Node;
  var UIContainer = basis.ui.Container;

  var nsTemplate = basis.template;
  var nsLayout = basis.layout;
  var nsTree = basis.ui.tree;
  var nsResizer = basis.ui.resizer;
  var nsProperty = basis.data.property;
  var nsButton = basis.ui.button;


  //
  // Main part
  //

  var Editor = resource('Editor.js')();

  var ResourceEditor = Editor.subclass({
    active: true,
    autoDelegate: false,

    template: resource('../templates/resourceEditor/resourceEditor.tmpl'),

    binding: {
      filename: 'data:',
      buttonPanel: 'satellite:',
      createFilePanel: 'satellite:'
    },

    satelliteConfig: {
      buttonPanel: {
        instanceOf: nsButton.ButtonPanel,
        config: {  
          autoDelegate: DELEGATE.OWNER,
          disabled: true,
          childNodes: [
            {
              autoDelegate: DELEGATE.PARENT,
              caption: 'Save',
              click: function(){
                this.target.save();
              }
            },
            {
              autoDelegate: DELEGATE.PARENT,
              caption: 'Rollback',
              click: function(){
                this.target.rollback();
              }
            }
          ],
          syncDisableState: function(){
            if (this.target && this.target.modified)
              this.enable();
            else
              this.disable();
          },
          handler: {
            targetChanged: function(){
              this.syncDisableState();
            }
          },
          listen: {
            target: {
              rollbackUpdate: function(){
                this.syncDisableState();
              }
            }
          }
        }
      },
      createFilePanel: {
        existsIf: function(editor){
          return editor.data.filename && !editor.target;
        },
        hook: {
          rootChanged: true,
          targetChanged: true
        },
        instanceOf: UINode.subclass({
          autoDelegate: DELEGATE.OWNER,

          template: resource('../templates/resourceEditor/createFilePanel.tmpl'),

          binding: {
            filename: 'data:',
            ext: function(node){
              return (node.owner && node.owner.fileExt) || '?';
            },
            button: 'satellite:'
          },

          satelliteConfig: {
            button: basis.ui.button.Button.subclass({
              autoDelegate: DELEGATE.OWNER,
              caption: 'Create a file',
              click: function(){
                app.type.file.File.createFile(this.data.filename);
              }
            })
          }
        })
      }

    },

    init: function(config){
      Editor.prototype.init.call(this, config);
      if (this.data.content)
        this.tmpl.field.textContent = this.data.content;
    },

    readFieldValue_: function(){
      return this.tmpl && this.tmpl.field && this.tmpl.field.innerText;
    },
    writeFieldValue_: function(value){
      if (this.tmpl && this.tmpl.field && this.tmpl.field.innerText != value)
        this.tmpl.field.innerText = value;
    }
  });

  var resourceFilesDataset = new basis.data.Dataset({});

  var resourceEditorList = new UIContainer({
    template: 
      '<div class="ResourceEditorList"></div>',
    
    childClass: ResourceEditor,
    dataSource: resourceFilesDataset
  });

  var widget = new nsLayout.VerticalPanelStack({
    id: 'Resources',
    childNodes: [
      {
        //childNodes: resourceList
      },
      {
        flex: 1,
        childNodes: resourceEditorList//cssEditor
      }
    ]
  });

  /*var cssSource = new nsProperty.Property('');

  var resourceList = new UIContainer({
    selection: true,
    childClass: UINode.subclass({
      template: resource('../templates/resourceEditor/resourceListItem.tmpl'),
      binding: {
        title: 'data:filename'
      },
      action: {
        select: function(){
          this.select();
        }
      }
    }),
    template: resource('../templates/resourceEditor/resourceList.tmpl')
  });


  var cssEditor = new Editor({
    id: 'CssEditor',
    sourceProperty: cssSource,
    fileExt: 'css',
    active: true
  });

  resourceList.selection.addHandler({
    datasetChanged: function(selection, delta){
      var item = selection.pick();
      cssEditor.setDelegate(item && app.type.File.get(item.data.path + item.data.filename));
    }
  });


  var widget = new nsLayout.VerticalPanelStack({
    id: 'ResourceEditor',
    childNodes: [
      {
        childNodes: resourceList
      },
      {
        flex: 1,
        childNodes: cssEditor
      }
    ]
  });*/


 /**
  * resizer
  */
  new nsResizer.Resizer({
    element: widget.element,
    property: 'width'
  });


  //
  // export names
  //

  exports = module.exports = widget;
  //exports.cssSource = cssSource;
  exports.setSource = function(decl, path){
    /*var decl = nsTemplate.makeDeclaration(source)
    tree.setChildNodes(decl.tokens);*/

    resourceFilesDataset.set(decl.resources.map(function(res){ return app.type.file.File.getSlot(path + res) }));
    //resourceEditorList.setChildNodes(decl.resources.map(function(res){ return { filename: (path || '') + res } }));
    /*resourceList.setChildNodes(decl.resources.map(function(res){ return { data: { filename: res, path: path }}}));
    if (resourceList.firstChild)
      resourceList.firstChild.select();*/
  }
