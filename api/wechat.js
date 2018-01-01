
const toolHelper = require('../helpers/tool');

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
