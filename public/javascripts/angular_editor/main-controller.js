angular.module('MainController',[])
    .controller('myController',
      ['$scope','$indexedDB','$http', 
      function($scope, $indexedDB, $http){

        // define variables for input text and no. of lines
        $scope.inputText = '';
        $scope.numLines = 1;

        // angular watch function for the input text
        $scope.$watch(

            // set the watch variable to inputText
            function(scope){ 
                return scope.inputText;
            },

            // set what happens on change of watch variable
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
                        var phonemes = _.chain(syllables)
                                        .pluck('phonemes')
                                        .flatten()
                                        .filter(function(pho){
                                            return pho.stress != -1;
                                        })
                                        .value();

                        var sylPerLine = _.map(input, function(d,i){

                            var syl = _.chain(d)
                                       .map(function(word){
                                            var word_phoneme = _.filter(syllables, function(s){
                                                return s.word.toLowerCase() === word.toLowerCase();
                                            })[0];

                                            return _.chain(word_phoneme.phonemes)
                                                    .filter(function(pho){
                                                        return pho.stress != -1;
                                                    })
                                                    .value();
                                       })
                                       .flatten()
                                       .value();

                            angular.element('.syllable-count-'+(i+1))
                                .text(syl.length+' ');

                            return syl;

                        });

                        var rhymes = sylPerLine.map(function(d){
                            var stress = _.pluck(d,'stress'),
                                even = stress
                                        .filter(function(d,i){ return i%2 == 0})
                                        .reduce(function(a,b){ return a+b}),
                                odd = stress
                                        .filter(function(d,i){ return i%2 != 0})
                                        .reduce(function(a,b){ return a+b}),
                                rhyme_type = '';

                            // console.log(even,odd, (stress.length/2 -1), Math.abs(even-odd));

                            if(Math.abs(even-odd) >= (stress.length/2 -1)){
                                rhyme_type = 'iambic';
                            }
                            return {stress:stress, rhyme_type:rhyme_type};
                        });

                        console.log(rhymes);

                        // console.log(sylPerLine);

                        // console.log(syllables);
                        // console.log(phonemes);



                    });
                }
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

        // define function to syllables
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
