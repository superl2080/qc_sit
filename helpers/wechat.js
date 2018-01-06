
const async = require('async');
const adModel = require('../models/ad');
const systemConfigModel = require('../models/systemConfig');
const wechatApi = require('../api/wechat');
const toolHelper = require('./tool');


const CreatePreAuthCode = exports.CreatePreAuthCode = (param, callback) => {
    
    async.auto({
        GetOpenToken: (callback) => {
            console.log('[CALL] CreatePreAuthCode, GetOpenToken');
            GetOpenToken(null, callback);
        },

        GetPreAuthCode: ['GetOpenToken', (result, callback) => {
            console.log('[CALL] CreatePreAuthCode, GetPreAuthCode');
            wechatApi.OpenCreatePreAuthCode({
                access_token: result.GetOpenToken
            }, callback);
        }],

        UpdateAdPreAuthCode: ['GetPreAuthCode', (result, callback) => {
            console.log('[CALL] CreatePreAuthCode, UpdateAdPreAuthCode');
            adModel.UpdateWechatMpPreAuthCode({
                adId: param.adId,
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
        GetOpenToken: (callback) => {
            console.log('[CALL] UpdateWechatMpAuthInfo, GetOpenToken');
            GetOpenToken(null, callback);
        },

        GetMpAuthInfo: ['GetOpenToken', (result, callback) => {
            console.log('[CALL] UpdateWechatMpAuthInfo, GetMpAuthInfo');
            wechatApi.OpenQueryAuth({
                access_token: result.GetOpenToken,
                auth_code: param.auth_code
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
                pre_auth_code: param.pre_auth_code,
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
                    }, (err, systemConfig) => {
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

const GetMpToken = exports.GetMpToken = (param, callback) => {
    console.log('[CALL] GetMpToken');

    adModel.GetWechatMpAuthInfo({ adId: param.ad._id }, (err, wechatMpAuthInfo) => {
        if( err ) {
            console.log('[CALLBACK] GetMpToken');
            callback(err);
        } else if( wechatMpAuthInfo.access_token
            && toolHelper.CheckExpiresInDate(wechatMpAuthInfo.expires_in) ) {
            console.log('[CALLBACK] GetMpToken');
            callback(null, wechatMpAuthInfo.access_token);
        } else {
            GetOpenToken(null, (err, access_token) => {
                if( !err ) {
                    wechatApi.OpenRefreshAuth({
                        access_token: access_token,
                        appid: wechatMpAuthInfo.appid,
                        refresh_token: wechatMpAuthInfo.refresh_token
                    }, (err, result) => {
                        if( !err ) {
                            adModel.RefreshWechatMpAuthInfo({
                                adId: param.ad._id,
                                access_token: result.authorizer_access_token,
                                expires_in: toolHelper.CreateExpiresInDate(result.expires_in)
                                refresh_token: result.authorizer_refresh_token,
                            }, (err, ad) => {
                                console.log('[CALLBACK] GetMpToken');
                                callback(err, result.authorizer_access_token);
                            });
                        } else {
                            callback(err);
                        }
                    });
                } else {
                    callback(err);
                }
            });
        }
    });
}

