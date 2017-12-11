var express = require('express');
var session = require('express-session');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(session);
var test = require('./routes/test');
var controller = require('./routes/controller');

var f_mongo_url;
if(process.env.NODE_ENV === 'production') {
    f_mongo_url = 'mongodb://localhost/qingcheng';
} else {
    f_mongo_url = 'mongodb://localhost/qingcheng_test';
}
mongoose.connect(f_mongo_url, {useMongoClient: true});

var app = express();

app.use(session({
    secret: 'sit51qingchengcom',
    resave: true,
    saveUninitialized: true,
    rolling: true,
    cookie: { maxAge: 180000, secure: false },
    store: new MongoStore({ mongooseConnection: mongoose.connection })
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public/images/favicon.png')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', test.router);
app.use('/', controller.router);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('frame-error', {title: err.message, message: err.status});
});

module.exports = app;