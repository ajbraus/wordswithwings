angular.module('Datafactory',[])
.factory('dataFactory', function($http){
    var service = {},
        meterTypes = [{name:'Iambic', symbol:'i'},
                     {name:'Trochiaic', symbol:'t'},
                     {name:'Anapestic', symbol:'a'},
                     {name:'Dactylic', symbol:'d'},
                     {name:'Spondee', symbol:'s'},
                     {name:'Pyrrhic', symbol:'p'},
                     {name:'Monometer', symbol:'m'},
                     {name:'Dimeter', symbol:'di'},
                     {name:'Trimeter', symbol:'tr'},
                     {name:'Tetrameter', symbol:'te'},
                     {name:'Pentameter', symbol:'pe'},
                     {name:'Hexameter', symbol:'hx'},
                     {name:'Heptameter', symbol:'hp'}];

    // define function to syllables
    function getSyllables(input, callback, getWordDicts){
        // function to get syllables from server with parameters as
        // unique words from input text
        var words = _.uniq(_.flatten(input));

        $http({method:'GET',
               url:'/getSyllables',
               params:{words:words},
               dataType:'json'
        })
        .success(function(data){

            // send word dicts and total number of lines to main controller
            getWordDicts(data, input.length);
            // returns dictionary containing word, syllables, phonemes that include stress
            callback(data, input);

        })
        .error(function(err){
            throw err;
        });

    }

    function analyseInputText(data, callback){
        // get syllables only when a space or end of line has occurred
        if( [" ","\n"].indexOf(data.slice(-2,-1)) != -1 ){

            // get each line by splitting end of line '\n'
            var input = data.split('\n')
                        .map(function(d){
                            return d.split(' ').slice(0,-1);
                        });

            // call function to get syllables of unique words from server
            getSyllables(input, analyseWord, callback);

            // return syllables;
        }
    }

// function to analyse each word in line and get syllables and meter type
    function analyseWord(word_dicts, input){

        // for each line analyse words
        var sylPerLine = _.map(input, function(d,i){
            // get word_dict for each word in line
            var syl = _.chain(d)
                       .map(function(word){
                            var word_phoneme = _.filter(word_dicts, function(s){
                                return s.word.toLowerCase() === word.toLowerCase();
                            })[0];

                            // filter out stress that is -1 as it means no syllable
                            return _.filter(word_phoneme.phonemes, function(pho){
                                        return pho.stress != -1;
                                    });
                       })
                       .flatten()
                       .value();

            return syl;

        }); //end sylPerLine

        // get the meter for each line
        var meterSyl = sylPerLine.map(function(d, i){

            // get stress for each syllable in line
            var stress = _.pluck(d,'stress'),
                meter_type = '-';

            // check the meter type
            meter_type = checkIambic(stress);

            // set the gutter of editor to show the syllable count and meter type
            angular.element('.syllable-count-'+(i+1))
                .text(d.length+' '+meter_type+' ');

            return {stress:stress, meter_type:meter_type};
        });

    }

// function to check if line is iambic meter
// condition: (sum of stress of syllable at even places 
//              - sum of stress of syllable at odd places) 
//              >= half of length of all stress -1
    function checkIambic(stress){

        var meter_type = '-',
            even = stress.filter(function(d,i){ return i%2 == 0}),
            odd = stress.filter(function(d,i){ return i%2 != 0});

        // use reduce on non empty array
        even = even.length > 0 ? even.reduce(function(a,b){ return a+b}) : even;
        odd = odd.length > 0 ? odd.reduce(function(a,b){ return a+b}) : odd;

        if(Math.abs(even-odd) >= (stress.length/2 -1)){
            meter_type = 'i';
        }

        return meter_type;

    }

// data that will be used in main controller
    service.getData = function(){
        return {meterTypes:meterTypes};
    }

// function to be used in the watch function for inputText in main-controller
    service.analyseInputText = analyseInputText;

    return service;
})
