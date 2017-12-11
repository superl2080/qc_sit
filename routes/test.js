var express = require('express');
var session = require('express-session');
var router = express.Router();
var mongoose = require('mongoose');
var database = require('./database');
var Schema = mongoose.Schema;

var userModel = mongoose.model('user');
var deviceModel = mongoose.model('device');
var deviceOrderModel = mongoose.model('deviceOrder');
var incomeOrderModel = mongoose.model('incomeOrder');


var testSchema = new Schema({
    /* Fixed */
    needNotLogin: Boolean,
});

var testModel = mongoose.model('test', testSchema);



router.get('/scan/dev/:devNo', function(req, res, next) {
    testModel.findOne({ }).
    exec(function(err, testInfo){
        if(testInfo) {
            if(testInfo.needNotLogin) {
                req.session.userInfo = { _id: "59ff2effc3fe2e78590935f8" };
            }
        }
        next();
    });
});


router.get('/home', function(req, res, next) {
    testModel.findOne({ }).
    exec(function(err, testInfo){
        if(testInfo) {
            if(testInfo.needNotLogin) {
                req.session.userInfo = { _id: "59ff2effc3fe2e78590935f8" };
                req.session.deviceInfo = { devNo: "YMJD20175173" };
            }
        }
        next();
    });
});

module.exports.router = router;
