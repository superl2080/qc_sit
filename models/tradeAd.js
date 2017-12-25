
const mongoose = require('mongoose');


const tradeAdSchema = new mongoose.Schema({

    createDate: { type: Date, default: new Date() },

    deviceOrderId: mongoose.Schema.Types.ObjectId,
    userId: mongoose.Schema.Types.ObjectId,
    adId: mongoose.Schema.Types.ObjectId,
    aderId: mongoose.Schema.Types.ObjectId,
    partnerId: mongoose.Schema.Types.ObjectId,
    payout: Number,
    income: Number,
    type: String, //'WECHAT_MP'

    partnerBonus: {
        partnerId: mongoose.Schema.Types.ObjectId,
        bonus: Number
    },

    wechatMpInfo: {
        openId: String,
        event: String
    }
});

const tradeAdModel = mongoose.model('tradeAd', tradeAdSchema);

