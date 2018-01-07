const express = require('express');
const session = require('express-session');
const async = require('async');

var userModel = require('../imports/models/user');
var adModel = require('../imports/models/ad');
var pointModel = require('../imports/models/point');
var pointOrderModel = require('../imports/models/pointOrder');
var systemConfigModel = require('../imports/models/systemConfig');
var tradePayModel = require('../imports/models/tradePay');
var cryptHelper = require('../imports/helpers/crypt');
var wechatHelper = require('../imports/helpers/wechat');
var orderHelper = require('../imports/helpers/order');
var serviceApi = require('../imports/api/service');
var wechatApi = require('../imports/api/wechat');

const router = express.Router();


router.get('/scan/point/:id', function(req, res, next) {
    console.log('[GET] /scan/point/:id, id:' + req.params.id);

    req.session.flow = {
        state: 'SCAN'
    };

    req.session.point = {
        _id: req.params.id
    };

    var option = {
        req: req,
        res: res
    };

    if(!req.session.userInfo) {
        async.auto({
            RedirectToLogin: async.apply(RedirectToLogin, option)
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
            RedirectToLogin: async.apply(RedirectToLogin, option)
        }, function(err, results) {
            if(!err) {
            } else {
                HandleError(option, err);
            }
        });
    } else if(req.session.flow.state == 'SCAN') {
        async.auto({
            UserLogin: async.apply(UserLogin, option),
            GetPointInfo: ['UserLogin', function (results, callback) {
                GetPointInfo(option, callback);
            }],
            CreateDeviceOrder: ['GetPointInfo', function (results, callback) {
                CreateDeviceOrder(option, callback);
            }]
        }, function(err, results) {
            if(!err) {
                renderFrame(option);
            } else {
                HandleError(option, err);
            }
        });
    } else if(req.session.flow.state == 'SUBSCRIBE') {
        async.auto({
            UserLogin: async.apply(UserLogin, option),
            AdSubscribe: ['UserLogin', function (result, callback) {
                wechatHelper.AdSubscribe({
                    userId: result.UserLogin._id,
                    appid: req.session.flow.appid
                }, callback);
            }],
            GetPointInfo: ['AdSubscribe', function (results, callback) {
                GetPointInfo(option, callback);
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
            UserLogin: async.apply(UserLogin, option),
            GetPointInfo: ['UserLogin', function (results, callback) {
                GetPointInfo(option, callback);
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


router.get('/wechat/resCode', function(req, res, next) {
    console.log('[GET] /wechat/resCode, openId:' + req.query.openId);

    req.session.userInfo = {
        authId: {
            wechatId: req.query.openId
        }
    };
    var option = {
        req: req,
        res: res
    };

    async.auto({
        GetOpenId: function (callback) {
            UserLogin(option, callback);
        }
    }, function(err, results) {
        if(!err) {
            res.redirect('/home');
        } else {
            HandleError(option, err);
        }
    });
});


function HandleError(params, err) {
    console.log('[CALL] controller/HandleError, err:', err);
    if(err == 'ERROR_BROWSER') {
        params.req.session.destroy(function(err) {
            params.res.render('frame-error', {error: {message: '请使用微信扫描', status: '抱歉，目前仅支持微信扫描使用本产品'}});
        })
    } else if(err == 'SESSION_EXPIRED') {
        params.req.session.flow = {
            state: 'OVERTIME',
            takeItemRes: 'OVERTIME'
        }
        renderContent(params);
    } else if(err == 'END') {

    } else if(err == 'RESTART') {

    } else {
        params.req.session.destroy(function(err) {
            params.res.render('frame-error', {error: {message: '服务器发生未知错误', status: '抱歉，请稍等片刻后重新使用操作。如还有问题，请联系工作人员。'}});
        })
    }
}


function renderFrame(params) {
    console.log('[CALL] controller/renderFrame');
    
    if( params.req.session.flow.state == 'SCAN' ) {
        var option = {
            userInfo: params.req.session.userInfo,
            deviceInfo: params.req.session.point,
            activityInfo: params.req.session.flow.activityInfo,
            page: "ORDER"
        };
        params.req.session.flow = null;
        params.res.render('frame', option);
    } else {
        var option = {
            userInfo: params.req.session.userInfo,
            deviceInfo: params.req.session.point,
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
            deviceInfo: params.req.session.point,
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
            deviceInfo: params.req.session.point,
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
            deviceInfo: params.req.session.point
        };
        params.res.render('page-loading', option);
    }
}


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
        CheckLogin: async.apply(CheckLogin, option)
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
        CheckLogin: async.apply(CheckLogin, option),
        CreateDeviceOrder: ['CheckLogin', function (results, callback) {
            CreateDeviceOrder(option, callback);
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
        CheckLogin: async.apply(CheckLogin, option),
        GetPointOrderInfo: ['CheckLogin', function (results, callback) {
            GetPointOrderInfo(option, callback);
        }],
        PrePay: ['GetPointOrderInfo', function (results, callback) {

            wechatApi.PayCreatePrepay({
                body: '青橙 - 领取纸巾',
                notify_url: 'http://' + option.req.headers.host + '/wechat/payBack',
                openid: option.req.session.userInfo.authId.wechatId,
                spbill_create_ip: option.req.headers['x-real-ip'],
                out_trade_no: option.req.session.pointOrder._id.toString(),
                total_fee: option.req.session.pointOrder.payout
            }, (err, result) => {
                if( !err ) {
                    console.log(result);
                    option.req.session.flow.prepay = result;
                    callback(null, result);
                } else {
                    callback(err);
                }
            });
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
        CheckLogin: async.apply(CheckLogin, option),
        SetTimeout: ['CheckLogin', function (results, callback) {

            setTimeout(function () {
                callback(null);
            }, 500);
        }],
        GetPointOrderInfo: ['SetTimeout', function (results, callback) {
            GetPointOrderInfo(option, callback);
        }]
    }, function(err, results) {
        if(!err) {
            renderContent(option);
        } else {
            HandleError(option, err);
        }
    });
});


router.post('/wechat/payBack', function(req, res, next) {
    console.log('[POST] /wechat/payBack');

    console.log(req.body);
    cryptHelper.ParseJsonFromXml(req.body, function (err, result) {
        console.log(result);

        wechatHelper.FinishPay(result, (err, result) => {
            res.send(cryptHelper.GetXmlFromJsonForceCData({
                return_code: 'SUCCESS',
                return_msg: 'OK'
            }));
        });
    });
});


router.get('/subscribe/:appid', function(req, res, next) {
    console.log('[GET] /subscribe');

    req.session.flow = {
        state: 'SUBSCRIBE',
        appid: req.params.appid
    };

    async.auto({
        CheckLogin: async.apply(UserLogin, option),
    }, function(err, results) {
        if(!err) {
            renderContent(option);
        } else {
            HandleError(option, err);
        }
    });
});



function RedirectToLogin(params, callback) {
    console.log('[CALL] model/RedirectToLogin');
    
    var WECHAT_AGENT = new RegExp('MicroMessenger');

    if(WECHAT_AGENT.test(params.req.headers['user-agent'])) {
        params.req.session.flow.browser = 'WECHAT';
        params.res.redirect(serviceApi.GetWechatAuthUrl({
            redirect_uri: 'http://' + params.req.headers.host + '/wechat/resCode'
        }));
        callback('RESTART');
    }
    else {
        callback('ERROR_BROWSER');
    }
}


function UserLogin(params, callback) {
    console.log('[CALL] model/UserLogin');

    if(!params.req.session.userInfo.authId ||
        !params.req.session.userInfo.authId.wechatId) {
        callback('ERROR_SERVICE');
        return;
    }

    userModel.WechatLogin({ wechatId: params.req.session.userInfo.authId.wechatId }, function(err, userInfo){
        params.req.session.userInfo = userInfo;
        callback(null, userInfo);
    });
}


function CheckLogin(params, callback) {
    console.log('[CALL] model/CheckLogin');

    if(!params.req.session
        || !params.req.session.userInfo) {
        callback('SESSION_EXPIRED');
    } else {
        callback(null);
    }
}


function GetPointInfo(params, callback) {
    console.log('[CALL] model/GetPointInfo');

    if(!params.req.session.point ||
        !params.req.session.point._id) {
        callback(null);
    } else {
        pointModel.GetPointById({ pointId: params.req.session.point._id }, function(err, point){
            if(point
                && point.state != 'OPEN'
                && point.state != 'CLOSE' ) {
                params.req.session.point = point;
                callback(null);
            } else {
                callback('ERROR_SERVICE');
            }
        });
    }
}


function GetPointOrderInfo(params, callback) {
    console.log('[CALL] model/GetPointOrderInfo');

    if(!params.req.session.pointOrder ) {
        callback(null);
    } else {
        pointOrderModel.GetPointOrder({
            pointOrderId: params.req.session.pointOrder._id,
            state: 'OPEN'
        }, function(err, pointOrder){
            if(pointOrder) {
                params.req.session.pointOrder = pointOrder;
                callback(null);
            } else {
                callback('ERROR_SERVICE');
            }
        });
    }
}


function CreateDeviceOrder(params, callback) {
    console.log('[CALL] model/CreateDeviceOrder');

    orderHelper.CreatePointOrder({
        user: params.req.session.userInfo,
        point: params.req.session.point,
    }, (err, result) => {
        params.req.session.pointOrder = result.pointOrder;
        if( result.pointOrder.adInfo ) {
            params.req.session.flow.activityInfo = {
                auth: result.pointOrder.adInfo.auth,
                qrcodeUrl: result.pointOrder.adInfo.qrcode_url
            };
            if(!result.pointOrder.adInfo.auth) {
                systemConfigModel.GetWechatOpen(null, (err, wechatOpen) => {
                    if( !err ) {
                        params.req.session.flow.activityInfo.auto_reply = wechatOpen.auto_reply;
                        callback(null);
                    } else {
                        callback(err);
                    }
                });
            } else {
                callback(null);
            }
        } else {
            callback(null);
        }
    });

}


module.exports.router = router;
