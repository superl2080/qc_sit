
const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;


const tradePaySchema = new mongoose.Schema({

    createDate:             { type: Date,               default: new Date() },

    pointOrderId:           { type: ObjectId,           required: true },
    userId:                 { type: ObjectId,           required: true, index: true },
    partnerId:              { type: ObjectId,           required: true, index: true },
    payout:                 { type: Number,             required: true },
    income:                 { type: Number,             required: true },
    type:                   { type: String,             required: true }, //'WECHAT'

    wechatInfo: {
        transaction_id:     String,
        total_fee:          Number
    }
});

let tradePayModel = null;
try {
    tradePayModel = mongoose.model('tradePay', tradePaySchema);
} catch(err) {
    if (err.name === 'OverwriteModelError') {
        tradePayModel = mongoose.model('tradePay');
    }
}

