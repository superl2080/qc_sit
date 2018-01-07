
const mongoose = require('mongoose');
const adModel = require('./ad');
const aderModel = require('./ader');
const ObjectId = mongoose.Schema.Types.ObjectId;


const pointOrderSchema = new mongoose.Schema({

    createDate:             { $type: Date,               default: new Date() },

    userId:                 { $type: ObjectId,           required: true, index: true },
    pointId:                { $type: ObjectId,           required: true, index: true },
    payout:                 { $type: Number,             required: true },
    state:                  { $type: String,             default: 'OPEN' }, //'OPEN', 'SUCCESS', 'FAIL', 'CANCEL'

    adInfo: {
        adId:               ObjectId,
        qrcode_url:         String,
        appid:              String,
        auth:               Boolean,
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


const CreatePointOrder = exports.CreatePointOrder = (param, callback) => {
    if( !param
        || !param.userId
        || !param.pointId
        || !param.payout ) {
        return callback(new Error('CreatePointOrder: param is error'));
    }

    pointOrderModel.create({ 
        userId: param.userId,
        pointId: param.pointId,
        payout: param.payout
    }, callback);
}

const GetPointOrder = exports.GetPointOrder = (param, callback) => {
    if( !param
        || !param.pointOrderId ) {
        return callback(new Error('GetPointOrder: param is error'));
    }

    let option = {
        _id: param.pointOrderId
    }

    if( param.state ) {
        option.state = param.state;
    }

    pointOrderModel.findOne(option, callback);
}

const DeliverAd = exports.DeliverAd = (param, callback) => {
    if( !param
        || !param.pointOrderId
        || !param.adInfo ) {
        return callback(new Error('DeliverAd: param is error'));
    }

    pointOrderModel.findById(param.pointOrderId)
    .exec(function (err, pointOrder) {
        if( err
            || !pointOrder ) {
            callback(err || new Error('DeliverAd: pointOrder is empty'));
        } else {
            pointOrder.adInfo = param.adInfo;
            pointOrder.save(callback);
        }
    });
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
        'adInfo.appid': param.appid
    }, callback);
}

const CancelOnePointOrder = exports.CancelOnePointOrder = (param, callback) => {
    if( !param ) {
        return callback(new Error('CancelOnePointOrder: param is error'));
    }

    let option = {
        state: 'OPEN'
    }

    if( param.userId ) {
        option.userId = param.userId;
    } else if( param.expiresInDate ) {
        option.createDate = { $lt: param.expiresInDate };
    }

    pointOrderModel.findOne(option)
    .exec((err, pointOrder) => {
        if( err ) {
            callback(null);
        } else {
            pointOrder.state = 'CANCEL';
            pointOrder.save((err, result) => {
                if( err ){
                    callback(err, pointOrder);
                } else {
                    if( pointOrder.adInfo ){
                        adModel.CancelAd({ adId: pointOrder.adInfo.adId }, (err, result) => {
                            if( err ){
                                callback(err, pointOrder);
                            } else {
                                callback(null, pointOrder);
                            }
                        });
                    } else {
                        callback(null, result);
                    }
                }
            });
        } 
    });
}

const FinishPointOrder = exports.FinishPointOrder = (param, callback) => {
    if( !param
        || !param.pointOrderId
        || !param.state
        || !param.payInfo ) {
        return callback(new Error('FinishPointOrder: param is error'));
    }

    pointOrderModel.findById(param.pointOrderId)
    .exec(function (err, pointOrder) {
        if( err
            || !pointOrder ) {
            callback(err || new Error('FinishPointOrder: pointOrder is empty'));
        } else {
            pointOrder.state = param.state;
            pointOrder.payInfo = param.payInfo;
            pointOrder.save((err, result) => {
                if( err ){
                    callback(err, result);
                } else if( pointOrder.payInfo.type != 'AD' ){
                    adModel.CancelAd({ adId: pointOrder.adInfo.adId }, (err, result) => {
                        if( err ){
                            callback(err, result);
                        } else {
                            callback(null, pointOrder);
                        }
                    });
                } else {
                    callback(null, pointOrder);
                }
            });
        }
    });
}
