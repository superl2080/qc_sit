var request = require('request');
var mongoose = require('mongoose');

var userModel = mongoose.model('user');
var partnerModel = mongoose.model('partner');
var aderModel = mongoose.model('ader');
var adminModel = mongoose.model('admin');
var deviceModel = mongoose.model('device');
var deviceOrderModel = mongoose.model('deviceOrder');
var incomeOrderModel = mongoose.model('incomeOrder');


function TakeDeviceItem(params, callback){
    console.log('[CALL] apiService/TakeDeviceItem, params:');
    console.log(params);
    
    if(params.userInfo.balance < params.deviceInfo.income) {
        callback({res: 'NO_BALANCE'});
    } else if(params.deviceInfo.state == 'OPEN') {
        var option = {
            /* Relate */
            userId: params.userInfo._id,
            partnerId: params.deviceInfo.partnerId,
            type: params.deviceInfo.type,
            city: params.deviceInfo.city,
            devNo: params.deviceInfo.devNo,
            income: params.deviceInfo.income,
            /* Fixed */
            date: new Date()
        };
        deviceOrderModel.create(option, function (err, deviceOrder) {
            params.deviceOrder = deviceOrder;
            requestTakeItem(params, callback);
        });
    } else {
        callback({res: 'FAIL'});
    }

}

function requestTakeItem(params, callback){
    console.log('[CALL] apiService/requestTakeItem, params:');
    console.log(params);

    var option = {
        url: 'http://106.14.195.50:80/api/TakeDeviceItem',
        method: 'POST',
        headers: {  
            'content-type': 'application/json'
        },
        json: {
            devNo: params.deviceInfo.devNo,
            deviceOrderId: params.deviceOrder._id.toString()
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
            partnerModel.findByIdAndUpdate(params.deviceOrder.partnerId, {$inc: {balance: params.deviceOrder.income}}, {new: true}).
            exec(function(err, partnerInfo) {
                callback({res: takeRes});
            });
        } else {
            callback({res: takeRes});
        }
    });
}   

module.exports.TakeDeviceItem = TakeDeviceItem; 
