
  basis.require('basis.ui');

    
  module.exports = new basis.ui.Node({
    template: resource('template/view.tmpl'),

    satellite: {
      inspectButton: resource('inspectButton.js')(),
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
