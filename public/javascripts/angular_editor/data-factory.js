angular.module('Datafactory',[])
.factory('dataFactory', function($http, socket){

    var service = {},
        inputText,
        getWordDicts,
        reg_vowel = /[aeiouAEIOU]/,
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

    socket.on('syllables sent', function(data){
        // console.log(data);
        getWordDicts(data, inputText.length);
        analyseWord(data, inputText);
    });                     

    function arrayCombos(arg) {
        var r = [], 
            max = arg.length-1;
        function helper(arr, i) {
            if(typeof arg[i] != "undefined"){
                for (var j=0, l=arg[i].length; j<l; j++) {
                    var a = arr.slice(0); // clone arr
                    a.push(arg[i][j]);                    
                    if (i==max) {
                        r.push(a);
                    } else
                        helper(a, i+1);
                }
            }
        }
        helper([], 0);
        return r;
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
            var syl = [];

            d.forEach(function(word){
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

                // console.log(word_phoneme)

                // return _.pluck(word_phoneme, phonemes);
                if(typeof word_phoneme[0] == 'undefined'){

                    syl.push([0]);

                } else if(word_phoneme[0].phonemes.length > 1){

                    var pho = _.pluck(word_phoneme, 'phonemes')
                            .map(function(d){
                                // console.log(d);
                                return _.pluck(d,'stress');
                            });

                    // var word_syl = [];
                    // console.log(pho);

                    pho[0].forEach(function(ph,index){
                        var temp = [];
                        pho.forEach(function(w){
                            temp.push([w[index]]);
                        });
                        syl.push(temp);
                    });

                    // syl.push(pho);

                } else {

                    var pho = _.pluck(word_phoneme, 'phonemes')
                            .map(function(d){
                                // console.log(d);
                                return _.pluck(d,'stress');
                            });

                    // console.log(_.pluck(word_phoneme, 'phonemes'));
                    // console.log(pho);

                    syl.push(pho);
                    // return word_phoneme[0].phonemes;
                }


                // filter out stress that is -1 as it means no syllable
                // return _.filter(word_phoneme.phonemes, function(pho){
                //             return pho.stress != -1;
                //         });
           });
           // .flatten()//
           // .value();

            return syl;

        }); //end sylPerLine

        // console.log(sylPerLine);

        var meterLines = [],
            last_words = input.map(function(arr){
                return arr.slice(-1)[0];
            })
            .filter(function(w){
                return typeof w != "undefined";
            })

        // console.log(last_words);
        last_words = last_words.map(function(word){
            var regex = new RegExp("^"+word.toLowerCase()+"(\\(\\d\\))?$");
            var word_phoneme = _.filter(word_dicts, function(s){
                return s.word.toLowerCase().search(regex) != -1;
            })
            .map(function(word){
                var t = word.syllables.slice(-1)[0];
                // console.log(t, t.slice(-1)[0], t.slice(-1)[0].search(reg_vowel));
                t = t.slice(-1)[0].search(reg_vowel) === -1 ? t.slice(-2) : t.slice(-1);
                // console.log(t);
                return t;
            });

            // console.log(word_phoneme);
            var len = word_phoneme.length;
            var word_phoneme_new = word_phoneme;

            for(var i=0; i<len;i++){
                for(var j=i+1; j<len; j++){
                    if(angular.element(word_phoneme[i]).not(word_phoneme[j]).length === 0){
                        word_phoneme_new.splice(i,1);
                    }                    
                }

            }

            // console.log(word_phoneme_new);

            return word_phoneme;
        });

        var rhyme_seq = [],
            // max_level = 'A',
            len = last_words.length;

        // initiate rhymes
        for(var i=0; i < len; i++){
            if(i === 0){
                rhyme_seq.push( String.fromCharCode('A'.charCodeAt(0)) );
            } else {
                rhyme_seq.push(String.fromCharCode(rhyme_seq[i-1].charCodeAt(0)+1));
            }
        }

        // check which rhymes are same
        for(var i=0; i < len; i++){

            for(var j=i+1; j < len; j++){

                var break_out = false;

                angular.element(last_words[j]).each(function(wj){
                    angular.element(last_words[i]).each(function(wi){
                        if(angular.element(last_words[j][wj]).not(last_words[i][wi]).length === 0){

                            rhyme_seq[j] = rhyme_seq[i];
                            break_out = true;
                            return false;
                        }  
                    });
                    if(break_out) return false;
                });
                // console.log(max_level);
                // if(!break_out){
                //     // console.log("####different####", rhyme_seq, i, j);
                //     // if(typeof rhyme_seq[j] === "undefined"){
                //         // console.log(rhyme_seq, rhyme_seq[i].charCodeAt(0), i);
                //         // console.log("entered");
                //         // rhyme_seq[j] = String.fromCharCode(rhyme_seq[j-1].charCodeAt(0)+1);
                //         rhyme_seq[j] = String.fromCharCode(max_level.charCodeAt(0)+1);
                        // max_level = _.max(rhyme_seq.slice(0,j).map(function(ch){
                        //     return ch.charCodeAt(0);
                        // }));
                //         max_level = String.fromCharCode(max_level);
                //     // }
                // }
            }
        }

        // refactor such that only sequence of alphabet used
        rhyme_seq = rhyme_seq.map(function(ch,i){
            if(i===0){
                return ch;
            } else {
               var max_level = _.max(rhyme_seq.slice(0,i).map(function(ch){
                            return ch.charCodeAt(0);
                        })); 
               if(ch.charCodeAt(0) <= max_level+1){
                return ch;
               } else {
                return String.fromCharCode(max_level+1);
               }
            }
        });        

        rhyme_seq = rhyme_seq.join('');

        // console.log(rhyme_seq);
        var seq = [];

        // get the meter for each line
        sylPerLine.forEach(function(d, i){

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
            var combo,
                meter_combo;

            // check the meter type
            meter_combo = checkIambic(new_arr);

            meter_type = meter_combo[0];
            combo = meter_combo[1];

            meterLines.push(meter_type);

            // set the gutter of editor to show the syllable count and meter type
            angular.element('.syllable-count-'+(i+1))
                .text(d.length+' '+meter_type+' ');

            // if(meter_type === 'I'){
            //     seq.push("<div>0101010101</div>")
            // } else if(meter_type === 'T'){
            //     seq.push("<div>10101010</div>");
            // } else if(meter_type === 'A'){
            //     seq.push("<div>001001001</div>");              
            // } else if(meter_type === 'D'){
            //     seq.push("<div>100100100100100100</div>");  
            // console.log(combo);
            if(combo !== ''){

                seq.push("<div>"+combo+"</div>");

            } else {
                var combo = arrayCombos(new_arr);

                combo = combo.map(function(c){
                    return "<li>"+c.join("")+"</li>";
                }); 

                combo = _.uniq(combo);

                combo = "<ul>"+combo.join('')+"</ul>";

                // combo = typeof combo != "undefined" ? "<div>"+combo.join('')+"</div>" : '<div></div>';

                // if(combo.match(/^<div>\d+<\/div>$/) !== null){
                   // seq.push(combo);  
                // }
                seq.push("<div>"+combo+"</div>");
            }

            // return {stress:stress, meter_type:meter_type};
        });

        angular.element("#meter").html(seq.join(''));

        var rhyme = sylPerLine.map(function(arr){ return arr.length}).join('-');

        if(rhyme == '5-7-5'){
            angular.element('#rhyme').text('Haiku, rhyme seq: '+rhyme_seq);
        } else if(meterLines.join('') == Array(sylPerLine.length+1).join('i')){
            angular.element('#rhyme').text('Blank Verse, rhyme seq: '+rhyme_seq);
        } else {
            angular.element('#rhyme').text(rhyme_seq);
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
            combo_string = '',
            meter_type = '-';
        // console.log(allcombos);
        angular.element(allcombos).each(function(index){

            combo = allcombos[index];

            // combo = combo.join('');

         /*   if(combo == "0101010101"){
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
            }   */ 

            var len = combo.length;

            if(len%2 === 0){

                var iambic = true,
                    trochiaic = true;

                for(var i = 0; i<len; i+=2 ){
                    if(!(combo[i] == 0 && combo[i+1] == 1)){
                        iambic = false;
                    }
                    if(!(combo[i] == 1 && combo[i+1] == 0)){
                        trochiaic = false;
                    }                    
                }

                if(iambic){
                    meter_type = len == 10 ? 'I' : 'i';
                    combo_string = combo.join('');
                    return false;
                } else if(trochiaic){
                    meter_type = len == 8 ? 'T' : 't';
                    combo_string = combo.join('');
                    return false;
                }

            } else if(len%3 === 0){

                var anapestic = true,
                    dactylic = true;

                for(var i = 0; i<len; i+=3 ){
                    if(!(combo[i] == 0 && combo[i+1] == 0 && combo[i+1] == 1 )){
                        anapestic = false;
                    }
                    if(!( combo[i] == 1 && combo[i+1] == 0 && combo[i+1] == 0 )){
                        dactylic = false;
                    }                    
                } 

                if(anapestic){
                    meter_type = len == 9 ? 'A' : 'a';
                    combo_string = combo.join('');
                    return false;
                } else if(dactylic){
                    meter_type = len == 18 ? 'D' : 'd';
                    combo_string = combo.join('');
                    return false;
                }                               

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

        return [meter_type,combo_string];

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
