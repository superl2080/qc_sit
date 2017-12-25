
const request = require('request');

const SERVICE_URL = 'http://106.14.195.50:80';

const TakeDeviceItem = exports.TakeDeviceItem = (param, callback) => {
    console.log('[CALL] TakeDeviceItem, param:');
    console.log(param);

    if( !param ||
        !param.pointOrderId ||
        !param.devNo ) {
        callback(new Error('param is error'));
        return;
    }

    var option = {
        url: SERVICE_URL + '/api/TakeDeviceItem',
        method: 'POST',
        headers: {  
            'content-type': 'application/json'
        },
        json: {
            devNo: param.devNo,
            deviceOrderId: param.pointOrderId.toString()
        }
    };
    request.post(option, function(err, res, body) {
        console.log('[CALLBACK] requestTakeItem, err:' + err + 'body:');
        console.log(body);
        if(err) {
            callback(err);
        } else if( !body ||
            !body.data) {
            callback(new Error('TakeDeviceItem callback body is empty'));
        } else if( body.data.res == 'SUCCESS' ||
            body.data.res == 'FAIL' ) {
            callback(null, body.data.res);
        } else {
            callback(null, 'FAIL');
        }
    });
}
