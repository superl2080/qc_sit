
const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;


const aderSchema = new mongoose.Schema({

    name:                   { type: String,             required: true },
    createDate:             { type: Date,               default: new Date() },

    balance:                { type: Number,             required: true },
    payout:                 { type: Number,             required: true },
    income:                 { type: Number,             required: true },

    info: {
        phone:              String,
        descript:           String
    }
});

let aderModel = null;
try {
    aderModel = mongoose.model('ader', aderSchema);
} catch(err) {
    if (err.name === 'OverwriteModelError') {
        aderModel = mongoose.model('ader');
    }
}


const GetHaveBalanceAders = exports.GetHaveBalanceAders = (param, callback) => {
    aderModel.find({ balance: { $gt: 0 } })
    .exec(callback);
}

const GetAderById = exports.GetAderById = (param, callback) => {
    if( !param ||
        !param.aderId ) {
        callback(new Error('param is error'));
        return ;
    }

    aderModel.findById( param.aderId )
    .exec(callback);
}
