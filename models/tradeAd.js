
const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;


const tradeAdSchema = new mongoose.Schema({

    createDate:             { $type: Date,               default: new Date() },

    pointOrderId:           { $type: ObjectId,           required: true },
    userId:                 { $type: ObjectId,           required: true, index: true },
    adId:                   { $type: ObjectId,           required: true, index: true },
    aderId:                 { $type: ObjectId,           required: true, index: true },
    partnerId:              { $type: ObjectId,           required: true, index: true },
    payout:                 { $type: Number,             required: true },
    income:                 { $type: Number,             required: true },
    appid:                  { $type: String,             required: true },             

    wechatMpInfo: {
        openId:             String,
        event:              String
    }
}, { typeKey: '$type' });

let tradeAdModel = null;
try {
    tradeAdModel = mongoose.model('tradeAd', tradeAdSchema);
} catch(err) {
    if (err.name === 'OverwriteModelError') {
        tradeAdModel = mongoose.model('tradeAd');
    }
}


const CreateTradeAd = exports.CreateTradeAd = (param, callback) => {
    if( !param
        || !param.pointOrderId
        || !param.userId
        || !param.adId
        || !param.aderId
        || !param.partnerId
        || !param.appid ) {
        return callback(new Error('CreateTradeAd: param is error'));
    }

    let newTradeAd = { 
        pointOrderId: param.pointOrderId,
        userId: param.userId,
        adId: param.adId,
        aderId: param.aderId,
        partnerId: param.partnerId,
        payout: param.payout,
        income: param.income,
        appid: param.appid
    };
    if( param.openId
        && param.event ) {
        newTradeAd.wechatMpInfo = {
            openId: param.openId,
            event: param.event
        }
    }
    tradeAdModel.create(newTradeAd, callback);
}

const GetUserTradeAds = exports.GetUserTradeAds = (param, callback) => {
    if( !param
        || !param.userId ) {
        return callback(new Error('GetUserTradeAds: param is error'));
    }

    tradeAdModel.find({
        userId: param.userId
    }, callback);
}

