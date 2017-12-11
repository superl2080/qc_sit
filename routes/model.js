var express = require('express');
var session = require('express-session');
var request = require('request');
var async = require('async');
var mongoose = require('mongoose');
var cheerio = require('cheerio');
var utility = require('utility');
var xml2js = require('xml2js');
var xml2jsBuilder = new xml2js.Builder();
var xml2jsParser = new xml2js.Parser();
var database = require('./database');
var apiService = require('./apiService');

/* Local var*/
var userModel = mongoose.model('user');
var adModel = mongoose.model('ad');
var deviceModel = mongoose.model('device');
var deviceOrderModel = mongoose.model('deviceOrder');
var incomeOrderModel = mongoose.model('incomeOrder');

var WECHAT_AGENT = new RegExp('MicroMessenger');

var APP_ID = 'wx1676ae64c9ab902c';
var APP_SECRET = '2c3a4d54806a9f9442c6f5ebf10a1e53';
var WXPAY_ID = '1485302692';
var WXPAY_KEY = '2c3a4d54806a9f9442c6f5ebf10a1e53';


function RedirectToLogin(params, callback) {
    console.log('[CALL] model/RedirectToLogin');

    if(WECHAT_AGENT.test(params.req.headers['user-agent'])) {
        params.req.session.flow.browser = 'WECHAT';
        var REDIRECT_URI = 'http%3A%2F%2F' + params.req.headers.host + '%2Fwechat%2FresCode';
        var url = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=' + APP_ID + 
            '&redirect_uri=' + REDIRECT_URI + 
            '&response_type=code&scope=snsapi_base&state=state#wechat_redirect';

        console.log('[REDIRECT] url:' + url);
        params.res.redirect(url);
        callback('RESTART');
    }
    else {
        callback('ERROR_BROWSER');
    }
}
module.exports.RedirectToLogin = RedirectToLogin;


function GetOpenId(params, callback) {
    console.log('[CALL] model/GetOpenId, wechatCode:' + params.req.session.flow.wechatCode);

    var option = {
        url: 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=' + APP_ID +
        '&secret=' + APP_SECRET +
        '&code=' + params.req.session.flow.wechatCode +
        '&grant_type=authorization_code'
    };

    request.get(option, function(err, ret, body) {
        if(!ret ||
            !ret.statusCode ||
            ret.statusCode != 200) {
        } else {
            var openId = JSON.parse(body).openid;
            if(!openId) {
            } else {
                params.req.session.userInfo = {
                    relate: {
                        openId: openId
                    }
                };
                callback(null);
                return;
            }
        }
        callback('ERROR_SERVICE');
    });
}
module.exports.GetOpenId = GetOpenId;


function UserLogin(params, callback) {
    console.log('[CALL] model/UserLogin');

    var option = null;
    if(!params.req.session.userInfo.relate ||
        !params.req.session.userInfo.relate.openId) {
        callback('ERROR_SERVICE');
        return;
    }

    userModel.findOne({ 'relate.openId': params.req.session.userInfo.relate.openId }).
    exec(function(err, userInfo){
        if(!userInfo) {
            var option = {
                relate: {
                    openId: params.req.session.userInfo.relate.openId
                },
                signDate: new Date(),
                name: params.req.session.userInfo.relate.openId,
                finishedAppids: []
            };
            userModel.create(option, function (err, newUserInfo) {
                params.req.session.userInfo = newUserInfo;
                callback(null);
            });
        } else {
            params.req.session.userInfo = userInfo;
            callback(null);
        }
    });
}
module.exports.UserLogin = UserLogin;


function CheckLogin(params, callback) {
    console.log('[CALL] model/CheckLogin');

    if(!params.req.session.userInfo) {
        callback('SESSION_EXPIRED');
    } else {
        callback(null);
    }
}
module.exports.CheckLogin = CheckLogin;


function SetTimeout(params, callback) {
    console.log('[CALL] model/SetTimeout');

    setTimeout(function () {
        callback(null);
    }, params.timeout);
}
module.exports.SetTimeout = SetTimeout;


function GetUserInfo(params, callback) {
    console.log('[CALL] model/GetUserInfo');

    if(params.req.session.userInfo.relate &&
        params.req.session.userInfo.relate.openId) {
        userModel.findOne({ 'relate.openId': params.req.session.userInfo.relate.openId }).
        exec(function(err, userInfo){
            if(userInfo) {
                params.req.session.userInfo = userInfo;
                callback(null);
            } else {
                callback('ERROR_SERVICE');
            }
        });
        return;
    }
    if(params.req.session.userInfo._id) {
        userModel.findById(params.req.session.userInfo._id).
        exec(function(err, userInfo){
            if(userInfo) {
                params.req.session.userInfo = userInfo;
                callback(null);
            } else {
                callback('ERROR_SERVICE');
            }
        });
        return;
    }
    callback('ERROR_SERVICE');
}
module.exports.GetUserInfo = GetUserInfo;


function GetDeviceInfo(params, callback) {
    console.log('[CALL] model/GetDeviceInfo');

    if(!params.req.session.deviceInfo ||
        !params.req.session.deviceInfo.devNo) {
        callback(null);
    } else {
        deviceModel.findOne({devNo: params.req.session.deviceInfo.devNo}).
        exec(function(err, deviceInfo){
            if(deviceInfo) {
                params.req.session.deviceInfo = deviceInfo;
                callback(null);
            } else {
                callback('ERROR_SERVICE');
            }
        });
    }
}
module.exports.GetDeviceInfo = GetDeviceInfo;


module.exports.GetDeviceOrderInfo = function (params, callback) {
    console.log('[CALL] model/GetDeviceOrderInfo');

    if(!params.req.session.deviceOrderInfo ) {
        callback(null);
    } else {
        deviceOrderModel.findById(params.req.session.deviceOrderInfo._id).
        exec(function(err, deviceOrderInfo){
            if(deviceOrderInfo) {
                params.req.session.deviceOrderInfo = deviceOrderInfo;
                callback(null);
            } else {
                callback('ERROR_SERVICE');
            }
        });
    }
}


module.exports.CreateDeviceOrder = function (params, callback) {
    console.log('[CALL] model/CreateDeviceOrder');

    deviceOrderModel.find({userId: params.req.session.userInfo._id, state: 'OPEN'}).
    exec(function(err, deviceOrderInfos) {
        deviceOrderInfos.forEach(function(deviceOrderInfo){
            deviceOrderInfo.state = 'FAIL';
            deviceOrderInfo.save(function (err) { });
        });
    });
    var option = {
        /* Relate */
        userId: params.req.session.userInfo._id,
        partnerId: params.req.session.deviceInfo.partnerId,
        type: params.req.session.deviceInfo.type,
        city: params.req.session.deviceInfo.city,
        devNo: params.req.session.deviceInfo.devNo,
        income: params.req.session.deviceInfo.income,
        /* Free */
        state: 'OPEN',
        /* Fixed */
        date: new Date()
    };
    deviceOrderModel.create(option, function (err, deviceOrder) {
        params.req.session.deviceOrderInfo = deviceOrder;
        callback(null);
    });
}


module.exports.GetActivity = function (params, callback) {
    console.log('[CALL] model/GetActivity');
    
    async.auto({
        FindAdInfos: function (callback2) {
            adModel.find({ state: 'OPEN' })
            .exec(function(err, adInfos){
                if( adInfos.length > 0 ) {
                    callback2(null, adInfos);
                } else {
                    callback2('FAIL');
                }
            });
        },
        FindNofinishedAd: ['FindAdInfos', function (results, callback2) {
            var hasActivity = false;
            results.FindAdInfos.forEach(function(adInfo){
                if( !hasActivity
                     && (!params.req.session.userInfo.finishedAppids
                     || params.req.session.userInfo.finishedAppids.indexOf(adInfo.appid) == -1)) {
                    hasActivity = true;
                    callback2(null, adInfo);
                }
            });
            if (!hasActivity) {
                if( params.req.session.deviceInfo.state == 'TEST' ) {
                    results.FindAdInfos.forEach(function(adInfo){
                        if( !hasActivity && adInfo.isDefault ) {
                            hasActivity = true;
                            callback2(null, adInfo);
                        }
                    });
                } else {
                    callback2('FAIL');
                }
            }
        }],
        GetQrcodeUrl: ['FindNofinishedAd', function (results, callback2) {
            var option = {
                url: 'https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token='
                    + results.FindNofinishedAd.access_token,
                method: 'POST',
                headers: {  
                    'content-type': 'application/json'
                },
                json: {
                    expire_seconds: 3 * 60,
                    action_name: 'QR_STR_SCENE', 
                    action_info: {scene: {scene_str: params.req.session.userInfo._id.toString()}}
                }
            };
            console.log(option);
            request.post(option, function(err, ret, body) {
                console.log(body);
                if(!ret.statusCode
                    || ret.statusCode != 200) {
                    callback2('FAIL');
                } else {
                    callback2(null, body);
                }
            });
        }],
        GetQrcodeImage: ['GetQrcodeUrl', function (results, callback2) {
            var option = {
                url: 'https://cli.im/api/qrcode/code?text='
                    + results.GetQrcodeUrl.url
                    + '&mhid=tUOUXlvpz50hMHctKddQPaI'
            };

            request.get(option, function(err, ret, body) {
                if(!ret ||
                    !ret.statusCode ||
                    ret.statusCode != 200) {
                    callback('FAIL');
                } else {
                    var $ = cheerio.load(body);
                    console.log($("img").attr("src"));
                    params.req.session.flow.activityInfo = {
                        qrcodeUrl: $("img").attr("src")
                    };
                    callback(null);
                }
            });
        }]
    }, function(err, results) {
        console.log('[CALL] model/GetActivity finish err:');
            console.log(err);
        if(!err) {
        } else {
        }
        callback(null);
    });

}


function GetPayItemName(params) {
    console.log('[CALL] model/GetPayItemName');

    var item = '青橙';
    if(params.req.session.deviceInfo.type == 'JUANZHI') {
        item += ' - 领取卷纸';
    } else if(params.req.session.deviceInfo.type == 'ZHIJIN') {
        item += ' - 领取纸帕巾';
    } 

    return item;
}


function wechatSign(params) {
    console.log('[CALL] model/wechatSign');
    
    var keys = Object.keys(params);
    keys = keys.sort()
    var newArgs = {};
    keys.forEach(function (key) {
        newArgs[key] = params[key];
    });

    var stringSign = '';
    for (var k in newArgs) {
        stringSign += '&' + k + '=' + newArgs[k];
    }
    stringSign = stringSign.substr(1);
    stringSign += '&key=' + WXPAY_KEY;
    console.log(stringSign);
    return utility.md5(stringSign).toUpperCase();
}


function PrePay(params, callback) {
    console.log('[CALL] model/PrePay');

    var option = {
        /* Relate */
        userId: params.req.session.userInfo._id,
        deviceId: params.req.session.deviceInfo._id,
        /* Fixed */
        channel: 'WXPAY',
        income: params.req.session.deviceInfo.income,
        date: new Date(),
        /* Free */
        state: 'OPEN'
    };
    incomeOrderModel.create(option, function (err, incomeOrder) {
        var data = {
            appid: APP_ID,
            body: GetPayItemName(params),
            mch_id: WXPAY_ID,
            nonce_str:  Math.floor(Math.random()*100000000).toString(),
            notify_url: 'http://' + params.req.headers.host + '/wechat/payBack',
            openid: params.req.session.userInfo.relate.openId,
            out_trade_no: incomeOrder._id.toString(),
            spbill_create_ip: params.req.headers['x-real-ip'],
            total_fee: params.req.session.deviceInfo.income.toString(),
            trade_type: 'JSAPI'
        };
        data.sign = wechatSign(data);

        var option2 = {
            url: 'https://api.mch.weixin.qq.com/pay/unifiedorder',
            method: 'POST',
            headers: {  
                'content-type': 'text/xml;charset=UTF-8'
            },
            body: xml2jsBuilder.buildObject(data)
        };
        console.log(option2);
        request.post(option2, function(err, ret, body) {
            console.log(body);
            if(!ret.statusCode ||
                ret.statusCode != 200) {
                callback('ERROR_SERVICE');
            } else {
                xml2jsParser.parseString(body, function (err, result) {
                    console.log(result);
                    var prepay_id = result.xml.prepay_id;
                    if(!prepay_id) {
                        callback('ERROR_SERVICE');
                    } else {
                        var d = new Date();
                        params.req.session.flow.prepay = {
                            appId: APP_ID,
                            nonceStr: Math.floor(Math.random()*100000000).toString(),
                            package: 'prepay_id=' + prepay_id,
                            signType: 'MD5',
                            timeStamp: parseInt(d.getTime()/1000).toString()
                        };
                        params.req.session.flow.prepay.paySign = wechatSign(params.req.session.flow.prepay);
                        console.log(params.req.session.flow.prepay);
                        callback(null);
                    }
                });
            }
        });
    });
}
module.exports.PrePay = PrePay;


function FinishPay(params) {
    console.log('[CALL] model/FinishPay');

    incomeOrderModel.findById(params.xml.out_trade_no, function (err, incomeOrder) {
        if(incomeOrder.state == 'OPEN') {
            incomeOrderModel.findByIdAndUpdate(params.xml.out_trade_no, {$set: {state: params.xml.result_code}}, function (err, incomeOrder) {
                deviceOrderModel.findOne({userId: incomeOrder.userId, state: 'OPEN'}).
                exec(function(err, deviceOrderInfo) {
                    deviceOrderInfo.state = params.xml.result_code;
                    deviceOrderInfo.save(function (err) {
                    });
                });
            });
        }
        var option = {
            return_code: 'SUCCESS',
            return_msg: 'OK'
        };
        params.res.send(xml2jsBuilder.buildObject(option));
    });
    
}
module.exports.FinishPay = FinishPay;


function TakeDeviceItem(params, callback) {
    console.log('[CALL] model/TakeDeviceItem');

    if(params.req.session.deviceOrderInfo.state == 'SUCCESS') {
        var option = {
            url: 'http://106.14.195.50:80/api/TakeDeviceItem',
            method: 'POST',
            headers: {  
                'content-type': 'application/json'
            },
            json: {
                devNo: params.req.session.deviceInfo.devNo,
                deviceOrderId: params.req.session.deviceOrderInfo._id.toString()
            }
        };
        console.log(option);
        request.post(option, function(err, res, body) {
            console.log('[CALLBACK] requestTakeItem, err:' + err + 'body:');
            console.log(body);
            var takeRes = 'FAIL';
            if(!body ||
                !body.data) {
            } else {
                takeRes = body.data.res;
            }
            if(takeRes == 'SUCCESS') {
                deviceOrderModel.findByIdAndUpdate(params.req.session.deviceOrderInfo._id, {$set: {state: 'TAKED'}}, {new: true}).
                exec(function(err, deviceOrderInfo) {
                    params.req.session.deviceOrderInfo = deviceOrderInfo;
                    params.req.session.flow.takeItemRes = takeRes;
                    callback(null);
                });
            } else {
                params.req.session.flow.takeItemRes = takeRes;
                callback(null);
            }
        });
    }
}
module.exports.TakeDeviceItem = TakeDeviceItem;


