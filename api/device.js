
const toolHelper = require('../helpers/tool');

const SERVICE_URL = 'http://106.14.195.50:80';


const TakeDeviceItem = exports.TakeDeviceItem = (param, callback) => {
    console.log('[CALL] TakeDeviceItem, param:');
    console.log(param);

    toolHelper.PostJson({
        url: SERVICE_URL + '/api/TakeDeviceItem',
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

