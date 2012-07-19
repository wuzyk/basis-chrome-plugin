
  basis.require('basis.data');
  basis.require('basis.data.dataset');
  basis.require('basis.entity');

  var nsEntity = basis.entity;
  var EntityType = basis.entity.EntityType;

  var Dictionary = new EntityType({
    name: 'Dictionary',
    fields: {
      Dictionary: nsEntity.StringId,
      Location: String,
      Position: Number,
      ResourceModified: Boolean
    }
  });

  var Token = new EntityType({
    name: 'Token',
    fields: {
      Dictionary: nsEntity.StringId,
      Token: nsEntity.StringId,
      Position: Number
    }
  });

  var Resource = new EntityType({
    name: 'Resource',
    fields: {
      Dictionary: nsEntity.StringId,
      Token: nsEntity.StringId,
      Culture: nsEntity.StringId,
      Value: String
    }
  });

  var DictionaryCulture = new EntityType({
    name: 'DictionaryCulture',
    fields: {
      Dictionary: nsEntity.StringId,
      Culture: nsEntity.StringId,
      Position: Number
    }
  });

  var Culture = new EntityType({
    name: 'Culture',
    fields: {
      Culture: nsEntity.StringId,
      Title: String
    }
  });

  //
  // Datasets
  //
  /*var resourceDictionaryCultureGrouping = new nsEntity.Grouping({
    wrapper: Resource,
    rule: function(object){
      return object.data.Dictionary + '_' + object.data.Culture;
    },
    source: Resource.all
  });

  var resourceDictionaryCultureMerge = new basis.data.dataset.Merge({
    wrapper: Resource
  });

  var resourceGrouping = new nsEntity.Grouping({
    wrapper: Resource,
    rule: function(object){
      return object.data.Dictionary + '_' + object.data.Token;
    },
    source: resourceDictionaryCultureMerge
  });

  var dictionaryCultureGrouping = new nsEntity.Grouping({
    rule: getter('data.Dictionary'),
    wrapper: DictionaryCulture,
    source: DictionaryCulture.all
  });

  var dictionaryCultureDataSource = new nsEntity.Collection({
    wrapper: DictionaryCulture,
    filter: Function.$true
  });

  var tokenGrouping = new nsEntity.Grouping({
    wrapper: Token,
    rule: getter('data.Dictionary'),
    source: Token.all
  });

  var tokenDataSource = new nsEntity.Collection({
    wrapper: Token
  });*/

  module.exports = {
    Dictionary: Dictionary,
    Token: Token,
    Resource: Resource,
    DictionaryCulture: DictionaryCulture,
    Culture: Culture
  }
