angular.module('MainController',[])
    .controller('myController',
      ['$scope','$indexedDB','$http','dataFactory', 
      function($scope, $indexedDB, $http, dataFactory){

        // define variables for input text and no. of lines
        // dataFactory :- ./data-factory.js
        var data = dataFactory.getData();
        $scope.numLines = 1;
        $scope.meterTypes = data.meterTypes;
        $scope.analyseInputText = dataFactory.analyseInputText;
        $scope.ace_options = {theme:'twilight',
                              onLoad: $scope.aceLoaded,
                              onChange: $scope.aceChanged};

        // variable that will contain the text from editor
        $scope.inputText = '';

        // angular watch function for the input text
        $scope.$watch(

            // set the watch variable to inputText
            function(scope){ 
                return scope.inputText;
            },

            // set what happens on change of watch variable
            function(data){
                $scope.analyseInputText(data, function(word_dicts, numLines){
                    $scope.word_dicts = word_dicts;
                    $scope.numLines = numLines;
                });
            }
            
        );

        // ace onload function
        $scope.aceLoaded = function(_editor) {
            // Options
            var _session = _editor.getSession();
            var _renderer = _editor.renderer;
        };

        // ace onchange function
        $scope.aceChanged = function(e) {
            // Options
            // console.log(e);
            // angular.element('.syllable-count-1').text($scope.numLines);
        };        



    }]);
