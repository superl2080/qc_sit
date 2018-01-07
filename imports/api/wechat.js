
const toolHelper = require('../helpers/tool');
const cryptHelper = require('../helpers/crypt');

const WECHAT_MP_APP_ID = process.env.WECHAT_MP_APP_ID || '';
const WECHAT_PAY_ID = process.env.WECHAT_PAY_ID || '';
const WECHAT_OPEN_APP_ID = process.env.WECHAT_OPEN_APP_ID || '';
const WECHAT_OPEN_APP_SECRET = process.env.WECHAT_OPEN_APP_SECRET || '';


const OpenComponentToken = exports.OpenComponentToken = (param, callback) => {
    console.log('[CALL] OpenComponentToken, param:');
    console.log(param);

    toolHelper.PostJson({
        url: 'https://api.weixin.qq.com/cgi-bin/component/api_component_token',
        json: {
            component_appid: WECHAT_OPEN_APP_ID,
            component_appsecret: WECHAT_OPEN_APP_SECRET, 
            component_verify_ticket: param.component_verify_ticket
        }
    }, function(err, result) {
        if( err 
            || !result.component_access_token
            || !result.expires_in ) {
            callback(err || new Error('post return is error'));
        } else {
            callback(null, result);
        }
    });
}

const PayCreatePrepay = exports.PayCreatePrepay = (param, callback) => {
    console.log('[CALL] PayCreatePrepay, param:');
    console.log(param);

    const prepayJson = {
        body: param.body,
        notify_url: param.notify_url,
        openid: param.openid,
        spbill_create_ip: param.spbill_create_ip,
        out_trade_no: param.out_trade_no,
        total_fee: param.total_fee,
        appid: WECHAT_MP_APP_ID,
        mch_id: WECHAT_PAY_ID,
        nonce_str: cryptHelper.RandomBytes(16).toString('hex'),
        trade_type: 'JSAPI'
    };
    prepayJson.sign = cryptHelper.WechatPaySign(prepayJson);

    toolHelper.PostXml({
        url: 'https://api.mch.weixin.qq.com/pay/unifiedorder',
        xml: prepayJson
    }, function(err, result) {
        if( err 
            || result.return_code != 'SUCCESS'
            || result.result_code != 'SUCCESS'
            || !result.prepay_id ) {
            callback(err || new Error('PayCreatePrepay: prepayResult is error'));
        } else {
            let prepayResult = {
                appId: WECHAT_MP_APP_ID,
                nonceStr: cryptHelper.RandomBytes(16).toString('hex'),
                package: 'prepay_id=' + result.prepay_id,
                signType: 'MD5',
                timeStamp: toolHelper.CreateTimeStamp(new Date())
            };
            prepayResult.paySign = cryptHelper.WechatPaySign(prepayResult);
            callback(null, prepayResult);
        }
    });
}

const OpenCreatePreAuthCode = exports.OpenCreatePreAuthCode = (param, callback) => {
    console.log('[CALL] OpenCreatePreAuthCode, param:');
    console.log(param);

    toolHelper.PostJson({
        url: 'https://api.weixin.qq.com/cgi-bin/component/api_create_preauthcode?component_access_token=' + param.access_token,
        json: {
            component_appid: WECHAT_OPEN_APP_ID
        }
    }, function(err, result) {
        if( err 
            || !result.pre_auth_code ) {
            callback(err || new Error('post return is error'));
        } else {
            callback(null, result);
        }
    });
}

const OpenQueryAuth = exports.OpenQueryAuth = (param, callback) => {
    console.log('[CALL] OpenQueryAuth, param:');
    console.log(param);

    toolHelper.PostJson({
        url: 'https://api.weixin.qq.com/cgi-bin/component/api_query_auth?component_access_token=' + param.access_token,
        json: {
            component_appid: WECHAT_OPEN_APP_ID,
            authorization_code: param.auth_code
        }
    }, function(err, result) {
        if( err 
            || !result.authorization_info ) {
            callback(err || new Error('post return is error'));
        } else {
            callback(null, result.authorization_info);
        }
    });
}

const OpenRefreshAuth = exports.OpenRefreshAuth = (param, callback) => {
    console.log('[CALL] OpenRefreshAuth, param:');
    console.log(param);

    toolHelper.PostJson({
        url: 'https://api.weixin.qq.com/cgi-bin/component/api_authorizer_token?component_access_token=' + param.access_token,
        json: {
            component_appid: WECHAT_OPEN_APP_ID,
            authorizer_appid: param.appid,
            authorizer_refresh_token: param.refresh_token
        }
    }, function(err, result) {
        if( err ) {
            callback(err || new Error('post return is error'));
        } else {
            callback(null, result);
        }
    });
}

const OpenGetAuthorizerInfo = exports.OpenGetAuthorizerInfo = (param, callback) => {
    console.log('[CALL] OpenGetAuthorizerInfo, param:');
    console.log(param);

    toolHelper.PostJson({
        url: 'https://api.weixin.qq.com/cgi-bin/component/api_get_authorizer_info?component_access_token=' + param.access_token,
        json: {
            component_appid: WECHAT_OPEN_APP_ID,
            authorizer_appid: param.appid
        }
    }, function(err, result) {
        if( err 
            || !result.authorizer_info ) {
            callback(err || new Error('post return is error'));
        } else {
            callback(null, result.authorizer_info);
        }
    });
}

const GetOpenAuthUrl = exports.GetOpenAuthUrl = (param) => {
    console.log('[CALL] GetOpenAuthUrl, param:');
    console.log(param);

    let url = 'https://mp.weixin.qq.com/cgi-bin/componentloginpage?component_appid=' + WECHAT_OPEN_APP_ID;
    url += '&pre_auth_code=' + param.pre_auth_code;
    url += '&redirect_uri=' + encodeURIComponent(param.redirect_uri);
    url += '&auth_type=1';

    console.log('[CALLBACK] GetOpenAuthUrl');
    console.log(url);
    return url;
};

const GetMpOAuthUrl = exports.GetMpOAuthUrl = (param) => {
    console.log('[CALL] GetMpOAuthUrl, param:');
    console.log(param);

    let url = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=' + WECHAT_MP_APP_ID;
    url += '&redirect_uri=' + encodeURIComponent(param.redirect_uri);
    url += '&response_type=code';
    url += '&scope=snsapi_base';
    url += '&redirect_uri=state';
    url += '&component_appid=' + WECHAT_OPEN_APP_ID;
    url += '#wechat_redirect';

    console.log('[CALLBACK] GetMpOAuthUrl');
    console.log(url);
    return url;
};

const MpOAuthGetOpenId = exports.MpOAuthGetOpenId = (param, callback) => {
    console.log('[CALL] MpOAuthGetOpenId, param:');
    console.log(param);

    let url = 'https://api.weixin.qq.com/sns/oauth2/component/access_token?appid=' + WECHAT_MP_APP_ID;
    url += '&code=' + param.code;
    url += '&grant_type=authorization_code';
    url += '&component_appid=' + WECHAT_OPEN_APP_ID;
    url += '&component_access_token=' + param.token;

    toolHelper.GetJson({ url: url }, function(err, result) {
        result = JSON.parse(result);
        if( err 
            || !result.openid ) {
            callback(err || new Error('get return is error'));
        } else {
            callback(null, result);
        }
    });
}

const MpQrcodeCreate = exports.MpQrcodeCreate = (param, callback) => {
    console.log('[CALL] MpQrcodeCreate, param:');
    console.log(param);

    toolHelper.PostJson({
        url: 'https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=' + param.token,
        json: {
            expire_seconds: 24 * 60 * 60,
            action_name: 'QR_STR_SCENE', 
            action_info: { scene: { scene_str: param.scene_str }}
        }
    }, function(err, result) {
        if( err 
            || !result.url ) {
            callback(err || new Error('post return is error'));
        } else {
            callback(null, result);
        }
    });
}

const MpGetUserInfo = exports.MpGetUserInfo = (param, callback) => {
    console.log('[CALL] MpGetUserInfo, param:');
    console.log(param);

    let url = 'https://api.weixin.qq.com/cgi-bin/user/info?access_token=' + param.token;
    url += '&openid=' + param.openId;
    url += '&lang=zh_CN';

    toolHelper.GetJson({ url: url }, function(err, result) {
        result = JSON.parse(result);
        if( err ) {
            callback(err || new Error('get return is error'));
        } else {
            callback(null, result);
        }
    });
}

