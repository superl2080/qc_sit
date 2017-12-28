
const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;


const pointOrderSchema = new mongoose.Schema({

    createDate:             { type: Date,               default: new Date() },

    userId:                 { type: ObjectId,           required: true, index: true },
    pointId:                { type: ObjectId,           required: true, index: true },
    payout:                 { type: Number,             required: true },
    state:                  { type: String,             default: 'OPEN' }, //'OPEN', 'PAY', 'SUCCESS', 'FAIL'

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
});

let pointOrderModel = null;
try {
    pointOrderModel = mongoose.model('pointOrder', pointOrderSchema);
} catch(err) {
    if (err.name === 'OverwriteModelError') {
        pointOrderModel = mongoose.model('pointOrder');
    }
}

