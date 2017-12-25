
const mongoose = require('mongoose');


const pointOrderSchema = new mongoose.Schema({

    createDate: { type: Date, default: new Date() },

    userId: mongoose.Schema.Types.ObjectId,
    pointId: mongoose.Schema.Types.ObjectId,
    payout: Number,
    state: String, //'OPEN', 'PAYED', 'SUCCESS', 'FAIL'

    adInfo: {
        adId: mongoose.Schema.Types.ObjectId,
        wechatId: String
    },

    payInfo: {
        type: String, //'AD', 'PAY'
        tradeAdId: mongoose.Schema.Types.ObjectId,
        tradePayId: mongoose.Schema.Types.ObjectId
    }
});

const pointOrderModel = mongoose.model('pointOrder', pointOrderSchema);

