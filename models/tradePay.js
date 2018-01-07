
const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;


const tradePaySchema = new mongoose.Schema({

    createDate:             { $type: Date,               default: new Date() },

    pointOrderId:           { $type: ObjectId,           required: true },
    userId:                 { $type: ObjectId,           required: true, index: true },
    partnerId:              { $type: ObjectId,           required: true, index: true },
    payout:                 { $type: Number,             required: true },
    income:                 { $type: Number,             required: true },
    type:                   { $type: String,             required: true }, //'WECHAT'

    wechatInfo: {
        total_fee:          Number,
        transaction_id:     String
    }
}, { typeKey: '$type' });

let tradePayModel = null;
try {
    tradePayModel = mongoose.model('tradePay', tradePaySchema);
} catch(err) {
    if (err.name === 'OverwriteModelError') {
        tradePayModel = mongoose.model('tradePay');
    }
}


const CreateTradePay = exports.CreateTradePay = (param, callback) => {
    if( !param
        || !param.pointOrderId
        || !param.userId
        || !param.partnerId ) {
        return callback(new Error('CreateTradePay: param is error'));
    }

    let newTradePay = { 
        pointOrderId: param.pointOrderId,
        userId: param.userId,
        partnerId: param.partnerId,
        payout: param.payout,
        income: param.income,
        type: param.type,
        wechatInfo: {
            total_fee: param.total_fee
        }
    };
    if( param.transaction_id ) { newTradePay.wechatInfo.transaction_id = param.transaction_id; }
    
    tradePayModel.create(newTradePay, callback);
}

