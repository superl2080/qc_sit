
const mongoose = require('mongoose');


const tradePaySchema = new mongoose.Schema({

    createDate: { type: Date, default: new Date() },

    deviceOrderId: mongoose.Schema.Types.ObjectId,
    userId: mongoose.Schema.Types.ObjectId,
    partnerId: mongoose.Schema.Types.ObjectId,
    payout: Number,
    income: Number,
    type: String, //'WECHAT'

    wechatInfo: {
        transaction_id: String,
        total_fee: Number
    }
});

const tradePayModel = mongoose.model('tradePay', tradePaySchema);

