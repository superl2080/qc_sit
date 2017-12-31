
const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;


const tradeAdSchema = new mongoose.Schema({

    createDate:             { type: Date,               default: new Date() },

    pointOrderId:           { type: ObjectId,           required: true },
    userId:                 { type: ObjectId,           required: true, index: true },
    adId:                   { type: ObjectId,           required: true, index: true },
    aderId:                 { type: ObjectId,           required: true, index: true },
    partnerId:              { type: ObjectId,           required: true, index: true },
    payout:                 { type: Number,             required: true },
    income:                 { type: Number,             required: true },

    wechatMpInfo: {
        openId:             String,
        event:              String
    },

    wechatMpApiInfo: {
        appid:              String
    }
});

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
        || !param.payout
        || !param.income ) {
        returncallback(new Error('CreateTradeAd: param is error'));
    }

    let newTradeAd = { 
        pointOrderId: param.pointOrderId,
        userId: param.userId,
        adId: param.adId,
        aderId: param.aderId,
        partnerId: param.partnerId,
        payout: param.payout,
        income: param.income,
    };
    if( param.openId
        && param.event ) {
        newTradeAd.wechatMpInfo = {
            openId: param.openId,
            event: param.event
        }
    }
    if( param.appid ) {
        newTradeAd.wechatMpApiInfo = {
            appid: param.appid
        }
    }
    tradeAdModel.create(newTradeAd, callback);
}
