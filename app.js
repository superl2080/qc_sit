const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const main = require('./routes/main');

const app = express();
const router = exports.router = express.Router();


mongoose.connect(process.env.MONGO_URL, {useMongoClient: true});

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
app.use(bodyParser.raw({ type: 'text/xml' }));
app.use(bodyParser.json({ type: 'application/json' }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', main.router);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    err.status = err.status || 500;
    console.error(err);
    if (res.headersSent) {
        return next(err);
    }
    // render the error page
    res.render('frame-error', { error: err });
});

module.exports = app;