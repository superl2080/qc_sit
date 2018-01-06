
const toolHelper = require('../helpers/tool');

const DEVICE_URL = 'http://106.14.195.50:80';
const SERVICE_URL = process.env.SERVICE_URL || '';


const GetWechatAuthUrl = exports.GetWechatAuthUrl = (param) => {
    console.log('[CALL] GetWechatAuthUrl, param:');
    console.log(param);

    let url = 'http://' + process.env.SERVICE_URL + '/wechat/mp/oAuth?redirect_uri=' + encodeURIComponent(param.redirect_uri);

    console.log('[CALLBACK] GetWechatAuthUrl');
    console.log(url);
    return url;
};

const TakeDeviceItem = exports.TakeDeviceItem = (param, callback) => {
    console.log('[CALL] TakeDeviceItem, param:');
    console.log(param);

    toolHelper.PostJson({
        url: DEVICE_URL + '/api/TakeDeviceItem',
        json: {
            devNo: param.devNo,
            deviceOrderId: param.pointOrderId.toString()
        }
    }, function(err, result) {
        if(err
            || !result.data) {
            callback(err || new Error('TakeDeviceItem callback result data is empty'));
        } else if( result.data.res == 'SUCCESS'
            || result.data.res == 'FAIL' ) {
            callback(null, result.data.res);
        } else {
            callback(null, 'FAIL');
        }
    });
}

