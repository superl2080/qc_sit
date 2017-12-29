
const async = require('async');
const request = require('request');
const adModel = require('../models/ad');
const systemConfigModel = require('../models/systemConfig');
const cryptHelper = require('./crypt');

const WECHAT_OPEN_APP_ID = process.env.WECHAT_OPEN_APP_ID;
const WECHAT_OPEN_APP_SECRET = process.env.WECHAT_OPEN_APP_SECRET;
const WECHAT_OPEN_ENCODE_KEY = process.env.WECHAT_OPEN_ENCODE_KEY;

const CRYPTO_AES_KEY = new Buffer(WECHAT_OPEN_ENCODE_KEY + '=', 'base64');
const CRYPTO_IV = CRYPTO_AES_KEY.slice(0, 16);


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
            GetPreAuthCode(result.GetOpenToken, callback);
        }],

        UpdateAdPreAuthCode: ['GetPreAuthCode', (result, callback) => {
            console.log('[CALL] CreatePreAuthCode, UpdateAdPreAuthCode');
            adModel.UpdateWechatMpPreAuthCode({
                adId: result.Pre.adId,
                pre_auth_code: result.GetPreAuthCode
            }, callback);
        }]

    }, (err, results) => {
        console.log('[CALLBACK] CreatePreAuthCode');
        callback(err, results.GetPreAuthCode);
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
            GetMpAuthInfo({
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
                    GetMpInfo({
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
                expires_in: CreateExpiresInDate(result.GetMpAuthInfo.expires_in),
                refresh_token: result.GetMpAuthInfo.authorizer_refresh_token,
                nick_name: result.GetMpInfo.nick_name,
                head_img: result.GetMpInfo.head_img,
                user_name: result.GetMpInfo.user_name
            }, callback);
        }]

    }, (err, results) => {
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

    }, (err, results) => {
        console.log('[CALLBACK] CancelWechatMpAuthInfo');
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
            && CheckExpiresInDate(wechatOpen.expires_in) ) {
            console.log('[CALLBACK] GetOpenToken');
            callback(null, wechatOpen.access_token);
        } else {
            let option = {
                url: 'https://api.weixin.qq.com/cgi-bin/component/api_component_token',
                method: 'POST',
                headers: {  
                    'content-type': 'application/json'
                },
                json: {
                    component_appid: WECHAT_OPEN_APP_ID,
                    component_appsecret: WECHAT_OPEN_APP_SECRET, 
                    component_verify_ticket: wechatOpen.ticket
                }
            };

            request.post(option, function(err, ret, body) {
                console.log('[CALL] GetOpenToken, post return:');
                console.log(body);
                if( err 
                    || !ret.statusCode
                    || ret.statusCode != 200
                    || !body
                    || !body.component_access_token ) {
                    console.log('[CALLBACK] GetOpenToken');
                    callback(err || new Error('post return is error'));
                } else {
                    systemConfigModel.UpdateWechatOpenToken({
                        access_token: body.component_access_token,
                        expires_in: CreateExpiresInDate(body.expires_in)
                    }, function (err, systemConfig) {
                        console.log('[CALLBACK] GetOpenToken');
                        callback(err, body.component_access_token);
                    });
                }
            });
        }
    });
}

const GetPreAuthCode = exports.GetPreAuthCode = (access_token, callback) => {
    console.log('[CALL] GetPreAuthCode');

    if( !access_token ) {
        console.log('[CALLBACK] GetPreAuthCode');
        return callback(new Error('access_token is error'));
    }

    var option = {
        url: 'https://api.weixin.qq.com/cgi-bin/component/api_create_preauthcode?component_access_token=' + access_token,
        method: 'POST',
        headers: {  
            'content-type': 'application/json'
        },
        json: {
            component_appid: WECHAT_OPEN_APP_ID
        }
    };

    request.post(option, function(err, ret, body) {
        console.log('[CALL] GetPreAuthCode, post return:');
        console.log(body);
        if( err
            || !ret.statusCode
            || ret.statusCode != 200
            || !body
            || !body.pre_auth_code ) {
            console.log('[CALLBACK] GetPreAuthCode');
            callback(err || new Error('post return is error'));
        } else {
            callback(null, body.pre_auth_code);
        }
    });
}

const GetMpAuthInfo = exports.GetMpAuthInfo = (param, callback) => {
    console.log('[CALL] GetMpAuthInfo');

    if( !param
        || !param.access_token
        || !param.auth_code ) {
        console.log('[CALLBACK] GetMpAuthInfo');
        return callback(new Error('param is error'));
    }

    var option = {
        url: 'https://api.weixin.qq.com/cgi-bin/component/api_query_auth?component_access_token=' + param.access_token,
        method: 'POST',
        headers: {  
            'content-type': 'application/json'
        },
        json: {
            component_appid: WECHAT_OPEN_APP_ID,
            authorization_code: param.auth_code
        }
    };

    request.post(option, function(err, ret, body) {
        console.log('[CALL] GetMpAuthInfo, post return:');
        console.log(body);
        if( err
            || !ret.statusCode
            || ret.statusCode != 200
            || !body
            || !body.authorization_info ) {
            console.log('[CALLBACK] GetMpAuthInfo');
            callback(err || new Error('post return is error'));
        } else {
            callback(null, body.authorization_info);
        }
    });
}

const GetMpInfo = exports.GetMpInfo = (param, callback) => {
    console.log('[CALL] GetMpInfo');

    if( !param
        || !param.access_token
        || !param.appid ) {
        console.log('[CALLBACK] GetMpInfo');
        return callback(new Error('param is error'));
    }

    var option = {
        url: 'https://api.weixin.qq.com/cgi-bin/component/api_get_authorizer_info?component_access_token=' + param.access_token,
        method: 'POST',
        headers: {  
            'content-type': 'application/json'
        },
        json: {
            component_appid: WECHAT_OPEN_APP_ID,
            authorizer_appid: param.appid
        }
    };

    request.post(option, function(err, ret, body) {
        console.log('[CALL] GetMpInfo, post return:');
        console.log(body);
        if( err
            || !ret.statusCode
            || ret.statusCode != 200
            || !body
            || !body.authorizer_info ) {
            console.log('[CALLBACK] GetMpInfo');
            callback(err || new Error('post return is error'));
        } else {
            callback(null, body.authorizer_info);
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
            && CheckExpiresInDate(wechatOpen.expires_in) ) {
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
                    component_appid: WECHAT_OPEN_APP_ID,
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
                        expires_in: CreateExpiresInDate(body.expires_in)
                    }, function (err, newWechatOpen) {
                        console.log('[CALLBACK] GetMpToken');
                        callback(err, newWechatOpen.access_token);
                    });
                }
            });
        }
    });
}*/


const CreateExpiresInDate = exports.CreateExpiresInDate = (expires_in) => {
    let expiresInDate = new Date();
    expiresInDate.setTime(expiresInDate.getTime() + expires_in * 1000 - 5 * 60 * 1000);
    return expiresInDate;
}

const CheckExpiresInDate = exports.CheckExpiresInDate = (expiresInDate) => {
    let currentDate = new Date();
    return currentDate.getTime() < expiresInDate.getTime();
}

const Decrypt = exports.Decrypt = (msgEncrypt) => {
    console.log('[CALL] Decrypt, msgEncrypt:');
    console.log(msgEncrypt);

    if( !msgEncrypt ) {
        return new Error('msgEncrypt is empty');
    }

    let decipheredBuff = cryptHelper.DecryptAes256Cbc({ data: msgEncrypt, aesKey: CRYPTO_AES_KEY, aesIv: CRYPTO_IV });
    decipheredBuff = cryptHelper.DecodePKCS7(decipheredBuff);

    let msg = decipheredBuff.slice(16);
    let msg_len = msg.slice(0, 4).readUInt32BE(0);
    let msg_content = msg.slice(4, msg_len + 4).toString('utf-8');
    let msg_appId =msg.slice(msg_len + 4).toString('utf-8');

    console.log('[CALLBACK] Decrypt, msg_content:');
    console.log(msg_content);
    return msg_content;
};

const Encrypt = exports.Encrypt = (msgDecrypt) => {
    console.log('[CALL] Encrypt, msgDecrypt:');
    console.log(msgDecrypt);

    if( !msgDecrypt ) {
        return new Error('msgDecrypt is empty');
    }

    let random16 = cryptHelper.RandomBytes(16);
    let msg_content = new Buffer(msgDecrypt);
    let msg_len = new Buffer(4);
    msg_len.writeUInt32BE(msg_content.length, 0);
    let msg_appId = new Buffer(WECHAT_OPEN_APP_ID);
    let raw_msg = Buffer.concat([random16, msg_len, msg_content, msg_appId]);

    raw_msg = cryptHelper.EncodePKCS7(raw_msg);
    let msgEncrypt = cryptHelper.EncryptAes256Cbc({ data: raw_msg, aesKey: CRYPTO_AES_KEY, aesIv: CRYPTO_IV });

    console.log('[CALLBACK] Encrypt, msgEncrypt:');
    console.log(msgEncrypt);
    return msgEncrypt;
};
 
