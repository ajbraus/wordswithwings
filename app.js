var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var _ = require('lodash');

var syllables;
// read data from syllables list and store in syllables variable 
// for later use
fs.readFile('./node_modules/phonemenon/syllable-list.json','utf-8',function(err,data){
    syllables = _.map(data.split('\n'), function(d,i){ 
        return d === ''? null: JSON.parse(d);
    });
});

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// get syllables of unique words and send to client
app.get('/getSyllables', function(req,res){

    var words = req.query.words,
        result = [];

    // if single word is sent it would be a string else object
    // convert all words to lower case for easy comparison
    words = typeof words === 'string' ? 
                [words.toLowerCase()] : 
                words.map(function(w){ return w.toLowerCase()})

    // 
    // result = _.filter(syllables,function(w){
    //     var test_word = w == null ? w : w.word.toLowerCase();

    //     return words.indexOf(test_word) != -1;
    // });

    // var test_list = [];

    syllables.forEach(function(w){
        var test_word = w == null ? w : w.word.toLowerCase();

        words.forEach(function(word){
            var regex = new RegExp("^"+word+"(\\(\\d\\))?$");
            if(test_word != null && test_word.search(regex) != -1){
                result.push(w);
            }
        });
    });

    res.send(result);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
