    angular.module('ModuleIndexedDB', ['xc.indexedDB'])
      .config(function ($indexedDBProvider) {
        $indexedDBProvider
          .connection('myIndexedDB')
          .upgradeDatabase(4, function(event, db, tx){
            var objStore = db.createObjectStore('syllables', {autoIncrement: true});
            objStore.createIndex('word_idx', 'word', {unique: true});
            objStore.createIndex('phonemes_idx', 'phonemes', {unique: false});
            objStore.createIndex('syllables_idx', 'syllables', {unique: false});            
          });
      });
