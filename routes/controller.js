var express = require('express');
var session = require('express-session');
var request = require('request');
var async = require('async');
var xml2js = require('xml2js');
var xml2jsBuilder = new xml2js.Builder();
var xml2jsParser = new xml2js.Parser();
var model = require('./model');
var router = express.Router();


router.get('/scan/dev/:devNo', function(req, res, next) {
    console.log('[GET] /scan/dev/:devNo, devNo:' + req.params.devNo);

    req.session.flow = {
        state: 'SCAN'
    };

    req.session.deviceInfo = {
        devNo: req.params.devNo
    };

    var option = {
        req: req,
        res: res
    };

    if(!req.session.userInfo) {
        async.auto({
            RedirectToLogin: async.apply(model.RedirectToLogin, option)
        }, function(err, results) {
            if(!err) {
            } else {
                HandleError(option, err);
            }
        });
    } else {
        res.redirect('/home');
    }
});


router.get('/home', function(req, res, next) {
    console.log('[GET] /home');

    if( !req.session.flow ||
        !req.session.flow.state ) {
        req.session.flow = {
            state: 'HOME'
        };
    }

    var option = {
        req: req,
        res: res
    };

    if(!req.session.userInfo) {
        async.auto({
            RedirectToLogin: async.apply(model.RedirectToLogin, option)
        }, function(err, results) {
            if(!err) {
            } else {
                HandleError(option, err);
            }
        });
    } else if(req.session.flow.state == 'SCAN') {
        async.auto({
            GetUserInfo: async.apply(model.GetUserInfo, option),
            GetDeviceInfo: ['GetUserInfo', function (results, callback) {
                model.GetDeviceInfo(option, callback);
            }],
            CreateDeviceOrder: ['GetDeviceInfo', function (results, callback) {
                model.CreateDeviceOrder(option, callback);
            }],
            GetActivity: ['CreateDeviceOrder', function (results, callback) {
                model.GetActivity(option, callback);
            }]
        }, function(err, results) {
            if(!err) {
                renderFrame(option);
            } else {
                HandleError(option, err);
            }
        });
    } else {
        async.auto({
            GetUserInfo: async.apply(model.GetUserInfo, option),
            GetDeviceInfo: ['GetUserInfo', function (results, callback) {
                model.GetDeviceInfo(option, callback);
            }]
        }, function(err, results) {
            if(!err) {
                renderFrame(option);
            } else {
                HandleError(option, err);
            }
        });
    }
});


function HandleError(params, err) {
    console.log('[CALL] controller/HandleError, err:', err);
    if(err == 'ERROR_BROWSER') {
        params.req.session.destroy(function(err) {
            params.res.render('frame-error', {title: '请使用微信扫描', message: '抱歉，目前仅支持微信扫描使用本产品'});
        })
    } else if(err == 'ERROR_SERVICE') {
        params.req.session.destroy(function(err) {
            params.res.render('frame-error', {title: '服务器发生未知错误', message: '抱歉，请稍等片刻后重新使用操作。如还有问题，请联系工作人员。'});
        })
    } else if(err == 'SESSION_EXPIRED') {
        params.req.session.flow = {
            state: 'OVERTIME',
            takeItemRes: 'OVERTIME'
        }
        renderContent(params);
    } else if(err == 'END') {

    } else if(err == 'RESTART') {

    }
}


function renderFrame(params) {
    console.log('[CALL] controller/renderFrame');
    
    if( params.req.session.flow.state == 'SCAN' ) {
        var option = {
            userInfo: params.req.session.userInfo,
            deviceInfo: params.req.session.deviceInfo,
            activityInfo: params.req.session.flow.activityInfo,
            page: "ORDER"
        };
        params.req.session.flow = null;
        params.res.render('frame', option);
    } else {
        var option = {
            userInfo: params.req.session.userInfo,
            deviceInfo: params.req.session.deviceInfo,
            takeItemRes: null,
            page: "HOME"
        };
        params.req.session.flow = null;
        params.res.render('frame', option);
    }
}


function renderContent(params) {
    console.log('[CALL] controller/renderContent');
    
    if( params.req.session.flow.state == 'BACK_HOME' ||
        params.req.session.flow.state == 'LOADED' ) {
        var option = {
            userInfo: params.req.session.userInfo,
            deviceInfo: params.req.session.deviceInfo,
            takeItemRes: params.req.session.flow.takeItemRes,
        };
        params.req.session.flow = null;
        params.res.render('page-home', option);
    } else if( params.req.session.flow.state == 'OVERTIME' ) {
        var option = {
            userInfo: null,
            deviceInfo: null,
            takeItemRes: params.req.session.flow.takeItemRes,
        };
        params.req.session.flow = null;
        params.res.render('page-home', option);
    } else if( params.req.session.flow.state == 'ORDER' ) {
        var option = {
            userInfo: params.req.session.userInfo,
            deviceInfo: params.req.session.deviceInfo,
            activityInfo: params.req.session.flow.activityInfo
        };
        params.req.session.flow = null;
        params.res.render('page-order', option);
    } else if( params.req.session.flow.state == 'PAY' ) {
        var option = params.req.session.flow.prepay;
        params.req.session.flow = null;
        params.res.send(option);
    } else if( params.req.session.flow.state == 'LOADING' ) {
        var option = {
            userInfo: params.req.session.userInfo,
            deviceInfo: params.req.session.deviceInfo
        };
        params.res.render('page-loading', option);
    }
}


router.get('/wechat/resCode', function(req, res, next) {
    console.log('[GET] /wechat/resCode, code:' + req.query.code);

    req.session.flow.wechatCode = req.query.code;

    var option = {
        req: req,
        res: res
    };

    async.auto({
        GetOpenId: async.apply(model.GetOpenId, option),
        UserLogin: ['GetOpenId', function (results, callback) {
            model.UserLogin(option, callback);
        }]
    }, function(err, results) {
        if(!err) {
            res.redirect('/home');
        } else {
            HandleError(option, err);
        }
    });
});


router.post('/wechat/payBack', function(req, res, next) {
    console.log('[POST] /wechat/payBack');

    req.rawBody = '';
    req.setEncoding('utf8');
    req.on('data', function(chunk) { 
        req.rawBody += chunk;
    });
    req.on('end', function() {
        console.log(req.rawBody);
        xml2jsParser.parseString(req.rawBody, function (err, result) {
            console.log(result);
            var option = {
                req: req,
                res: res,
                xml: result.xml
            };
            model.FinishPay(option);
        });
    }); 
});


router.post('/page/home', function(req, res, next) {
    console.log('[POST] /page/home');

    req.session.flow = {
        state: 'BACK_HOME'
    };
    
    var option = {
        req: req,
        res: res
    };

    async.auto({
        CheckLogin: async.apply(model.CheckLogin, option)
    }, function(err, results) {
        if(!err) {
            renderContent(option);
        } else {
            HandleError(option, err);
        }
    });
});


router.post('/page/order', function(req, res, next) {
    console.log('[POST] /page/order');

    req.session.flow = {
        state: 'ORDER'
    };
    
    var option = {
        req: req,
        res: res
    };

    async.auto({
        CheckLogin: async.apply(model.CheckLogin, option),
        CreateDeviceOrder: ['CheckLogin', function (results, callback) {
            model.CreateDeviceOrder(option, callback);
        }],
        GetActivity: ['CreateDeviceOrder', function (results, callback) {
            model.GetActivity(option, callback);
        }]
    }, function(err, results) {
        if(!err) {
            renderContent(option);
        } else {
            HandleError(option, err);
        }
    });
});


router.post('/page/order/pay', function(req, res, next) {
    console.log('[POST] /page/order/pay');

    req.session.flow = {
        state: 'PAY'
    };
    
    var option = {
        req: req,
        res: res
    };

    async.auto({
        CheckLogin: async.apply(model.CheckLogin, option),
        GetDeviceOrderInfo: ['CheckLogin', function (results, callback) {
            model.GetDeviceOrderInfo(option, callback);
        }],
        CreateDeviceOrder: ['GetDeviceOrderInfo', function (results, callback) {
            if(req.session.deviceOrderInfo.state != 'OPEN') {
                model.CreateDeviceOrder(option, callback);
            } else {
                callback(null);
            }
        }],
        PrePay: ['CreateDeviceOrder', function (results, callback) {
            model.PrePay(option, callback);
        }]
    }, function(err, results) {
        if(!err) {
            renderContent(option);
        } else {
            HandleError(option, err);
        }
    });
});


router.post('/page/loading', function(req, res, next) {
    console.log('[POST] /page/loading');

    req.session.flow = {
        state: 'LOADING'
    };
    
    var option = {
        req: req,
        res: res
    };

    renderContent(option);
});


router.post('/page/loading/loaded', function(req, res, next) {
    console.log('[POST] /page/loading/loaded, flow:');
    console.log(req.session.flow);

    req.session.flow = {
        state: 'LOADED',
        takeItemRes: 'FAIL'
    };

    var option = {
        req: req,
        res: res
    };

    async.auto({
        CheckLogin: async.apply(model.CheckLogin, option),
        SetTimeout: ['CheckLogin', function (results, callback) {
            option.timeout = 500;
            model.SetTimeout(option, callback);
        }],
        GetDeviceOrderInfo: ['SetTimeout', function (results, callback) {
            model.GetDeviceOrderInfo(option, callback);
        }],
        TakeDeviceItem: ['GetDeviceOrderInfo', function (results, callback) {
            model.TakeDeviceItem(option, callback);
        }]
    }, function(err, results) {
        if(!err) {
            renderContent(option);
        } else {
            HandleError(option, err);
        }
    });
});


module.exports.router = router;
