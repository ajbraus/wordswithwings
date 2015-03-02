angular.module('Datafactory',[])
.factory('dataFactory', function($http, socket){
    var service = {},
        inputText,
        getWordDicts,
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

    function arrayCombos(arg) {
        var r = [], 
            max = arg.length-1;
        function helper(arr, i) {
            for (var j=0, l=arg[i].length; j<l; j++) {
                var a = arr.slice(0); // clone arr
                a.push(arg[i][j]);
                if (i==max) {
                    r.push(a);
                } else
                    helper(a, i+1);
            }
        }
        helper([], 0);
        return r;
    }

    // socket.on('news', function (data) {
    //     console.log(data);
    //     socket.emit('my other event', { my: 'data' });
    //   });  
    socket.on('syllables sent', function(data){
        // console.log(data);
        getWordDicts(data, inputText.length);
        analyseWord(data, inputText);
    });              

    // define function to syllables
    function getSyllables(input, callback, getWordDicts){
        // function to get syllables from server with parameters as
        // unique words from input text
        var words = _.uniq(_.flatten(input));

        socket.emit('words sent', { words: words });
        // socket.on('syllables sent', function(data){
        //     // console.log(data);
        //     getWordDicts(data, input.length);
        //     callback(data, input);
        // });         


        /*$http({method:'GET',
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
        });*/

    }

    function analyseInputText(data, callback){
        // get syllables only when a space or end of line has occurred

        // get each line by splitting end of line '\n'
        var input = data.split('\n')
                    .map(function(d){
                        var temp = d.split(' ');
                        return temp[temp.length - 1] == '' ? temp.slice(0,-1) : temp;
                    });

        inputText = input;
        getWordDicts = callback;

        socket.emit('words sent', { words: _.uniq(_.flatten(input)) });

        // call function to get syllables of unique words from server
        // getSyllables(input, analyseWord, callback);

    }

// function to analyse each word in line and get syllables and meter type
    function analyseWord(word_dicts, input){

        // for each line analyse words
        var sylPerLine = _.map(input, function(d,i){
            // get word_dict for each word in line
            var syl = _.chain(d)
                       .map(function(word){
                            // console.log(word_dicts);
                            var regex = new RegExp("^"+word.toLowerCase()+"(\\(\\d\\))?$");
                            var word_phoneme = _.filter(word_dicts, function(s){
                                // return s.word.toLowerCase() === word.toLowerCase();
                                return s.word.toLowerCase().search(regex) != -1;
                            })
                            .map(function(w){
                                var temp = _.filter(w.phonemes, function(pho){
                                            return pho.stress != -1;
                                        });

                                w.phonemes = temp;
                                
                                return w;
                            });

                            // return _.pluck(word_phoneme, phonemes);
                            if(typeof word_phoneme[0] == 'undefined'){
                                return [{phoneme:word,stress:0}];
                            } else {
                                var pho = _.pluck(word_phoneme, 'phonemes')
                                        .map(function(d){
                                            // console.log(d);
                                            return _.pluck(d,'stress');
                                        });

                                // console.log(_.pluck(word_phoneme, 'phonemes'));
                                // console.log(pho);

                                return pho;
                                // return word_phoneme[0].phonemes;
                            }


                            // filter out stress that is -1 as it means no syllable
                            // return _.filter(word_phoneme.phonemes, function(pho){
                            //             return pho.stress != -1;
                            //         });
                       })
                       // .flatten()//
                       .value();

            return syl;

        }); //end sylPerLine

        console.log(input);
        var meterLines = [],
            last_words = input.map(function(arr){
                return arr.slice(-1)[0];
            });

        console.log(last_words);

        // get the meter for each line
        sylPerLine.forEach(function(d, i){

            // console.log(d);

            // get stress for each syllable in line
            var meter_type = '-',
                new_arr = [];

            d.forEach(function(arr){
                if(arr.length == 1 && arr[0].length > 1){
                    // console.log(arr);
                    arr[0].forEach(function(a){
                        // console.log(a);
                        new_arr.push([a]);
                    });
                } else {
                    new_arr.push(_.flatten(arr));
                }
            });

            // console.log(new_arr);

            // check the meter type
            meter_type = checkIambic(new_arr);

            meterLines.push(meter_type);

            // set the gutter of editor to show the syllable count and meter type
            angular.element('.syllable-count-'+(i+1))
                .text(d.length+' '+meter_type+' ');

            // return {stress:stress, meter_type:meter_type};
        });

        var rhyme = sylPerLine.map(function(arr){ return arr.length}).join('-');

        if(rhyme == '5-7-5'){
            angular.element('#rhyme').text('Haiku');
        } else if(meterLines.join('') == Array(sylPerLine.length+1).join('i')){
            angular.element('#rhyme').text('Blank Verse');
        } else {
            angular.element('#rhyme').text('');
        }   

    }

// function to check if line is iambic meter
// condition: (sum of stress of syllable at even places 
//              - sum of stress of syllable at odd places) 
//              >= half of length of all stress -1
    function checkIambic(stress){

        // var stress = _.pluck(phonemes,'stress');

        // console.log(stress);
        var allcombos = arrayCombos(stress),
            meter_type = '-';
        // console.log(allcombos);
        allcombos.forEach(function(combo){

            combo = combo.join('');

            if(combo == "0101010101"){
                meter_type = 'i';
                return meter_type;
            } else if(combo == "10101010"){
                meter_type = 't';
                return meter_type;
            } else if(combo == "001001001"){
                meter_type = 'a';
                return meter_type;                
            } else if(combo == "100100100100100100"){
                meter_type = 'd';
                return meter_type;                
            }            

            /*var even = combo.filter(function(d,i){ return i%2 == 0}),
                odd = combo.filter(function(d,i){ return i%2 != 0});

            // use reduce on non empty array
            even = even.length > 0 ? even.reduce(function(a,b){ return a+b}) : even;
            odd = odd.length > 0 ? odd.reduce(function(a,b){ return a+b}) : odd;

            var half = combo.length/2;

            if([Math.ceil(half), Math.floor(half)].indexOf(Math.abs(even-odd)) != -1 && combo.length != 0){
                meter_type = 'i';
                // console.log(combo);
                return meter_type;
            }*/

        });

        return meter_type;

    }

// data that will be used in main controller
    service.getData = function(){
        return {meterTypes:meterTypes};
    }

// function to be used in the watch function for inputText in main-controller
    service.analyseInputText = analyseInputText;
    service.analyseInputText = analyseInputText;

    return service;
})
