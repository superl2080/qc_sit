
const async = require('async');
const adModel = require('../models/ad');
const tradeAdModel = require('../models/tradeAd');
const partnerModel = require('../models/partner');
const systemConfigModel = require('../models/systemConfig');
const pointOrderModel = require('../models/pointOrder');
const wechatApi = require('../api/wechat');
const deviceApi = require('../api/device');
const toolHelper = require('./tool');


const UpdateTicket = exports.UpdateTicket = (newTicket, callback) => {
    systemConfigModel.UpdateWechatOpenTicket(newTicket, callback);
}

const CreatePreAuthCode = exports.CreatePreAuthCode = (adId, callback) => {
    
    async.auto({
        Pre: (callback) => {
            console.log('[CALL] CreatePreAuthCode, Pre');
            if( !adId ){
                callback(new Error('CreatePreAuthCode: adId is error'));
            } else {
                callback(null, {
                    adId: adId
                });
            }
        },

        GetOpenToken: ['Pre', (result, callback) => {
            console.log('[CALL] CreatePreAuthCode, GetOpenToken');
            GetOpenToken(null, callback);
        }],

        GetPreAuthCode: ['GetOpenToken', (result, callback) => {
            console.log('[CALL] CreatePreAuthCode, GetPreAuthCode');
            wechatApi.OpenCreatePreAuthCode({
                access_token: result.GetOpenToken
            }, callback);
        }],

        UpdateAdPreAuthCode: ['GetPreAuthCode', (result, callback) => {
            console.log('[CALL] CreatePreAuthCode, UpdateAdPreAuthCode');
            adModel.UpdateWechatMpPreAuthCode({
                adId: result.Pre.adId,
                pre_auth_code: result.GetPreAuthCode.pre_auth_code
            }, callback);
        }]

    }, (err, result) => {
        console.log('[CALLBACK] CreatePreAuthCode');
        callback(err, result.GetPreAuthCode.pre_auth_code);
    });
}

const UpdateWechatMpAuthInfo = exports.UpdateWechatMpAuthInfo = (param, callback) => {
    
    async.auto({
        Pre: (callback) => {
            console.log('[CALL] UpdateWechatMpAuthInfo, Pre');
            if( !param
                || !param.auth_code
                || !param.pre_auth_code ){
                callback(new Error('UpdateWechatMpAuthInfo: param is error'));
            } else {
                callback(null, param);
            }
        },

        GetOpenToken: ['Pre', (result, callback) => {
            console.log('[CALL] UpdateWechatMpAuthInfo, GetOpenToken');
            GetOpenToken(null, callback);
        }],

        GetMpAuthInfo: ['GetOpenToken', (result, callback) => {
            console.log('[CALL] UpdateWechatMpAuthInfo, GetMpAuthInfo');
            wechatApi.OpenQueryAuth({
                access_token: result.GetOpenToken,
                auth_code: result.Pre.auth_code
            }, callback);
        }],

        GetMpInfo: ['GetMpAuthInfo', (result, callback) => {
            console.log('[CALL] UpdateWechatMpAuthInfo, GetMpInfo');
            let haveFuncscope = false;
            result.GetMpAuthInfo.func_info.forEach((element) => {
                if( !haveFuncscope
                    && element.funcscope_category.id == 1 ){
                    haveFuncscope = true;
                    wechatApi.OpenGetAuthorizerInfo({
                        access_token: result.GetOpenToken,
                        appid: result.GetMpAuthInfo.authorizer_appid
                    }, callback);
                }
            });
            if( !haveFuncscope ) {
                adModel.CancelAdWechatMpAuthInfo(result.GetMpAuthInfo.authorizer_appid, (err, result) => {
                    callback(new Error('UpdateWechatMpAuthInfo: do not have funcscope'));
                });
            }
        }],

        UpdateAdWechatMpAuthInfo: ['GetMpInfo', (result, callback) => {
            console.log('[CALL] UpdateWechatMpAuthInfo, UpdateAdWechatMpAuthInfo');
            let auth = false;
            if( result.GetMpInfo.service_type_info.id == 2
                && result.GetMpInfo.verify_type_info.id == 0) {
                result.GetMpAuthInfo.func_info.forEach((element) => {
                    if( element.funcscope_category.id == 3 ){
                        auth = true;
                    }
                });
            }
            adModel.UpdateWechatMpAuthInfo({
                appid: result.GetMpAuthInfo.authorizer_appid,
                pre_auth_code: result.Pre.pre_auth_code,
                qrcode_url: result.GetMpInfo.qrcode_url,
                auth: auth,
                service_type: result.GetMpInfo.service_type_info.id,
                verify_type: result.GetMpInfo.verify_type_info.id,
                access_token: result.GetMpAuthInfo.authorizer_access_token,
                expires_in: toolHelper.CreateExpiresInDate(result.GetMpAuthInfo.expires_in),
                refresh_token: result.GetMpAuthInfo.authorizer_refresh_token,
                nick_name: result.GetMpInfo.nick_name,
                head_img: result.GetMpInfo.head_img,
                user_name: result.GetMpInfo.user_name
            }, callback);
        }]

    }, (err, result) => {
        console.log('[CALLBACK] UpdateWechatMpAuthInfo');
        callback(err);
    });
}

const CancelWechatMpAuthInfo = exports.CancelWechatMpAuthInfo = (param, callback) => {
    
    async.auto({
        Pre: (callback) => {
            console.log('[CALL] CancelWechatMpAuthInfo, Pre');
            if( !param
                || !param.appid ){
                callback(new Error('CancelWechatMpAuthInfo: param is error'));
            } else {
                callback(null, param);
            }
        },

        CancelAdWechatMpAuthInfo: ['Pre', (result, callback) => {
            console.log('[CALL] CancelWechatMpAuthInfo, CancelAdWechatMpAuthInfo');
            adModel.CancelAdWechatMpAuthInfo(result.Pre.appid, callback);
        }]

    }, (err, result) => {
        console.log('[CALLBACK] CancelWechatMpAuthInfo');
        callback(err);
    });
}

const AdSubscribe = exports.AdSubscribe = (param, callback) => {

    async.auto({
        Pre: (callback) => {
            console.log('[CALL] AdSubscribe, Pre');
            if( !param
                || !param.userId
                || !param.appid ){
                callback(new Error('AdSubscribe: param is error'));
            } else {
                callback(null, param);
            }
        },

        SubscribePointOrder: ['Pre', (result, callback) => {
            console.log('[CALL] AdSubscribe, SubscribePointOrder');
            pointOrderModel.SubscribePointOrder(param, callback);
        }],

        GetPointById: ['SubscribePointOrder', (result, callback) => {
            console.log('[CALL] AdSubscribe, GetPointById');
            pointModel.GetPointById({ pointId: result.SubscribePointOrder.pointId }, callback);
        }],

        GetAdById: ['GetPointById', (result, callback) => {
            console.log('[CALL] AdSubscribe, GetAdById');
            adModel.GetAdById({ adId: result.SubscribePointOrder.adId }, callback);
        }],

        CreateTradeAd: ['GetAdById', (result, callback) => {
            console.log('[CALL] AdSubscribe, CreateTradeAd');
            let newTradeAd = {
                pointOrderId: result.SubscribePointOrder._id,
                userId: result.SubscribePointOrder.userId,
                adId: result.SubscribePointOrder.adId,
                aderId: result.GetAdById.aderId,
                partnerId: result.GetPointById.partnerId,
                payout: result.GetAdById.deliverInfo.payout,
                income: result.GetAdById.deliverInfo.income
            };
            if( result.Pre.openId ) { newTradeAd.openId = result.Pre.openId; }
            if( result.Pre.event ) { newTradeAd.event = result.Pre.event; }
            if( result.Pre.appid ) { newTradeAd.appid = result.Pre.appid; }
            tradeAdModel.CreateTradeAd(newTradeAd, callback);
        }],

        PartnerIncome: ['CreateTradeAd', (result, callback) => {
            console.log('[CALL] AdSubscribe, PartnerIncome');
            partnerModel.PartnerIncome({
                partnerId: result.GetPointById.partnerId,
                income: result.GetAdById.deliverInfo.payout - result.GetAdById.deliverInfo.income
            }, callback);
        }],

        TakeDeviceItem: ['PartnerIncome', (result, callback) => {
            console.log('[CALL] AdSubscribe, TakeDeviceItem');
            if( result.FindPoint.type == 'ZHIJINJI'
                && result.FindPoint.deviceInfo ) {
                deviceApi.TakeDeviceItem({
                    pointOrderId: result.SubscribePointOrder._id,
                    devNo: result.FindPoint.deviceInfo.devNo
                }, callback);
            } else {
                callback(null, 'SUCCESS');
            }
        }],

        CheckFailPointOrder: ['TakeDeviceItem', (result, callback) => {
            console.log('[CALL] AdSubscribe, CheckFailPointOrder');
            if( result.TakeDeviceItem == 'FAIL' ){
                pointOrderModel.UpdateFailPointOrder({ pointOrderId: result.FinishPointOrder._id }, callback);
            } else {
                callback(null);
            }
        }]

    }, (err, result) => {
        console.log('[CALLBACK] AdSubscribe');
        callback(err);
    });
}

const GetOpenToken = exports.GetOpenToken = (param, callback) => {
    console.log('[CALL] GetOpenToken');

    systemConfigModel.GetWechatOpen(null, (err, wechatOpen) => {
        if( err ) {
            console.log('[CALLBACK] GetOpenToken');
            callback(err);
        } else if( wechatOpen.access_token
            && toolHelper.CheckExpiresInDate(wechatOpen.expires_in) ) {
            console.log('[CALLBACK] GetOpenToken');
            callback(null, wechatOpen.access_token);
        } else {
            wechatApi.OpenComponentToken({
                component_verify_ticket: wechatOpen.ticket
            }, (err, result) => {
                if( !err ) {
                    systemConfigModel.UpdateWechatOpenToken({
                        access_token: result.component_access_token,
                        expires_in: toolHelper.CreateExpiresInDate(result.expires_in)
                    }, function (err, systemConfig) {
                        console.log('[CALLBACK] GetOpenToken');
                        callback(err, result.component_access_token);
                    });
                } else {
                    callback(err);
                }
            });
        }
    });
}

/*

const GetMpToken = exports.GetMpToken = (param, callback) => {
    console.log('[CALL] GetMpToken');

    if( !param
        !! !param.access_token
        !! !param.appid
        !! !param.refresh_token ) {
        console.log('[CALLBACK] GetMpToken');
        return callback(new Error('param is error'));
    }
    
    adModel.GetWechatOpen(null, (err, wechatOpen) => {
        if( err ) {
            console.log('[CALLBACK] GetMpToken');
            callback(err);
        } else if( wechatOpen.access_token
            && toolHelper.CheckExpiresInDate(wechatOpen.expires_in) ) {
            console.log('[CALLBACK] GetMpToken');
            callback(null, wechatOpen.access_token);
        } else {
            let option = {
                url: 'https://api.weixin.qq.com/cgi-bin/component/api_authorizer_token?component_access_token=' + param.access_token,
                method: 'POST',
                headers: {  
                    'content-type': 'application/json'
                },
                json: {
                    component_appid: process.env.WECHAT_OPEN_APP_ID,
                    authorizer_appid: param.appid, 
                    authorizer_refresh_token: param.refresh_token
                }
            };

            request.post(option, function(err, ret, body) {
                console.log('[CALL] GetMpToken, post return:');
                console.log(body);
                if( err 
                    || !ret.statusCode
                    || ret.statusCode != 200
                    || !body
                    || !body.component_access_token ) {
                    console.log('[CALLBACK] GetMpToken');
                    callback(err || new Error('post return is error'));
                } else {
                    systemConfigModel.UpdateWechatOpenToken({
                        access_token: body.component_access_token,
                        expires_in: toolHelper.CreateExpiresInDate(body.expires_in)
                    }, function (err, newWechatOpen) {
                        console.log('[CALLBACK] GetMpToken');
                        callback(err, newWechatOpen.access_token);
                    });
                }
            });
        }
    });
}*/



