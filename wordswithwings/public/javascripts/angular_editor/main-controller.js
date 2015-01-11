angular.module('MainController',[])
    .controller('myController',
      ['$scope','$indexedDB','$http', 
      function($scope, $indexedDB, $http){

        // define variables for input text and no. of lines
        $scope.inputText = '';
        $scope.numLines = 1;

        // angular watch function for the input text
        $scope.$watch(

            function(scope){ 
                return scope.inputText;
            },

            function(data){
                // get syllables only when a space or end of line has occurred
                if( [" ","\n"].indexOf(data.slice(-2,-1)) != -1 ){

                    var input = data.split('\n')
                                .map(function(d){
                                    return d.split(' ').slice(0,-1);
                                }),
                        uniqueWords = _.uniq(_.flatten(input)),
                        syllables;

                    $scope.numLines = input.length;

                    // call function to get syllables of unique words from server
                    getSyllables(uniqueWords, function(syllables){
                        $scope.syllables = syllables;
                    });
                }
            }
        );

        function getSyllables(words, callback){
            // function to get syllables from server with parameters as
            // unique words from input text

            $http({method:'GET',
                   url:'/getSyllables',
                   params:{words:words},
                   dataType:'json'
            })
            .success(function(data){

                callback(data);

            })
            .error(function(err){
                throw err;
            });

        }

    }]);
