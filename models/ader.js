
const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;


const aderSchema = new mongoose.Schema({

    name:                   { $type: String,             required: true },
    createDate:             { $type: Date,               default: new Date() },

    balance:                { $type: Number,             required: true },
    payout:                 { $type: Number,             required: true },
    income:                 { $type: Number,             required: true },

    info: {
        phone:              String,
        descript:           String
    }
}, { typeKey: '$type' });

let aderModel = null;
try {
    aderModel = mongoose.model('ader', aderSchema);
} catch(err) {
    if (err.name === 'OverwriteModelError') {
        aderModel = mongoose.model('ader');
    }
}


const GetHaveBalanceAders = exports.GetHaveBalanceAders = (param, callback) => {
    aderModel.find({ balance: { $gt: 100 } })
    .exec(callback);
}

const GetAderById = exports.GetAderById = (param, callback) => {
    if( !param ||
        !param.aderId ) {
        callback(new Error('GetAderById: param is error'));
        return ;
    }

    aderModel.findById( param.aderId )
    .exec(callback);
}

const DeliverAd = exports.DeliverAd = (param, callback) => {
    if( !param
        || !param.aderId
        || !param.payout ) {
        return callback(new Error('DeliverAd: param is error'));
    }

    aderModel.findById(param.aderId)
    .exec((err, ader) => {
        if( err
            || !ader ) {
            callback(err || new Error('DeliverAd: ader is empty'));
        } else {
            ader.balance -= param.payout;
            if( ader.balance < 0 ){
                callback(new Error('NO_BALANCE'));
            } else {
                ader.save(callback);
            }
        }
    });
}

const CancelAd = exports.CancelAd = (param, callback) => {
    if( !param
        || !param.aderId
        || !param.payout ) {
        return callback(new Error('CancelAd: param is error'));
    }

    aderModel.findById(param.aderId)
    .exec((err, ader) => {
        if( err
            || !ader ) {
            callback(err || new Error('CancelAd: ader is empty'));
        } else {
            ader.balance += param.payout;
            ader.save(callback);
        }
    });
}
