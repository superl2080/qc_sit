
const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;


const pointSchema = new mongoose.Schema({

    createDate:             { type: Date,               default: new Date() },

    partnerId:              { type: ObjectId,           required: true, index: true },
    type:                   { type: String,             required: true }, //'ZHIJIN', 'ZHIJINJI'
    state:                  { type: String,             default: 'OPEN' }, //'OPEN', 'DEPLOY', 'TEST', 'CLOSE'

    deviceInfo: {
        devNo:              String,
        type:               String, //'JUANZHI', 'ZHIJIN'
        state:              String
    },

    deployInfo: {
        payout:             Number,
        name:               String,
        shop:               String,
        operatorWechatId:   String
    },

    info: {
        descript:           String
    }
});

let pointModel = null;
try {
    pointModel = mongoose.model('point', pointSchema);
} catch(err) {
    if (err.name === 'OverwriteModelError') {
        pointModel = mongoose.model('point');
    }
}


const GetPointById = exports.GetPointById = (param, callback) => {
    if( !param
        || !param.pointId ) {
        return callback(new Error('GetAdById: param is error'));
    }

    pointModel.findById(param.pointId, callback);
}
