
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

