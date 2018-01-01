
const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;


const pointOrderSchema = new mongoose.Schema({

    createDate:             { $type: Date,               default: new Date() },

    userId:                 { $type: ObjectId,           required: true, index: true },
    pointId:                { $type: ObjectId,           required: true, index: true },
    payout:                 { $type: Number,             required: true },
    state:                  { $type: String,             default: 'OPEN' }, //'OPEN', 'SUCCESS', 'FAIL'

    adInfo: {
        adId:               ObjectId,
        wechatMpApiInfo: {
            appid:          String,
            qrcode_url:     String,
            auth:           Boolean,
        }
    },

    payInfo: {
        type:               String, //'AD', 'PAY'
        lastDate:           Date,
        tradeAdId:          ObjectId,
        tradePayId:         ObjectId
    }
}, { typeKey: '$type' });

let pointOrderModel = null;
try {
    pointOrderModel = mongoose.model('pointOrder', pointOrderSchema);
} catch(err) {
    if (err.name === 'OverwriteModelError') {
        pointOrderModel = mongoose.model('pointOrder');
    }
}


const SubscribePointOrder = exports.SubscribePointOrder = (param, callback) => {
    if( !param
        || !param.userId
        || !param.appid ) {
        return callback(new Error('SubscribePointOrder: param is error'));
    }

    pointOrderModel.findOne({
        userId: param.userId,
        state: 'OPEN',
        'adInfo.wechatMpApiInfo.appid': param.appid
    })
    .exec(function (err, pointOrder) {
        if( err
            || !pointOrder ) {
            callback(err || new Error('SubscribePointOrder: pointOrder is empty'));
        } else {
            pointOrder.state = 'SUCCESS';
            pointOrder.save(callback);
        }
    });
}

const UpdateFailPointOrder = exports.UpdateFailPointOrder = (param, callback) => {

    pointOrderModel.findById(param.pointOrderId)
    .exec(function (err, pointOrder) {
        if( err
            || !pointOrder ) {
            callback(err || new Error('UpdateFailPointOrder: pointOrder is empty'));
        } else {
            pointOrder.state = 'FAIL';
            pointOrder.save(callback);
        }
    });
}
