
  basis.require('basis.ui');
  
  var LiveMemo = basis.ui.Node.subclass({
    template: resource('template/livememo.tmpl'),

    init: function(config){
      basis.ui.Node.prototype.init.call(this, config);
      //this.inherit(config);

      memos[this.eventObjectId] = this;

      Event.addHandler(this.element, 'scroll', function(){
        this.element.scrollTop = 0;
      });

      this.tmpl.memo.object = this;
      Event.addHandlers(this.tmpl.memo, LIVEMEMO_HANDLERS);

      this.cachedValue = undefined;
      this.tmpl.memo.value = this.tmpl.shadowMemo.value = this.text || '';
      this.cachedScrollHeight = this.tmpl.shadowMemo.scrollHeight;

      this.updateMemo();
      setTimeout(this.updateMemo.bind(this), 0);
    },
    setText: function(text){
      this.tmpl.memo.value = this.tmpl.shadowMemo.value = text;
      this.update();        
    },
    updateMemo: function(){
      var newValue = this.tmpl.memo.value;
      if (newValue !== this.cachedValue)
        this.tmpl.shadowMemo.value = this.cachedValue = newValue;

      var scrollHeight = this.tmpl.shadowMemo.scrollHeight;
      basis.cssom.setStyle(this.tmpl.memo, {
        height: scrollHeight ? scrollHeight + 'px' : '1.2em'
      });
    },
    destroy: function(){
      delete memos[this.eventObjectId];
      Event.clearHandlers(this.tmpl.memo);

      clearInterval(this.timer);
      delete this.timer;

      basis.ui.Node.prototype.destroy.call(this);
    }
  });

  var LIVEMEMO_HANDLERS = {
    change: function(event){ 
      var object = Event.sender(event).object;
      object.updateMemo(); 
    },
    keyup: function(event){
      var object = Event.sender(event).object;
      object.updateMemo();
    },
    keydown: function(event){
      if (Event.key(event) == Event.KEY.ENTER)
        Event.kill(event);
    },
    focus: function(event){
      var object = Event.sender(event).object;
      if (!object.timer)
        object.timer = setInterval(object.updateMemo.bind(object), 100);
    },
    blur: function(event){
      var object = Event.sender(event).object;
      clearTimeout(object.timer);
      delete object.timer;
    }
  } 

  var memos = {};
  function updateMemos(){
    for (var i in memos)
      memos[i].updateMemo();
  }
  Event.addHandler(window, 'resize', updateMemos);

  module.exports = {
    LiveMemo: LiveMemo,
    updateMemos: updateMemos
  }

