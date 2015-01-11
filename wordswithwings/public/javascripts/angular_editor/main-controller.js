angular.module('MainController',[])
    .controller('myController',
      ['$scope','$indexedDB','$http', 
      function($scope, $indexedDB, $http){

        $scope.inputText = '';
        $scope.numLines = 1;

        $scope.$watch(function(scope){ return scope.inputText},function(data){

            if([" ","\n"].indexOf(data.slice(-2,-1)) != -1){
                var input = data.split('\n')
                            .map(function(d){
                                return d.split(' ');
                            }),
                    uniqueWords = _.uniq(_.flatten(input)),
                    syllables;

                $scope.numLines = input.length;
                getSyllables(uniqueWords, function(syllables){
                    $scope.syllables = syllables;
                    // console.log($scope.numLines, uniqueWords, syllables);
                });
            }

        })



        // var OBJECT_STORE_NAME = 'syllables';  

        /**
         * @type {ObjectStore}
         */
        // var myObjectStore = $indexedDB.objectStore(OBJECT_STORE_NAME);

        function getSyllables(words, callback){

            $http({method:'GET',
                   url:'/getSyllables',
                   params:{words:words},
                   dataType:'json'
            })
            .success(function(data){

                // console.log(data)
                callback(data);

            })
            .error(function(err){
                throw err;
            });

        }


        // data.slice(0,5).forEach(function(d){
        //     myObjectStore.insert(d)
        //         .then(function(e){ console.log('inserted'); });                
        // })

        // myObjectStore.insert({"word":"!EXCLAMATION-POINT","phonemes":[{"phoneme":"EH","stress":2},{"phoneme":"K","stress":-1},{"phoneme":"S","stress":-1},{"phoneme":"K","stress":-1},{"phoneme":"L","stress":-1},{"phoneme":"AH","stress":0},{"phoneme":"M","stress":-1},{"phoneme":"EY","stress":1},{"phoneme":"SH","stress":-1},{"phoneme":"AH","stress":0},{"phoneme":"N","stress":-1},{"phoneme":"P","stress":-1},{"phoneme":"OY","stress":2},{"phoneme":"N","stress":-1},{"phoneme":"T","stress":-1}],"syllables":[["EH","K","S","K"],["L","AH"],["M","EY"],["SH","AH","N"],["P","OY","N","T"]]})
        // .then(function(e){ console.log('inserted'); });

        // myObjectStore.getAll().then(function(results) {  
        //   // Update scope
        //   $scope.objects = results;
        // });        
        // console.log($scope.inputText);
    }]);
